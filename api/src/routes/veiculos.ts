import { Router } from 'express';
import { pool } from '../db/pool';
import { requireAuth, requireGestor, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth, requireGestor);

// GET / - List all vehicles for tenant with counts
router.get('/', async (req: AuthRequest, res) => {
  const { rows } = await pool.query(`
    SELECT
      v.*,
      (SELECT COUNT(*) FROM veiculo_motoristas vm WHERE vm.veiculo_id = v.id AND vm.ativo = true) as motoristas_count,
      (SELECT COUNT(*) FROM rotas r WHERE r.veiculo_id = v.id AND r.ativo = true) as rotas_count
    FROM veiculos v
    WHERE v.tenant_id = $1 AND v.ativo = true
    ORDER BY v.placa
  `, [req.user!.tenant_id]);
  res.json(rows);
});

// GET /:id - Get vehicle with details
router.get('/:id', async (req: AuthRequest, res) => {
  const { rows: veiculoRows } = await pool.query(
    'SELECT * FROM veiculos WHERE id = $1 AND tenant_id = $2',
    [req.params.id, req.user!.tenant_id]
  );
  if (veiculoRows.length === 0) {
    return res.status(404).json({ error: 'Veiculo nao encontrado' });
  }

  const veiculo = veiculoRows[0];

  // Get habilitados motoristas
  const { rows: motoristas } = await pool.query(`
    SELECT m.id, m.nome, m.telefone
    FROM veiculo_motoristas vm
    JOIN motoristas m ON m.id = vm.motorista_id
    WHERE vm.veiculo_id = $1 AND vm.ativo = true AND m.ativo = true
    ORDER BY m.nome
  `, [req.params.id]);

  // Get vinculadas rotas
  const { rows: rotas } = await pool.query(`
    SELECT id, nome, turno
    FROM rotas
    WHERE veiculo_id = $1 AND ativo = true
    ORDER BY nome
  `, [req.params.id]);

  veiculo.motoristas_habilitados = motoristas;
  veiculo.rotas_vinculadas = rotas;

  res.json(veiculo);
});

// POST / - Create vehicle
router.post('/', async (req: AuthRequest, res) => {
  const { placa, modelo, fabricante, ano, capacidade, consumo_km, renavam, chassi } = req.body;

  if (!placa || !modelo || !fabricante) {
    return res.status(400).json({ error: 'Placa, modelo e fabricante sao obrigatorios' });
  }

  const { rows } = await pool.query(`
    INSERT INTO veiculos (tenant_id, placa, modelo, fabricante, ano, capacidade, consumo_km, renavam, chassi)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `, [
    req.user!.tenant_id,
    placa,
    modelo,
    fabricante,
    ano ?? null,
    capacidade ?? 15,
    consumo_km ?? null,
    renavam ?? null,
    chassi ?? null
  ]);

  res.status(201).json(rows[0]);
});

// PUT /:id - Update vehicle
router.put('/:id', async (req: AuthRequest, res) => {
  const { placa, modelo, fabricante, ano, capacidade, consumo_km, renavam, chassi, ativo } = req.body;

  const { rowCount } = await pool.query(`
    UPDATE veiculos
    SET placa = $1, modelo = $2, fabricante = $3, ano = $4, capacidade = $5,
        consumo_km = $6, renavam = $7, chassi = $8, ativo = $9
    WHERE id = $10 AND tenant_id = $11
  `, [
    placa,
    modelo,
    fabricante,
    ano ?? null,
    capacidade ?? 15,
    consumo_km ?? null,
    renavam ?? null,
    chassi ?? null,
    ativo ?? true,
    req.params.id,
    req.user!.tenant_id
  ]);

  if (rowCount === 0) {
    return res.status(404).json({ error: 'Veiculo nao encontrado' });
  }

  res.json({ ok: true });
});

// PUT /:id/motoristas - Update driver pool
router.put('/:id/motoristas', async (req: AuthRequest, res) => {
  const { motorista_ids } = req.body;
  const veiculoId = req.params.id;

  // Verify vehicle belongs to tenant
  const { rows: veiculoRows } = await pool.query(
    'SELECT id FROM veiculos WHERE id = $1 AND tenant_id = $2',
    [veiculoId, req.user!.tenant_id]
  );
  if (veiculoRows.length === 0) {
    return res.status(404).json({ error: 'Veiculo nao encontrado' });
  }

  // Deactivate all current motoristas for this vehicle
  await pool.query(
    'UPDATE veiculo_motoristas SET ativo = false WHERE veiculo_id = $1',
    [veiculoId]
  );

  // Activate/insert selected motoristas
  if (motorista_ids && motorista_ids.length > 0) {
    for (const motoristaId of motorista_ids) {
      await pool.query(`
        INSERT INTO veiculo_motoristas (veiculo_id, motorista_id, ativo)
        VALUES ($1, $2, true)
        ON CONFLICT (veiculo_id, motorista_id) DO UPDATE SET ativo = true
      `, [veiculoId, motoristaId]);
    }
  }

  res.json({ ok: true });
});

// DELETE /:id - Soft delete
router.delete('/:id', async (req: AuthRequest, res) => {
  const { rowCount } = await pool.query(
    'UPDATE veiculos SET ativo = false WHERE id = $1 AND tenant_id = $2',
    [req.params.id, req.user!.tenant_id]
  );

  if (rowCount === 0) {
    return res.status(404).json({ error: 'Veiculo nao encontrado' });
  }

  res.json({ ok: true });
});

export default router;
