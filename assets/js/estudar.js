/* ==========================================================================
   múltiplo — estudar
   quiz (matemática/português/ciências/história/geografia/vida), foco, notas,
   progresso e busca no conteúdo.
   ========================================================================== */
(function () {
  'use strict';
  const { $, $$, esc, norm, toast, store, beep } = window.Multiplo;

  const GRADES = [
    ['1', '1º ano'], ['2', '2º ano'], ['3', '3º ano'], ['4', '4º ano'], ['5', '5º ano'], ['6', '6º ano'],
    ['7', '7º ano'], ['8', '8º ano'], ['9', '9º ano'], ['em1', '1ª série do médio'], ['em2', '2ª série do médio'],
    ['em3', '3ª série do médio'], ['vida', 'vida prática']
  ];
  const SUBJECTS = {
    matematica: 'matemática', portugues: 'português', ciencias: 'ciências',
    historia: 'história', geografia: 'geografia', vida: 'vida prática'
  };

  const state = {
    all: [],
    pool: [],
    idx: 0,
    score: 0,
    answered: 0,
    subject: 'matematica',
    grade: '7',
    done: new Set(store.get('quiz-done', [])),
    filterSubject: true
  };

  function pickPool() {
    let pool = state.all.filter(q => q.s === state.grade);
    if (state.filterSubject) {
      const sub = pool.filter(q => q.m === state.subject);
      if (sub.length >= 3) pool = sub;
    }
    if (!pool.length) pool = state.all.filter(q => q.m === state.subject);
    if (!pool.length) pool = state.all;
    /* embaralha */
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    return pool.slice(0, 10);
  }

  function progressPaint() {
    const bar = $('#quiz-progress');
    bar.innerHTML = state.pool.map((q, i) => `<i class="${i < state.idx ? 'done' : i === state.idx ? 'now' : ''}"></i>`).join('');
    $('#quiz-counter').textContent = `${Math.min(state.idx + 1, state.pool.length)} / ${state.pool.length}`;
  }

  function renderQuestion() {
    progressPaint();
    const q = state.pool[state.idx];
    if (!q) return finish();
    $('#quiz-q').textContent = q.q;
    $('#quiz-meta').textContent = `${GRADES.find(g => g[0] === q.s)?.[1] || q.s} · ${SUBJECTS[q.m] || q.m}`;
    const opts = q.o.map((o, i) => `<button class="quiz-opt" type="button" data-opt="${i}">
      <span class="key">${String.fromCharCode(65 + i)}</span><span>${esc(o)}</span></button>`).join('');
    $('#quiz-options').innerHTML = opts;
    const ex = $('#quiz-explain');
    ex.hidden = true;
    ex.innerHTML = '';
    $('#quiz-next').hidden = true;
    $('#quiz-skip').hidden = false;
    state.answeredThis = false;
  }

  function answer(i) {
    const q = state.pool[state.idx];
    if (!q || state.answeredThis) return;
    state.answeredThis = true;
    const opts = $$('.quiz-opt');
    opts.forEach(b => b.disabled = true);
    opts[q.a].classList.add('correct');
    if (i !== q.a) opts[i].classList.add('wrong');
    else {
      state.score++;
      if (!state.done.has(q.q)) { state.done.add(q.q); store.set('quiz-done', [...state.done]); }
      beep('done');
    }
    if (i !== q.a) beep('off');
    const ex = $('#quiz-explain');
    ex.hidden = false;
    ex.innerHTML = `<span class="glyph">por quê</span><span>${esc(q.e || '')}</span>`;
    $('#quiz-score').textContent = state.score;
    $('#quiz-progress-total').textContent = state.done.size;
    $('#quiz-next').hidden = false;
    $('#quiz-skip').hidden = true;
  }

  function next() {
    if (!state.answeredThis) { /* pular */ }
    state.idx++;
    if (state.idx >= state.pool.length) return finish();
    renderQuestion();
  }

  function finish() {
    progressPaint();
    const total = state.pool.length;
    const pct = Math.round((state.score / Math.max(1, total)) * 100);
    $('#quiz-q').textContent = pct >= 80 ? 'mandou bem — ' + state.score + ' de ' + total + '.' : state.score + ' de ' + total + '. vale tentar de novo.';
    $('#quiz-meta').textContent = 'resultado';
    $('#quiz-options').innerHTML = `<p class="lede">${pct >= 80 ? 'você acertou quase tudo desse bloco. que tal subir o ano ou trocar de matéria?' : 'errar é parte do caminho — a explicação de cada questão fica no histórico do navegador.'}</p>`;
    $('#quiz-explain').hidden = true;
    $('#quiz-next').hidden = false;
    $('#quiz-next').textContent = 'novo quiz ↻';
    state.finished = true;
  }

  function newQuiz() {
    state.pool = pickPool();
    state.idx = 0; state.score = 0; state.finished = false; state.answeredThis = false;
    $('#quiz-next').textContent = 'próxima →';
    renderQuestion();
  }

  async function boot() {
    if (!$('#quiz-card')) return;
    const gradeSel = $('#grade-select');
    gradeSel.innerHTML = GRADES.map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
    const subSel = $('#subject-select');
    subSel.innerHTML = Object.entries(SUBJECTS).map(([v, l]) => `<option value="${v}">${l}</option>`).join('');

    state.subject = store.get('study-subject', 'matematica');
    state.grade = store.get('study-grade', '7');
    subSel.value = state.subject;
    gradeSel.value = state.grade;

    try { state.all = await window.MultiploData.loadQuestions(); }
    catch (_) { toast('não deu para carregar as perguntas', '!'); return; }

    $('#quiz-progress-total').textContent = state.done.size;
    $('#quiz-total').textContent = state.all.length;

    subSel.addEventListener('change', () => { state.subject = subSel.value; store.set('study-subject', state.subject); newQuiz(); });
    gradeSel.addEventListener('change', () => { state.grade = gradeSel.value; store.set('study-grade', state.grade); state.filterSubject = false; newQuiz(); state.filterSubject = true; });

    $('#quiz-options').addEventListener('click', e => {
      const b = e.target.closest('.quiz-opt'); if (!b) return;
      answer(Number(b.dataset.opt));
    });
    $('#quiz-next').addEventListener('click', () => { if (state.finished) newQuiz(); else next(); });
    $('#quiz-skip').addEventListener('click', () => next());
    $('#quiz-restart').addEventListener('click', newQuiz);

    /* teclado 1-4 */
    addEventListener('keydown', e => {
      if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
      if (['1', '2', '3', '4'].includes(e.key)) { const b = $$('.quiz-opt')[Number(e.key) - 1]; if (b && !b.disabled) b.click(); }
      if (e.key === 'Enter' && !$('#quiz-next').hidden) $('#quiz-next').click();
    });

    newQuiz();

    /* foco */
    const timer = $('#timer');
    const timerBtn = $('#timer-toggle');
    let remaining = 25 * 60, running = false, int = null;
    const paintTimer = () => {
      const m = Math.floor(remaining / 60), s = remaining % 60;
      timer.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
      timer.classList.toggle('running', running);
      timerBtn.textContent = running ? 'pausar' : 'começar';
    };
    $('#timer-duration').addEventListener('change', e => {
      remaining = Number(e.target.value) * 60; running = false; clearInterval(int); paintTimer();
    });
    timerBtn.addEventListener('click', () => {
      running = !running;
      clearInterval(int);
      if (running) int = setInterval(() => {
        remaining--;
        paintTimer();
        if (remaining <= 0) {
          clearInterval(int); running = false; paintTimer();
          beep('done'); toast('tempo de foco concluído — levanta, bebe água', '◷');
          $('#timer-status').textContent = 'feito. pausa de 5 minutos?';
        }
      }, 1000);
      $('#timer-status').textContent = running ? 'em foco…' : 'pausado';
    });
    paintTimer();

    /* notas */
    const notes = $('#notes');
    notes.value = store.get('notes', '');
    let nt = null;
    notes.addEventListener('input', () => {
      clearTimeout(nt);
      $('#notes-status').textContent = 'escrevendo…';
      nt = setTimeout(() => { store.set('notes', notes.value); $('#notes-status').textContent = 'salvo neste navegador ♡'; }, 400);
    });

    /* limpar progresso */
    $('#progress-reset').addEventListener('click', () => {
      state.done.clear(); store.set('quiz-done', []);
      $('#quiz-progress-total').textContent = '0';
      toast('progresso limpo', '⌫');
    });

    /* busca nas perguntas */
    $('#study-search-form').addEventListener('submit', e => {
      e.preventDefault();
      const q = norm($('#study-search').value);
      const out = $('#study-results');
      if (!q) { out.innerHTML = '<p class="tiny">digite algo — frações, ângulos, plantas…</p>'; return; }
      const hits = state.all.filter(x => norm(x.q).includes(q) || norm(x.e).includes(q)).slice(0, 12);
      out.innerHTML = hits.length
        ? hits.map(h => `<div class="editorial-row"><span class="n">${esc(GRADES.find(g => g[0] === h.s)?.[1] || h.s)}</span><span class="t">${esc(h.q)}<small>${esc(h.e)}</small></span><span class="arrow">${esc(SUBJECTS[h.m] || h.m)}</span></div>`).join('')
        : '<p class="tiny">nada encontrado — tente outra palavra.</p>';
    });

    /* abas */
    $$('[data-tab]').forEach(b => b.addEventListener('click', () => {
      $$('[data-tab]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      $$('[data-tab-panel]').forEach(p => { p.hidden = p.dataset.tabPanel !== b.dataset.tab; });
    }));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
