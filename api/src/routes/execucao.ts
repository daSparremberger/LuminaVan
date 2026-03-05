import { Router } from 'express';
import { pool } from '../db/pool';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth as any);

// Motorista inicia rota
router.post('/iniciar', async (req: AuthRequest, res) => {
  const { rota_id } = req.body;
  if (!rota_id) return res.status(400).json({ error: 'rota_id obrigatorio' });

  const { rows } = await pool.query(`
    INSERT INTO rota_historico (tenant_id, rota_id, motorista_id, data_inicio)
    VALUES ($1, $2, $3, NOW())
    RETURNING id
  `, [req.user!.tenant_id, rota_id, req.user!.id]);

  res.status(201).json({ id: rows[0].id });
});

// Registrar parada (aluno embarcou ou pulou) - path param version
router.post('/:id/parada', async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { aluno_id, status } = req.body;
  if (!aluno_id || !status) {
    return res.status(400).json({ error: 'aluno_id e status obrigatorios' });
  }

  await pool.query(`
    INSERT INTO historico_paradas (historico_id, aluno_id, status, horario)
    VALUES ($1, $2, $3, NOW())
  `, [id, aluno_id, status]);

  // Atualizar contadores
  if (status === 'embarcou') {
    await pool.query('UPDATE rota_historico SET alunos_embarcados = alunos_embarcados + 1 WHERE id = $1', [id]);
  } else {
    await pool.query('UPDATE rota_historico SET alunos_pulados = alunos_pulados + 1 WHERE id = $1', [id]);
  }

  res.json({ ok: true });
});

// Finalizar rota - path param version
router.post('/:id/finalizar', async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { km_total } = req.body;

  await pool.query(`
    UPDATE rota_historico SET data_fim = NOW(), km_total = $1 WHERE id = $2
  `, [km_total ?? null, id]);

  res.json({ ok: true });
});

// Listar historico
router.get('/historico', async (req: AuthRequest, res) => {
  const { motorista_id, data_inicio, data_fim } = req.query;
  let sql = `SELECT h.*, r.nome as rota_nome, m.nome as motorista_nome
    FROM rota_historico h
    LEFT JOIN rotas r ON r.id = h.rota_id
    LEFT JOIN motoristas m ON m.id = h.motorista_id
    WHERE h.tenant_id = $1`;
  const params: any[] = [req.user!.tenant_id];

  if (req.user!.role === 'motorista') {
    sql += ` AND h.motorista_id = $${params.length + 1}`; params.push(req.user!.id);
  } else if (motorista_id) {
    sql += ` AND h.motorista_id = $${params.length + 1}`; params.push(motorista_id);
  }
  if (data_inicio) { sql += ` AND h.data_inicio >= $${params.length + 1}`; params.push(data_inicio); }
  if (data_fim) { sql += ` AND h.data_inicio <= $${params.length + 1}`; params.push(data_fim); }
  sql += ' ORDER BY h.criado_em DESC LIMIT 100';

  const { rows } = await pool.query(sql, params);
  res.json(rows);
});

export default router;
