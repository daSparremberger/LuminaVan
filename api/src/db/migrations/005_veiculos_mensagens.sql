-- Migration: 005_veiculos_mensagens
-- Description: Add tables for vehicles, school contacts, messages and face embeddings

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

-- Vincular rotas a veiculos (manter motorista_id para compatibilidade)
ALTER TABLE rotas ADD COLUMN IF NOT EXISTS veiculo_id INTEGER REFERENCES veiculos(id) ON DELETE SET NULL;

-- Indices
CREATE INDEX IF NOT EXISTS idx_veiculos_tenant ON veiculos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_veiculo_motoristas_veiculo ON veiculo_motoristas(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_escola_contatos_escola ON escola_contatos(escola_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_tenant ON mensagens(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_destinatario ON mensagens(destinatario_id, destinatario_tipo);
