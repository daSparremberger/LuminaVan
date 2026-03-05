# RotaVans - Design do Sistema Multi-Tenant com Painel Admin

## Visao Geral

Sistema de controle de acesso onde:
- **Admin** (dono do app) = primeiro login Google, permanente
- **Gestores** = acessam via link de convite gerado pelo admin
- **Motoristas** = acessam via link de convite gerado pelo gestor
- Sem convite, ninguem acessa a plataforma

## Decisoes de Arquitetura

| Aspecto | Decisao |
|---------|---------|
| Admin | Primeiro login Google define admin (imutavel) |
| Painel admin | Mesma aplicacao Electron, aba condicional |
| Gestores | Entram via link de convite do admin |
| Motoristas | Entram via link de convite do gestor (ja existe) |
| Hospedagem | Railway (API + /download) |
| Desktop | Electron com frontend local, API remota |
| Mobile | APK via download direto em /download |

---

## 1. Banco de Dados

### Nova tabela: system_config

```sql
CREATE TABLE system_config (
  id SERIAL PRIMARY KEY,
  chave TEXT UNIQUE NOT NULL,
  valor TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);
```

Registros:
- `admin_firebase_uid` - UID do admin
- `admin_email` - Email do admin
- `setup_completo` - true apos primeiro login

### Nova tabela: convites_gestor

```sql
CREATE TABLE convites_gestor (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  email TEXT,
  usado BOOLEAN DEFAULT false,
  expira_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_convites_gestor_token ON convites_gestor(token);
```

---

## 2. Fluxos de Autenticacao

### Primeiro Acesso (Setup Admin)
```
Login Google -> system_config vazia?
  -> SIM -> Salva firebase_uid como admin -> Painel Admin
  -> NAO -> Verifica se tem convite pendente
```

### Acesso com Convite
```
/convite/:token -> Login Google -> Valida token ->
  -> Token gestor? -> Cria gestor vinculado ao tenant
  -> Token motorista? -> Vincula firebase_uid ao motorista
```

### Acesso Normal
```
Login Google -> Busca por firebase_uid ->
  -> E admin? -> Painel Admin
  -> E gestor? -> Painel Gestao
  -> Nao encontrado? -> Erro "Sem permissao"
```

---

## 3. API - Novas Rotas

### Autenticacao
| Rota | Metodo | Acesso | Descricao |
|------|--------|--------|-----------|
| POST /auth/login | Todos | Verifica token, retorna role/dados |
| GET /auth/convite/:token | Publico | Valida convite |
| POST /auth/convite/:token/aceitar | Publico | Aceita convite |

### Admin
| Rota | Metodo | Acesso | Descricao |
|------|--------|--------|-----------|
| GET /admin/tenants | Admin | Lista tenants |
| POST /admin/tenants | Admin | Cria tenant |
| GET /admin/tenants/:id | Admin | Detalhes tenant |
| PUT /admin/tenants/:id | Admin | Atualiza tenant |
| DELETE /admin/tenants/:id | Admin | Remove tenant |
| POST /admin/tenants/:id/convite | Admin | Gera convite gestor |
| GET /admin/stats | Admin | Estatisticas gerais |

### Download
| Rota | Metodo | Acesso | Descricao |
|------|--------|--------|-----------|
| GET /download/desktop | Publico | Download .exe |
| GET /download/mobile | Publico | Download .apk |
| POST /admin/releases/upload | Admin | Upload de release |

---

## 4. Frontend - Estrutura

```
App.tsx
|-- Sem autenticacao
|   |-- LoginScreen (botao Google)
|   +-- ConviteScreen (aceitar convite)
|
|-- Role: admin
|   +-- AdminLayout
|       |-- Dashboard (stats gerais)
|       |-- Tenants (lista de regioes)
|       |-- TenantForm (criar/editar)
|       +-- ConviteGestor (gerar link)
|
+-- Role: gestor
    +-- GestorLayout (ja existe)
        |-- Dashboard
        |-- Rotas
        |-- Alunos
        +-- ... (abas existentes)
```

### Telas Admin

**Dashboard Admin:**
- Total de tenants ativos
- Total de gestores
- Total de motoristas (todas regioes)
- Total de alunos (todas regioes)

**Lista de Tenants:**
- Tabela: Nome, Cidade, Estado, Gestor, Status, Acoes
- Botao "Nova Regiao"

**Form Tenant:**
- Nome da prefeitura
- Cidade
- Estado
- Botao "Salvar"
- Apos salvar: opcao de gerar convite para gestor

**Convite Gestor:**
- Mostra link gerado
- Botao copiar
- Email opcional (restringe quem pode usar)
- Validade (ex: 7 dias)

---

## 5. Build e Distribuicao

### Electron (.exe)

Estrutura:
```
apps/desktop/
|-- electron/
|   +-- main.ts
|-- package.json
+-- electron-builder.yml
```

electron-builder.yml:
```yaml
appId: com.rotavans.desktop
productName: RotaVans
directories:
  output: dist
files:
  - dist/**/*
  - electron/**/*
win:
  target: nsis
  icon: assets/icon.ico
nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
```

Build: `pnpm --filter desktop build`

### Mobile (.apk)

eas.json:
```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

Build: `cd apps/mobile && eas build --platform android --profile production`

### Rota /download

- Arquivos servidos de `uploads/releases/`
- Estrutura: `uploads/releases/RotaVans-Setup.exe`, `uploads/releases/RotaVans.apk`
- Admin faz upload manual ou via CI/CD

---

## 6. Configuracao Railway

Variaveis de ambiente:
```
DATABASE_URL=postgresql://...
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
API_URL=https://rotavans-api.up.railway.app
MAPBOX_TOKEN=pk.xxx
```

---

## 7. Arquivos a Criar/Modificar

### Criar
- `api/src/db/migrations/006_admin_convites.sql`
- `api/src/routes/admin.ts`
- `api/src/routes/download.ts`
- `api/src/middleware/requireAdmin.ts`
- `apps/web/src/pages/Admin/index.tsx`
- `apps/web/src/pages/Admin/Tenants.tsx`
- `apps/web/src/pages/Admin/TenantForm.tsx`
- `apps/web/src/pages/Login.tsx`
- `apps/web/src/pages/Convite.tsx`
- `apps/desktop/electron/main.ts`
- `apps/desktop/electron-builder.yml`

### Modificar
- `api/src/index.ts` - registrar rotas admin e download
- `api/src/middleware/auth.ts` - detectar admin
- `apps/web/src/App.tsx` - roteamento por role
- `apps/web/src/stores/auth.ts` - guardar role
- `apps/mobile/eas.json` - config build APK
- `apps/desktop/package.json` - scripts electron-builder

---

## 8. Ordem de Implementacao

1. Migration banco (system_config, convites_gestor)
2. Middleware requireAdmin
3. Rotas /auth (login, convite)
4. Rotas /admin (tenants, convites)
5. Frontend Login + deteccao de role
6. Frontend Painel Admin
7. Frontend tela Convite
8. Rota /download
9. Config Electron + build .exe
10. Config EAS + build .apk
11. Deploy Railway
12. Testar fluxo completo
