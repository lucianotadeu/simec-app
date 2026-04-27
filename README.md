# SIMEC — Sistema de Inscrição em Evento Acadêmico

Aplicação web completa desenvolvida com **Node.js + Express + MySQL**, criada como projeto prático da disciplina de Desenvolvimento de Software para Web.

---

## Stack tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Servidor | Node.js 20+ / Express 4 |
| Banco de dados | MySQL 8 |
| Driver de banco | mysql2 (Promise-based) |
| Template engine | EJS |
| Hash de senhas | bcrypt |
| Segurança | helmet, cors, express-rate-limit |
| Validação | express-validator |
| Upload | multer |
| Ambiente | dotenv |

---

## Estrutura do projeto

```
simec-app/
├── server.js              # Ponto de entrada — configura Express completo
├── package.json
├── .env.example           # Modelo de variáveis de ambiente
├── .gitignore
│
├── db/
│   ├── connection.js      # Pool de conexões MySQL (mysql2)
│   └── migrate.js         # Cria as tabelas automaticamente
│
├── middlewares/
│   ├── autenticado.js     # Guard de autenticação
│   └── csrf.js            # Proteção CSRF (gerarCsrf + verificarCsrf)
│
├── routes/
│   ├── auth.js            # GET/POST /cadastro, /login, /logout
│   └── inscricoes.js      # GET/POST/DELETE /inscricoes
│
├── views/                 # Templates EJS
│   ├── index.ejs          # Página inicial com eventos
│   ├── login.ejs
│   ├── cadastro.ejs
│   ├── inscricoes.ejs     # Minhas inscrições
│   ├── erro.ejs           # Página de erro (404, 500)
│   └── partials/
│       ├── header.ejs
│       └── footer.ejs
│
├── public/
│   ├── css/style.css      # Estilos completos
│   └── js/app.js          # Fetch, modal, cancelamento via JS
│
└── uploads/               # Arquivos enviados (fora do public/)
```

---

## Executar localmente

### Pré-requisitos
- Node.js 20+ → https://nodejs.org
- MySQL 8 rodando localmente (XAMPP, WAMP, Docker ou instalação nativa)

### Passo a passo

```bash
# 1. Clonar o repositório
git clone https://github.com/seu-usuario/simec-app.git
cd simec-app

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env
# Editar o .env com suas credenciais locais

# 4. Criar o banco de dados (MySQL)
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS simec_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 5. Criar as tabelas e seed inicial
npm run db:migrate

# 6. Iniciar o servidor em modo desenvolvimento
npm run dev

# Acesse: http://localhost:3000
```

### Conteúdo do `.env` para desenvolvimento local

```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_NAME=simec_db
DB_USER=root
DB_PASS=
SESSION_SECRET=qualquer_string_longa_e_aleatoria_aqui_minimo_32_chars
```

---

## Deploy no Render (gratuito)

O **Render** é a melhor opção gratuita em 2026 para Node.js:
- ✅ Sem sleep forçado no plano gratuito (2025+)
- ✅ Deploy via Git automático
- ✅ Variáveis de ambiente pelo painel
- ✅ Banco MySQL via add-on Railway ou PlanetScale

### Parte 1 — Banco de dados gratuito (Railway)

1. Acesse **https://railway.app** → cadastre-se com GitHub
2. Clique em **New Project → Deploy MySQL**
3. Vá em **Variables** do serviço MySQL e copie:
   - `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`
   - `MYSQL_USER`, `MYSQL_PASSWORD`
4. Ou copie a variável `DATABASE_URL` (o `connection.js` já suporta essa URL)

### Parte 2 — Criar o Web Service no Render

1. Acesse **https://render.com** → cadastre-se com GitHub
2. Clique em **New → Web Service**
3. Conecte ao seu repositório GitHub (`simec-app`)
4. Configure:

| Campo | Valor |
|-------|-------|
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | Free |

5. Em **Environment Variables**, adicione:

