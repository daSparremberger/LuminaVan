# RotaVans Web Gestao - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refinar o aplicativo web de gestao com Dashboard rico, Veiculos, Mensagens, biometria facial e melhorias em todas as abas.

**Architecture:** Frontend React com Recharts para graficos, face-api.js para biometria client-side, Socket.io para mensagens em tempo real. Backend Express com novas tabelas para veiculos, contatos de escolas e mensagens.

**Tech Stack:** React 18, Vite, Tailwind CSS, Recharts, face-api.js, Socket.io, PostgreSQL, Express.js

---

## Phase 1: Database & Types

### Task 1: Create migration for new tables

**Files:**
- Create: `api/src/db/migrations/005_veiculos_mensagens.sql`

**Step 1: Write the migration file**

```sql
-- Veiculos
CREATE TABLE IF NOT EXISTS veiculos (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
  placa TEXT NOT NULL,
  modelo TEXT NOT NULL,
  fabricante TEXT NOT NULL,
  ano INTEGER,
  capacidade INTEGER DEFAULT 15,
  consumo_km DECIMAL(4,2),
  renavam TEXT,
  chassi TEXT,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Pool de motoristas por veiculo
CREATE TABLE IF NOT EXISTS veiculo_motoristas (
  id SERIAL PRIMARY KEY,
  veiculo_id INTEGER REFERENCES veiculos(id) ON DELETE CASCADE,
  motorista_id INTEGER REFERENCES motoristas(id) ON DELETE CASCADE,
  ativo BOOLEAN DEFAULT true,
  UNIQUE(veiculo_id, motorista_id)
);

-- Contatos de escolas
CREATE TABLE IF NOT EXISTS escola_contatos (
  id SERIAL PRIMARY KEY,
  escola_id INTEGER REFERENCES escolas(id) ON DELETE CASCADE,
  cargo TEXT NOT NULL,
  nome TEXT NOT NULL,
  telefone TEXT
);

-- Mensagens
CREATE TABLE IF NOT EXISTS mensagens (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
  remetente_id INTEGER NOT NULL,
  remetente_tipo TEXT CHECK(remetente_tipo IN ('gestor','motorista')),
  destinatario_id INTEGER NOT NULL,
  destinatario_tipo TEXT CHECK(destinatario_tipo IN ('gestor','motorista')),
  conteudo TEXT NOT NULL,
  lido BOOLEAN DEFAULT false,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Biometria facial em alunos
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS face_embeddings JSONB;

-- Mudar rotas para vincular a veiculo (manter motorista_id para compatibilidade)
ALTER TABLE rotas ADD COLUMN IF NOT EXISTS veiculo_id INTEGER REFERENCES veiculos(id) ON DELETE SET NULL;

-- Indices
CREATE INDEX IF NOT EXISTS idx_veiculos_tenant ON veiculos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_veiculo_motoristas_veiculo ON veiculo_motoristas(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_escola_contatos_escola ON escola_contatos(escola_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_tenant ON mensagens(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_destinatario ON mensagens(destinatario_id, destinatario_tipo);
```

**Step 2: Run migration**

Run: `cd api && pnpm run db:migrate`
Expected: Migration applied successfully

**Step 3: Commit**

```bash
git add api/src/db/migrations/005_veiculos_mensagens.sql
git commit -m "feat(db): add tables for vehicles, contacts, messages and face embeddings"
```

---

### Task 2: Update shared types

**Files:**
- Modify: `packages/shared/src/types.ts`

**Step 1: Add new interfaces**

Add after existing types:

```typescript
// Veiculos
export interface Veiculo {
  id: number;
  tenant_id: number;
  placa: string;
  modelo: string;
  fabricante: string;
  ano?: number;
  capacidade: number;
  consumo_km?: number;
  renavam?: string;
  chassi?: string;
  ativo: boolean;
  criado_em: string;
  // Computed
  motoristas_habilitados?: Motorista[];
  rotas_vinculadas?: Rota[];
}

export interface VeiculoMotorista {
  id: number;
  veiculo_id: number;
  motorista_id: number;
  motorista_nome?: string;
  ativo: boolean;
}

// Contatos de Escola
export interface EscolaContato {
  id: number;
  escola_id: number;
  cargo: string;
  nome: string;
  telefone?: string;
}

// Mensagens
export interface Mensagem {
  id: number;
  tenant_id: number;
  remetente_id: number;
  remetente_tipo: 'gestor' | 'motorista';
  remetente_nome?: string;
  destinatario_id: number;
  destinatario_tipo: 'gestor' | 'motorista';
  destinatario_nome?: string;
  conteudo: string;
  lido: boolean;
  criado_em: string;
}

export interface Conversa {
  participante_id: number;
  participante_tipo: 'gestor' | 'motorista';
  participante_nome: string;
  ultima_mensagem?: string;
  ultima_mensagem_data?: string;
  nao_lidas: number;
  online?: boolean;
}

// Dashboard Stats
export interface DashboardStats {
  veiculos_ativos: number;
  veiculos_total: number;
  motoristas_em_acao: number;
  rotas_hoje: number;
  alunos_total: number;
}

export interface DashboardChartData {
  rotas_por_dia: { data: string; total: number }[];
  alunos_por_escola: { escola: string; total: number }[];
  financeiro_mensal: { mes: string; receitas: number; despesas: number }[];
  atividade_por_turno: { turno: string; rotas: number }[];
}
```

