import { Router } from 'express';
import { pool } from '../db/pool';
import { requireAuth, AuthRequest } from '../middleware/auth';
import crypto from 'crypto';

const router = Router();
router.use(requireAuth as any);

// Verificar PIN
router.post('/verificar-pin', async (req: AuthRequest, res) => {
  if (req.user!.role !== 'motorista') {
    return res.status(403).json({ error: 'Apenas motoristas' });
  }

  const { pin } = req.body;
  if (!pin) return res.status(400).json({ error: 'PIN obrigatorio' });

  const pinHash = crypto.createHash('sha256').update(pin).digest('hex');

  const { rows } = await pool.query(
    'SELECT id FROM motoristas WHERE id = $1 AND pin_hash = $2',
    [req.user!.id, pinHash]
  );

  if (rows.length === 0) {
    return res.status(401).json({ error: 'PIN incorreto' });
  }

  res.json({ ok: true });
});

// Listar rotas do motorista
router.get('/rotas', async (req: AuthRequest, res) => {
  if (req.user!.role !== 'motorista') {
    return res.status(403).json({ error: 'Apenas motoristas' });
  }

  const { rows } = await pool.query(`
    SELECT r.*,
      (SELECT COUNT(*) FROM rota_paradas rp WHERE rp.rota_id = r.id) as paradas_count
    FROM rotas r
    WHERE r.motorista_id = $1 AND r.ativo = true
    ORDER BY r.turno, r.nome
  `, [req.user!.id]);

  res.json(rows);
});

// Detalhes de uma rota
router.get('/rotas/:id', async (req: AuthRequest, res) => {
  if (req.user!.role !== 'motorista') {
    return res.status(403).json({ error: 'Apenas motoristas' });
  }

  const { id } = req.params;

  const rotaResult = await pool.query(
    'SELECT * FROM rotas WHERE id = $1 AND motorista_id = $2',
    [id, req.user!.id]
  );

  if (rotaResult.rows.length === 0) {
    return res.status(404).json({ error: 'Rota nao encontrada' });
  }

  const rota = rotaResult.rows[0];

  // Buscar paradas com dados dos alunos
  const paradasResult = await pool.query(`
    SELECT rp.*, a.nome as aluno_nome, a.endereco as aluno_endereco, a.lat, a.lng
    FROM rota_paradas rp
    LEFT JOIN alunos a ON a.id = rp.aluno_id
    WHERE rp.rota_id = $1
    ORDER BY rp.ordem
  `, [id]);

  rota.paradas = paradasResult.rows;
  res.json(rota);
});

export default router;
