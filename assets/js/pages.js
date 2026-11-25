/* ==========================================================================
   múltiplo — páginas (início, navegar, créditos)
   ========================================================================== */
(function () {
  'use strict';
  const M = window.Multiplo || {};
  const { $, $$, esc, norm, shuffle, params, toast } = M;

  /* ------------------------------------------------------------------ *
   * INÍCIO
   * ------------------------------------------------------------------ */
  async function home() {
    if (!$('#home-departments')) return;
    let games = null, links = null;
    try { games = await window.MultiploData.loadGames(); } catch (_) { }
    try { links = await window.MultiploData.loadLinks(); } catch (_) { }
    if (games) {
      const total = games.groups.reduce((n, g) => n + g.games.length, 0);
      const n1 = $('#stat-games'); if (n1) n1.textContent = total.toLocaleString('pt-BR');
      const noSite = $('#stat-local'); if (noSite) noSite.textContent = games.groups.find(g => g.id === 'no-site').games.length;
      const groups = $('#stat-groups'); if (groups) groups.textContent = games.groups.length;
    }
    if (links) {
      const l = $('#stat-links'); if (l) l.textContent = links.total.toLocaleString('pt-BR');
      const u = $('#stat-unblockers'); if (u) u.textContent = (links.counts.unblockers || 0).toLocaleString('pt-BR');
    }
    /* capa do pôster: um jogo com thumbnail */
    const art = $('#hero-poster');
    if (art && games) {
      await window.MultiploData.fingerprints();
      const pool = games.groups.find(g => g.id === 'no-site').games.filter(g => window.MultiploData.coverFor(g));
      const pick = pool.slice(0, 6);
      if (pick[0]) {
        const cap = document.querySelector('#hero-pair-caption');
        if (cap) cap.textContent = pick[0].n;
      }
    }
    /* tira de "no site" */
    const strip = $('#strip-local');
    if (strip && games) {
      const list = games.groups.find(g => g.id === 'no-site').games.slice(0, 12);
      strip.innerHTML = list.map(g => {
        const cover = window.MultiploData.coverFor(g);
        return `<a class="game-card" href="jogar.html?j=${encodeURIComponent(g.n)}">
          <div class="game-thumb">${cover ? `<img src="${esc(cover)}" alt="" loading="lazy" onerror="this.remove()">` : ''}</div>
          <div class="game-info"><h3>${esc(g.n)}</h3><span class="src">no site</span></div>
        </a>`;
      }).join('');
    }
    /* destaque aleatório */
    const spinPick = $('#spin-title');
    if (spinPick && games) {
      const all = window.MultiploData.all(games);
      const paint = () => {
        const g = all[Math.floor(Math.random() * all.length)];
        const cover = window.MultiploData.coverFor(g);
        $('#spin-title').textContent = g.n;
        $('#spin-src').textContent = g.f ? 'roda aqui no site' : 'abre em ' + (g.group === 'gn-math' ? 'GN-Math' : g.group === 'duckmath' ? 'DuckMath' : g.group || 'site original');
        $('#spin-art').innerHTML = cover ? `<img src="${esc(cover)}" alt="" onerror="this.remove()">` : `<span class="ph">${esc(g.n.charAt(0))}</span>`;
        $('#spin-open').href = g.f ? 'jogar.html?j=' + encodeURIComponent(g.n) : 'jogar.html?u=' + encodeURIComponent(g.u || '') + '&n=' + encodeURIComponent(g.n) + '&s=' + encodeURIComponent(g.group || '');
        $('#spin-open').dataset.game = g.n;
        $('#spin-open').dataset.url = g.u || '';
        $('#spin-open').dataset.src = g.group || '';
        const body = $('#spin-body'); body.classList.remove('rolling'); void body.offsetWidth; body.classList.add('rolling');
        $('#spin-link').href = 'links.html?q=' + encodeURIComponent(g.n);
      };
      paint();
      $('#spin-next').addEventListener('click', paint);
    }
    /* roleta de links */
    const linkRoll = $('#link-roll');
    if (linkRoll && links) {
      linkRoll.addEventListener('click', e => {
        e.preventDefault();
        const pool = links.groups.filter(g => g.kind === 'unblocker' || g.kind === 'site').flatMap(g => g.links.map(l => ({ ...l, group: g.name })));
        const pick = pool[Math.floor(Math.random() * pool.length)];
        const out = $('#link-roll-out');
        out.innerHTML = `<span class="kind">link sorteado · ${esc(pick.group)}</span>
          <h3>${esc(pick.n || pick.u)}</h3>
          <p class="tiny">${esc(pick.u)}</p>
          <div class="actions"><a class="btn btn--solid" href="${esc(pick.u)}" target="_blank" rel="noopener noreferrer">abrir <span class="arr">↗</span></a>
          <button class="btn" type="button" data-copy="${esc(pick.u)}">copiar</button></div>`;
        document.dispatchEvent(new CustomEvent('multiplo:new-content'));
      });
    }
    document.addEventListener('click', e => {
      const b = e.target.closest('[data-copy]');
      if (b && M.copy) M.copy(b.dataset.copy);
    });
  }

  /* ------------------------------------------------------------------ *
   * NAVEGAR
   * o proxy de verdade roda em /proxy/ (o service worker precisa do escopo
   * daquela pasta). esta página só organiza o atalho e a lista de espelhos.
   * ------------------------------------------------------------------ */
  function proxyUrl(target, cloak) {
    return 'proxy/index.html?url=' + encodeURIComponent(target) + '&auto=1' + (cloak ? '&cloak=1' : '');
  }

  async function navegar() {
    if (!$('#proxy-form')) return;
    const input = $('#proxy-url');
    const p = params();
    if (p.get('url')) input.value = p.get('url');
    const go = cloak => {
      const target = (input.value || '').trim();
      if (!target) { input.focus(); return; }
      const destination = proxyUrl(target, cloak);
      if (!window.MultiploRouter || !window.MultiploRouter.go(destination)) location.href = destination;
    };
    $('#proxy-form').addEventListener('submit', e => { e.preventDefault(); go(false); });
    $('#proxy-embed').addEventListener('click', () => go(false));
    $('#proxy-cloak').addEventListener('click', () => go(true));
    $$('.shortcut[data-url]').forEach(b => b.addEventListener('click', () => {
      input.value = b.dataset.url;
      go(false);
    }));

    const box = $('#mirror-grid');
    if (!box) return;
    try {
      const db = await window.MultiploData.loadLinks();
      const groups = db.groups.filter(g => g.cat === 'espelhos');
      const html = groups.map(g => {
        const n = g.links.length;
        const first = g.links.find(l => l && l.u);
        if (!first) return '';
        return `<a class="mirror-card" href="${esc(proxyUrl(first.u))}" data-target="${esc(first.u)}">
          <small>${esc(g.name)} · ${n} ${n === 1 ? 'espelho' : 'espelhos'}</small>
          <strong>${esc(first.u.replace(/^https?:\/\//, '').split('/')[0])}</strong>
          <span class="go">abrir no proxy <span>↗</span></span>
        </a>`;
      }).join('');
      box.innerHTML = html || '<p class="tiny">sem espelhos cadastrados.</p>';
      box.hidden = false;
    } catch (_) {
      box.innerHTML = '<p class="tiny">não deu para carregar os espelhos.</p>';
    }
  }

  /* ------------------------------------------------------------------ *
   * CRÉDITOS
   * ------------------------------------------------------------------ */
  async function creditos() {
    if (!$('#credit-games')) return;
    let links = null, games = null;
    try { links = await window.MultiploData.loadLinks(); } catch (_) { }
    try { games = await window.MultiploData.loadGames(); } catch (_) { }
    if (links) {
      $('#credit-links').textContent = links.total.toLocaleString('pt-BR');
      $('#credit-groups').textContent = links.groups.length.toLocaleString('pt-BR');
    }
    if (games) {
      const g = games.groups.find(x => x.id === 'no-site');
      const total = games.groups.reduce((n, x) => n + x.games.length, 0);
      $('#credit-games').textContent = total.toLocaleString('pt-BR');
      $('#credit-local').textContent = g.games.length;
    }
    /* tabela de fontes montada a partir dos dados reais */
    const box = $('#credit-sources');
    if (box && links) {
      const byCredit = new Map();
      for (const g of links.groups) {
        const key = g.credit || 'coleção própria';
        if (!byCredit.has(key)) byCredit.set(key, { n: 0, groups: new Set() });
        const it = byCredit.get(key);
        it.n += g.links.length;
        it.groups.add(g.name);
      }
      box.innerHTML = [...byCredit.entries()].sort((a, b) => b[1].n - a[1].n).map(([credit, it]) =>
        `<a class="editorial-row" href="links.html">
          <span class="n">${String(it.n).padStart(3, '0')}</span>
          <span class="t">${esc(credit)}<small>${it.groups.size} grupos · ${[...it.groups].slice(0, 4).join(' · ')}${it.groups.size > 4 ? '…' : ''}</small></span>
          <span class="arrow">↗</span>
        </a>`).join('');
    }
  }

  function boot() { home(); navegar(); creditos(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
