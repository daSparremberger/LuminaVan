# RotaVans Web - Design do Sistema de Gestao

## Visao Geral

Refinamento completo do aplicativo web/Electron de gestao para prefeituras. Sistema multi-tenant com 10 abas principais para gerenciamento de transporte escolar.

## Arquitetura

- **Frontend:** React 18 + Vite + Tailwind CSS + Zustand
- **Backend:** Express.js + PostgreSQL + Socket.io
- **Biometria:** face-api.js (client-side)
- **Mapas:** Mapbox GL JS
- **Graficos:** Recharts ou Chart.js

## Estrutura de Abas

1. **Dashboard** - Relatorios e graficos
2. **Rotas** - Gerenciamento de rotas
3. **Alunos** - Lista + cadastro + biometria facial
4. **Escolas** - Cadastro com turnos/contatos
5. **Motoristas** - Lista + historico detalhado
6. **Veiculos** - Cadastro + pool de motoristas (NOVO)
7. **Financeiro** - Ja existe
8. **Mensagens** - Chat gestor-motorista (NOVO)
9. **Rastreamento** - Ao vivo (ja existe)
10. **Historico** - Ja existe

---

## 1. Dashboard

### Cards Superiores
- Veiculos Ativos (em rota agora)
- Veiculos Cadastrados (total)
- Motoristas em Acao (executando rota)
- Rotas Hoje (realizadas no dia)
- Total de Alunos

### Graficos
- **Linha:** Rotas realizadas nos ultimos 7 dias
- **Pizza:** Distribuicao de alunos por escola
- **Barras:** Receitas vs Despesas do mes
- **Barras:** Atividade por turno (manha/tarde/noite)

---

## 2. Rotas

### Layout
- Lista de rotas a esquerda
- Detalhes da rota selecionada a direita (mapa + paradas)

### Criar Rota
1. Nome da rota
2. Seleciona **veiculo** (placa + modelo)
3. Seleciona **turno** (manha/tarde/noite)
4. Lista de alunos filtrada por turno (checkbox)
5. Ordem das paradas (drag-and-drop)
6. Auto-calcula escolas destino
7. Gera trajeto via Mapbox Directions API

### Modelo de Dados
- Rota vinculada ao veiculo (`veiculo_id`)
- Qualquer motorista habilitado no veiculo pode executar

---

## 3. Alunos

### Lista
- Filtros: Escola, Turno, Busca por nome
- Colunas: Nome, Escola, Turno, Status Biometria, Acoes

### Cadastro (Modal com secoes colapsaveis)
1. **Dados Pessoais:** Nome, Nascimento, Telefone, Endereco
2. **Dados Escolares:** Escola, Turno, Turma, Ano
3. **Responsavel:** Nome, CPF, Nascimento, Telefone
4. **Saude:** Restricoes, Observacoes
5. **Biometria Facial:** Captura de 5 fotos, gera embeddings

### Biometria Facial
- Biblioteca: face-api.js
- Captura 5 angulos (frente, esquerda, direita, cima, baixo)
- Gera embeddings 128-d
- Salva em `face_embeddings JSONB`
- Check-in no mobile compara face ao vivo com embeddings

---

## 4. Escolas

### Lista
- Colunas: Nome, Endereco, Turnos, Qtd Alunos, Acoes

### Cadastro
1. **Dados:** Nome, Endereco (com mapa para lat/lng)
2. **Turnos:** Checkbox + horarios entrada/saida por turno
3. **Contatos:** Lista dinamica (cargo, nome, telefone)

### Tabela Nova
```sql
escola_contatos (
  id, escola_id, cargo, nome, telefone
)
```

---

## 5. Motoristas

### Layout
- Lista de motoristas a esquerda
- Perfil detalhado a direita

### Perfil do Motorista
- Foto, nome, telefone
- Data de cadastro, dias trabalhados
- Estatisticas: rotas realizadas, alunos transportados, km percorridos
- Lista das ultimas rotas executadas
- Veiculos habilitados

---

## 6. Veiculos (NOVO)

### Layout
- Lista de veiculos a esquerda
- Detalhes a direita

### Cadastro
- Placa, Modelo, Fabricante, Ano
- Capacidade (alunos), Consumo (km/L)
- Renavam, Chassi (opcional)

### Pool de Motoristas
- Lista de checkboxes com todos motoristas
- Marcar quais estao habilitados para este veiculo

### Tabelas Novas
```sql
veiculos (
  id, tenant_id, placa, modelo, fabricante, ano,
  capacidade, consumo_km, renavam, chassi, ativo, criado_em
)

veiculo_motoristas (
  id, veiculo_id, motorista_id, ativo
)
```

### Alteracao em Rotas
- Mudar `motorista_id` para `veiculo_id`
- Rota passa a ser vinculada ao veiculo

---

## 7. Central de Mensagens (NOVO)

### Layout
- Lista de conversas a esquerda (ordenadas por ultima msg)
- Chat a direita

### Funcionalidades
- Chat individual gestor-motorista
- Indicador online/offline via socket
- Timestamp e status de leitura (enviado, lido)
- Tempo real via Socket.io existente

### Tabela Nova
```sql
mensagens (
  id, tenant_id,
  remetente_id, remetente_tipo,
  destinatario_id, destinatario_tipo,
  conteudo, lido, criado_em
)
```

### Eventos Socket
- `chat:message` - nova mensagem
- `chat:read` - marcar como lido
- `chat:typing` - indicador de digitacao

---

## Resumo de Alteracoes no Banco

### Tabelas Novas
1. `veiculos`
2. `veiculo_motoristas`
3. `escola_contatos`
4. `mensagens`

### Alteracoes
1. `alunos` - adicionar `face_embeddings JSONB`
2. `rotas` - mudar `motorista_id` para `veiculo_id`

---

## Bibliotecas a Adicionar

- `face-api.js` - reconhecimento facial
- `recharts` ou `chart.js` - graficos do dashboard
- `@dnd-kit/core` - drag-and-drop para ordenar paradas

---

## Proximos Passos

1. Criar migration para novas tabelas
2. Implementar pagina de Veiculos
3. Refatorar Dashboard com graficos
4. Implementar biometria facial em Alunos
5. Adicionar multiplos contatos em Escolas
6. Adicionar perfil detalhado em Motoristas
7. Implementar Central de Mensagens
8. Atualizar Rotas para vincular a veiculos
