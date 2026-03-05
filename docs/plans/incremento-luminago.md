# Plano de Incremento: RotaVans + LuminaGO

## Analise Comparativa

### Entidade ALUNO

| Campo | RotaVans | LuminaGO | Acao |
|-------|----------|----------|------|
| nome | ✅ | ✅ nomeCompleto | OK |
| nascimento | ❌ | ✅ | **ADICIONAR** |
| telefone | ❌ | ✅ telefone aluno | **ADICIONAR** |
| endereco | ✅ | ✅ | OK |
| lat/lng | ✅ | ✅ | OK |
| escola_id | ✅ | ✅ idEscola | OK |
| turno | ✅ | ✅ periodo | OK |
| **turma** | ❌ | ✅ | **ADICIONAR** |
| **ano** | ❌ | ✅ | **ADICIONAR** |
| cpf_responsavel | ✅ | ✅ | OK |
| telefone_responsavel | ✅ | ✅ | OK |
| **nome_responsavel** | ❌ | ✅ | **ADICIONAR** |
| **nascimento_responsavel** | ❌ | ✅ | **ADICIONAR** |
| **valor_mensalidade** | ❌ | ✅ | **ADICIONAR** |
| **meses_contrato** | ❌ | ✅ | **ADICIONAR** |
| **inicio_contrato** | ❌ | ✅ | **ADICIONAR** |
| **restricoes** | ❌ | ✅ | **ADICIONAR** |
| **observacoes** | ❌ | ✅ | **ADICIONAR** |
| ativo | ✅ | ✅ | OK |

### Entidade ESCOLA

| Campo | RotaVans | LuminaGO | Acao |
|-------|----------|----------|------|
| nome | ✅ | ✅ | OK |
| endereco | ✅ | ✅ localizacao | OK |
| lat/lng | ✅ | ✅ | OK |
| turno_manha | ✅ | ✅ matutino | OK |
| turno_tarde | ✅ | ✅ vespertino | OK |
| turno_noite | ✅ | ✅ noturno | OK |
| horarios | ✅ | ✅ | OK |

### Entidade MOTORISTA

| Campo | RotaVans | LuminaGO | Acao |
|-------|----------|----------|------|
| nome | ✅ | ✅ | OK |
| telefone | ✅ | ✅ | OK |
| pin | ✅ pin_hash | ✅ pin | OK |
| **permissoes** | ❌ | ✅ Map<String,bool> | **ADICIONAR** |
| foto_url | ✅ | ❌ | OK |
| documento_url | ✅ | ❌ | OK |

### Entidade ROTA

| Campo | RotaVans | LuminaGO | Acao |
|-------|----------|----------|------|
| nome | ✅ | ✅ | OK |
| turno | ✅ (manha/tarde/noite) | ✅ (manhaIda/tardeVolta/etc) | **MELHORAR** |
| motorista_id | ✅ | ✅ | OK |
| paradas | ✅ | ✅ participantes | OK |
| **status** | ❌ | ✅ (planejada/em_andamento/finalizada) | **ADICIONAR** |
| **horario_inicio** | ❌ | ✅ | **ADICIONAR** |
| **distancia_km** | ❌ | ✅ | **ADICIONAR** |
| **tempo_minutos** | ❌ | ✅ | **ADICIONAR** |

---

## Modulos Adicionais do LuminaGO para Implementar

### 1. Modulo Financeiro (Prioridade: ALTA)
- Registro de transacoes (receitas/despesas)
- Categorias personalizaveis
- Vinculacao a alunos e veiculos
- Status de pagamento por aluno
- Dashboard financeiro

### 2. Comunicacao com Pais (Prioridade: MEDIA)
- Notificacoes automaticas (embarcou/desembarcou)
- Integracao WhatsApp
- Status de entrega de mensagens

### 3. Rastreamento em Tempo Real (Prioridade: ALTA)
- Posicao GPS ao vivo
- Velocidade atual
- Rota planejada vs executada
- ETA por parada

### 4. Sistema de Alertas (Prioridade: MEDIA)
- Excesso de velocidade
- Desvio de rota
- Parada prolongada
- Atraso

### 5. Relatorios e Dashboards (Prioridade: ALTA)
- Pontualidade
- Frequencia de alunos
- KM rodado
- Relatorio por motorista/escola

