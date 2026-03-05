# Multi-Tenant Admin System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implementar sistema de admin com controle de acesso por convites, painel de gestao de tenants, e build/distribuicao de .exe e .apk.

**Architecture:** Primeiro login Google vira admin permanente (salvo em system_config). Admin cria tenants e gera convites para gestores. Gestores geram convites para motoristas (ja existe). Electron empacota frontend local, comunica com API remota. APK distribuido via /download.

**Tech Stack:** Express.js, PostgreSQL, Firebase Auth, React, Zustand, Electron, Expo/EAS

---

## Task 1: Migration - system_config e convites_gestor

**Files:**
- Create: `api/src/db/migrations/006_admin_convites.sql`

**Step 1: Criar arquivo de migration**

```sql
-- Migration: 006_admin_convites
-- Description: Add system config and gestor invites tables

-- Configuracoes globais do sistema
CREATE TABLE IF NOT EXISTS system_config (
  id SERIAL PRIMARY KEY,
  chave TEXT UNIQUE NOT NULL,
  valor TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Convites para gestores
CREATE TABLE IF NOT EXISTS convites_gestor (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  email TEXT,
  usado BOOLEAN DEFAULT false,
  expira_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_system_config_chave ON system_config(chave);
CREATE INDEX IF NOT EXISTS idx_convites_gestor_token ON convites_gestor(token);
```

**Step 2: Rodar migration**

Run: `cd api && pnpm dev`
(O servidor roda migrations automaticamente via migrate.ts)

**Step 3: Verificar tabelas criadas**

Run: Conectar no banco e verificar: `\dt` deve mostrar system_config e convites_gestor

**Step 4: Commit**

```bash
git add api/src/db/migrations/006_admin_convites.sql
git commit -m "feat(db): add system_config and convites_gestor tables"
```

---

## Task 2: Middleware requireAdmin

**Files:**
- Create: `api/src/middleware/requireAdmin.ts`

**Step 1: Criar middleware**

```typescript
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
```

**Step 2: Commit**

```bash
git add api/src/middleware/requireAdmin.ts
git commit -m "feat(api): add requireAdmin middleware"
```

---

## Task 3: Atualizar auth.ts para detectar admin

**Files:**
- Modify: `api/src/middleware/auth.ts`

**Step 1: Adicionar tipo admin ao UserProfile**

Modificar em `packages/shared` (se existir) ou inline. Adicionar `'admin'` ao tipo `UserRole`.

**Step 2: Modificar requireAuth para detectar admin**

Adicionar apos linha 62 (antes do `if (!user)`):

```typescript
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
```

**Step 3: Commit**

```bash
git add api/src/middleware/auth.ts packages/shared/
git commit -m "feat(api): detect admin role in auth middleware"
```

---

## Task 4: Rota POST /auth/login (setup admin + login normal)

**Files:**
- Modify: `api/src/routes/auth.ts`

**Step 1: Adicionar rota de login**

```typescript
import { Router } from 'express';
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
    let gestorResult = await pool.query(
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

// Retorna perfil do usuario logado (ja existia)
router.get('/perfil', requireAuth, (req: AuthRequest, res) => {
  res.json(req.user);
});

export default router;
```

**Step 2: Adicionar imports necessarios**

```typescript
import { requireAuth, AuthRequest } from '../middleware/auth';
```

**Step 3: Commit**

```bash
git add api/src/routes/auth.ts
git commit -m "feat(api): add POST /auth/login with admin setup"
```

---

## Task 5: Rotas de convite (validar e aceitar)

**Files:**
- Modify: `api/src/routes/auth.ts`

**Step 1: Adicionar rota GET /convite/:token**

```typescript
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
```

**Step 2: Adicionar rota POST /convite/:token/aceitar**

```typescript
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
```

**Step 3: Commit**

```bash
git add api/src/routes/auth.ts
git commit -m "feat(api): add convite validation and accept routes"
```

---

## Task 6: Rotas Admin - CRUD Tenants

**Files:**
- Create: `api/src/routes/admin.ts`

**Step 1: Criar arquivo de rotas admin**

