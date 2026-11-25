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

  function showLoading(on) {
    loading.classList.toggle('off', !on);
  }

  function setError(msg, detail) {
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
    current = i;
    errBox.hidden = true;
    showLoading(true);
    $('#mirror-idx').textContent = String(i + 1);
    frame.src = candidates[i];
    const addr = $('#addr'); if (addr) addr.textContent = candidates[i];
    const t = setTimeout(() => showLoading(false), 18000);
    frame.onload = () => { clearTimeout(t); showLoading(false); };
    /* se o site proíbe iframe, o onload dispara com documento vazio em alguns
       navegadores; o aviso abaixo é a rede de segurança */
    setTimeout(() => {
      if (document.querySelector('.player-loading:not(.off)')) {
        showLoading(false);
      }
    }, 12000);
  }

  function next(manual) {
    if (current + 1 >= candidates.length) {
      showLoading(false);
      setError('o site original recusa ser aberto dentro de outra página — é uma escolha do servidor deles.', 'você pode tentar outro espelho, abrir em nova aba ou usar o proxy em navegar.html.');
      return;
    }
    load(current + 1);
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

  /* barra do player */
  $('#next-mirror').addEventListener('click', () => next(true));
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
    if (e.key.toLowerCase() === 'r' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); load(current); }
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
