// server.js — Ponto de entrada da aplicação SIMEC
import 'dotenv/config';
import express        from 'express';
import session        from 'express-session';
import helmet         from 'helmet';
import cors           from 'cors';
import rateLimit      from 'express-rate-limit';
import path           from 'path';
import { fileURLToPath } from 'url';

import { pool, testConnection } from './db/connection.js';
import authRoutes               from './routes/auth.js';
import inscricoesRoutes         from './routes/inscricoes.js';
import { autenticado }          from './middlewares/autenticado.js';
import { gerarCsrf }            from './middlewares/csrf.js';

// ── Helpers para __dirname em ES Modules ──────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ── Validar variáveis obrigatórias antes de iniciar ──────────
const required = ['SESSION_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`❌ Variável de ambiente obrigatória ausente: ${key}`);
    process.exit(1);
  }
}

const app  = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

// ── View engine (EJS) ─────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── Segurança: Helmet (headers HTTP) ─────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc : ["'self'", "'unsafe-inline'"], // inline para demos
      styleSrc  : ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc   : ["'self'", "https://fonts.gstatic.com"],
      imgSrc    : ["'self'", "data:"],
    }
  },
}));

// ── CORS ─────────────────────────────────────────────────────
app.use(cors({
  origin: isProd
    ? [process.env.APP_URL || 'https://simec-app.onrender.com']
    : ['http://localhost:3000'],
  credentials: true,
}));

// ── Rate Limiting ─────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  message: { erro: 'Muitas tentativas de login. Aguarde 15 minutos.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

app.use('/login',   loginLimiter);
app.use('/cadastro', rateLimit({ windowMs: 60_000, max: 5 }));

// ── Parsers ───────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Arquivos estáticos ────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── Sessão ───────────────────────────────────────────────────
app.use(session({
  secret           : process.env.SESSION_SECRET,
  resave           : false,
  saveUninitialized: false,
  cookie           : {
    secure  : isProd,    // HTTPS only em produção
    httpOnly: true,      // não acessível via JS do cliente
    maxAge  : 24 * 60 * 60 * 1000, // 24 horas
    sameSite: 'lax',
  },
}));

// ── Variáveis globais para views ──────────────────────────────
app.use((req, res, next) => {
  res.locals.usuarioNome = req.session?.usuarioNome || null;
  res.locals.usuarioId   = req.session?.usuarioId   || null;
  // Garante que csrfToken sempre exista nas views — gerarCsrf sobrescreve com o valor real
  res.locals.csrfToken   = req.session?.csrfToken   || '';
  next();
});

// ── Rotas ─────────────────────────────────────────────────────
app.use('/',           authRoutes);
app.use('/inscricoes', inscricoesRoutes);

// ── Página inicial ────────────────────────────────────────────
app.get('/', gerarCsrf, async (req, res) => {
  const [eventos] = await pool.execute(
    'SELECT id, titulo, descricao, data_inicio, local_nome, vagas FROM eventos ORDER BY data_inicio'
  );
  res.render('index', { eventos });
});

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).render('erro', {
    codigo: 404,
    mensagem: 'Página não encontrada.',
  });
});

// ── Middleware de erro global ─────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(err.stack);
  const codigo = err.status || 500;
  res.status(codigo).render('erro', {
    codigo,
    mensagem: isProd
      ? 'Ocorreu um erro interno. Tente novamente.'
      : err.message,
  });
});

// ── Inicializar ───────────────────────────────────────────────
async function start() {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`🚀 SIMEC rodando em http://localhost:${PORT}`);
    console.log(`   Ambiente: ${process.env.NODE_ENV || 'development'}`);
  });
}

start();