```typescript
import { Router } from 'express';
import { pool } from '../db/pool';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/requireAdmin';
import crypto from 'crypto';

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
      link: `/convite/${token}`
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
```

**Step 2: Commit**

```bash
git add api/src/routes/admin.ts
git commit -m "feat(api): add admin routes for tenant management"
```

---

## Task 7: Rota /download

**Files:**
- Create: `api/src/routes/download.ts`

**Step 1: Criar pasta uploads/releases**

```bash
mkdir -p api/uploads/releases
```

**Step 2: Criar rota de download**

```typescript
import { Router } from 'express';
import path from 'path';
import fs from 'fs';

const router = Router();

const RELEASES_DIR = path.join(__dirname, '../../uploads/releases');

// GET /download/desktop - download do .exe
router.get('/desktop', (req, res) => {
  const filePath = path.join(RELEASES_DIR, 'RotaVans-Setup.exe');

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Arquivo nao disponivel' });
  }

  res.download(filePath, 'RotaVans-Setup.exe');
});

// GET /download/mobile - download do .apk
router.get('/mobile', (req, res) => {
  const filePath = path.join(RELEASES_DIR, 'RotaVans.apk');

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Arquivo nao disponivel' });
  }

  res.download(filePath, 'RotaVans.apk');
});

// GET /download/info - info sobre releases disponiveis
router.get('/info', (req, res) => {
  const exePath = path.join(RELEASES_DIR, 'RotaVans-Setup.exe');
  const apkPath = path.join(RELEASES_DIR, 'RotaVans.apk');

  const info = {
    desktop: {
      disponivel: fs.existsSync(exePath),
      tamanho: fs.existsSync(exePath) ? fs.statSync(exePath).size : null
    },
    mobile: {
      disponivel: fs.existsSync(apkPath),
      tamanho: fs.existsSync(apkPath) ? fs.statSync(apkPath).size : null
    }
  };

  res.json(info);
});

export default router;
```

**Step 3: Adicionar uploads ao .gitignore**

```bash
echo "api/uploads/releases/*.exe" >> .gitignore
echo "api/uploads/releases/*.apk" >> .gitignore
```

**Step 4: Commit**

```bash
git add api/src/routes/download.ts .gitignore
git commit -m "feat(api): add download routes for desktop and mobile"
```

---

## Task 8: Registrar novas rotas no index.ts

**Files:**
- Modify: `api/src/index.ts`

**Step 1: Importar e registrar rotas**

Adicionar imports:
```typescript
import adminRoutes from './routes/admin';
import downloadRoutes from './routes/download';
```

Adicionar apos as outras rotas:
```typescript
app.use('/admin', adminRoutes);
app.use('/download', downloadRoutes);
```

**Step 2: Commit**

```bash
git add api/src/index.ts
git commit -m "feat(api): register admin and download routes"
```

---

## Task 9: Frontend - Store de auth atualizada

**Files:**
- Modify: `apps/web/src/stores/auth.ts`

**Step 1: Ler arquivo atual**

Verificar estrutura existente.

**Step 2: Atualizar store para suportar roles**

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type UserRole = 'admin' | 'gestor' | 'motorista' | null;

interface User {
  id: number;
  tenant_id: number | null;
  firebase_uid: string;
  nome: string;
  email?: string;
}

