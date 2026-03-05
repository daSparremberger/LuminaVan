import { Router } from 'express';
import { pool } from '../db/pool';
import { requireAuth, requireGestor, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth, requireGestor);

router.get('/', async (req: AuthRequest, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM escolas WHERE tenant_id = $1 ORDER BY nome',
    [req.user!.tenant_id]
  );
  res.json(rows);
});

router.post('/', async (req: AuthRequest, res) => {
  const { nome, endereco, lat, lng, turno_manha, turno_tarde, turno_noite,
    horario_entrada_manha, horario_saida_manha, horario_entrada_tarde,
    horario_saida_tarde, horario_entrada_noite, horario_saida_noite } = req.body;

  if (!nome || !endereco) {
    return res.status(400).json({ error: 'Nome e endereco obrigatorios' });
  }

  const { rows } = await pool.query(`
    INSERT INTO escolas (tenant_id, nome, endereco, lat, lng, turno_manha, turno_tarde, turno_noite,
      horario_entrada_manha, horario_saida_manha, horario_entrada_tarde, horario_saida_tarde,
      horario_entrada_noite, horario_saida_noite)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
    RETURNING *
  `, [req.user!.tenant_id, nome, endereco, lat ?? null, lng ?? null,
    turno_manha ?? false, turno_tarde ?? false, turno_noite ?? false,
    horario_entrada_manha ?? null, horario_saida_manha ?? null,
    horario_entrada_tarde ?? null, horario_saida_tarde ?? null,
    horario_entrada_noite ?? null, horario_saida_noite ?? null]);

  res.status(201).json(rows[0]);
});

router.put('/:id', async (req: AuthRequest, res) => {
  const { nome, endereco, lat, lng, turno_manha, turno_tarde, turno_noite,
    horario_entrada_manha, horario_saida_manha, horario_entrada_tarde,
    horario_saida_tarde, horario_entrada_noite, horario_saida_noite } = req.body;

  await pool.query(`
    UPDATE escolas SET nome=$1, endereco=$2, lat=$3, lng=$4,
      turno_manha=$5, turno_tarde=$6, turno_noite=$7,
      horario_entrada_manha=$8, horario_saida_manha=$9,
      horario_entrada_tarde=$10, horario_saida_tarde=$11,
      horario_entrada_noite=$12, horario_saida_noite=$13
    WHERE id=$14 AND tenant_id=$15
  `, [nome, endereco, lat ?? null, lng ?? null,
    turno_manha ?? false, turno_tarde ?? false, turno_noite ?? false,
    horario_entrada_manha ?? null, horario_saida_manha ?? null,
    horario_entrada_tarde ?? null, horario_saida_tarde ?? null,
    horario_entrada_noite ?? null, horario_saida_noite ?? null,
    req.params.id, req.user!.tenant_id]);

  res.json({ ok: true });
});

router.delete('/:id', async (req: AuthRequest, res) => {
  await pool.query('DELETE FROM escolas WHERE id = $1 AND tenant_id = $2', [req.params.id, req.user!.tenant_id]);
  res.json({ ok: true });
});

// GET single school with contacts
router.get('/:id', async (req: AuthRequest, res) => {
  const { id } = req.params;
  const escola = await pool.query(
    'SELECT * FROM escolas WHERE id = $1 AND tenant_id = $2',
    [id, req.user!.tenant_id]
  );

  if (escola.rows.length === 0) {
    return res.status(404).json({ error: 'Escola nao encontrada' });
  }

  const contatos = await pool.query(
    'SELECT * FROM escola_contatos WHERE escola_id = $1 ORDER BY cargo',
    [id]
  );

  res.json({ ...escola.rows[0], contatos: contatos.rows });
});

// --- School Contacts CRUD ---

// List contacts for a school
router.get('/:id/contatos', async (req: AuthRequest, res) => {
  const { id } = req.params;

  // Verify school belongs to tenant
  const escola = await pool.query(
    'SELECT id FROM escolas WHERE id = $1 AND tenant_id = $2',
    [id, req.user!.tenant_id]
  );

  if (escola.rows.length === 0) {
    return res.status(404).json({ error: 'Escola nao encontrada' });
  }

  const { rows } = await pool.query(
    'SELECT * FROM escola_contatos WHERE escola_id = $1 ORDER BY cargo',
    [id]
  );

  res.json(rows);
});

// Add contact to a school
router.post('/:id/contatos', async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { cargo, nome, telefone } = req.body;

  if (!cargo || !nome) {
    return res.status(400).json({ error: 'Cargo e nome obrigatorios' });
  }

  // Verify school belongs to tenant
  const escola = await pool.query(
    'SELECT id FROM escolas WHERE id = $1 AND tenant_id = $2',
    [id, req.user!.tenant_id]
  );

  if (escola.rows.length === 0) {
    return res.status(404).json({ error: 'Escola nao encontrada' });
  }

  const { rows } = await pool.query(
    `INSERT INTO escola_contatos (escola_id, cargo, nome, telefone)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [id, cargo, nome, telefone ?? null]
  );

  res.status(201).json(rows[0]);
});

// Update contact
router.put('/:id/contatos/:contatoId', async (req: AuthRequest, res) => {
  const { id, contatoId } = req.params;
  const { cargo, nome, telefone } = req.body;

  // Verify school belongs to tenant
  const escola = await pool.query(
    'SELECT id FROM escolas WHERE id = $1 AND tenant_id = $2',
    [id, req.user!.tenant_id]
  );

  if (escola.rows.length === 0) {
    return res.status(404).json({ error: 'Escola nao encontrada' });
  }

  const { rowCount } = await pool.query(
    `UPDATE escola_contatos
     SET cargo = $1, nome = $2, telefone = $3
     WHERE id = $4 AND escola_id = $5`,
    [cargo, nome, telefone ?? null, contatoId, id]
  );

  if (rowCount === 0) {
    return res.status(404).json({ error: 'Contato nao encontrado' });
  }

  res.json({ ok: true });
});

// Remove contact
router.delete('/:id/contatos/:contatoId', async (req: AuthRequest, res) => {
  const { id, contatoId } = req.params;

  // Verify school belongs to tenant
  const escola = await pool.query(
    'SELECT id FROM escolas WHERE id = $1 AND tenant_id = $2',
    [id, req.user!.tenant_id]
  );

  if (escola.rows.length === 0) {
    return res.status(404).json({ error: 'Escola nao encontrada' });
  }

  const { rowCount } = await pool.query(
    'DELETE FROM escola_contatos WHERE id = $1 AND escola_id = $2',
    [contatoId, id]
  );

  if (rowCount === 0) {
    return res.status(404).json({ error: 'Contato nao encontrado' });
  }

  res.json({ ok: true });
});

export default router;
