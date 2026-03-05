import { Router } from 'express';
import { pool } from '../db/pool';
import { requireAuth, requireGestor, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth as any);

// Listar rotas — gestor ve todas do tenant, motorista ve as suas
router.get('/', async (req: AuthRequest, res) => {
  if (req.user!.role === 'gestor') {
    const { rows } = await pool.query(`
      SELECT r.*, v.placa as veiculo_placa FROM rotas r
      LEFT JOIN veiculos v ON v.id = r.veiculo_id
      WHERE r.tenant_id = $1 ORDER BY r.nome
    `, [req.user!.tenant_id]);
    return res.json(rows);
  }
  // motorista: so as suas (via vehicle assignment)
  const { rows } = await pool.query(`
    SELECT r.*, v.placa as veiculo_placa FROM rotas r
    LEFT JOIN veiculos v ON v.id = r.veiculo_id
    WHERE r.veiculo_id IN (
      SELECT veiculo_id FROM veiculo_motoristas WHERE motorista_id = $1 AND ativo = true
    ) AND r.ativo = true
  `, [req.user!.id]);
  res.json(rows);
});

// Detalhe da rota com paradas
router.get('/:id', async (req: AuthRequest, res) => {
  const { rows: rotaRows } = await pool.query('SELECT * FROM rotas WHERE id = $1 AND tenant_id = $2', [req.params.id, req.user!.tenant_id]);
  if (rotaRows.length === 0) return res.status(404).json({ error: 'Rota nao encontrada' });

  const rota = rotaRows[0];
  const { rows: paradas } = await pool.query(`
    SELECT rp.*, a.nome as aluno_nome, a.endereco as aluno_endereco
    FROM rota_paradas rp
    JOIN alunos a ON a.id = rp.aluno_id
    WHERE rp.rota_id = $1
    ORDER BY rp.ordem
  `, [req.params.id]);

  rota.paradas = paradas;
  res.json(rota);
});

// Criar rota (gestor)
router.post('/', requireGestor as any, async (req: AuthRequest, res) => {
  const { nome, veiculo_id, turno, aluno_ids } = req.body;
  if (!nome || !veiculo_id || !turno) return res.status(400).json({ error: 'Campos obrigatorios' });

  const { rows } = await pool.query(
    'INSERT INTO rotas (tenant_id, nome, veiculo_id, turno) VALUES ($1,$2,$3,$4) RETURNING id',
    [req.user!.tenant_id, nome, veiculo_id, turno]
  );
  const rotaId = rows[0].id;

  // Inserir paradas na ordem fornecida
  if (aluno_ids?.length) {
    for (let i = 0; i < aluno_ids.length; i++) {
      const alunoId = aluno_ids[i];
      const { rows: alunoRows } = await pool.query('SELECT lat, lng FROM alunos WHERE id = $1', [alunoId]);
      const aluno = alunoRows[0];
      await pool.query(
        'INSERT INTO rota_paradas (rota_id, aluno_id, ordem, lat, lng) VALUES ($1,$2,$3,$4,$5)',
        [rotaId, alunoId, i + 1, aluno?.lat ?? null, aluno?.lng ?? null]
      );
    }
  }

  res.status(201).json({ id: rotaId });
});

// Otimizar rota via Mapbox Optimization API
router.post('/:id/otimizar', requireGestor as any, async (req: AuthRequest, res) => {
  const { rows: rotaRows } = await pool.query('SELECT * FROM rotas WHERE id = $1 AND tenant_id = $2', [req.params.id, req.user!.tenant_id]);
  if (rotaRows.length === 0) return res.status(404).json({ error: 'Rota nao encontrada' });
  const rota = rotaRows[0];

  const { rows: paradas } = await pool.query(`
    SELECT rp.aluno_id, rp.lat, rp.lng, a.endereco FROM rota_paradas rp
    JOIN alunos a ON a.id = rp.aluno_id WHERE rp.rota_id = $1
  `, [req.params.id]);

  const semCoordenadas = paradas.filter(p => !p.lat || !p.lng);
  if (semCoordenadas.length) {
    return res.status(422).json({
      error: 'Geocodifique todos os alunos antes de otimizar',
      pendentes: semCoordenadas.map(p => p.endereco)
    });
  }

  const { origem_lat, origem_lng, escola_lat, escola_lng } = req.body;
  if (!origem_lat || !origem_lng || !escola_lat || !escola_lng) {
    return res.status(400).json({ error: 'Informe origem_lat, origem_lng, escola_lat, escola_lng' });
  }

  const coordenadas = [
    `${origem_lng},${origem_lat}`,
    ...paradas.map(p => `${p.lng},${p.lat}`),
    `${escola_lng},${escola_lat}`
  ].join(';');

  const url = `https://api.mapbox.com/optimized-trips/v1/mapbox/driving/${coordenadas}` +
    `?source=first&destination=last&roundtrip=false&access_token=${process.env.MAPBOX_TOKEN}`;

  const response = await fetch(url);
  const data = await response.json() as any;

  if (data.code !== 'Ok') {
    return res.status(502).json({ error: 'Mapbox Optimization falhou', detail: data });
  }

  // Reordenar paradas conforme waypoint_index retornado
  const waypointOrder = data.waypoints
    .filter((w: any) => w.waypoint_index > 0 && w.waypoint_index < data.waypoints.length - 1)
    .sort((a: any, b: any) => a.trips_index - b.trips_index || a.waypoint_index - b.waypoint_index);

  for (let i = 0; i < waypointOrder.length; i++) {
    const w = waypointOrder[i];
    const aluno = paradas[w.waypoint_index - 1];
    await pool.query('UPDATE rota_paradas SET ordem = $1 WHERE rota_id = $2 AND aluno_id = $3',
      [i + 1, rota.id, aluno.aluno_id]);
  }

  // Salvar geojson da rota
  await pool.query('UPDATE rotas SET rota_geojson = $1 WHERE id = $2',
    [JSON.stringify(data.trips[0].geometry), rota.id]);

  res.json({ ok: true, geometry: data.trips[0].geometry });
});

router.delete('/:id', requireGestor as any, async (req: AuthRequest, res) => {
  await pool.query('UPDATE rotas SET ativo = false WHERE id = $1 AND tenant_id = $2',
    [req.params.id, req.user!.tenant_id]);
  res.json({ ok: true });
});

export default router;
