/* ==========================================================================
   múltiplo — coleção de links
   busca, categorias, tipos, favoritos, virtualização de linhas e sorteio.
   ========================================================================== */
(function () {
  'use strict';
  const { $, $$, esc, norm, params, toast, copy } = window.Multiplo;

  const CAT_LABEL = { jogos: 'jogos', estudos: 'estudos', unblockers: 'unblockers', espelhos: 'espelhos', midia: 'filmes & séries' };
  const KIND_LABEL = { site: 'site', unblocker: 'unblocker', mirror: 'espelho', pack: 'pack' };

  const state = {
    db: null,
    groups: [],
    cat: 'todos',
    kind: 'todos',
    query: '',
    favs: new Set(window.Multiplo.store.get('link-favs', [])),
    favsOnly: false,
    shown: 0,
    CHUNK: 6
  };

  const isHttp = u => /^https?:/i.test(u || '');
  const pretty = u => {
    try { const x = new URL(u); return x.hostname + (x.pathname === '/' ? '' : x.pathname); }
    catch (_) { return u; }
  };

  function rowsFor(group) {
    return group.links.filter(l => l.u && isHttp(l.u));
  }

  function matchGroup(group) {
    if (state.cat !== 'todos' && group.cat !== state.cat) return false;
    if (state.kind !== 'todos' && (group.kind || 'site') !== state.kind) return false;
    if (state.favsOnly && !rowsFor(group).some(l => state.favs.has(l.u))) return false;
    return true;
  }

  function filteredGroups() {
    const q = norm(state.query);
    return state.groups.filter(g => {
      if (!matchGroup(g)) return false;
      if (!q) return true;
      if (norm(g.name).includes(q)) return true;
      if (norm(g.note || '').includes(q)) return true;
      return g.links.some(l => norm(l.n || '').includes(q) || norm(l.u || '').includes(q));
    });
  }

  function rowsHTML(group, gi) {
    const rows = rowsFor(group).filter(l => !state.query ? true :
      norm(group.name).includes(norm(state.query)) || norm(group.note || '').includes(norm(state.query)) ||
      norm(l.n || '').includes(norm(state.query)) || norm(l.u || '').includes(norm(state.query)));
    const shown = state.favsOnly ? rows.filter(l => state.favs.has(l.u)) : rows;
    return shown.map((l, i) => {
      const label = l.n && !/^[A-Z][a-z]+ .*\d/.test(l.n) && l.n !== l.u ? l.n : pretty(l.u);
      const sub = l.n && l.n !== l.u ? pretty(l.u) : '';
      const fav = state.favs.has(l.u);
      const isSvg = /\.svg(\?|$)/i.test(l.u);
      return `<div class="link-row" data-url="${esc(l.u)}">
        <span class="n">${String(i + 1).padStart(2, '0')}</span>
        <a class="name" href="${esc(l.u)}" target="_blank" rel="noopener noreferrer">
          <strong>${esc(label)}</strong>
          ${sub ? `<small>${esc(sub)}</small>` : ''}
        </a>
        <span class="tag">${isSvg ? 'svg' : esc(KIND_LABEL[group.kind] || 'site')}</span>
        <span class="actions">
          <button class="icon-btn" type="button" data-fav-link="${esc(l.u)}" aria-pressed="${fav}" aria-label="favoritar link" title="favoritar">${fav ? '♥' : '♡'}</button>
          <button class="icon-btn" type="button" data-copy="${esc(l.u)}" aria-label="copiar link" title="copiar">⎘</button>
          <a class="icon-btn" href="navegar.html?url=${encodeURIComponent(l.u)}&auto=1" aria-label="abrir no proxy" title="abrir no proxy">◱</a>
        </span>
      </div>`;
    }).join('');
  }

  function render() {
    const box = $('#link-index');
    const groups = filteredGroups();
    state.shown = Math.min(groups.length, state.CHUNK);
    box.innerHTML = '';
    appendChunk();
    const totalLinks = groups.reduce((n, g) => n + rowsFor(g).length, 0);
    $('#link-count').textContent = `${groups.length.toLocaleString('pt-BR')} grupos · ${totalLinks.toLocaleString('pt-BR')} links`;
    $('#links-more').classList.toggle('hide', state.shown >= groups.length);
    document.dispatchEvent(new CustomEvent('multiplo:new-content'));
  }

  function appendChunk() {
    const box = $('#link-index');
    const groups = filteredGroups();
    const slice = groups.slice(state.shown - state.CHUNK < 0 ? 0 : state.shown - state.CHUNK, state.shown);
    box.insertAdjacentHTML('beforeend', slice.map((g, i) => `
      <section class="link-group" data-reveal>
        <div class="link-group-head">
          <h2>${esc(g.name)}</h2>
          <span class="meta">${esc(CAT_LABEL[g.cat] || g.cat)} · ${rowsFor(g).length} ${rowsFor(g).length === 1 ? 'link' : 'links'}</span>
        </div>
        ${g.note ? `<p class="tiny" style="padding-top:.5rem">${esc(g.note)}</p>` : ''}
        <div class="link-rows">${rowsHTML(g, i)}</div>
      </section>`).join(''));
  }

  function syncChips() {
    $$('.chip[data-cat]').forEach(c => c.setAttribute('aria-pressed', String(c.dataset.cat === state.cat)));
    $$('.chip[data-kind]').forEach(c => c.setAttribute('aria-pressed', String(c.dataset.kind === state.kind)));
    $$('.chip[data-fav-only]').forEach(c => c.setAttribute('aria-pressed', String(state.favsOnly)));
  }

  async function boot() {
    const p = params();
    try { state.db = await window.MultiploData.loadLinks(); } catch (e) { toast('não deu para carregar a coleção', '!'); return; }
    state.groups = state.db.groups;
    const counts = state.db.counts || {};
    const cats = $('#cat-chips');
    if (cats) cats.innerHTML =
      `<button class="chip" data-cat="todos" aria-pressed="true">todos<span class="n">${state.db.total}</span></button>` +
      Object.entries(CAT_LABEL).filter(([k]) => counts[k]).map(([k, label]) =>
        `<button class="chip" data-cat="${k}" aria-pressed="false">${label}<span class="n">${counts[k]}</span></button>`).join('');
    const kinds = $('#kind-chips');
    if (kinds) kinds.innerHTML =
      `<button class="chip" data-kind="todos" aria-pressed="true">tudo</button>` +
      `<button class="chip" data-kind="unblocker" aria-pressed="false">unblocker</button>` +
      `<button class="chip" data-kind="mirror" aria-pressed="false">espelho</button>` +
      `<button class="chip" data-kind="site" aria-pressed="false">site</button>` +
      `<button class="chip" data-fav-only aria-pressed="false">favoritos</button>`;

    if (p.get('cat')) state.cat = p.get('cat');
    if (p.get('kind')) state.kind = p.get('kind');
    if (p.get('q')) { state.query = p.get('q'); $('#link-search').value = state.query; }
    syncChips();

    document.addEventListener('click', e => {
      const cat = e.target.closest('.chip[data-cat]');
      if (cat) { state.cat = cat.dataset.cat; syncChips(); render(); }
      const kind = e.target.closest('.chip[data-kind]');
      if (kind) { state.kind = kind.dataset.kind; syncChips(); render(); }
      const favOnly = e.target.closest('.chip[data-fav-only]');
      if (favOnly) { state.favsOnly = !state.favsOnly; syncChips(); render(); }
      const fav = e.target.closest('[data-fav-link]');
      if (fav) {
        const u = fav.dataset.favLink;
        if (state.favs.has(u)) state.favs.delete(u); else state.favs.add(u);
        window.Multiplo.store.set('link-favs', [...state.favs]);
        const on = state.favs.has(u);
        fav.setAttribute('aria-pressed', String(on));
        fav.textContent = on ? '♥' : '♡';
        window.Multiplo.beep(on ? 'done' : 'off');
        if (state.favsOnly) render();
      }
      const cp = e.target.closest('[data-copy]');
      if (cp && cp.classList.contains('icon-btn')) { e.preventDefault(); copy(cp.dataset.copy); }
    });

    $('#link-search').addEventListener('input', e => {
      clearTimeout(state.t);
      state.t = setTimeout(() => { state.query = e.target.value; render(); }, 160);
    });

    $('#links-more').addEventListener('click', () => {
      state.shown = Math.min(filteredGroups().length, state.shown + state.CHUNK);
      appendChunk();
      $('#links-more').classList.toggle('hide', state.shown >= filteredGroups().length);
      document.dispatchEvent(new CustomEvent('multiplo:new-content'));
    });

    $('#link-random').addEventListener('click', () => {
      const pool = state.groups.flatMap(g => rowsFor(g).map(l => ({ ...l, g: g.name })));
      if (!pool.length) return;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      toast('sorteado · ' + pick.g + ' · ' + pretty(pick.u), '✦');
      window.open(pick.u, '_blank', 'noopener');
    });

    const p2 = params();
    if (p2.get('aleatorio') === '1') setTimeout(() => $('#link-random').click(), 500);

    /* exportar / importar favoritos */
    const exp = $('#links-export');
    if (exp) exp.addEventListener('click', () => {
      const data = JSON.stringify({ favs: [...state.favs] }, null, 0);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
      a.download = 'multiplo-favoritos.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      toast('favoritos exportados', '↓');
    });

    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