**Step 2: Update Aluno interface**

Add to Aluno interface:

```typescript
  face_embeddings?: number[][];  // Array of 128-d vectors
```

**Step 3: Update Rota interface**

Add to Rota interface:

```typescript
  veiculo_id?: number;
  veiculo_placa?: string;
```

**Step 4: Commit**

```bash
git add packages/shared/src/types.ts
git commit -m "feat(types): add interfaces for vehicles, contacts, messages and dashboard"
```

---

## Phase 2: API Routes

### Task 3: Create vehicles API routes

**Files:**
- Create: `api/src/routes/veiculos.ts`
- Modify: `api/src/index.ts`

**Step 1: Create veiculos.ts**

```typescript
import { Router } from 'express';
import { pool } from '../db/pool';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// Listar veiculos
router.get('/', async (req, res) => {
  const { tenant_id } = req.user!;
  const result = await pool.query(
    `SELECT v.*,
      (SELECT COUNT(*) FROM veiculo_motoristas vm WHERE vm.veiculo_id = v.id AND vm.ativo = true) as motoristas_count,
      (SELECT COUNT(*) FROM rotas r WHERE r.veiculo_id = v.id AND r.ativo = true) as rotas_count
     FROM veiculos v WHERE v.tenant_id = $1 AND v.ativo = true ORDER BY v.placa`,
    [tenant_id]
  );
  res.json(result.rows);
});

// Obter veiculo com detalhes
router.get('/:id', async (req, res) => {
  const { tenant_id } = req.user!;
  const { id } = req.params;

  const veiculo = await pool.query(
    'SELECT * FROM veiculos WHERE id = $1 AND tenant_id = $2',
    [id, tenant_id]
  );
  if (veiculo.rows.length === 0) return res.status(404).json({ error: 'Veiculo nao encontrado' });

  const motoristas = await pool.query(
    `SELECT vm.*, m.nome as motorista_nome FROM veiculo_motoristas vm
     JOIN motoristas m ON m.id = vm.motorista_id
     WHERE vm.veiculo_id = $1`,
    [id]
  );

  const rotas = await pool.query(
    'SELECT id, nome, turno FROM rotas WHERE veiculo_id = $1 AND ativo = true',
    [id]
  );

  res.json({
    ...veiculo.rows[0],
    motoristas_habilitados: motoristas.rows,
    rotas_vinculadas: rotas.rows
  });
});

// Criar veiculo
router.post('/', async (req, res) => {
  const { tenant_id } = req.user!;
  const { placa, modelo, fabricante, ano, capacidade, consumo_km, renavam, chassi } = req.body;

  const result = await pool.query(
    `INSERT INTO veiculos (tenant_id, placa, modelo, fabricante, ano, capacidade, consumo_km, renavam, chassi)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [tenant_id, placa, modelo, fabricante, ano, capacidade || 15, consumo_km, renavam, chassi]
  );
  res.status(201).json(result.rows[0]);
});

// Atualizar veiculo
router.put('/:id', async (req, res) => {
  const { tenant_id } = req.user!;
  const { id } = req.params;
  const { placa, modelo, fabricante, ano, capacidade, consumo_km, renavam, chassi } = req.body;

  const result = await pool.query(
    `UPDATE veiculos SET placa=$1, modelo=$2, fabricante=$3, ano=$4, capacidade=$5, consumo_km=$6, renavam=$7, chassi=$8
     WHERE id=$9 AND tenant_id=$10 RETURNING *`,
    [placa, modelo, fabricante, ano, capacidade, consumo_km, renavam, chassi, id, tenant_id]
  );
  res.json(result.rows[0]);
});

// Atualizar motoristas habilitados
router.put('/:id/motoristas', async (req, res) => {
  const { tenant_id } = req.user!;
  const { id } = req.params;
  const { motorista_ids } = req.body; // array de IDs

  // Desativar todos
  await pool.query('UPDATE veiculo_motoristas SET ativo = false WHERE veiculo_id = $1', [id]);

  // Ativar/inserir selecionados
  for (const motorista_id of motorista_ids) {
    await pool.query(
      `INSERT INTO veiculo_motoristas (veiculo_id, motorista_id, ativo)
       VALUES ($1, $2, true)
       ON CONFLICT (veiculo_id, motorista_id) DO UPDATE SET ativo = true`,
      [id, motorista_id]
    );
  }

  res.json({ success: true });
});

