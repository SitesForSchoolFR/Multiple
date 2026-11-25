/* ==========================================================================
   múltiplo — catálogo de jogos
   busca, grupos, favoritos, aleatório e paginação.
   ========================================================================== */
(function () {
  'use strict';
  const { $, $$, esc, norm, shuffle, params, toast } = window.Multiplo;

  const state = {
    games: null,
    all: [],
    thumbs: {},
    group: 'todos',
    query: '',
    sort: 'destaque',
    favsOnly: false,
    page: 1,
    PAGE: 36,
    density: window.Multiplo.store.get('game-density', 'padrao'),
    favs: new Set(window.Multiplo.store.get('favs', []))
  };

  const GROUP_LABEL = {
    'no-site': 'no site',
    mantle: 'mantle',
    'gn-math': 'gn-math',
    duckmath: 'duckmath',
    night: 'blogpaste',
    driveu7: 'drive u-7',
    bikesense: 'bikesense',
    p2p: 'p2p'
  };

  function href(game) {
    if (game.f) return 'jogar.html?j=' + encodeURIComponent(game.n);
    return 'jogar.html?u=' + encodeURIComponent(game.u || '') + '&n=' + encodeURIComponent(game.n) + '&s=' + encodeURIComponent(game.group || '');
  }

  function card(game, i) {
    const fav = state.favs.has(game.n);
    const cover = window.MultiploData.coverFor(game);
    const local = !!game.f;
    const img = cover
      ? `<img src="${esc(cover)}" alt="" loading="lazy" decoding="async" onerror="this.remove()">`
      : `<span class="ph" aria-hidden="true">${esc((game.n || '?').trim().charAt(0))}</span>`;
    const variant = state.density === 'compacto' ? ' game-card--wide' : state.density === 'capa' ? ' game-card--cover' : '';
    return `<article class="game-card${variant}" data-reveal data-delay="${i % 4}">
      <a class="cover-link" href="${esc(href(game))}" aria-label="jogar ${esc(game.n)}"></a>
      <div class="game-thumb">
        ${local ? '<span class="badge-local">no site</span>' : ''}
        <button class="fav" type="button" data-fav="${esc(game.n)}" aria-pressed="${fav}" aria-label="favoritar ${esc(game.n)}" title="favoritar">${fav ? '♥' : '♡'}</button>
        ${img}
      </div>
      <div class="game-info">
        <h3 title="${esc(game.n)}">${esc(game.n)}</h3>
        ${game.group === 'no-site' ? '' : `<span class="src">${esc(GROUP_LABEL[game.group] || game.group || '')}</span>`}
      </div>
    </article>`;
  }

  function filtered() {
    let list = state.all;
    if (state.group !== 'todos') list = list.filter(g => g.group === state.group);
    if (state.favsOnly) list = list.filter(g => state.favs.has(g.n));
    if (state.query) {
      const q = norm(state.query);
      list = list.filter(g => norm(g.n).includes(q) || norm(g.a || '').includes(q) || norm(g.k || '').includes(q));
    }
    if (state.sort === 'az') list = list.slice().sort((a, b) => a.n.localeCompare(b.n, 'pt-BR'));
    else if (state.sort === 'za') list = list.slice().sort((a, b) => b.n.localeCompare(a.n, 'pt-BR'));
    else if (state.sort === 'local') list = list.filter(g => g.f);
    else if (state.sort === 'aleatorio') list = shuffle(list);
    else if (state.group === 'todos' && !state.query && !state.favsOnly) {
      /* destaque: primeiros os que têm capa, depois o acervo */
      list = list.slice().sort((a, b) => {
        const ca = window.MultiploData.coverFor(a) ? 0 : 1;
        const cb = window.MultiploData.coverFor(b) ? 0 : 1;
        return ca - cb;
      });
    }
    return list;
  }

  function render(reset) {
    const grid = $('#game-grid');
    const list = filtered();
    if (state.page === 1) grid.innerHTML = '';
    if (!list.length) {
      grid.innerHTML = '';
      $('#empty').classList.remove('hide');
      $('#load-more').classList.add('hide');
      $('#result-count').textContent = '0 jogos';
      return;
    }
    $('#empty').classList.add('hide');
    const start = (state.page - 1) * state.PAGE;
    const slice = list.slice(start, start + state.PAGE);
    grid.insertAdjacentHTML('beforeend', slice.map((g, i) => card(g, i)).join(''));
    $('#result-count').textContent = `${list.length.toLocaleString('pt-BR')} ${list.length === 1 ? 'jogo' : 'jogos'} · mostrando ${Math.min(list.length, start + state.PAGE).toLocaleString('pt-BR')}`;
    const more = start + state.PAGE < list.length;
    $('#load-more').classList.toggle('hide', !more);
    document.dispatchEvent(new CustomEvent('multiplo:new-content'));
  }

  function syncChips() {
    $$('.chip[data-group]').forEach(c => c.setAttribute('aria-pressed', String(c.dataset.group === state.group)));
    $$('.chip[data-fav-only]').forEach(c => c.setAttribute('aria-pressed', String(state.favsOnly)));
  }

  function randomGame() {
    const list = filtered();
    if (!list.length) { toast('nada para sortear com esse filtro', '∅'); return; }
    const pick = list[Math.floor(Math.random() * list.length)];
    toast('sorteado: ' + pick.n, '✦');
    setTimeout(() => { location.href = href(pick); }, 550);
  }

  async function boot() {
    const p = params();
    try {
      state.games = await window.MultiploData.loadGames();
      state.thumbs = await window.MultiploData.fingerprints();
      state.all = window.MultiploData.all(state.games);
    } catch (e) { toast('não deu para carregar o catálogo', '!'); return; }

    const chips = $('#group-chips');
    const groups = [{ id: 'todos', name: 'todos', count: state.all.length }]
      .concat(state.games.groups.map(g => ({ id: g.id, name: GROUP_LABEL[g.id] || g.id, count: g.games.length })));
    chips.innerHTML = groups.map(g =>
      `<button class="chip" type="button" data-group="${g.id}" aria-pressed="${g.id === state.group}">${esc(g.name)}<span class="n">${g.count.toLocaleString('pt-BR')}</span></button>`
    ).join('');

    if (p.get('grupo')) state.group = p.get('grupo');
    if (p.get('q')) { state.query = p.get('q'); $('#search').value = state.query; }
    if (p.get('favoritos') === '1') state.favsOnly = true;
    syncChips();

    $('#search').addEventListener('input', e => {
      clearTimeout(state.t);
      state.t = setTimeout(() => { state.query = e.target.value; state.page = 1; state.sort = state.sort === 'destaque' ? 'destaque' : state.sort; render(true); }, 140);
    });

    chips.addEventListener('click', e => {
      const b = e.target.closest('.chip'); if (!b) return;
      state.group = b.dataset.group; state.page = 1; syncChips(); render(true);
      history.replaceState(null, '', state.group === 'todos' ? 'jogos.html' : 'jogos.html?grupo=' + encodeURIComponent(state.group));
    });

    $$('.chip[data-fav-only]').forEach(b => b.addEventListener('click', () => {
      state.favsOnly = !state.favsOnly; state.page = 1; syncChips(); render(true);
    }));

    $('#sort').addEventListener('change', e => {
      state.sort = e.target.value;
      if (state.sort === 'aleatorio') state.page = 1;
      render(true);
    });

    $('#load-more').addEventListener('click', () => { state.page++; render(false); });

    $('#shuffle').addEventListener('click', randomGame);

    const dens = $('#density');
    if (dens) {
      dens.value = state.density;
      dens.addEventListener('change', () => {
        state.density = dens.value;
        window.Multiplo.store.set('game-density', state.density);
        state.page = 1;
        render(true);
      });
    }

    document.addEventListener('click', e => {
      const b = e.target.closest('[data-fav]'); if (!b) return;
      e.preventDefault();
      const name = b.dataset.fav;
      if (state.favs.has(name)) state.favs.delete(name); else state.favs.add(name);
      window.Multiplo.store.set('favs', [...state.favs]);
      const on = state.favs.has(name);
      b.setAttribute('aria-pressed', String(on));
      b.textContent = on ? '♥' : '♡';
      const chipN = $('#fav-count-chip');
      if (chipN) chipN.textContent = state.favs.size.toLocaleString('pt-BR');
      window.Multiplo.beep(on ? 'done' : 'off');
      if (state.favsOnly) render(true);
      else {
        const n = $('#fav-count');
        if (n) n.textContent = state.favs.size;
      }
    });

    const chipCount = $('#fav-count-chip');
    if (chipCount) chipCount.textContent = state.favs.size.toLocaleString('pt-BR');

    render(true);
    if (p.get('aleatorio') === '1') randomGame();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
