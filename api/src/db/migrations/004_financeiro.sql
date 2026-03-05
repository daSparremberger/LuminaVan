-- Modulo Financeiro

CREATE TABLE IF NOT EXISTS transacoes (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK(tipo IN ('receita','despesa')),
  categoria TEXT NOT NULL,
  descricao TEXT,
  valor DECIMAL(10,2) NOT NULL,
  data DATE NOT NULL,
  aluno_id INTEGER REFERENCES alunos(id) ON DELETE SET NULL,
  pago BOOLEAN DEFAULT false,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transacoes_tenant ON transacoes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_data ON transacoes(data);
CREATE INDEX IF NOT EXISTS idx_transacoes_aluno ON transacoes(aluno_id);

-- Categorias padrao
COMMENT ON TABLE transacoes IS 'Categorias sugeridas: mensalidade, combustivel, manutencao, seguro, multa, outros';
