import { Router } from 'express';
import { pool } from '../db/pool';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/requireAdmin';
import crypto from 'crypto';
import { buildInviteUrl } from '../lib/invite';

const router = Router();

// Todas as rotas requerem autenticacao + admin
router.use(requireAuth, requireAdmin);

// GET /admin/stats - estatisticas gerais
router.get('/stats', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM tenants WHERE ativo = true) as total_tenants,
        (SELECT COUNT(*) FROM gestores WHERE ativo = true) as total_gestores,
        (SELECT COUNT(*) FROM motoristas WHERE ativo = true) as total_motoristas,
        (SELECT COUNT(*) FROM alunos WHERE ativo = true) as total_alunos
    `);
    res.json(stats.rows[0]);
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// GET /admin/tenants - listar tenants
router.get('/tenants', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*,
        (SELECT COUNT(*) FROM gestores g WHERE g.tenant_id = t.id AND g.ativo = true) as total_gestores,
        (SELECT COUNT(*) FROM motoristas m WHERE m.tenant_id = t.id AND m.ativo = true) as total_motoristas,
        (SELECT COUNT(*) FROM alunos a WHERE a.tenant_id = t.id AND a.ativo = true) as total_alunos
      FROM tenants t
      ORDER BY t.criado_em DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('List tenants error:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// POST /admin/tenants - criar tenant
router.post('/tenants', async (req, res) => {
  const { nome, cidade, estado } = req.body;

  if (!nome || !cidade || !estado) {
    return res.status(400).json({ error: 'Nome, cidade e estado sao obrigatorios' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO tenants (nome, cidade, estado) VALUES ($1, $2, $3) RETURNING *',
      [nome, cidade, estado]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create tenant error:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// GET /admin/tenants/:id - detalhes do tenant
router.get('/tenants/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM tenants WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant nao encontrado' });
    }

    // Buscar gestores do tenant
    const gestores = await pool.query(
      'SELECT id, nome, email, criado_em FROM gestores WHERE tenant_id = $1 AND ativo = true',
      [id]
    );

    res.json({ ...result.rows[0], gestores: gestores.rows });
  } catch (err) {
    console.error('Get tenant error:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// PUT /admin/tenants/:id - atualizar tenant
router.put('/tenants/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, cidade, estado, ativo } = req.body;

  try {
    const result = await pool.query(
      `UPDATE tenants SET
        nome = COALESCE($1, nome),
        cidade = COALESCE($2, cidade),
        estado = COALESCE($3, estado),
        ativo = COALESCE($4, ativo)
       WHERE id = $5 RETURNING *`,
      [nome, cidade, estado, ativo, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant nao encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update tenant error:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// DELETE /admin/tenants/:id - remover tenant (soft delete)
router.delete('/tenants/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'UPDATE tenants SET ativo = false WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant nao encontrado' });
    }

    res.json({ message: 'Tenant desativado com sucesso' });
  } catch (err) {
    console.error('Delete tenant error:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// POST /admin/tenants/:id/convite - gerar convite para gestor
router.post('/tenants/:id/convite', async (req, res) => {
  const { id } = req.params;
  const { email, dias_validade = 7 } = req.body;

  try {
    // Verificar se tenant existe
    const tenant = await pool.query('SELECT id FROM tenants WHERE id = $1 AND ativo = true', [id]);
    if (tenant.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant nao encontrado' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expira_em = new Date();
    expira_em.setDate(expira_em.getDate() + dias_validade);

    const result = await pool.query(
      `INSERT INTO convites_gestor (tenant_id, token, email, expira_em)
       VALUES ($1, $2, $3, $4)
       RETURNING id, token, email, expira_em`,
      [id, token, email || null, expira_em]
    );

    res.status(201).json({
      ...result.rows[0],
      link: buildInviteUrl(token),
      convite_url: buildInviteUrl(token)
    });
  } catch (err) {
    console.error('Create convite error:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// GET /admin/tenants/:id/convites - listar convites do tenant
router.get('/tenants/:id/convites', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT id, token, email, usado, expira_em, criado_em
       FROM convites_gestor
       WHERE tenant_id = $1
       ORDER BY criado_em DESC`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('List convites error:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;
