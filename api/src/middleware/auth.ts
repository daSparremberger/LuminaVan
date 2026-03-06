import { Request, Response, NextFunction } from 'express';
import { auth } from '../lib/firebase';
import { pool } from '../db/pool';
import type { UserRole, UserProfile } from '../types';
import { verifyAppToken } from '../lib/appToken';

export interface AuthRequest extends Request {
  user?: UserProfile;
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token ausente' });
  }

  try {
    const idToken = header.slice(7);

    const appToken = verifyAppToken(idToken);
    if (appToken) {
      const motoristaResult = await pool.query(
        'SELECT id, tenant_id, firebase_uid, nome FROM motoristas WHERE id = $1 AND tenant_id = $2 AND ativo = true AND cadastro_completo = true',
        [appToken.sub, appToken.tenant_id]
      );

      if (motoristaResult.rows.length > 0) {
        const m = motoristaResult.rows[0];
        req.user = {
          id: m.id,
          tenant_id: m.tenant_id,
          firebase_uid: m.firebase_uid || `motorista:${m.id}`,
          nome: m.nome,
          role: 'motorista',
        };
        return next();
      }
    }

    const decoded = await auth.verifyIdToken(idToken);
    const firebaseUid = decoded.uid;
    const email = decoded.email;

    // Buscar usuario no banco (gestor ou motorista)
    let user: UserProfile | null = null;

    // Tentar como gestor (por firebase_uid)
    let gestorResult = await pool.query(
      'SELECT id, tenant_id, firebase_uid, nome, email FROM gestores WHERE firebase_uid = $1 AND ativo = true',
      [firebaseUid]
    );

    // Se nao achou por uid, tentar por email (primeiro login)
    if (gestorResult.rows.length === 0 && email) {
      gestorResult = await pool.query(
        'SELECT id, tenant_id, firebase_uid, nome, email FROM gestores WHERE email = $1 AND ativo = true',
        [email]
      );

      // Se achou por email mas sem firebase_uid, atualizar
      if (gestorResult.rows.length > 0 && !gestorResult.rows[0].firebase_uid) {
        await pool.query('UPDATE gestores SET firebase_uid = $1 WHERE id = $2', [firebaseUid, gestorResult.rows[0].id]);
        gestorResult.rows[0].firebase_uid = firebaseUid;
      }
    }

    if (gestorResult.rows.length > 0) {
      const g = gestorResult.rows[0];
      user = { id: g.id, tenant_id: g.tenant_id, firebase_uid: g.firebase_uid, nome: g.nome, email: g.email, role: 'gestor' };
    }

    // Tentar como motorista
    if (!user) {
      const motoristaResult = await pool.query(
        'SELECT id, tenant_id, firebase_uid, nome FROM motoristas WHERE firebase_uid = $1 AND ativo = true AND cadastro_completo = true',
        [firebaseUid]
      );
      if (motoristaResult.rows.length > 0) {
        const m = motoristaResult.rows[0];
        user = { id: m.id, tenant_id: m.tenant_id, firebase_uid: m.firebase_uid, nome: m.nome, role: 'motorista' };
      }
    }

    // Verificar se e admin
    if (!user) {
      const adminResult = await pool.query(
        "SELECT valor FROM system_config WHERE chave = 'admin_firebase_uid'"
      );

      if (adminResult.rows.length > 0 && adminResult.rows[0].valor === firebaseUid) {
        user = {
          id: 0,
          tenant_id: null,
          firebase_uid: firebaseUid,
          nome: email || 'Admin',
          email: email,
          role: 'admin'
        };
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Usuario nao encontrado' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth error:', err);
    res.status(401).json({ error: 'Token invalido' });
  }
}

export function requireGestor(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'gestor') {
    return res.status(403).json({ error: 'Acesso restrito ao gestor' });
  }
  next();
}
