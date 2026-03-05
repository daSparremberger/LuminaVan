import { Response, NextFunction } from 'express';
import { pool } from '../db/pool';
import { AuthRequest } from './auth';

export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Nao autenticado' });
  }

  try {
    const result = await pool.query(
      "SELECT valor FROM system_config WHERE chave = 'admin_firebase_uid'"
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Sistema nao configurado' });
    }

    if (result.rows[0].valor !== req.user.firebase_uid) {
      return res.status(403).json({ error: 'Acesso restrito ao administrador' });
    }

    next();
  } catch (err) {
    console.error('Admin check error:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
}
