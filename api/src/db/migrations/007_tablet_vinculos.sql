-- Migration: 007_tablet_vinculos
-- Vinculo de tablet (dispositivo) com veiculo para app de motorista

CREATE TABLE IF NOT EXISTS tablet_vinculos (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  veiculo_id INTEGER NOT NULL REFERENCES veiculos(id) ON DELETE CASCADE,
  motorista_id INTEGER REFERENCES motoristas(id) ON DELETE SET NULL,
  device_id TEXT NOT NULL,
  device_nome TEXT,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_tablet_vinculos_veiculo_ativo
  ON tablet_vinculos(veiculo_id)
  WHERE ativo = true;

CREATE UNIQUE INDEX IF NOT EXISTS uq_tablet_vinculos_device_ativo
  ON tablet_vinculos(device_id)
  WHERE ativo = true;

CREATE INDEX IF NOT EXISTS idx_tablet_vinculos_tenant
  ON tablet_vinculos(tenant_id);