```
NODE_ENV        = production
PORT            = 3000 (o Render sobrescreve automaticamente)
DB_HOST         = (cole o host do Railway)
DB_PORT         = (cole a porta do Railway)
DB_NAME         = (cole o nome do banco)
DB_USER         = (cole o usuário)
DB_PASS         = (cole a senha)
SESSION_SECRET  = (gere com o comando abaixo)
```

**Gerar SESSION_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

6. Clique em **Deploy Web Service**
7. Aguarde o build terminar (~2 minutos)
8. Execute as migrações via **Shell** do Render:
   ```bash
   npm run db:migrate
   ```

### Parte 3 — Alternativa com DATABASE_URL

Se o Railway fornecer uma URL única de conexão:

```
DATABASE_URL = mysql://user:pass@host:port/database
```

Adicione essa variável no Render. O `db/connection.js` já detecta e usa `DATABASE_URL` automaticamente.

---

## Deploy no Glitch (alternativa — sem banco)

O **Glitch** é ideal para protótipos sem banco de dados ou com SQLite:

1. Acesse **https://glitch.com** → cadastre-se
2. Clique em **New Project → Import from GitHub**
3. Cole a URL do seu repositório
4. No arquivo `.env` do Glitch, adicione as variáveis
5. Abra o terminal integrado e execute: `npm run db:migrate`

> ⚠️ O Glitch dorme após 5 min sem acesso no plano gratuito.
> Use o Render para produção.

---

## Variáveis de ambiente em produção

| Variável | Obrigatória | Descrição |
|----------|------------|-----------|
| `SESSION_SECRET` | ✅ | String aleatória de 64+ chars |
| `NODE_ENV` | ✅ | `production` |
| `DB_HOST` | ✅* | Host do MySQL |
| `DB_PORT` | ✅* | Porta do MySQL (padrão: 3306) |
| `DB_NAME` | ✅* | Nome do banco |
| `DB_USER` | ✅* | Usuário do banco |
| `DB_PASS` | ✅* | Senha do banco |
| `DATABASE_URL` | Alt. | URL completa (substitui DB_*) |
| `PORT` | Auto | Definido pelo Render automaticamente |
| `APP_URL` | Recom. | URL pública da app (para CORS) |

*Ou use `DATABASE_URL`

---

## Comandos úteis

```bash
npm run dev          # Desenvolvimento com reload automático (--watch)
npm start            # Produção
npm run db:migrate   # Criar/atualizar tabelas no banco
npm audit            # Verificar vulnerabilidades
npm audit fix        # Corrigir automaticamente
```

---

## Rotas da aplicação

| Método | Rota | Descrição | Auth? |
|--------|------|-----------|-------|
| GET | `/` | Página inicial — lista eventos | Não |
| GET | `/cadastro` | Formulário de cadastro | Não |
| POST | `/cadastro` | Processar cadastro | Não |
| GET | `/login` | Formulário de login | Não |
| POST | `/login` | Processar login | Não |
| POST | `/logout` | Encerrar sessão | Sim |
| GET | `/inscricoes` | Minhas inscrições | Sim |
| POST | `/inscricoes` | Nova inscrição (JSON) | Sim |
| DELETE | `/inscricoes/:id` | Cancelar inscrição (JSON) | Sim |
| GET | `/inscricoes/evento/:id` | Listar inscritos do evento | Sim |

---

## Segurança implementada

- 🔒 **bcrypt** — senhas com hash (custo 12)
- 🔒 **SQL Injection** — placeholders `?` em todas as queries
- 🔒 **XSS** — `textContent` no cliente, EJS escapa automaticamente
- 🔒 **CSRF** — token por sessão com `crypto.timingSafeEqual`
- 🔒 **Session Fixation** — `session.regenerate()` após login
- 🔒 **Rate Limiting** — 10 tentativas de login por 15 min por IP
- 🔒 **Helmet** — Content-Security-Policy, X-Frame-Options, HSTS, etc.
- 🔒 **CORS** — lista explícita de origens permitidas
- 🔒 **httpOnly cookies** — sessão inacessível via JavaScript
- 🔒 **Variáveis de ambiente** — nenhum segredo no código
