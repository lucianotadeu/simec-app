// public/js/app.js — JavaScript do cliente SIMEC
'use strict';

// ── Helpers ───────────────────────────────────────────────────
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function showMsg(el, texto, tipo = 'ok') {
  if (!el) return;
  el.textContent = texto;
  el.className = `msg msg-${tipo}`;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 4000);
}

// ── CSRF token da página ──────────────────────────────────────
function getCsrf() {
  const el = $('#csrf-token');
  return el ? el.value : '';
}

// ── Modal de inscrição ────────────────────────────────────────
const modal       = $('#modal-inscricao');
const modalTitulo = $('#modal-titulo');
const formInsc    = $('#form-inscricao');
const campoEvento = $('#campo-evento-id');
const msgInsc     = $('#msg-inscricao');
const btnFechar   = $('#btn-fechar');

function abrirModal(eventoId, titulo) {
  if (!modal) return;
  campoEvento.value = eventoId;
  modalTitulo.textContent = `Inscrição: ${titulo}`;
  if (formInsc) formInsc.reset();
  if (msgInsc)  msgInsc.classList.add('hidden');
  modal.classList.remove('hidden');
}

function fecharModal() {
  if (modal) modal.classList.add('hidden');
}

// Botões "Inscrever-se"
$$('.btn-inscrever').forEach(btn => {
  btn.addEventListener('click', () => {
    abrirModal(btn.dataset.evento, btn.dataset.titulo);
  });
});

if (btnFechar) btnFechar.addEventListener('click', fecharModal);

// Fechar clicando fora do box
if (modal) {
  modal.addEventListener('click', e => {
    if (e.target === modal) fecharModal();
  });
}

// ── Envio do formulário de inscrição via fetch ────────────────
if (formInsc) {
  formInsc.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = formInsc.querySelector('[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';

    const dados = {
      evento_id: campoEvento.value,
      camiseta : $('#camiseta').value,
      areas    : $('#areas')?.value || '',
      _csrf    : getCsrf(),
    };

    try {
      const resp = await fetch('/inscricoes', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify(dados),
      });
      const json = await resp.json();

      if (resp.ok) {
        fecharModal();
        const msgGlobal = $('#msg-acao') || $('#msg-inscricao');
        showMsg(msgGlobal, '✅ ' + json.mensagem, 'ok');
        // Recarrega a lista se estiver na página de inscrições
        if (window.location.pathname === '/inscricoes') {
          setTimeout(() => window.location.reload(), 1200);
        }
      } else {
        showMsg(msgInsc, '❌ ' + (json.erro || json.erros?.[0]?.msg || 'Erro ao inscrever.'), 'erro');
      }
    } catch {
      showMsg(msgInsc, '❌ Falha na conexão. Tente novamente.', 'erro');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Confirmar inscrição';
    }
  });
}

// ── Cancelar inscrição ────────────────────────────────────────
$$('.btn-cancelar').forEach(btn => {
  btn.addEventListener('click', async () => {
    const id = btn.dataset.id;
    if (!confirm('Cancelar esta inscrição?')) return;

    btn.disabled = true;
    btn.textContent = '...';

    try {
      const resp = await fetch(`/inscricoes/${id}`, {
        method : 'DELETE',
        headers: {
          'Content-Type' : 'application/json',
          'x-csrf-token' : getCsrf(),
        },
      });
      const json = await resp.json();

      if (resp.ok) {
        const linha = $(`#inscricao-${id}`);
        if (linha) linha.remove();
        const msgGlobal = $('#msg-acao');
        showMsg(msgGlobal, '✅ ' + json.mensagem, 'ok');
      } else {
        alert(json.erro || 'Erro ao cancelar.');
        btn.disabled = false;
        btn.textContent = 'Cancelar';
      }
    } catch {
      alert('Falha na conexão.');
      btn.disabled = false;
      btn.textContent = 'Cancelar';
    }
  });
});

// ── Fechar modal com Escape ───────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') fecharModal();
});
