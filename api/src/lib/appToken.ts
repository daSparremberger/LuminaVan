import jwt from 'jsonwebtoken';

export interface AppTokenPayload {
  sub: number;
  tenant_id: number;
  role: 'motorista';
}

const APP_TOKEN_SECRET = process.env.APP_TOKEN_SECRET || 'rotavans-mobile-dev-secret';
const APP_TOKEN_EXPIRES_IN = process.env.APP_TOKEN_EXPIRES_IN || '180d';

export function signMotoristaAppToken(payload: AppTokenPayload) {
  return jwt.sign(payload as object, APP_TOKEN_SECRET, {
    expiresIn: APP_TOKEN_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAppToken(token: string): AppTokenPayload | null {
  try {
    const decoded = jwt.verify(token, APP_TOKEN_SECRET) as jwt.JwtPayload | string;
    if (typeof decoded === 'string') return null;
    if (decoded.role !== 'motorista' || !decoded.sub || !decoded.tenant_id) return null;
    return {
      sub: Number(decoded.sub),
      tenant_id: Number(decoded.tenant_id),
      role: 'motorista',
    };
  } catch {
    return null;
  }
}
