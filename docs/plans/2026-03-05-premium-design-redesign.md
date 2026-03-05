# RotaVans Premium Design Redesign

**Data:** 2026-03-05
**Status:** Aprovado

## Objetivo

Redesign completo do app web RotaVans para elevar a experiencia visual e justificar um valor alto de assinatura. Foco em UX/UI premium com animacoes fluidas, paleta de cores refinada e layout moderno.

## Decisoes de Design

### 1. Layout Geral

- **Container floating** com margem de 16px em volta do app
- Cantos arredondados (`rounded-2xl`) no container principal
- Sidebar a esquerda (colapsavel ao hover)
- Header fixo no topo com barra de pesquisa centralizada
- Area de conteudo com scroll interno

### 2. Paleta de Cores

#### Tema Escuro (Warm Espresso)

| Token | Cor | Uso |
|-------|-----|-----|
| `bg` | `#1A1613` | Fundo do body |
| `surface` | `#2D2520` | Container principal |
| `surface2` | `#3D352C` | Cards, inputs |
| `surface3` | `#4A3F35` | Hover states |
| `border` | `#4A3F35` | Bordas sutis |
| `text` | `#F7F1E4` | Texto principal |
| `text-muted` | `#A89F94` | Texto secundario |
| `accent` | `#D4A574` | Dourado suave |
| `accent-hover` | `#C9963C` | Ouro hover |

#### Tema Claro (Cream Elegante)

| Token | Cor | Uso |
|-------|-----|-----|
| `bg` | `#FAF8F5` | Fundo do body |
| `surface` | `#FFFFFF` | Container principal |
| `surface2` | `#F5F0E8` | Cards, inputs |
| `surface3` | `#EDE6DA` | Hover states |
| `border` | `#E5DDD0` | Bordas sutis |
| `text` | `#2D2520` | Texto principal |
| `text-muted` | `#6B5D4D` | Texto secundario |
| `accent` | `#D4A574` | Dourado suave |
| `accent-hover` | `#C9963C` | Ouro hover |

### 3. Sidebar Premium

- **Largura**: 72px colapsada -> 240px expandida (ao hover)
- **Icones**: 24px, centralizados
- **Item ativo**: Fundo `accent/20` com borda arredondada (`rounded-xl`)
- **Transicao**: 200ms ease-out

#### Categorias da Sidebar

```
PRINCIPAL
  - Dashboard

CADASTROS
  - Escolas
  - Alunos
  - Motoristas
  - Veiculos

OPERACOES
  - Rotas
  - Ao Vivo
  - Historico

GESTAO
  - Financeiro
  - Mensagens

SISTEMA
  - Configuracoes
  - Perfil
```

### 4. Header Fixo

- Altura: 64px
- Barra de pesquisa centralizada (max-width: 480px)
- Icone de sino (notificacoes futuras) a direita
- Avatar pequeno clicavel (abre dropdown de perfil)

### 5. Animacoes (Framer Motion)

- **Transicao de pagina**: fade + slideY (20px) em 350ms
- **Stagger nos cards**: 50ms delay entre elementos
- **Sidebar expand**: 200ms ease-out
- **Hover nos cards**: scale(1.02) + shadow elevation

### 6. Componentes Refinados

- **Cards**: `rounded-2xl`, sombra sutil, borda `border/50`
- **Inputs**: `rounded-xl`, altura 48px, focus ring dourado
- **Botoes**: `rounded-xl`, estados hover/active bem definidos
- **Tabelas**: Linhas com hover, cabecalho sticky
- **Modais**: Backdrop blur, animacao de entrada suave

### 7. Novas Paginas

#### Perfil
- Upload de avatar
- Edicao de nome/email
- Seletor de regiao/cidade

#### Configuracoes
- Toggle de tema (claro/escuro)
- Seletor de idioma
- Formato de data/hora
- Secao placeholder para features futuras

## Arquivos a Modificar

### Configuracao
- `tailwind.config.ts` - Nova paleta de cores com suporte a temas

### Layout
- `src/index.css` - CSS base para temas e container floating
- `src/components/layout/Layout.tsx` - Container floating + header fixo
- `src/components/layout/Sidebar.tsx` - Redesign completo com categorias

### Componentes UI
- `src/components/ui/PageTransition.tsx` - NOVO: wrapper de animacao
- `src/components/ui/SearchBar.tsx` - NOVO: barra de pesquisa global
- `src/components/ui/ThemeToggle.tsx` - NOVO: toggle de tema
- `src/components/ui/StatCard.tsx` - Atualizar estilos
- `src/components/ui/Modal.tsx` - Adicionar blur e animacoes
- `src/components/ui/EmptyState.tsx` - Atualizar estilos
- `src/components/ui/PageHeader.tsx` - Atualizar estilos

### Stores
- `src/stores/theme.ts` - NOVO: gerenciamento de tema

### Paginas Novas
- `src/pages/Perfil.tsx` - NOVO
- `src/pages/Configuracoes.tsx` - NOVO

### Paginas Existentes (atualizar estilos)
- `src/pages/Dashboard.tsx`
- `src/pages/Alunos.tsx`
- `src/pages/Escolas.tsx`
- `src/pages/Motoristas.tsx`
- `src/pages/Veiculos.tsx`
- `src/pages/Rotas.tsx`
- `src/pages/Rastreamento.tsx`
- `src/pages/Historico.tsx`
- `src/pages/Financeiro.tsx`
- `src/pages/Mensagens.tsx`

### Rotas
- `src/App.tsx` - Adicionar rotas de Perfil e Configuracoes

## Metricas de Sucesso

- Visual consistente e premium em todas as paginas
- Animacoes fluidas sem lag
- Tema claro/escuro funcionando perfeitamente
- Sidebar responsiva e intuitiva
- Todas as paginas seguindo o novo design system
