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

export default router;
