-- Migration: 006_admin_convites
-- Description: Add system_config and convites_gestor tables for admin and invitation support

-- Tabela de configuracoes do sistema
CREATE TABLE IF NOT EXISTS system_config (
  id SERIAL PRIMARY KEY,
  chave TEXT UNIQUE NOT NULL,
  valor TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de convites para gestores
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
