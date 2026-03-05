import { Router } from 'express';
import { pool } from '../db/pool';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

// GET /conversas - List conversations for current user
router.get('/conversas', async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const tenantId = req.user!.tenant_id;

  try {
    // Get all conversations grouped by participant
    const { rows } = await pool.query(`
      WITH conversas AS (
        SELECT
          CASE
            WHEN remetente_id = $1 AND remetente_tipo = $2 THEN destinatario_id
            ELSE remetente_id
          END AS participante_id,
          CASE
            WHEN remetente_id = $1 AND remetente_tipo = $2 THEN destinatario_tipo
            ELSE remetente_tipo
          END AS participante_tipo,
          conteudo,
          criado_em,
          lido,
          destinatario_id,
          destinatario_tipo
        FROM mensagens
        WHERE tenant_id = $3
          AND (
            (remetente_id = $1 AND remetente_tipo = $2)
            OR (destinatario_id = $1 AND destinatario_tipo = $2)
          )
      ),
      ultima_msg AS (
        SELECT DISTINCT ON (participante_id, participante_tipo)
          participante_id,
          participante_tipo,
          conteudo AS ultima_mensagem,
          criado_em AS ultima_mensagem_data
        FROM conversas
        ORDER BY participante_id, participante_tipo, criado_em DESC
      ),
      nao_lidas AS (
        SELECT
          participante_id,
          participante_tipo,
          COUNT(*) AS nao_lidas
        FROM conversas
        WHERE lido = false
          AND destinatario_id = $1
          AND destinatario_tipo = $2
        GROUP BY participante_id, participante_tipo
      )
      SELECT
        u.participante_id,
        u.participante_tipo,
        u.ultima_mensagem,
        u.ultima_mensagem_data,
        COALESCE(n.nao_lidas, 0)::int AS nao_lidas
      FROM ultima_msg u
      LEFT JOIN nao_lidas n ON u.participante_id = n.participante_id AND u.participante_tipo = n.participante_tipo
      ORDER BY u.ultima_mensagem_data DESC
    `, [userId, userRole, tenantId]);

    // Get participant names
    const conversasComNomes = await Promise.all(rows.map(async (conv) => {
      let nome = 'Desconhecido';
      if (conv.participante_tipo === 'motorista') {
        const { rows: motoristas } = await pool.query(
          'SELECT nome FROM motoristas WHERE id = $1',
          [conv.participante_id]
        );
        if (motoristas.length > 0) nome = motoristas[0].nome;
      } else if (conv.participante_tipo === 'gestor') {
        const { rows: gestores } = await pool.query(
          'SELECT nome FROM gestores WHERE id = $1',
          [conv.participante_id]
        );
        if (gestores.length > 0) nome = gestores[0].nome;
      }
      return {
        ...conv,
        participante_nome: nome
      };
    }));

    res.json(conversasComNomes);
  } catch (err) {
    console.error('Erro ao listar conversas:', err);
    res.status(500).json({ error: 'Erro ao listar conversas' });
  }
});

// GET /conversa/:tipo/:id - Get messages with a specific person
router.get('/conversa/:tipo/:id', async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const tenantId = req.user!.tenant_id;
  const { tipo, id } = req.params;

  if (tipo !== 'gestor' && tipo !== 'motorista') {
    return res.status(400).json({ error: 'Tipo invalido. Use gestor ou motorista.' });
  }

  const participanteId = parseInt(id, 10);
  if (isNaN(participanteId)) {
    return res.status(400).json({ error: 'ID invalido' });
  }

  try {
    // Mark messages as read (messages sent to current user from this participant)
    await pool.query(`
      UPDATE mensagens
      SET lido = true
      WHERE tenant_id = $1
        AND destinatario_id = $2
        AND destinatario_tipo = $3
        AND remetente_id = $4
        AND remetente_tipo = $5
        AND lido = false
    `, [tenantId, userId, userRole, participanteId, tipo]);

    // Get all messages between the two users
    const { rows } = await pool.query(`
      SELECT
        id,
        remetente_id,
        remetente_tipo,
        destinatario_id,
        destinatario_tipo,
        conteudo,
        lido,
        criado_em
      FROM mensagens
      WHERE tenant_id = $1
        AND (
          (remetente_id = $2 AND remetente_tipo = $3 AND destinatario_id = $4 AND destinatario_tipo = $5)
          OR (remetente_id = $4 AND remetente_tipo = $5 AND destinatario_id = $2 AND destinatario_tipo = $3)
        )
      ORDER BY criado_em ASC
    `, [tenantId, userId, userRole, participanteId, tipo]);

    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar conversa:', err);
    res.status(500).json({ error: 'Erro ao buscar conversa' });
  }
});

// POST / - Send message
router.post('/', async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const tenantId = req.user!.tenant_id;
  const { destinatario_id, destinatario_tipo, conteudo } = req.body;

  if (!destinatario_id || !destinatario_tipo || !conteudo) {
    return res.status(400).json({ error: 'destinatario_id, destinatario_tipo e conteudo sao obrigatorios' });
  }

  if (destinatario_tipo !== 'gestor' && destinatario_tipo !== 'motorista') {
    return res.status(400).json({ error: 'destinatario_tipo invalido. Use gestor ou motorista.' });
  }

  try {
    const { rows } = await pool.query(`
      INSERT INTO mensagens (tenant_id, remetente_id, remetente_tipo, destinatario_id, destinatario_tipo, conteudo)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, remetente_id, remetente_tipo, destinatario_id, destinatario_tipo, conteudo, lido, criado_em
    `, [tenantId, userId, userRole, destinatario_id, destinatario_tipo, conteudo]);

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Erro ao enviar mensagem:', err);
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

export default router;
