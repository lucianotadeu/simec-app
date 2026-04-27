// middlewares/csrf.js — Proteção CSRF com token de sessão
import crypto from 'crypto';

// Gera ou recupera o token da sessão
export function gerarCsrf(req, res, next) {
  if (!req.session.csrfToken)
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  res.locals.csrfToken = req.session.csrfToken;
  next();
}

// Verifica o token em requisições POST/PUT/DELETE
export function verificarCsrf(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

  const tokenEnviado = req.body?._csrf ?? req.headers['x-csrf-token'] ?? '';
  const tokenSessao  = req.session?.csrfToken ?? '';

  if (!tokenEnviado || !tokenSessao) {
    return res.status(403).json({ erro: 'Token CSRF ausente.' });
  }

  // Padding para garantir buffers do mesmo tamanho (timingSafeEqual exige isso)
  const len = Math.max(tokenEnviado.length, tokenSessao.length);
  const a = Buffer.from(tokenEnviado.padEnd(len));
  const b = Buffer.from(tokenSessao.padEnd(len));

  if (!crypto.timingSafeEqual(a, b)) {
    return res.status(403).json({ erro: 'Token CSRF inválido.' });
  }
  next();
}
