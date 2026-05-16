// routes/inscricoes.js — CRUD de Inscrições
import { Router }            from 'express';
import { body, validationResult } from 'express-validator';
import { pool }              from '../db/connection.js';
import { autenticado }       from '../middlewares/autenticado.js';
import { gerarCsrf, verificarCsrf } from '../middlewares/csrf.js';

const router = Router();

const validarInscricao = [
  body('evento_id').isInt({ min: 1 }).withMessage('Evento inválido.'),
  body('camiseta').isIn(['P', 'M', 'G', 'GG']).withMessage('Tamanho de camiseta inválido.'),
  body('areas').optional().trim().escape(),
];

// ── GET /inscricoes — listar inscrições do usuário logado ─────
router.get('/', autenticado, gerarCsrf, async (req, res) => {
  const [inscricoes] = await pool.execute(
    `SELECT i.id, e.titulo, e.data_inicio, e.local_nome, i.camiseta, i.areas, i.inscrito_em
     FROM inscricoes i
     JOIN eventos e ON i.evento_id = e.id
     WHERE i.usuario_id = ?
     ORDER BY i.inscrito_em DESC`,
    [req.session.usuarioId]
  );
  const [eventos] = await pool.execute(
    'SELECT id, titulo, data_inicio, vagas FROM eventos ORDER BY data_inicio'
  );
  res.render('inscricoes', { inscricoes, eventos });
});

// ── POST /inscricoes — nova inscrição ─────────────────────────
router.post('/', autenticado, verificarCsrf, ...validarInscricao, async (req, res) => {
  const erros = validationResult(req);
  if (!erros.isEmpty()) {
    return res.status(400).json({ erros: erros.array() });
  }

  const { evento_id, camiseta, areas } = req.body;
  const usuario_id = req.session.usuarioId;

  try {
    const [result] = await pool.execute(
      'INSERT INTO inscricoes (usuario_id, evento_id, camiseta, areas) VALUES (?, ?, ?, ?)',
      [usuario_id, Number(evento_id), camiseta, areas || null]
    );
    res.status(201).json({ mensagem: 'Inscrição realizada!', id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ erro: 'Você já está inscrito neste evento.' });
    }
    throw err;
  }
});

// ── DELETE /inscricoes/:id — cancelar inscrição ───────────────
router.delete('/:id', autenticado, verificarCsrf, async (req, res) => {
  const [result] = await pool.execute(
    'DELETE FROM inscricoes WHERE id = ? AND usuario_id = ?',
    [Number(req.params.id), req.session.usuarioId]
  );
  if (result.affectedRows === 0) {
    return res.status(404).json({ erro: 'Inscrição não encontrada.' });
  }
  res.json({ mensagem: 'Inscrição cancelada.' });
});

// ── GET /inscricoes/evento/:id — admin: listar inscritos ──────
router.get('/evento/:id', autenticado, async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT u.nome, u.email, i.camiseta, i.areas, i.inscrito_em
     FROM inscricoes i
     JOIN usuarios u ON i.usuario_id = u.id
     WHERE i.evento_id = ?
     ORDER BY u.nome`,
    [Number(req.params.id)]
  );
  res.json({ total: rows.length, inscritos: rows });
});

export default router;
