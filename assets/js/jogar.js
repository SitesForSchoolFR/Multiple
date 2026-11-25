/* ==========================================================================
   múltiplo — player
   abre jogos locais (mesmo domínio) ou externos com troca de espelho,
   fallback automático e aviso honesto quando o site recusa embed.
   ========================================================================== */
(function () {
  'use strict';
  const { $, esc, params, toast, store } = window.Multiplo;

  const stage = $('#stage');
  const frame = $('#frame');
  const loading = $('#loading');
  const errBox = $('#error');
  const p = params();

  let game = null;
  let candidates = [];
  let current = 0;
  let local = false;
  let loadTimer = 0;
  let menuOpen = false;

  const serverButton = $('#server-picker');
  const serverMenu = $('#server-menu');

  function serverName(url, index) {
    try { return new URL(url, location.href).host || ('servidor ' + (index + 1)); }
    catch (_) { return 'servidor ' + (index + 1); }
  }

  function renderServers() {
    if (!serverMenu) return;
    serverMenu.innerHTML = candidates.map((url, i) => {
      const active = i === current;
      return `<button class="server-option${active ? ' is-active' : ''}" type="button" role="option" aria-selected="${active}" data-server="${i}"><span class="server-number">${String(i + 1).padStart(2, '0')}</span><span class="server-host">${esc(serverName(url, i))}</span>${active ? '<span class="server-current">ativo</span>' : ''}</button>`;
    }).join('') || '<span class="server-empty">nenhum espelho disponível</span>';
    serverButton.disabled = candidates.length < 2;
    serverButton.title = candidates.length > 1 ? `escolher servidor · ${candidates.length} disponíveis · M: próximo` : 'não há espelhos conhecidos para este jogo';
    serverButton.setAttribute('aria-expanded', String(menuOpen));
  }

  function toggleServerMenu(force) {
    if (!serverMenu) return;
    menuOpen = typeof force === 'boolean' ? force : !menuOpen;
    serverMenu.hidden = !menuOpen;
    serverButton.setAttribute('aria-expanded', String(menuOpen));
  }

  function showLoading(on) {
    loading.classList.toggle('off', !on);
  }

  function setError(msg, detail) {
    clearTimeout(loadTimer);
    showLoading(false);
    errBox.hidden = false;
    errBox.innerHTML = `<div>
      <h2>não carregou.</h2>
      <p>${esc(msg)}</p>
      ${detail ? `<p class="tiny mt-1">${esc(detail)}</p>` : ''}
      <div class="row mt-3" style="justify-content:center">
        <button class="btn btn--solid" type="button" id="err-next">tentar outro espelho</button>
        <a class="btn" id="err-open" target="_blank" rel="noopener noreferrer" href="${esc(candidates[current] || '#')}">abrir em nova aba ↗</a>
        <a class="btn btn--ghost" href="jogos.html">voltar aos jogos</a>
      </div>
    </div>`;
    document.getElementById('err-next').addEventListener('click', () => next(true));
  }

  function load(i) {
    if (!candidates.length) return;
    current = Math.max(0, Math.min(i, candidates.length - 1));
    clearTimeout(loadTimer);
    errBox.hidden = true;
    showLoading(true);
    $('#mirror-idx').textContent = `${current + 1}/${candidates.length}`;
    renderServers();
    frame.onload = () => { clearTimeout(loadTimer); showLoading(false); };
    frame.src = candidates[current];
    const addr = $('#addr'); if (addr) addr.textContent = candidates[current];
    /* Uma falha de rede pode não disparar eventos úteis em iframe cross-origin.
       Depois do limite, liberamos os controles sem afirmar que o host caiu. */
    loadTimer = setTimeout(() => {
      showLoading(false);
      if (!errBox.hidden) return;
      setError('este servidor está demorando para responder.', 'tente outro espelho na lista ou recarregue. alguns sites bloqueiam incorporação; nesse caso, abra em uma nova aba.');
    }, 24000);
  }

  function next(manual) {
    if (candidates.length < 2) {
      setError('não há outro servidor conhecido para este jogo.', 'tente recarregar ou abrir em uma nova aba.');
      return;
    }
    load((current + 1) % candidates.length);
    if (manual) toast('trocando de espelho…', '⇄');
  }

  async function boot() {
    const name = p.get('n') || '';
    const u = p.get('u') || '';
    const json = p.get('j') || '';

    /* jogos locais */
    if (json) {
      try {
        let g = null;
        const catalog = await window.MultiploData.loadGames();
        g = window.MultiploData.all(catalog).find(x => x.n === json);
        /* também pode ser um jogo da coleção de links (entrada sem URL) */
        if (!g) {
          const links = await window.MultiploData.loadLinks();
          g = links.groups.flatMap(x => x.links).find(l => l.n === json);
        }
        if (!g) { setError('jogo não encontrado no catálogo.'); return; }
        game = g;
        document.title = g.n + ' — múltiplo';
        $('#game-name').textContent = g.n;
        paintFav();
        $('#game-src').textContent = g.f ? 'no site' : ('via ' + (g.credit || g.group || 'projeto original'));
        if (g.f) {
          local = true;
          candidates = [g.f];
          document.body.dataset.local = 'true';
          /* capa opcional na barra */
          const cover = window.MultiploData.coverFor(g);
          if (cover) $('#game-thumb').src = cover;
          load(0);
          store.set('recent', [{ n: g.n, f: g.f, when: Date.now() }, ...store.get('recent', []).filter(r => r.n !== g.n)].slice(0, 30));
          return;
        }
        if (g.u) {
          candidates = window.MultiploData.candidates(g);
          if (!candidates.length) { setError('este jogo não tem um endereço direto — veja os espelhos no projeto original.', ''); return; }
          load(0);
          return;
        }
        /* entrada sem URL (jogos só do projeto original) */
        errBox.hidden = false;
        errBox.innerHTML = `<div>
          <h2>${esc(g.n)} fica no projeto original.</h2>
          <p>essa entrada veio da lista sem um endereço próprio que dê para embutir aqui. use a coleção de links para procurar o espelho de quem hospeda o jogo.</p>
          <div class="row mt-3" style="justify-content:center">
            <a class="btn btn--solid" href="links.html?q=${encodeURIComponent(g.n)}">procurar na coleção ↗</a>
            <a class="btn" href="jogos.html">voltar aos jogos</a>
          </div>
        </div>`;
        showLoading(false);
      } catch (_) { setError('não deu para abrir o catálogo.'); }
      return;
    }

    /* jogo externo com URL crua */
    if (u) {
      const g = { n: name || 'jogo', u, group: p.get('s') || '' };
      game = g;
      candidates = window.MultiploData.candidates(g);
      if (!candidates.length) { setError('endereço inválido.'); return; }
      document.title = (name || 'jogo') + ' — múltiplo';
      $('#game-name').textContent = name || 'jogo';
      $('#game-src').textContent = 'site original';
      paintFav();
      load(0);
      return;
    }

    /* nada informado: escolhe um aleatório local */
    try {
      const catalog = await window.MultiploData.loadGames();
      const pool = catalog.groups.find(x => x.id === 'no-site').games;
      const g = pool[Math.floor(Math.random() * pool.length)];
      location.replace('jogar.html?j=' + encodeURIComponent(g.n));
    } catch (_) { setError('nada para abrir.'); }
  }

  /* favoritos na barra */
  function paintFav() {
    if (!game || !game.n) return;
    const favs = new Set(store.get('favs', []));
    const b = $('#fav-toggle');
    if (!b) return;
    const on = favs.has(game.n);
    b.setAttribute('aria-pressed', String(on));
    const path = b.querySelector('path');
    if (path) path.setAttribute('fill', on ? 'currentColor' : 'none');
  }
  function toggleFav() {
    if (!game || !game.n) return;
    const favs = new Set(store.get('favs', []));
    if (favs.has(game.n)) favs.delete(game.n); else favs.add(game.n);
    store.set('favs', [...favs]);
    paintFav();
    toast(favs.has(game.n) ? 'favoritado' : 'fora dos favoritos', favs.has(game.n) ? '♥' : '♡');
  }

  function openInBlankTab() {
    const url = candidates[current];
    if (!url) { toast('nenhum jogo para abrir', '!'); return; }
    const tab = window.open('about:blank', '_blank');
    if (!tab) { toast('o navegador bloqueou a nova aba', '!'); return; }
    try {
      tab.document.open();
      tab.document.write('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Recursos da aula</title><style>*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#080808}iframe{width:100%;height:100%;border:0;background:#080808}</style></head><body></body></html>');
      const gameFrame = tab.document.createElement('iframe');
      gameFrame.title = game && game.n ? game.n : 'jogo';
      gameFrame.allow = 'fullscreen; gamepad; autoplay; clipboard-read; clipboard-write; pointer-lock';
      gameFrame.allowFullscreen = true;
      gameFrame.referrerPolicy = 'no-referrer';
      gameFrame.src = url;
      tab.document.body.appendChild(gameFrame);
      tab.document.close();
      tab.focus();
      toast('jogo aberto em about:blank', '↗');
    } catch (_) {
      tab.location.href = url;
      toast('abrindo em nova aba', '↗');
    }
  }

  function updateClock() {
    const el = $('#player-clock');
    if (!el) return;
    const now = new Date();
    const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    el.textContent = time;
    el.title = now.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) + ' · horário local';
  }

  /* barra do player */
  $('#fav-toggle').addEventListener('click', toggleFav);
  serverButton.addEventListener('click', () => toggleServerMenu());
  serverMenu.addEventListener('click', e => {
    const option = e.target.closest('[data-server]');
    if (!option) return;
    const index = Number(option.dataset.server);
    toggleServerMenu(false);
    if (index === current) { load(index); toast('reconectando ao servidor atual', '↻'); }
    else { load(index); toast('trocando para ' + serverName(candidates[index], index), '⇄'); }
  });
  document.addEventListener('click', e => { if (!e.target.closest('.server-control')) toggleServerMenu(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') toggleServerMenu(false); });
  $('#reload-game').addEventListener('click', () => { load(current); toast('recarregando jogo…', '↻'); });
  $('#open-blank').addEventListener('click', openInBlankTab);
  updateClock();
  setInterval(updateClock, 1000);
  $('#copy-link').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(location.href); toast('link do jogo copiado', '⎘'); }
    catch (_) { toast('não deu para copiar', '!'); }
  });
  $('#fs').addEventListener('click', () => {
    const el = stage;
    if (document.fullscreenElement) document.exitFullscreen();
    else if (el.requestFullscreen) el.requestFullscreen();
  });
  $('#spot-search').addEventListener('click', () => {
    if (game && game.n) location.href = 'jogos.html?q=' + encodeURIComponent(game.n);
  });
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && !document.fullscreenElement) { /* deixa o navegador lidar */ }
    if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.metaKey && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) $('#fs').click();
    if (e.key.toLowerCase() === 'm' && !e.ctrlKey && !e.metaKey && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); next(true); }
    if (e.key.toLowerCase() === 'r' && !e.ctrlKey && !e.metaKey && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); load(current); }
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