// Desativar veiculo
router.delete('/:id', async (req, res) => {
  const { tenant_id } = req.user!;
  const { id } = req.params;
  await pool.query('UPDATE veiculos SET ativo = false WHERE id = $1 AND tenant_id = $2', [id, tenant_id]);
  res.json({ success: true });
});

export default router;
```

**Step 2: Register route in index.ts**

Add import and use:

```typescript
import veiculosRouter from './routes/veiculos';
// ... after other routes
app.use('/veiculos', veiculosRouter);
```

**Step 3: Commit**

```bash
git add api/src/routes/veiculos.ts api/src/index.ts
git commit -m "feat(api): add vehicles CRUD routes"
```

---

### Task 4: Create escola_contatos API routes

**Files:**
- Modify: `api/src/routes/escolas.ts`

**Step 1: Add contatos endpoints**

Add to existing escolas.ts:

```typescript
// Listar contatos de uma escola
router.get('/:id/contatos', async (req, res) => {
  const { id } = req.params;
  const result = await pool.query(
    'SELECT * FROM escola_contatos WHERE escola_id = $1 ORDER BY cargo',
    [id]
  );
  res.json(result.rows);
});

// Adicionar contato
router.post('/:id/contatos', async (req, res) => {
  const { id } = req.params;
  const { cargo, nome, telefone } = req.body;
  const result = await pool.query(
    'INSERT INTO escola_contatos (escola_id, cargo, nome, telefone) VALUES ($1, $2, $3, $4) RETURNING *',
    [id, cargo, nome, telefone]
  );
  res.status(201).json(result.rows[0]);
});

// Atualizar contato
router.put('/:id/contatos/:contatoId', async (req, res) => {
  const { contatoId } = req.params;
  const { cargo, nome, telefone } = req.body;
  const result = await pool.query(
    'UPDATE escola_contatos SET cargo=$1, nome=$2, telefone=$3 WHERE id=$4 RETURNING *',
    [cargo, nome, telefone, contatoId]
  );
  res.json(result.rows[0]);
});

// Remover contato
router.delete('/:id/contatos/:contatoId', async (req, res) => {
  const { contatoId } = req.params;
  await pool.query('DELETE FROM escola_contatos WHERE id = $1', [contatoId]);
  res.json({ success: true });
});
```

**Step 2: Update GET escola/:id to include contatos**

```typescript
router.get('/:id', async (req, res) => {
  const { tenant_id } = req.user!;
  const { id } = req.params;

  const escola = await pool.query(
    'SELECT * FROM escolas WHERE id = $1 AND tenant_id = $2',
    [id, tenant_id]
  );
  if (escola.rows.length === 0) return res.status(404).json({ error: 'Escola nao encontrada' });

  const contatos = await pool.query(
    'SELECT * FROM escola_contatos WHERE escola_id = $1 ORDER BY cargo',
    [id]
  );

  res.json({ ...escola.rows[0], contatos: contatos.rows });
});
```

**Step 3: Commit**

```bash
git add api/src/routes/escolas.ts
git commit -m "feat(api): add school contacts CRUD"
```

---

### Task 5: Create messages API routes

**Files:**
- Create: `api/src/routes/mensagens.ts`
- Modify: `api/src/index.ts`

**Step 1: Create mensagens.ts**

```typescript
import { Router } from 'express';
import { pool } from '../db/pool';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// Listar conversas
router.get('/conversas', async (req, res) => {
  const { tenant_id, id: user_id, role } = req.user!;
  const user_tipo = role;

  // Buscar todas as conversas do usuario
  const result = await pool.query(`
    WITH ultimas AS (
      SELECT DISTINCT ON (
        CASE WHEN remetente_id = $1 AND remetente_tipo = $2 THEN destinatario_id ELSE remetente_id END,
        CASE WHEN remetente_id = $1 AND remetente_tipo = $2 THEN destinatario_tipo ELSE remetente_tipo END
      )
        CASE WHEN remetente_id = $1 AND remetente_tipo = $2 THEN destinatario_id ELSE remetente_id END as participante_id,
        CASE WHEN remetente_id = $1 AND remetente_tipo = $2 THEN destinatario_tipo ELSE remetente_tipo END as participante_tipo,
        conteudo as ultima_mensagem,
        criado_em as ultima_mensagem_data
      FROM mensagens
      WHERE tenant_id = $3
        AND ((remetente_id = $1 AND remetente_tipo = $2) OR (destinatario_id = $1 AND destinatario_tipo = $2))
      ORDER BY
        CASE WHEN remetente_id = $1 AND remetente_tipo = $2 THEN destinatario_id ELSE remetente_id END,
        CASE WHEN remetente_id = $1 AND remetente_tipo = $2 THEN destinatario_tipo ELSE remetente_tipo END,
        criado_em DESC
    )
    SELECT u.*,
      CASE
        WHEN u.participante_tipo = 'motorista' THEN (SELECT nome FROM motoristas WHERE id = u.participante_id)
        ELSE (SELECT nome FROM gestores WHERE id = u.participante_id)
      END as participante_nome,
      (SELECT COUNT(*) FROM mensagens m
       WHERE m.remetente_id = u.participante_id
         AND m.remetente_tipo = u.participante_tipo
         AND m.destinatario_id = $1
         AND m.destinatario_tipo = $2
         AND m.lido = false) as nao_lidas
    FROM ultimas u
    ORDER BY ultima_mensagem_data DESC
  `, [user_id, user_tipo, tenant_id]);

  res.json(result.rows);
});

