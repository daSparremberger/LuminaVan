-- Campos adicionais do aluno (baseado no LuminaGO)

-- Dados pessoais
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS nascimento DATE;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS telefone TEXT;

-- Dados escolares
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS turma TEXT;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS ano TEXT;

-- Dados do responsavel
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS nome_responsavel TEXT;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS nascimento_responsavel DATE;

-- Contrato
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS valor_mensalidade DECIMAL(10,2);
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS meses_contrato INTEGER;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS inicio_contrato DATE;

-- Saude e observacoes
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS restricoes TEXT;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Campos adicionais da rota
ALTER TABLE rotas ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'planejada' CHECK(status IN ('planejada','em_andamento','finalizada'));
ALTER TABLE rotas ADD COLUMN IF NOT EXISTS horario_inicio TEXT;
ALTER TABLE rotas ADD COLUMN IF NOT EXISTS distancia_km DOUBLE PRECISION;
ALTER TABLE rotas ADD COLUMN IF NOT EXISTS tempo_minutos INTEGER;

-- Permissoes do motorista
ALTER TABLE motoristas ADD COLUMN IF NOT EXISTS permissoes JSONB DEFAULT '{}';