---

## Design e Cores

### LuminaGO (Tema Escuro)
```
Primaria:      #F7AF27 (amarelo destaque)
Background:    #1F1A15 (marrom escuro)
Surface:       #2A241E
Texto:         #F7F1E4 (bege claro)
Navegacao:     #4285F4 (azul rota)
```

### RotaVans Atual
```
Background:    #0a0a0a
Surface:       #1a1a1a
Accent:        #3B82F6 (azul)
Accent2:       #22C55E (verde)
Warn:          #EF4444 (vermelho)
```

**Recomendacao:** Manter as cores do RotaVans mas adicionar um tema claro opcional.

---

## Plano de Implementacao

### Fase 1: Enriquecimento de Dados (1-2 dias)

**Task 1.1: Migration - Campos adicionais do Aluno**
```sql
ALTER TABLE alunos ADD COLUMN nascimento DATE;
ALTER TABLE alunos ADD COLUMN telefone TEXT;
ALTER TABLE alunos ADD COLUMN turma TEXT;
ALTER TABLE alunos ADD COLUMN ano TEXT;
ALTER TABLE alunos ADD COLUMN nome_responsavel TEXT;
ALTER TABLE alunos ADD COLUMN nascimento_responsavel DATE;
ALTER TABLE alunos ADD COLUMN valor_mensalidade DECIMAL(10,2);
ALTER TABLE alunos ADD COLUMN meses_contrato INTEGER;
ALTER TABLE alunos ADD COLUMN inicio_contrato DATE;
ALTER TABLE alunos ADD COLUMN restricoes TEXT;
ALTER TABLE alunos ADD COLUMN observacoes TEXT;
```

**Task 1.2: Migration - Campos adicionais da Rota**
```sql
ALTER TABLE rotas ADD COLUMN status TEXT DEFAULT 'planejada';
ALTER TABLE rotas ADD COLUMN horario_inicio TEXT;
ALTER TABLE rotas ADD COLUMN distancia_km DOUBLE PRECISION;
ALTER TABLE rotas ADD COLUMN tempo_minutos INTEGER;
```

**Task 1.3: Migration - Permissoes do Motorista**
```sql
ALTER TABLE motoristas ADD COLUMN permissoes JSONB DEFAULT '{}';
```

**Task 1.4: Atualizar Types compartilhados**
- packages/shared/src/types.ts

**Task 1.5: Atualizar API routes**
- api/src/routes/alunos.ts
- api/src/routes/rotas.ts
- api/src/routes/motoristas.ts

**Task 1.6: Atualizar formularios Web**
- apps/web/src/pages/Alunos.tsx (formulario completo)

### Fase 2: Modulo Financeiro (2-3 dias)

**Task 2.1: Migration - Tabela transacoes**
```sql
CREATE TABLE transacoes (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id),
  tipo TEXT CHECK(tipo IN ('receita','despesa')),
  categoria TEXT,
  descricao TEXT,
  valor DECIMAL(10,2),
  data DATE,
  aluno_id INTEGER REFERENCES alunos(id),
  veiculo_id INTEGER,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);
```

**Task 2.2: API - CRUD transacoes**

**Task 2.3: Web - Pagina Financeiro**
- Lista de transacoes
- Filtros por periodo/categoria
- Dashboard com totais

### Fase 3: Rastreamento em Tempo Real (2-3 dias)

**Task 3.1: WebSocket server**
- Socket.io para posicao em tempo real

**Task 3.2: Mobile - Envio de GPS**
- Enviar posicao a cada 10 segundos

**Task 3.3: Web - Mapa ao vivo**
- Mostrar vans em tempo real no mapa

### Fase 4: Relatorios (1-2 dias)

**Task 4.1: API - Endpoints de relatorios**
- /relatorios/pontualidade
- /relatorios/frequencia
- /relatorios/km

**Task 4.2: Web - Pagina Relatorios**
- Graficos e tabelas
- Export CSV/PDF

---

## Prioridade de Implementacao

1. **Fase 1** - Campos adicionais (essencial para dados completos)
2. **Fase 2** - Financeiro (diferencial competitivo)
3. **Fase 3** - Rastreamento (feature premium)
4. **Fase 4** - Relatorios (valor para prefeituras)

---

## Estimativa Total: 6-10 dias