// Listar mensagens de uma conversa
router.get('/conversa/:tipo/:id', async (req, res) => {
  const { tenant_id, id: user_id, role } = req.user!;
  const user_tipo = role;
  const { tipo, id } = req.params;

  const result = await pool.query(`
    SELECT * FROM mensagens
    WHERE tenant_id = $1
      AND (
        (remetente_id = $2 AND remetente_tipo = $3 AND destinatario_id = $4 AND destinatario_tipo = $5)
        OR
        (remetente_id = $4 AND remetente_tipo = $5 AND destinatario_id = $2 AND destinatario_tipo = $3)
      )
    ORDER BY criado_em ASC
  `, [tenant_id, user_id, user_tipo, id, tipo]);

  // Marcar como lidas
  await pool.query(`
    UPDATE mensagens SET lido = true
    WHERE destinatario_id = $1 AND destinatario_tipo = $2
      AND remetente_id = $3 AND remetente_tipo = $4
      AND lido = false
  `, [user_id, user_tipo, id, tipo]);

  res.json(result.rows);
});

// Enviar mensagem
router.post('/', async (req, res) => {
  const { tenant_id, id: user_id, role } = req.user!;
  const { destinatario_id, destinatario_tipo, conteudo } = req.body;

  const result = await pool.query(`
    INSERT INTO mensagens (tenant_id, remetente_id, remetente_tipo, destinatario_id, destinatario_tipo, conteudo)
    VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
  `, [tenant_id, user_id, role, destinatario_id, destinatario_tipo, conteudo]);

  res.status(201).json(result.rows[0]);
});

export default router;
```

**Step 2: Register in index.ts**

```typescript
import mensagensRouter from './routes/mensagens';
app.use('/mensagens', mensagensRouter);
```

**Step 3: Commit**

```bash
git add api/src/routes/mensagens.ts api/src/index.ts
git commit -m "feat(api): add messaging routes"
```

---

### Task 6: Create dashboard stats API

**Files:**
- Modify: `api/src/routes/dashboard.ts` (create if not exists)

**Step 1: Create dashboard.ts**

```typescript
import { Router } from 'express';
import { pool } from '../db/pool';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/stats', async (req, res) => {
  const { tenant_id } = req.user!;

  const [veiculosTotal, veiculosAtivos, motoristasEmAcao, rotasHoje, alunosTotal] = await Promise.all([
    pool.query('SELECT COUNT(*) FROM veiculos WHERE tenant_id = $1 AND ativo = true', [tenant_id]),
    pool.query(`SELECT COUNT(DISTINCT v.id) FROM veiculos v
      JOIN rotas r ON r.veiculo_id = v.id
      JOIN rota_historico h ON h.rota_id = r.id
      WHERE v.tenant_id = $1 AND h.data_fim IS NULL AND h.data_inicio > NOW() - INTERVAL '12 hours'`, [tenant_id]),
    pool.query(`SELECT COUNT(DISTINCT h.motorista_id) FROM rota_historico h
      WHERE h.tenant_id = $1 AND h.data_fim IS NULL AND h.data_inicio > NOW() - INTERVAL '12 hours'`, [tenant_id]),
    pool.query(`SELECT COUNT(*) FROM rota_historico WHERE tenant_id = $1 AND DATE(data_inicio) = CURRENT_DATE`, [tenant_id]),
    pool.query('SELECT COUNT(*) FROM alunos WHERE tenant_id = $1 AND ativo = true', [tenant_id]),
  ]);

  res.json({
    veiculos_total: parseInt(veiculosTotal.rows[0].count),
    veiculos_ativos: parseInt(veiculosAtivos.rows[0].count),
    motoristas_em_acao: parseInt(motoristasEmAcao.rows[0].count),
    rotas_hoje: parseInt(rotasHoje.rows[0].count),
    alunos_total: parseInt(alunosTotal.rows[0].count),
  });
});