interface AuthState {
  user: User | null;
  role: UserRole;
  token: string | null;
  setAuth: (user: User, role: UserRole, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      role: null,
      token: null,
      setAuth: (user, role, token) => set({ user, role, token }),
      logout: () => set({ user: null, role: null, token: null }),
    }),
    { name: 'rotavans-auth' }
  )
);
```

**Step 3: Commit**

```bash
git add apps/web/src/stores/auth.ts
git commit -m "feat(web): update auth store with role support"
```

---

## Task 10: Frontend - Pagina de Login

**Files:**
- Create: `apps/web/src/pages/Login.tsx`

**Step 1: Criar componente de login**

```tsx
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuthStore } from '../stores/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);

  const conviteToken = searchParams.get('convite');

  async function handleGoogleLogin() {
    setLoading(true);
    setError(null);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      // Se tem convite, aceitar convite
      if (conviteToken) {
        const res = await fetch(`${API_URL}/auth/convite/${conviteToken}/aceitar`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${idToken}` }
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Erro ao aceitar convite');
        }

        const data = await res.json();
        setAuth(data.user, data.role, idToken);
        navigate('/');
        return;
      }

      // Login normal
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro no login');
      }

      const data = await res.json();
      setAuth(data.user, data.role, idToken);
      navigate('/');

    } catch (err: any) {
      setError(err.message || 'Erro no login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="bg-zinc-900 p-8 rounded-lg shadow-xl max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">RotaVans</h1>

        {conviteToken && (
          <p className="text-zinc-400 text-center mb-4">
            Voce foi convidado para acessar o sistema. Faca login para continuar.
          </p>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white text-black py-3 px-4 rounded font-medium hover:bg-zinc-100 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            'Entrando...'
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Entrar com Google
            </>
          )}
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/pages/Login.tsx
git commit -m "feat(web): add Login page with Google auth"
```

---

## Task 11: Frontend - Pagina de Convite

**Files:**
- Create: `apps/web/src/pages/Convite.tsx`

**Step 1: Criar componente de convite**

```tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface ConviteInfo {
  tipo: 'gestor' | 'motorista';
  tenant: { id: number; nome: string; cidade?: string };
  email_restrito?: string;
  motorista?: { id: number; nome: string };
}

export function ConvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [convite, setConvite] = useState<ConviteInfo | null>(null);

  useEffect(() => {
    async function validateConvite() {
      try {
        const res = await fetch(`${API_URL}/auth/convite/${token}`);

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Convite invalido');
        }

        const data = await res.json();
        setConvite(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      validateConvite();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-400">Validando convite...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="bg-zinc-900 p-8 rounded-lg max-w-md w-full text-center">
          <h1 className="text-xl font-bold text-red-500 mb-4">Convite Invalido</h1>
          <p className="text-zinc-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="bg-zinc-900 p-8 rounded-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-2">Convite Recebido</h1>

        <p className="text-zinc-400 mb-6">
          Voce foi convidado para ser{' '}
          <span className="text-blue-400 font-medium">
            {convite?.tipo === 'gestor' ? 'Gestor' : 'Motorista'}
          </span>{' '}
          em <span className="text-white font-medium">{convite?.tenant.nome}</span>
          {convite?.tenant.cidade && ` - ${convite.tenant.cidade}`}
        </p>

        {convite?.email_restrito && (
          <p className="text-zinc-500 text-sm mb-4">
            Este convite e restrito ao email: {convite.email_restrito}
          </p>
        )}

        <button
          onClick={() => navigate(`/login?convite=${token}`)}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded font-medium hover:bg-blue-700"
        >
          Aceitar Convite
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/pages/Convite.tsx
git commit -m "feat(web): add Convite page for invite validation"
```

---

## Task 12: Frontend - Painel Admin

**Files:**
- Create: `apps/web/src/pages/Admin/index.tsx`
- Create: `apps/web/src/pages/Admin/Tenants.tsx`
- Create: `apps/web/src/pages/Admin/TenantForm.tsx`

**Step 1: Criar layout admin**

`apps/web/src/pages/Admin/index.tsx`:
```tsx
import { Outlet, NavLink } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth';

export function AdminLayout() {
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800">
        <div className="p-4 border-b border-zinc-800">
          <h1 className="text-xl font-bold text-white">RotaVans Admin</h1>
          <p className="text-zinc-500 text-sm">{user?.email}</p>
        </div>

        <nav className="p-2">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `block px-4 py-2 rounded ${isActive ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:bg-zinc-800'}`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/admin/tenants"
            className={({ isActive }) =>
              `block px-4 py-2 rounded ${isActive ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:bg-zinc-800'}`
            }
          >
            Regioes
          </NavLink>
        </nav>

        <div className="absolute bottom-0 left-0 w-64 p-4 border-t border-zinc-800">
          <button
            onClick={logout}
            className="w-full text-left text-zinc-400 hover:text-white"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
```

**Step 2: Criar dashboard admin**

`apps/web/src/pages/Admin/Dashboard.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Stats {
  total_tenants: number;
  total_gestores: number;
  total_motoristas: number;
  total_alunos: number;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    async function loadStats() {
      const res = await fetch(`${API_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setStats(await res.json());
      }
    }
    loadStats();
  }, [token]);

  const cards = [
    { label: 'Regioes', value: stats?.total_tenants || 0, color: 'blue' },
    { label: 'Gestores', value: stats?.total_gestores || 0, color: 'green' },
    { label: 'Motoristas', value: stats?.total_motoristas || 0, color: 'yellow' },
    { label: 'Alunos', value: stats?.total_alunos || 0, color: 'purple' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Dashboard</h2>

      <div className="grid grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-zinc-900 rounded-lg p-6">
            <p className="text-zinc-500 text-sm">{card.label}</p>
            <p className="text-3xl font-bold text-white mt-1">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 3: Criar lista de tenants**

`apps/web/src/pages/Admin/Tenants.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Tenant {
  id: number;
  nome: string;
  cidade: string;
  estado: string;
  ativo: boolean;
  total_gestores: number;
  total_motoristas: number;
  total_alunos: number;
}

export function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    loadTenants();
  }, []);

  async function loadTenants() {
    const res = await fetch(`${API_URL}/admin/tenants`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      setTenants(await res.json());
    }
    setLoading(false);
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Regioes</h2>
        <Link
          to="/admin/tenants/novo"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Nova Regiao
        </Link>
      </div>

      <div className="bg-zinc-900 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-zinc-800">
            <tr>
              <th className="text-left p-4 text-zinc-400 font-medium">Nome</th>
              <th className="text-left p-4 text-zinc-400 font-medium">Cidade</th>
              <th className="text-left p-4 text-zinc-400 font-medium">Estado</th>
              <th className="text-left p-4 text-zinc-400 font-medium">Gestores</th>
              <th className="text-left p-4 text-zinc-400 font-medium">Motoristas</th>
              <th className="text-left p-4 text-zinc-400 font-medium">Alunos</th>
              <th className="text-left p-4 text-zinc-400 font-medium">Status</th>
              <th className="text-left p-4 text-zinc-400 font-medium">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => (
              <tr key={tenant.id} className="border-t border-zinc-800">
                <td className="p-4 text-white">{tenant.nome}</td>
                <td className="p-4 text-zinc-400">{tenant.cidade}</td>
                <td className="p-4 text-zinc-400">{tenant.estado}</td>
                <td className="p-4 text-zinc-400">{tenant.total_gestores}</td>
                <td className="p-4 text-zinc-400">{tenant.total_motoristas}</td>
                <td className="p-4 text-zinc-400">{tenant.total_alunos}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${tenant.ativo ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                    {tenant.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="p-4">
                  <Link
                    to={`/admin/tenants/${tenant.id}`}
                    className="text-blue-500 hover:underline"
                  >
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

**Step 4: Criar form de tenant**

`apps/web/src/pages/Admin/TenantForm.tsx`:
```tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function TenantFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const isEdit = !!id && id !== 'novo';

  const [form, setForm] = useState({ nome: '', cidade: '', estado: '' });
  const [loading, setLoading] = useState(false);
  const [conviteLink, setConviteLink] = useState<string | null>(null);

  useEffect(() => {
    if (isEdit) {
      loadTenant();
    }
  }, [id]);

  async function loadTenant() {
    const res = await fetch(`${API_URL}/admin/tenants/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setForm({ nome: data.nome, cidade: data.cidade, estado: data.estado });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const url = isEdit ? `${API_URL}/admin/tenants/${id}` : `${API_URL}/admin/tenants`;
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(form)
    });

    if (res.ok) {
      const data = await res.json();
      if (!isEdit) {
        navigate(`/admin/tenants/${data.id}`);
      }
    }

    setLoading(false);
  }

  async function handleGerarConvite() {
    const res = await fetch(`${API_URL}/admin/tenants/${id}/convite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ dias_validade: 7 })
    });

    if (res.ok) {
      const data = await res.json();
      setConviteLink(`${window.location.origin}/convite/${data.token}`);
    }
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-white mb-6">
        {isEdit ? 'Editar Regiao' : 'Nova Regiao'}
      </h2>

      <form onSubmit={handleSubmit} className="bg-zinc-900 rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-zinc-400 mb-1">Nome da Prefeitura</label>
          <input
            type="text"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-4 py-2 text-white"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-zinc-400 mb-1">Cidade</label>
            <input
              type="text"
              value={form.cidade}
              onChange={(e) => setForm({ ...form, cidade: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-4 py-2 text-white"
              required
            />
          </div>
          <div>
            <label className="block text-zinc-400 mb-1">Estado</label>
            <input
              type="text"
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-4 py-2 text-white"
              maxLength={2}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Salvando...' : 'Salvar'}
        </button>
      </form>

      {isEdit && (
        <div className="bg-zinc-900 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-bold text-white mb-4">Convite para Gestor</h3>

          {conviteLink ? (
            <div className="bg-zinc-800 p-4 rounded">
              <p className="text-zinc-400 text-sm mb-2">Link de convite (valido por 7 dias):</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={conviteLink}
                  readOnly
                  className="flex-1 bg-zinc-700 border border-zinc-600 rounded px-4 py-2 text-white"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(conviteLink)}
                  className="bg-zinc-700 text-white px-4 py-2 rounded hover:bg-zinc-600"
                >
                  Copiar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleGerarConvite}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Gerar Link de Convite
            </button>
          )}
        </div>
      )}
    </div>
  );
}
```

**Step 5: Commit**

```bash
git add apps/web/src/pages/Admin/
git commit -m "feat(web): add Admin panel pages"
```

---

## Task 13: Frontend - Atualizar App.tsx com roteamento por role

**Files:**
- Modify: `apps/web/src/App.tsx`

**Step 1: Atualizar roteamento**

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/auth';
import { LoginPage } from './pages/Login';
import { ConvitePage } from './pages/Convite';
import { AdminLayout } from './pages/Admin';
import { AdminDashboard } from './pages/Admin/Dashboard';
import { TenantsPage } from './pages/Admin/Tenants';
import { TenantFormPage } from './pages/Admin/TenantForm';
// Import existing gestor pages...

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { role } = useAuthStore();

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function RootRedirect() {
  const { role } = useAuthStore();

  if (!role) return <Navigate to="/login" replace />;
  if (role === 'admin') return <Navigate to="/admin" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/convite/:token" element={<ConvitePage />} />

        {/* Root redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* Admin routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="tenants" element={<TenantsPage />} />
          <Route path="tenants/:id" element={<TenantFormPage />} />
        </Route>

        {/* Gestor routes (existing) */}
        {/* ... keep existing gestor routes ... */}
      </Routes>
    </BrowserRouter>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/App.tsx
git commit -m "feat(web): add role-based routing"
```

---

## Task 14: Electron - Configurar build

**Files:**
- Create: `apps/desktop/electron/main.ts`
- Create: `apps/desktop/electron-builder.yml`
- Modify: `apps/desktop/package.json`

**Step 1: Criar main.ts do Electron**

```typescript
import { app, BrowserWindow } from 'electron';
import path from 'path';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0a0a0a',
      symbolColor: '#ffffff',
      height: 40
    }
  });

  // Em producao, carrega o index.html buildado
  // Em dev, carrega o servidor Vite
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
```

**Step 2: Criar electron-builder.yml**

```yaml
appId: com.rotavans.desktop
productName: RotaVans
copyright: Copyright © 2026

directories:
  output: release
  buildResources: assets

files:
  - dist/**/*
  - electron/**/*
  - package.json

win:
  target:
    - target: nsis
      arch:
        - x64
  icon: assets/icon.ico

nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  installerIcon: assets/icon.ico
  uninstallerIcon: assets/icon.ico
  installerHeaderIcon: assets/icon.ico
  createDesktopShortcut: true
  createStartMenuShortcut: true
  shortcutName: RotaVans
```

**Step 3: Atualizar package.json**

```json
{
  "name": "desktop",
  "version": "1.0.0",
  "main": "electron/main.js",
  "scripts": {
    "dev": "vite",
    "build": "vite build && tsc -p electron/tsconfig.json",
    "electron:dev": "concurrently \"vite\" \"wait-on http://localhost:5173 && electron .\"",
    "electron:build": "pnpm build && electron-builder --win"
  },
  "devDependencies": {
    "electron": "^28.0.0",
    "electron-builder": "^24.13.0",
    "concurrently": "^8.2.0",
    "wait-on": "^7.2.0"
  }
}
```

**Step 4: Criar electron/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": ".",
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true
  },
  "include": ["main.ts"]
}
```

**Step 5: Commit**

```bash
git add apps/desktop/electron/ apps/desktop/electron-builder.yml apps/desktop/package.json
git commit -m "feat(desktop): add Electron build configuration"
```

---

## Task 15: Mobile - Configurar EAS Build

**Files:**
- Modify: `apps/mobile/eas.json`
- Modify: `apps/mobile/app.json`

**Step 1: Atualizar eas.json**

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {}
}
```

**Step 2: Atualizar app.json com config Android**

```json
{
  "expo": {
    "name": "RotaVans",
    "slug": "rotavans-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0a0a0a"
    },
    "android": {
      "package": "com.rotavans.mobile",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0a0a0a"
      }
    },
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

**Step 3: Commit**

```bash
git add apps/mobile/eas.json apps/mobile/app.json
git commit -m "feat(mobile): configure EAS build for APK"
```

---

## Task 16: Testar fluxo completo

**Step 1: Rodar API**

```bash
cd api && pnpm dev
```

**Step 2: Rodar Web**

```bash
cd apps/web && pnpm dev
```

**Step 3: Testar setup admin**

1. Abrir http://localhost:5173
2. Fazer login com Google
3. Verificar que virou admin (primeiro login)
4. Verificar painel admin aparece

**Step 4: Testar criar tenant**

1. Ir em Regioes > Nova Regiao
2. Preencher dados
3. Salvar
4. Gerar link de convite

**Step 5: Testar convite gestor**

1. Abrir link de convite em aba anonima
2. Fazer login com Google diferente
3. Verificar que virou gestor do tenant

**Step 6: Commit final**

```bash
git add .
git commit -m "feat: complete multi-tenant admin system"
```

---

## Task 17: Build .exe

**Step 1: Instalar dependencias Electron**

```bash
cd apps/desktop && pnpm install
```

**Step 2: Criar icone**

Criar arquivo `apps/desktop/assets/icon.ico` (256x256 px)

**Step 3: Build**

```bash
pnpm electron:build
```

**Step 4: Verificar output**

Arquivo gerado em `apps/desktop/release/RotaVans-Setup.exe`

**Step 5: Copiar para API**

```bash
cp apps/desktop/release/RotaVans-Setup.exe api/uploads/releases/
```

---

## Task 18: Build .apk

**Step 1: Login no EAS**

```bash
cd apps/mobile && npx eas login
```

**Step 2: Configurar projeto EAS**

```bash
npx eas build:configure
```

**Step 3: Build APK**

```bash
npx eas build --platform android --profile production
```

**Step 4: Baixar APK**

Apos build finalizar, baixar do link fornecido.

**Step 5: Copiar para API**

```bash
cp ~/Downloads/RotaVans.apk api/uploads/releases/
```

---

## Task 19: Deploy Railway

**Step 1: Criar projeto no Railway**

1. Acessar railway.app
2. New Project > Deploy from GitHub
3. Selecionar repositorio

**Step 2: Configurar variaveis**

```
DATABASE_URL=postgresql://...
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
API_URL=https://seu-app.up.railway.app
MAPBOX_TOKEN=pk.xxx
```

**Step 3: Configurar build**

- Root Directory: `api`
- Build Command: `pnpm install && pnpm build`
- Start Command: `pnpm start`

**Step 4: Deploy**

Railway faz deploy automatico.

**Step 5: Testar**

Acessar URL do Railway e verificar API funcionando.
