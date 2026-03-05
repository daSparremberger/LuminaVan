-- Tenants (prefeituras)
CREATE TABLE IF NOT EXISTS tenants (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  cidade TEXT NOT NULL,
  estado TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Gestores
CREATE TABLE IF NOT EXISTS gestores (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
  firebase_uid TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Escolas
CREATE TABLE IF NOT EXISTS escolas (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  endereco TEXT NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  turno_manha BOOLEAN DEFAULT false,
  turno_tarde BOOLEAN DEFAULT false,
  turno_noite BOOLEAN DEFAULT false,
  horario_entrada_manha TEXT,
  horario_saida_manha TEXT,
  horario_entrada_tarde TEXT,
  horario_saida_tarde TEXT,
  horario_entrada_noite TEXT,
  horario_saida_noite TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Motoristas
CREATE TABLE IF NOT EXISTS motoristas (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
  firebase_uid TEXT UNIQUE,
  nome TEXT NOT NULL,
  telefone TEXT,
  foto_url TEXT,
  documento_url TEXT,
  pin_hash TEXT,
  ativo BOOLEAN DEFAULT true,
  convite_token TEXT UNIQUE,
  convite_expira_em TIMESTAMPTZ,
  cadastro_completo BOOLEAN DEFAULT false,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Alunos
CREATE TABLE IF NOT EXISTS alunos (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cpf_responsavel TEXT,
  telefone_responsavel TEXT,
  endereco TEXT NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  escola_id INTEGER REFERENCES escolas(id) ON DELETE SET NULL,
  turno TEXT CHECK(turno IN ('manha','tarde','noite')),
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Rotas
CREATE TABLE IF NOT EXISTS rotas (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  motorista_id INTEGER REFERENCES motoristas(id) ON DELETE SET NULL,
  turno TEXT CHECK(turno IN ('manha','tarde','noite')),
  ativo BOOLEAN DEFAULT true,
  rota_geojson TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Paradas da rota
CREATE TABLE IF NOT EXISTS rota_paradas (
  id SERIAL PRIMARY KEY,
  rota_id INTEGER REFERENCES rotas(id) ON DELETE CASCADE,
  aluno_id INTEGER REFERENCES alunos(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION
);

-- Historico de execucao
CREATE TABLE IF NOT EXISTS rota_historico (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
  rota_id INTEGER REFERENCES rotas(id) ON DELETE SET NULL,
  motorista_id INTEGER REFERENCES motoristas(id) ON DELETE SET NULL,
  data_inicio TIMESTAMPTZ,
  data_fim TIMESTAMPTZ,
  km_total DOUBLE PRECISION,
  alunos_embarcados INTEGER DEFAULT 0,
  alunos_pulados INTEGER DEFAULT 0,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Paradas do historico
CREATE TABLE IF NOT EXISTS historico_paradas (
  id SERIAL PRIMARY KEY,
  historico_id INTEGER REFERENCES rota_historico(id) ON DELETE CASCADE,
  aluno_id INTEGER REFERENCES alunos(id) ON DELETE SET NULL,
  status TEXT CHECK(status IN ('embarcou','pulado')),
  horario TIMESTAMPTZ DEFAULT NOW()
);

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_gestores_tenant ON gestores(tenant_id);
CREATE INDEX IF NOT EXISTS idx_escolas_tenant ON escolas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_motoristas_tenant ON motoristas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_alunos_tenant ON alunos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rotas_tenant ON rotas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gestores_firebase ON gestores(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_motoristas_firebase ON motoristas(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_motoristas_convite ON motoristas(convite_token);
