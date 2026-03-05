import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { pool } from '../db/pool';
import { requireAuth, requireGestor, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth, requireGestor);

router.get('/', async (req: AuthRequest, res) => {
  const { rows } = await pool.query(
    'SELECT id, nome, telefone, ativo, cadastro_completo, convite_token, criado_em FROM motoristas WHERE tenant_id = $1 ORDER BY nome',
    [req.user!.tenant_id]
  );
  res.json(rows);
});

router.post('/', async (req: AuthRequest, res) => {
  const { nome, telefone } = req.body;
  if (!nome) return res.status(400).json({ error: 'Nome obrigatorio' });

  const conviteToken = uuid();
  const conviteExpira = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

  const { rows } = await pool.query(`
    INSERT INTO motoristas (tenant_id, nome, telefone, convite_token, convite_expira_em)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, nome, telefone, convite_token
  `, [req.user!.tenant_id, nome, telefone ?? null, conviteToken, conviteExpira]);

  const conviteUrl = `${process.env.INVITE_BASE_URL}/${conviteToken}`;
  res.status(201).json({ ...rows[0], convite_url: conviteUrl });
});

router.put('/:id', async (req: AuthRequest, res) => {
  const { nome, telefone, ativo } = req.body;
  await pool.query(`
    UPDATE motoristas SET nome=$1, telefone=$2, ativo=$3
    WHERE id=$4 AND tenant_id=$5
  `, [nome, telefone ?? null, ativo ?? true, req.params.id, req.user!.tenant_id]);
  res.json({ ok: true });
});

router.post('/:id/reenviar-convite', async (req: AuthRequest, res) => {
  const conviteToken = uuid();
  const conviteExpira = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await pool.query(`
    UPDATE motoristas SET convite_token=$1, convite_expira_em=$2
    WHERE id=$3 AND tenant_id=$4
  `, [conviteToken, conviteExpira, req.params.id, req.user!.tenant_id]);

  const conviteUrl = `${process.env.INVITE_BASE_URL}/${conviteToken}`;
  res.json({ convite_url: conviteUrl });
});

// Get motorista stats and recent history
router.get('/:id/stats', async (req: AuthRequest, res) => {
  const motorista_id = req.params.id;
  const tenant_id = req.user!.tenant_id;

  // Get motorista details
  const { rows: motoristas } = await pool.query(
    'SELECT id, nome, telefone, foto_url, ativo, cadastro_completo, criado_em FROM motoristas WHERE id = $1 AND tenant_id = $2',
    [motorista_id, tenant_id]
  );

  if (motoristas.length === 0) {
    return res.status(404).json({ error: 'Motorista nao encontrado' });
  }

  const motorista = motoristas[0];

  // Get aggregated stats from rota_historico
  const { rows: stats } = await pool.query(`
    SELECT
      COUNT(*) as total_rotas,
      COALESCE(SUM(alunos_embarcados), 0) as total_alunos,
      COALESCE(SUM(km_total), 0) as total_km
    FROM rota_historico
    WHERE motorista_id = $1 AND tenant_id = $2 AND data_fim IS NOT NULL
  `, [motorista_id, tenant_id]);

  // Calculate dias trabalhados from criado_em
  const criadoEm = new Date(motorista.criado_em);
  const hoje = new Date();
  const diasTrabalhados = Math.floor((hoje.getTime() - criadoEm.getTime()) / (1000 * 60 * 60 * 24));

  // Get recent routes
  const { rows: recentRoutes } = await pool.query(`
    SELECT h.id, h.data_inicio, h.data_fim, h.alunos_embarcados, h.km_total, r.nome as rota_nome
    FROM rota_historico h
    LEFT JOIN rotas r ON r.id = h.rota_id
    WHERE h.motorista_id = $1 AND h.tenant_id = $2
    ORDER BY h.data_inicio DESC
    LIMIT 10
  `, [motorista_id, tenant_id]);

  res.json({
    motorista,
    stats: {
      dias_trabalhados: diasTrabalhados,
      total_rotas: parseInt(stats[0].total_rotas) || 0,
      total_alunos: parseInt(stats[0].total_alunos) || 0,
      total_km: parseFloat(stats[0].total_km) || 0,
    },
    recent_routes: recentRoutes,
  });
});

export default router;
