// routes/auth.js — Cadastro, Login e Logout
import { Router }            from 'express';
import bcrypt                from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { pool }              from '../db/connection.js';
import { gerarCsrf, verificarCsrf } from '../middlewares/csrf.js';

const router = Router();

// ── Validações reutilizáveis ──────────────────────────────────
const validarCadastro = [
  body('nome').trim().isLength({ min: 3, max: 100 })
    .withMessage('Nome deve ter entre 3 e 100 caracteres.'),
  body('email').isEmail().normalizeEmail()
    .withMessage('Informe um e-mail válido.'),
  body('senha').isLength({ min: 8 })
    .withMessage('Senha deve ter no mínimo 8 caracteres.'),
];

const validarLogin = [
  body('email').isEmail().normalizeEmail().withMessage('E-mail inválido.'),
  body('senha').notEmpty().withMessage('Senha obrigatória.'),
];

// ── GET /cadastro ─────────────────────────────────────────────
router.get('/cadastro', gerarCsrf, (req, res) => {
  res.render('cadastro', { erros: [], valores: {} });
});

// ── POST /cadastro ────────────────────────────────────────────
router.post('/cadastro', verificarCsrf, ...validarCadastro, async (req, res) => {
  const erros = validationResult(req);
  if (!erros.isEmpty()) {
    return res.status(400).render('cadastro', {
      erros: erros.array(),
      valores: req.body,
    });
  }

  const { nome, email, senha } = req.body;
  try {
    const senhaHash = await bcrypt.hash(senha, 12);
    await pool.execute(
      'INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)',
      [nome, email, senhaHash]
    );
    res.redirect('/login?cadastro=ok');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).render('cadastro', {
        erros: [{ msg: 'Este e-mail já está cadastrado.' }],
        valores: req.body,
      });
    }
    throw err;
  }
});

// ── GET /login ────────────────────────────────────────────────
router.get('/login', gerarCsrf, (req, res) => {
  res.render('login', {
    sucesso: req.query.cadastro === 'ok' ? 'Conta criada! Faça login.' : null,
    erro: null,
  });
});

// ── POST /login ───────────────────────────────────────────────
router.post('/login', verificarCsrf, ...validarLogin, async (req, res) => {
  const erros = validationResult(req);
  if (!erros.isEmpty()) {
    return res.status(400).render('login', {
      erro: erros.array()[0].msg,
      sucesso: null,
    });
  }

  const { email, senha } = req.body;
  const [rows] = await pool.execute(
    'SELECT * FROM usuarios WHERE email = ?', [email]
  );
  const usuario = rows[0];

  if (!usuario || !(await bcrypt.compare(senha, usuario.senha_hash))) {
    return res.status(401).render('login', {
      erro: 'E-mail ou senha incorretos.',
      sucesso: null,
    });
  }

  // Regenerar sessão após login — previne session fixation
  req.session.regenerate((err) => {
    if (err) throw err;
    req.session.usuarioId   = usuario.id;
    req.session.usuarioNome = usuario.nome;
    const destino = req.session.returnTo || '/';
    delete req.session.returnTo;
    res.redirect(destino);
  });
});

// ── POST /logout ──────────────────────────────────────────────
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

export default router;