router.get('/charts', async (req, res) => {
  const { tenant_id } = req.user!;

  const [rotasPorDia, alunosPorEscola, financeiroMensal, atividadePorTurno] = await Promise.all([
    // Rotas por dia (ultimos 7 dias)
    pool.query(`
      SELECT DATE(data_inicio) as data, COUNT(*) as total
      FROM rota_historico
      WHERE tenant_id = $1 AND data_inicio > NOW() - INTERVAL '7 days'
      GROUP BY DATE(data_inicio)
      ORDER BY data
    `, [tenant_id]),

    // Alunos por escola
    pool.query(`
      SELECT e.nome as escola, COUNT(a.id) as total
      FROM alunos a
      JOIN escolas e ON e.id = a.escola_id
      WHERE a.tenant_id = $1 AND a.ativo = true
      GROUP BY e.id, e.nome
      ORDER BY total DESC
      LIMIT 10
    `, [tenant_id]),

    // Financeiro mensal (ultimos 6 meses)
    pool.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', data), 'YYYY-MM') as mes,
        SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END) as receitas,
        SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END) as despesas
      FROM transacoes
      WHERE tenant_id = $1 AND data > NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', data)
      ORDER BY mes
    `, [tenant_id]),

    // Atividade por turno
    pool.query(`
      SELECT r.turno, COUNT(h.id) as rotas
      FROM rota_historico h
      JOIN rotas r ON r.id = h.rota_id
      WHERE h.tenant_id = $1 AND h.data_inicio > NOW() - INTERVAL '30 days'
      GROUP BY r.turno
    `, [tenant_id]),
  ]);

  res.json({
    rotas_por_dia: rotasPorDia.rows,
    alunos_por_escola: alunosPorEscola.rows,
    financeiro_mensal: financeiroMensal.rows,
    atividade_por_turno: atividadePorTurno.rows,
  });
});

export default router;
```

**Step 2: Register in index.ts**

```typescript
import dashboardRouter from './routes/dashboard';
app.use('/dashboard', dashboardRouter);
```

**Step 3: Commit**

```bash
git add api/src/routes/dashboard.ts api/src/index.ts
git commit -m "feat(api): add dashboard stats and charts endpoints"
```

---

## Phase 3: Frontend - Install Dependencies

### Task 7: Install frontend dependencies

**Step 1: Install recharts and face-api.js**

Run: `cd apps/web && pnpm add recharts face-api.js @types/face-api.js`

**Step 2: Commit**

```bash
git add apps/web/package.json pnpm-lock.yaml
git commit -m "chore(web): add recharts and face-api.js dependencies"
```

---

## Phase 4: Frontend Pages

### Task 8: Create Veiculos page

**Files:**
- Create: `apps/web/src/pages/Veiculos.tsx`

**Step 1: Create the page**

```tsx
import { useEffect, useState } from 'react';
import { Plus, Truck, ChevronRight } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { api } from '../lib/api';
import type { Veiculo, Motorista } from '@rotavans/shared';

export function Veiculos() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [selected, setSelected] = useState<Veiculo | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    placa: '', modelo: '', fabricante: '', ano: '', capacidade: '15', consumo_km: '', renavam: '', chassi: ''
  });
  const [selectedMotoristas, setSelectedMotoristas] = useState<number[]>([]);

  useEffect(() => { load(); }, []);

  async function load() {
    const [v, m] = await Promise.all([
      api.get<Veiculo[]>('/veiculos'),
      api.get<Motorista[]>('/motoristas'),
    ]);
    setVeiculos(v);
    setMotoristas(m.filter(x => x.cadastro_completo));
  }

  async function selectVeiculo(v: Veiculo) {
    const detail = await api.get<Veiculo>(`/veiculos/${v.id}`);
    setSelected(detail);
    setSelectedMotoristas(detail.motoristas_habilitados?.filter(m => m.ativo).map(m => m.motorista_id) || []);
  }

  function openNew() {
    setForm({ placa: '', modelo: '', fabricante: '', ano: '', capacidade: '15', consumo_km: '', renavam: '', chassi: '' });
    setModalOpen(true);
  }

  async function save() {
    await api.post('/veiculos', {
      ...form,
      ano: form.ano ? parseInt(form.ano) : null,
      capacidade: parseInt(form.capacidade),
      consumo_km: form.consumo_km ? parseFloat(form.consumo_km) : null,
    });
    setModalOpen(false);
    load();
  }

  async function saveMotoristas() {
    if (!selected) return;
    await api.put(`/veiculos/${selected.id}/motoristas`, { motorista_ids: selectedMotoristas });
    selectVeiculo(selected);
  }

  function toggleMotorista(id: number) {
    setSelectedMotoristas(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-48px)]">
      <div className="w-80 shrink-0">
        <PageHeader title="Veiculos" subtitle={`${veiculos.length} veiculo(s)`}
          action={<button onClick={openNew} className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-white px-3 py-2 rounded-xl text-sm font-medium"><Plus size={16} /></button>} />

        {veiculos.length === 0 ? <EmptyState icon={Truck} message="Nenhum veiculo" /> : (
          <div className="space-y-2">
            {veiculos.map((v) => (
              <button key={v.id} onClick={() => selectVeiculo(v)}
                className={`w-full text-left bg-surface border rounded-xl p-4 transition-colors ${selected?.id === v.id ? 'border-accent' : 'border-surface2 hover:border-gray-600'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{v.placa}</p>
                    <p className="text-gray-400 text-xs mt-1">{v.fabricante} {v.modelo} {v.ano}</p>
                  </div>
                  <ChevronRight size={18} className="text-gray-500" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 bg-surface border border-surface2 rounded-2xl p-6 overflow-y-auto">
        {selected ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">{selected.placa}</h2>
              <p className="text-gray-400">{selected.fabricante} {selected.modelo} {selected.ano}</p>
              <p className="text-gray-400 text-sm mt-2">Capacidade: {selected.capacidade} alunos | Consumo: {selected.consumo_km || '-'} km/L</p>
            </div>

            <div>
              <h3 className="text-sm text-gray-400 mb-3">Motoristas Habilitados</h3>
              <div className="space-y-2">
                {motoristas.map((m) => (
                  <label key={m.id} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer ${selectedMotoristas.includes(m.id) ? 'bg-accent/20' : 'bg-surface2'}`}>
                    <input type="checkbox" checked={selectedMotoristas.includes(m.id)} onChange={() => toggleMotorista(m.id)} className="rounded" />
                    <span className="text-white">{m.nome}</span>
                  </label>
                ))}
              </div>
              <button onClick={saveMotoristas} className="mt-3 bg-accent hover:bg-accent/90 text-white px-4 py-2 rounded-xl text-sm">
                Salvar Motoristas
              </button>
            </div>

            {selected.rotas_vinculadas && selected.rotas_vinculadas.length > 0 && (
              <div>
                <h3 className="text-sm text-gray-400 mb-3">Rotas Vinculadas</h3>
                <div className="space-y-2">
                  {selected.rotas_vinculadas.map((r) => (
                    <div key={r.id} className="bg-surface2 rounded-lg p-3">
                      <p className="text-white text-sm">{r.nome}</p>
                      <p className="text-gray-400 text-xs">{r.turno}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Selecione um veiculo para ver detalhes</p>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo Veiculo">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-gray-400 mb-1">Placa</label>
              <input value={form.placa} onChange={(e) => setForm({ ...form, placa: e.target.value.toUpperCase() })} className="w-full bg-surface2 border border-surface2 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent" /></div>
            <div><label className="block text-sm text-gray-400 mb-1">Ano</label>
              <input type="number" value={form.ano} onChange={(e) => setForm({ ...form, ano: e.target.value })} className="w-full bg-surface2 border border-surface2 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-gray-400 mb-1">Fabricante</label>
              <input value={form.fabricante} onChange={(e) => setForm({ ...form, fabricante: e.target.value })} className="w-full bg-surface2 border border-surface2 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent" /></div>
            <div><label className="block text-sm text-gray-400 mb-1">Modelo</label>
              <input value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })} className="w-full bg-surface2 border border-surface2 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-gray-400 mb-1">Capacidade (alunos)</label>
              <input type="number" value={form.capacidade} onChange={(e) => setForm({ ...form, capacidade: e.target.value })} className="w-full bg-surface2 border border-surface2 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent" /></div>
            <div><label className="block text-sm text-gray-400 mb-1">Consumo (km/L)</label>
              <input type="number" step="0.1" value={form.consumo_km} onChange={(e) => setForm({ ...form, consumo_km: e.target.value })} className="w-full bg-surface2 border border-surface2 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent" /></div>
          </div>
          <button onClick={save} disabled={!form.placa || !form.modelo || !form.fabricante}
            className="w-full bg-accent hover:bg-accent/90 text-white font-semibold py-3 rounded-xl disabled:opacity-50">Criar Veiculo</button>
        </div>
      </Modal>
    </div>
  );
}
```

**Step 2: Add route and sidebar link**

Modify `apps/web/src/App.tsx`:
```tsx
import { Veiculos } from './pages/Veiculos';
// Add route
<Route path="veiculos" element={<Veiculos />} />
```

Modify `apps/web/src/components/layout/Sidebar.tsx`:
```tsx
import { Car } from 'lucide-react';
// Add to links array after motoristas
{ to: '/veiculos', icon: Car, label: 'Veiculos' },
```

**Step 3: Commit**

```bash
git add apps/web/src/pages/Veiculos.tsx apps/web/src/App.tsx apps/web/src/components/layout/Sidebar.tsx
git commit -m "feat(web): add Veiculos page with driver pool management"
```

---

### Task 9: Refactor Dashboard with charts

**Files:**
- Modify: `apps/web/src/pages/Dashboard.tsx`

**Step 1: Rewrite Dashboard**

```tsx
import { useEffect, useState } from 'react';
import { Users, School, Map, Truck, Car, Activity } from 'lucide-react';
import { LineChart, Line, PieChart, Pie, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { StatCard } from '../components/ui/StatCard';
import { api } from '../lib/api';
import type { DashboardStats, DashboardChartData } from '@rotavans/shared';

const COLORS = ['#3B82F6', '#22C55E', '#EAB308', '#EF4444', '#8B5CF6', '#EC4899'];

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [charts, setCharts] = useState<DashboardChartData | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<DashboardStats>('/dashboard/stats'),
      api.get<DashboardChartData>('/dashboard/charts'),
    ]).then(([s, c]) => {
      setStats(s);
      setCharts(c);
    }).catch(console.error);
  }, []);

  if (!stats || !charts) {
    return <div className="text-gray-400">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard label="Veiculos Ativos" value={stats.veiculos_ativos} icon={Car} color="accent2" />
        <StatCard label="Veiculos Total" value={stats.veiculos_total} icon={Truck} color="accent" />
        <StatCard label="Motoristas em Acao" value={stats.motoristas_em_acao} icon={Activity} color="warn" />
        <StatCard label="Rotas Hoje" value={stats.rotas_hoje} icon={Map} color="accent" />
        <StatCard label="Alunos" value={stats.alunos_total} icon={Users} color="accent2" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rotas por dia */}
        <div className="bg-surface border border-surface2 rounded-2xl p-6">
          <h3 className="text-white font-medium mb-4">Rotas Realizadas (7 dias)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={charts.rotas_por_dia}>
              <XAxis dataKey="data" stroke="#666" fontSize={12} />
              <YAxis stroke="#666" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
              <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Alunos por escola */}
        <div className="bg-surface border border-surface2 rounded-2xl p-6">
          <h3 className="text-white font-medium mb-4">Alunos por Escola</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={charts.alunos_por_escola} dataKey="total" nameKey="escola" cx="50%" cy="50%" outerRadius={80} label={({ escola }) => escola}>
                {charts.alunos_por_escola.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financeiro */}
        <div className="bg-surface border border-surface2 rounded-2xl p-6">
          <h3 className="text-white font-medium mb-4">Receitas vs Despesas (6 meses)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={charts.financeiro_mensal}>
              <XAxis dataKey="mes" stroke="#666" fontSize={12} />
              <YAxis stroke="#666" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
              <Bar dataKey="receitas" fill="#22C55E" />
              <Bar dataKey="despesas" fill="#EF4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Atividade por turno */}
        <div className="bg-surface border border-surface2 rounded-2xl p-6">
          <h3 className="text-white font-medium mb-4">Atividade por Turno</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={charts.atividade_por_turno} layout="vertical">
              <XAxis type="number" stroke="#666" fontSize={12} />
              <YAxis type="category" dataKey="turno" stroke="#666" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
              <Bar dataKey="rotas" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/pages/Dashboard.tsx
git commit -m "feat(web): refactor Dashboard with rich charts using Recharts"
```

---

### Task 10: Create Mensagens page

**Files:**
- Create: `apps/web/src/pages/Mensagens.tsx`

**Step 1: Create the page**

```tsx
import { useEffect, useState, useRef } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { api } from '../lib/api';
import { io, Socket } from 'socket.io-client';
import { auth } from '../lib/firebase';
import type { Conversa, Mensagem, Motorista } from '@rotavans/shared';

export function Mensagens() {
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [selected, setSelected] = useState<{ id: number; tipo: string; nome: string } | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    load();
    connectSocket();
    return () => { socketRef.current?.disconnect(); };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  async function load() {
    const [c, m] = await Promise.all([
      api.get<Conversa[]>('/mensagens/conversas'),
      api.get<Motorista[]>('/motoristas'),
    ]);
    setConversas(c);
    setMotoristas(m.filter(x => x.cadastro_completo));
  }

  async function connectSocket() {
    const user = auth.currentUser;
    if (!user) return;
    const token = await user.getIdToken();
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001', { auth: { token } });

    socket.on('chat:message', (msg: Mensagem) => {
      if (selected && msg.remetente_id === selected.id && msg.remetente_tipo === selected.tipo) {
        setMensagens(prev => [...prev, msg]);
      }
      load(); // Refresh conversas
    });

    socketRef.current = socket;
  }

  async function selectConversa(c: Conversa) {
    setSelected({ id: c.participante_id, tipo: c.participante_tipo, nome: c.participante_nome });
    const msgs = await api.get<Mensagem[]>(`/mensagens/conversa/${c.participante_tipo}/${c.participante_id}`);
    setMensagens(msgs);
  }

  async function startNewConversa(m: Motorista) {
    setSelected({ id: m.id, tipo: 'motorista', nome: m.nome });
    const msgs = await api.get<Mensagem[]>(`/mensagens/conversa/motorista/${m.id}`);
    setMensagens(msgs);
  }

  async function enviar() {
    if (!selected || !texto.trim()) return;
    const msg = await api.post<Mensagem>('/mensagens', {
      destinatario_id: selected.id,
      destinatario_tipo: selected.tipo,
      conteudo: texto.trim(),
    });
    setMensagens(prev => [...prev, msg]);
    setTexto('');
    load();
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-48px)]">
      <div className="w-80 shrink-0">
        <PageHeader title="Mensagens" subtitle="Chat com motoristas" />

        {conversas.length === 0 && motoristas.length === 0 ? (
          <EmptyState icon={MessageCircle} message="Nenhuma conversa" />
        ) : (
          <div className="space-y-4">
            {conversas.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-2">Conversas recentes</p>
                <div className="space-y-2">
                  {conversas.map((c) => (
                    <button key={`${c.participante_tipo}-${c.participante_id}`} onClick={() => selectConversa(c)}
                      className={`w-full text-left bg-surface border rounded-xl p-3 transition-colors ${
                        selected?.id === c.participante_id ? 'border-accent' : 'border-surface2 hover:border-gray-600'
                      }`}>
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-white font-medium truncate">{c.participante_nome}</p>
                          <p className="text-gray-400 text-xs truncate">{c.ultima_mensagem}</p>
                        </div>
                        {c.nao_lidas > 0 && (
                          <span className="bg-accent text-white text-xs px-2 py-0.5 rounded-full">{c.nao_lidas}</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-xs text-gray-500 mb-2">Motoristas</p>
              <div className="space-y-2">
                {motoristas.filter(m => !conversas.some(c => c.participante_id === m.id)).map((m) => (
                  <button key={m.id} onClick={() => startNewConversa(m)}
                    className="w-full text-left bg-surface border border-surface2 rounded-xl p-3 hover:border-gray-600 transition-colors">
                    <p className="text-white text-sm">{m.nome}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 bg-surface border border-surface2 rounded-2xl flex flex-col">
        {selected ? (
          <>
            <div className="p-4 border-b border-surface2">
              <p className="text-white font-medium">{selected.nome}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {mensagens.map((m) => (
                <div key={m.id} className={`flex ${m.remetente_tipo === 'gestor' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-xl px-4 py-2 ${
                    m.remetente_tipo === 'gestor' ? 'bg-accent text-white' : 'bg-surface2 text-white'
                  }`}>
                    <p className="text-sm">{m.conteudo}</p>
                    <p className="text-xs opacity-60 mt-1">
                      {new Date(m.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-surface2 flex gap-2">
              <input value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && enviar()}
                placeholder="Digite sua mensagem..."
                className="flex-1 bg-surface2 border border-surface2 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent" />
              <button onClick={enviar} className="bg-accent hover:bg-accent/90 text-white p-3 rounded-xl">
                <Send size={18} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Selecione uma conversa</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Add route and sidebar link**

Modify `apps/web/src/App.tsx`:
```tsx
import { Mensagens } from './pages/Mensagens';
<Route path="mensagens" element={<Mensagens />} />
```

Modify `apps/web/src/components/layout/Sidebar.tsx`:
```tsx
import { MessageCircle } from 'lucide-react';
{ to: '/mensagens', icon: MessageCircle, label: 'Mensagens' },
```

**Step 3: Commit**

```bash
git add apps/web/src/pages/Mensagens.tsx apps/web/src/App.tsx apps/web/src/components/layout/Sidebar.tsx
git commit -m "feat(web): add Mensagens page with real-time chat"
```

---

## Remaining Tasks (Abbreviated)

### Task 11: Add contatos to Escolas page
- Modify `apps/web/src/pages/Escolas.tsx` to include contatos section in modal

### Task 12: Add detailed profile to Motoristas page
- Modify `apps/web/src/pages/Motoristas.tsx` with stats and history sidebar

### Task 13: Add face-api.js biometrics to Alunos page
- Create `apps/web/src/components/FaceCapture.tsx` component
- Modify `apps/web/src/pages/Alunos.tsx` to include biometrics section

### Task 14: Update Rotas to use veiculo_id
- Modify `apps/web/src/pages/Rotas.tsx` to select veiculo instead of motorista
- Update API routes to handle veiculo_id

### Task 15: Add socket events for messages
- Modify `api/src/socket.ts` to handle chat events

### Task 16: Final testing and cleanup
- Test all pages end-to-end
- Fix any bugs found
- Final commit

---

## Summary

Total estimated tasks: 16
Estimated time: 8-12 hours of implementation

Key deliverables:
1. Database migrations for veiculos, contatos, mensagens, face_embeddings
2. API routes for all new features
3. Veiculos page with driver pool management
4. Rich Dashboard with Recharts
5. Real-time Mensagens page
6. Enhanced Escolas with multiple contacts
7. Motoristas with detailed profile/history
8. Facial biometrics in Alunos (face-api.js)
9. Rotas updated to use vehicles instead of drivers
