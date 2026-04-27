// middlewares/autenticado.js — Guarda de autenticação
export function autenticado(req, res, next) {
  if (!req.session?.usuarioId) {
    // API: retorna JSON
    if (req.path.startsWith('/api/') || req.headers.accept?.includes('application/json')) {
      return res.status(401).json({ erro: 'Autenticação necessária. Faça login.' });
    }
    // Web: redireciona para login
    req.session.returnTo = req.originalUrl;
    return res.redirect('/login');
  }
  // Disponibiliza o usuário na view e no req
  res.locals.usuarioNome = req.session.usuarioNome;
  res.locals.usuarioId   = req.session.usuarioId;
  next();
}
