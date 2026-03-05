import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { pool } from '../db/pool';
import { auth } from '../lib/firebase';

const router = Router();

// Login - verifica/cria admin ou retorna usuario existente
router.post('/login', async (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token ausente' });
  }

  try {
    const idToken = header.slice(7);
    const decoded = await auth.verifyIdToken(idToken);
    const firebaseUid = decoded.uid;
    const email = decoded.email || '';
    const nome = decoded.name || email.split('@')[0];

    // Verificar se sistema ja tem admin
    const configResult = await pool.query(
      "SELECT valor FROM system_config WHERE chave = 'admin_firebase_uid'"
    );

    // Primeiro login = vira admin
    if (configResult.rows.length === 0) {
      await pool.query(
        "INSERT INTO system_config (chave, valor) VALUES ('admin_firebase_uid', $1)",
        [firebaseUid]
      );
      await pool.query(
        "INSERT INTO system_config (chave, valor) VALUES ('admin_email', $1)",
        [email]
      );
      await pool.query(
        "INSERT INTO system_config (chave, valor) VALUES ('setup_completo', 'true')"
      );

      return res.json({
        role: 'admin',
        user: { id: 0, firebase_uid: firebaseUid, nome, email }
      });
    }

    // Verificar se e o admin
    if (configResult.rows[0].valor === firebaseUid) {
      return res.json({
        role: 'admin',
        user: { id: 0, firebase_uid: firebaseUid, nome, email }
      });
    }

    // Tentar como gestor
    const gestorResult = await pool.query(
      'SELECT id, tenant_id, nome, email FROM gestores WHERE firebase_uid = $1 AND ativo = true',
      [firebaseUid]
    );

    if (gestorResult.rows.length > 0) {
      const g = gestorResult.rows[0];
      return res.json({
        role: 'gestor',
        user: { id: g.id, tenant_id: g.tenant_id, firebase_uid: firebaseUid, nome: g.nome, email: g.email }
      });
    }

    // Tentar como motorista
    const motoristaResult = await pool.query(
      'SELECT id, tenant_id, nome FROM motoristas WHERE firebase_uid = $1 AND ativo = true AND cadastro_completo = true',
      [firebaseUid]
    );

    if (motoristaResult.rows.length > 0) {
      const m = motoristaResult.rows[0];
      return res.json({
        role: 'motorista',
        user: { id: m.id, tenant_id: m.tenant_id, firebase_uid: firebaseUid, nome: m.nome }
      });
    }

    // Nao encontrado - sem permissao
    return res.status(403).json({ error: 'Sem permissao. Use um link de convite para acessar.' });

  } catch (err) {
    console.error('Login error:', err);
    res.status(401).json({ error: 'Token invalido' });
  }
});

// Retorna perfil do usuario logado
router.get('/perfil', requireAuth, (req: AuthRequest, res) => {
  res.json(req.user);
});

// Validar convite (gestor ou motorista)
router.get('/convite/:token', async (req, res) => {
  const { token } = req.params;

  try {
    // Tentar como convite de gestor
    const gestorConvite = await pool.query(
      `SELECT cg.id, cg.tenant_id, cg.email, cg.usado, cg.expira_em, t.nome as tenant_nome, t.cidade
       FROM convites_gestor cg
       JOIN tenants t ON t.id = cg.tenant_id
       WHERE cg.token = $1`,
      [token]
    );

    if (gestorConvite.rows.length > 0) {
      const c = gestorConvite.rows[0];

      if (c.usado) {
        return res.status(400).json({ error: 'Convite ja utilizado' });
      }
      if (c.expira_em && new Date(c.expira_em) < new Date()) {
        return res.status(400).json({ error: 'Convite expirado' });
      }

      return res.json({
        tipo: 'gestor',
        tenant: { id: c.tenant_id, nome: c.tenant_nome, cidade: c.cidade },
        email_restrito: c.email || null
      });
    }

    // Tentar como convite de motorista (tabela motoristas, campo convite_token)
    const motoristaConvite = await pool.query(
      `SELECT m.id, m.tenant_id, m.nome, m.convite_expira_em, t.nome as tenant_nome
       FROM motoristas m
       JOIN tenants t ON t.id = m.tenant_id
       WHERE m.convite_token = $1 AND m.firebase_uid IS NULL`,
      [token]
    );

    if (motoristaConvite.rows.length > 0) {
      const m = motoristaConvite.rows[0];

      if (m.convite_expira_em && new Date(m.convite_expira_em) < new Date()) {
        return res.status(400).json({ error: 'Convite expirado' });
      }

      return res.json({
        tipo: 'motorista',
        tenant: { id: m.tenant_id, nome: m.tenant_nome },
        motorista: { id: m.id, nome: m.nome }
      });
    }

    return res.status(404).json({ error: 'Convite nao encontrado' });

  } catch (err) {
    console.error('Convite validation error:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Aceitar convite apos login Google
router.post('/convite/:token/aceitar', async (req, res) => {
  const { token } = req.params;
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token ausente' });
  }

  try {
    const idToken = header.slice(7);
    const decoded = await auth.verifyIdToken(idToken);
    const firebaseUid = decoded.uid;
    const email = decoded.email || '';
    const nome = decoded.name || email.split('@')[0];

    // Tentar como convite de gestor
    const gestorConvite = await pool.query(
      'SELECT id, tenant_id, email, usado, expira_em FROM convites_gestor WHERE token = $1',
      [token]
    );

    if (gestorConvite.rows.length > 0) {
      const c = gestorConvite.rows[0];

      if (c.usado) {
        return res.status(400).json({ error: 'Convite ja utilizado' });
      }
      if (c.expira_em && new Date(c.expira_em) < new Date()) {
        return res.status(400).json({ error: 'Convite expirado' });
      }
      if (c.email && c.email.toLowerCase() !== email.toLowerCase()) {
        return res.status(400).json({ error: 'Email nao corresponde ao convite' });
      }

      // Criar gestor
      const gestorResult = await pool.query(
        `INSERT INTO gestores (tenant_id, firebase_uid, nome, email)
         VALUES ($1, $2, $3, $4)
         RETURNING id, tenant_id, nome, email`,
        [c.tenant_id, firebaseUid, nome, email]
      );

      // Marcar convite como usado
      await pool.query('UPDATE convites_gestor SET usado = true WHERE id = $1', [c.id]);

      const g = gestorResult.rows[0];
      return res.json({
        role: 'gestor',
        user: { id: g.id, tenant_id: g.tenant_id, firebase_uid: firebaseUid, nome: g.nome, email: g.email }
      });
    }

    // Tentar como convite de motorista
    const motoristaConvite = await pool.query(
      'SELECT id, tenant_id, nome, convite_expira_em FROM motoristas WHERE convite_token = $1 AND firebase_uid IS NULL',
      [token]
    );

    if (motoristaConvite.rows.length > 0) {
      const m = motoristaConvite.rows[0];

      if (m.convite_expira_em && new Date(m.convite_expira_em) < new Date()) {
        return res.status(400).json({ error: 'Convite expirado' });
      }

      // Vincular firebase_uid ao motorista
      await pool.query(
        'UPDATE motoristas SET firebase_uid = $1, convite_token = NULL, convite_expira_em = NULL WHERE id = $2',
        [firebaseUid, m.id]
      );

      return res.json({
        role: 'motorista',
        user: { id: m.id, tenant_id: m.tenant_id, firebase_uid: firebaseUid, nome: m.nome }
      });
    }

    return res.status(404).json({ error: 'Convite nao encontrado' });

  } catch (err) {
    console.error('Convite accept error:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;
