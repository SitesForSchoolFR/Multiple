/* ==========================================================================
   múltiplo — núcleo compartilhado
   configs persistidas, cursor (bolinha + anel com delay), paleta de comandos,
   toasts, relógio, header e micro-interações.
   ========================================================================== */
(function () {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem('multiplo:' + key); return v === null ? fallback : JSON.parse(v); }
      catch (_) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem('multiplo:' + key, JSON.stringify(value)); } catch (_) { }
      document.dispatchEvent(new CustomEvent('multiplo:store', { detail: { key, value } }));
    }
  };
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const DEFAULTS = {
    theme: 'tinta',        // tinta | paper | contrast
    accent: 'mono',        // mono | lime | sky | rose
    cursor: 'custom',      // custom | native
    cursorDelay: 0.16,     // segundos do anel
    cursorSize: 1,         // escala do anel
    motion: 'auto',        // auto | reduced
    grid: 'on',
    radius: 'crisp',       // sharp | crisp | soft
    density: 'normal',     // normal | compact
    sound: false,
    clock: true
  };
  const cfg = Object.assign({}, DEFAULTS, store.get('config', {}));

  const ACCENTS = {
    mono: [],
    lime: ['#c9f24d', '#a9d22f'],
    sky: ['#7cc4ff', '#4fa9ec'],
    rose: ['#f7a1b5', '#ea7d97']
  };

  /* ---------------------------------------------------------------- *
   * aplicar configuração
   * ---------------------------------------------------------------- */
  function apply() {
    const root = document.documentElement;
    root.dataset.theme = cfg.theme;
    root.dataset.radius = cfg.radius;
    root.dataset.density = cfg.density;
    root.dataset.grid = cfg.grid === 'on' ? 'on' : 'off';
    root.dataset.cursor = cfg.cursor;
    root.dataset.motion = cfg.motion === 'reduced' ? 'reduced' : 'auto';
    root.dataset.sound = cfg.sound ? 'on' : 'off';
    const pair = ACCENTS[cfg.accent] || [];
    if (pair.length) {
      root.style.setProperty('--accent', pair[0]);
      root.style.setProperty('--accent-2', pair[1]);
      root.dataset.accent = cfg.accent;
    } else {
      root.style.removeProperty('--accent');
      root.style.removeProperty('--accent-2');
      root.dataset.accent = 'mono';
    }
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.content = cfg.theme === 'paper' ? '#f4f1e9' : '#0a0a0a';
    $$('[data-cfg]').forEach(el => {
      const key = el.dataset.cfg;
      const val = String(cfg[key]);
      if (el.tagName === 'BUTTON') el.setAttribute('aria-pressed', String(el.dataset.value === val));
      else if (el.classList.contains('switch')) el.setAttribute('aria-checked', String(!!cfg[key]));
      else if (el.type === 'range') el.value = cfg[key];
    });
    document.dispatchEvent(new CustomEvent('multiplo:config', { detail: cfg }));
  }
  function set(key, value) {
    cfg[key] = value;
    store.set('config', cfg);
    apply();
    if (key === 'sound') beep(value ? 'on' : 'off');
    return cfg;
  }

  /* ---------------------------------------------------------------- *
   * som minúsculo (desligado por padrão)
   * ---------------------------------------------------------------- */
  let ctx = null;
  function audio() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (_) { } }
    return ctx;
  }
  const TONES = {
    tick: [1180, 0.018, 0.012],
    click: [660, 0.05, 0.03],
    on: [560, 0.05, 0.05],
    off: [380, 0.05, 0.04],
    copy: [990, 0.04, 0.05],
    done: [1320, 0.06, 0.07]
  };
  function beep(kind) {
    if (!cfg.sound) return;
    const a = audio(); if (!a) return;
    const [freq, vol, dur] = TONES[kind] || TONES.click;
    const o = a.createOscillator(), g = a.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0, a.currentTime);
    g.gain.linearRampToValueAtTime(vol, a.currentTime + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur + 0.02);
    o.connect(g).connect(a.destination);
    o.start(); o.stop(a.currentTime + dur + 0.03);
  }

  /* ---------------------------------------------------------------- *
   * toasts
   * ---------------------------------------------------------------- */
  let toastBox = null;
  function toast(msg, glyph) {
    if (!toastBox) {
      toastBox = document.createElement('div');
      toastBox.className = 'toasts';
      toastBox.setAttribute('role', 'status');
      toastBox.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastBox);
    }
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = (glyph ? '<span class="g">' + glyph + '</span>' : '') + '<span></span>';
    el.lastElementChild.textContent = msg;
    toastBox.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 400); }, 3200);
  }

  async function copy(text) {
    try { await navigator.clipboard.writeText(text); beep('copy'); toast('copiado: ' + text, '⎘'); }
    catch (_) {
      const t = document.createElement('textarea');
      t.value = text; t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); toast('copiado', '⎘'); } catch (e) { toast('não deu para copiar', '!'); }
      t.remove();
    }
  }

  /* ---------------------------------------------------------------- *
   * cursor personalizado — bolinha + anel com atraso
   * ---------------------------------------------------------------- */
  function setupCursor() {
    const fine = window.matchMedia('(pointer: fine)');
    if (!fine.matches || reduceMotion) return;
    const dot = document.createElement('span');
    const ring = document.createElement('span');
    dot.className = 'cursor-dot'; ring.className = 'cursor-ring';
    dot.setAttribute('aria-hidden', 'true'); ring.setAttribute('aria-hidden', 'true');
    document.body.append(dot, ring);

    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my, seen = false;
    let held = false;

    addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      mx = e.clientX; my = e.clientY;
      if (!seen) { seen = true; rx = mx; ry = my; document.documentElement.classList.add('cursor-active'); }
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
      const hot = e.target.closest('a, button, [role="button"], input, select, textarea, summary, [data-hot]');
      ring.classList.toggle('is-hot', !!hot);
    }, { passive: true });
    addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') { held = true; ring.classList.add('is-down'); } }, { passive: true });
    addEventListener('pointerup', () => { held = false; ring.classList.remove('is-down'); });
    addEventListener('pointerleave', () => { if (seen) { seen = false; document.documentElement.classList.remove('cursor-active'); } });
    document.addEventListener('mouseout', e => { if (!e.relatedTarget && !e.toElement) document.documentElement.classList.remove('cursor-active'); });

    let last = 0;
    function loop(t) {
      const dt = Math.min(0.05, (t - last) / 1000 || 0.016); last = t;
      const k = 1 - Math.exp(-dt / Math.max(0.02, Number(cfg.cursorDelay) || 0.16));
      rx += (mx - rx) * k; ry += (my - ry) * k;
      const scale = Number(cfg.cursorSize) || 1;
      ring.style.transform = `translate3d(${rx.toFixed(2)}px, ${ry.toFixed(2)}px, 0) scale(${scale})`;
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
    document.addEventListener('multiplo:config', () => {
      if (cfg.cursor === 'native') document.documentElement.classList.remove('cursor-active');
      else if (seen) document.documentElement.classList.add('cursor-active');
    });
  }

  /* ---------------------------------------------------------------- *
   * reveal ao rolar + scroll progress + header escondido
   * ---------------------------------------------------------------- */
  function setupScroll() {
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);

    const io = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
      for (const en of entries) if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }) : null;
    const watch = () => $$('[data-reveal]:not(.in)').forEach(el => io ? io.observe(el) : el.classList.add('in'));
    watch();
    document.addEventListener('multiplo:new-content', watch);

    const head = $('.site-head');
    let lastY = scrollY, ticking = false;
    function onScroll() {
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, scrollY / max) : 0) + ')';
      if (head && !head.hasAttribute('data-pinned')) {
        const y = scrollY;
        head.style.transform = y > 220 && y > lastY ? 'translateY(-101%)' : '';
        lastY = y;
      }
      ticking = false;
    }
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();
  }

  /* ---------------------------------------------------------------- *
   * paleta de comandos
   * ---------------------------------------------------------------- */
  const NAV = [
    { t: 'início', s: 'página inicial', k: '/', u: 'index.html' },
    { t: 'jogos', s: '3.500 jogos, ports, emuladores', k: 'J', u: 'jogos.html' },
    { t: 'navegar', s: 'proxy, mirrors, abrir qualquer site', k: 'N', u: 'navegar.html' },
    { t: 'links', s: '2.000+ links, unblockers, espelhos', k: 'L', u: 'links.html' },
    { t: 'estudar', s: 'quizzes, notas, foco', k: 'E', u: 'estudar.html' },
    { t: 'créditos', s: 'de onde vem cada coisa', k: 'C', u: 'creditos.html' },
    { t: 'proxies e mirrors', s: 'sites em iframes e espelhos', k: '', u: 'navegar.html#mirrors' },
    { t: 'unblockers', s: 'securly, goguardian, contentkeeper…', k: '', u: 'links.html?cat=unblockers' },
    { t: 'rolê aleatório', s: 'sorteia um jogo agora', k: '', u: 'jogos.html?aleatorio=1' },
    { t: 'sortear link', s: 'abre um link aleatório da coleção', k: '', u: 'links.html?aleatorio=1' }
  ];

  function setupPalette() {
    if ($('#cmd-palette')) return;
    const dlg = document.createElement('dialog');
    dlg.className = 'modal palette';
    dlg.id = 'cmd-palette';
    dlg.innerHTML =
      '<form method="dialog" class="sr-only"><button>fechar</button></form>' +
      '<input type="search" id="pal-input" placeholder="ir para, buscar jogo, comando…" autocomplete="off" spellcheck="false" aria-label="Buscar na paleta">' +
      '<div class="hint">↑ ↓ mover · ↵ abrir · esc fechar</div>' +
      '<div class="palette-results" id="pal-results"></div>';
    document.body.appendChild(dlg);

    const input = dlg.querySelector('#pal-input');
    const box = dlg.querySelector('#pal-results');
    let items = [], active = 0, catalog = null, loading = false;

    async function loadCatalog() {
      if (catalog || loading) return;
      loading = true;
      try {
        const res = await fetch('data/games.json');
        const db = await res.json();
        catalog = [];
        for (const g of db.groups) for (const e of g.games) {
          catalog.push({ t: e.n, s: g.name, k: 'jogo', u: e.f ? 'jogar.html?j=' + encodeURIComponent(e.n) : 'links.html?q=' + encodeURIComponent(e.n) });
        }
      } catch (_) { catalog = []; }
      loading = false;
      render();
    }

    function build(query) {
      const q = query.trim().toLowerCase();
      const base = [];
      for (const n of NAV) base.push({ t: n.t, s: n.s, k: n.k || 'ir', u: n.u, type: 'nav' });
      base.push({ t: 'configurações', s: 'tema, cursor, cor, movimento', k: ',', u: '#config', type: 'settings' });
      base.push({ t: 'tema claro', s: 'papel & tinta', k: '', u: '#theme:paper', type: 'settings' });
      base.push({ t: 'tema escuro', s: 'tinta (padrão)', k: '', u: '#theme:tinta', type: 'settings' });
      base.push({ t: 'alto contraste', s: 'preto e branco puro', k: '', u: '#theme:contrast', type: 'settings' });
      base.push({ t: 'cursor nativo', s: 'desligar bolinha personalizada', k: '', u: '#cursor:native', type: 'settings' });
      base.push({ t: 'cursor personalizado', s: 'bolinha com anel de atraso', k: '', u: '#cursor:custom', type: 'settings' });
      const games = (catalog || []).filter(e => !q || e.t.toLowerCase().includes(q)).slice(0, q ? 12 : 0).map(e => ({ ...e, type: 'game' }));
      const navFiltered = base.filter(e => !q || (e.t + ' ' + e.s).toLowerCase().includes(q));
      return [...games, ...navFiltered].slice(0, 40);
    }

    function render() {
      const q = input.value;
      items = build(q);
      active = 0;
      if (!items.length) { box.innerHTML = '<p class="pal-empty">nada por aqui — tente outro termo.</p>'; return; }
      box.innerHTML = items.map((it, i) =>
        `<button type="button" class="pal-opt" role="option" data-i="${i}" data-u="${encodeURIComponent(it.u)}" data-type="${it.type}">
           <span class="ic">${it.type === 'game' ? '▸' : it.type === 'settings' ? '◇' : '→'}</span>
           <span class="t">${esc(it.t)}<span class="s"> — ${esc(it.s || '')}</span></span>
           <span class="k">${esc(it.k || '')}</span>
         </button>`).join('');
      paint();
    }
    function paint() {
      $$('.pal-opt', box).forEach((b, i) => b.setAttribute('aria-selected', String(i === active)));
      const cur = box.children[active];
      if (cur) cur.scrollIntoView({ block: 'nearest' });
    }
    function go(it) {
      if (!it) return;
      if (it.type === 'settings') { runSetting(it.u); dlg.close(); return; }
      location.href = it.u;
    }
    function runSetting(hash) {
      const m = String(hash).slice(1).split(':');
      if (m[0] === 'config') { document.dispatchEvent(new CustomEvent('multiplo:open-settings')); return; }
      if (m[0] === 'theme') set('theme', m[1]);
      if (m[0] === 'cursor') set('cursor', m[1]);
    }

    input.addEventListener('input', render);
    input.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(items.length - 1, active + 1); paint(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(0, active - 1); paint(); }
      else if (e.key === 'Enter') { e.preventDefault(); go(items[active]); }
      else if (e.key === 'Home') { active = 0; paint(); }
      else if (e.key === 'End') { active = items.length - 1; paint(); }
    });
    box.addEventListener('click', e => {
      const b = e.target.closest('.pal-opt'); if (!b) return;
      go(items[Number(b.dataset.i)]);
    });
    box.addEventListener('mousemove', e => {
      const b = e.target.closest('.pal-opt'); if (!b) return;
      const i = Number(b.dataset.i); if (i !== active) { active = i; paint(); }
    });
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', () => { input.value = ''; });

    window.MultiploPalette = {
      open() {
        dlg.showModal();
        input.value = '';
        render();
        loadCatalog();
        setTimeout(() => input.focus(), 30);
      }
    };
  }

  /* ---------------------------------------------------------------- *
   * configurações
   * ---------------------------------------------------------------- */
  function setupSettings() {
    if ($('#settings-dlg')) return;
    const dlg = document.createElement('dialog');
    dlg.className = 'modal settings';
    dlg.id = 'settings-dlg';
    dlg.innerHTML = `
      <div class="modal-head">
        <h2>ajustes</h2>
        <button class="modal-close" data-close>fechar ✕</button>
      </div>
      <div class="modal-body">
        <div class="settings-group">
          <h3>tema</h3>
          <div class="seg" role="group" aria-label="Tema">
            <button data-cfg="theme" data-value="tinta">tinta</button>
            <button data-cfg="theme" data-value="paper">papel</button>
            <button data-cfg="theme" data-value="contrast">contraste</button>
          </div>
        </div>
        <div class="settings-group">
          <h3>acento</h3>
          <div class="accent-row" role="group" aria-label="Cor de acento">
            <button class="accent-dot" data-cfg="accent" data-value="mono" title="mono" style="background:linear-gradient(135deg,#111 50%,#eee 50%)"></button>
            <button class="accent-dot" data-cfg="accent" data-value="lime" title="lime" style="background:#c9f24d"></button>
            <button class="accent-dot" data-cfg="accent" data-value="sky" title="sky" style="background:#7cc4ff"></button>
            <button class="accent-dot" data-cfg="accent" data-value="rose" title="rose" style="background:#f7a1b5"></button>
          </div>
        </div>
        <div class="settings-group">
          <h3>cursor</h3>
          <div class="seg" role="group" aria-label="Cursor">
            <button data-cfg="cursor" data-value="custom">bolinha</button>
            <button data-cfg="cursor" data-value="native">nativo</button>
          </div>
          <div class="switch-row" style="margin-top:.8rem">
            <label for="cfg-delay">atraso do anel · <output id="cfg-delay-out"></output>ms</label>
          </div>
          <input id="cfg-delay" type="range" min="0" max="0.42" step="0.02" value="${cfg.cursorDelay}" style="width:100%" aria-label="Atraso do anel">
          <div class="switch-row" style="margin-top:.6rem">
            <label for="cfg-size">tamanho do anel · <output id="cfg-size-out"></output>×</label>
          </div>
          <input id="cfg-size" type="range" min="0.6" max="1.8" step="0.1" value="${cfg.cursorSize}" style="width:100%" aria-label="Tamanho do anel">
        </div>
        <div class="settings-group">
          <h3>forma & grade</h3>
          <div class="seg" role="group" aria-label="Cantos">
            <button data-cfg="radius" data-value="sharp">reto</button>
            <button data-cfg="radius" data-value="crisp">leve</button>
            <button data-cfg="radius" data-value="soft">redondo</button>
          </div>
          <div class="switch-row" style="margin-top:.8rem">
            <label for="cfg-grid">grade ao fundo</label>
            <button class="switch" id="cfg-grid" data-cfg="grid" role="switch" aria-checked="false" aria-label="Grade ao fundo"></button>
          </div>
          <div class="switch-row">
            <label for="cfg-compact">densidade compacta</label>
            <button class="switch" id="cfg-compact" role="switch" aria-checked="false" aria-label="Densidade compacta"></button>
          </div>
        </div>
        <div class="settings-group">
          <h3>som & movimento</h3>
          <div class="switch-row">
            <label for="cfg-sound">som de clique (sutil)</label>
            <button class="switch" id="cfg-sound" data-cfg="sound" role="switch" aria-checked="false" aria-label="Som"></button>
          </div>
          <div class="switch-row">
            <label for="cfg-motion">reduzir movimento</label>
            <button class="switch" id="cfg-motion" role="switch" aria-checked="false" aria-label="Reduzir movimento"></button>
          </div>
        </div>
        <p class="tiny" style="padding-top:.9rem">preferências ficam neste navegador. atalhos: <span class="kbd">ctrl</span>+<span class="kbd">k</span> paleta · <span class="kbd">g</span> depois <span class="kbd">j</span> jogos · <span class="kbd">g</span> <span class="kbd">l</span> links.</p>
      </div>`;
    document.body.appendChild(dlg);

    dlg.addEventListener('click', e => {
      const b = e.target.closest('[data-cfg]:not(.switch)');
      if (b) { set(b.dataset.cfg, b.dataset.value); beep('click'); }
      if (e.target.closest('[data-close]')) dlg.close();
      if (e.target === dlg) dlg.close();
    });
    dlg.querySelector('.switch[data-cfg="grid"]').addEventListener('click', e => set('grid', cfg.grid === 'on' ? 'off' : 'on'));
    dlg.querySelector('.switch[data-cfg="sound"]').addEventListener('click', e => set('sound', !cfg.sound));
    dlg.querySelector('.switch#cfg-motion').addEventListener('click', e => set('motion', cfg.motion === 'reduced' ? 'auto' : 'reduced'));
    dlg.querySelector('.switch#cfg-compact').addEventListener('click', e => set('density', cfg.density === 'compact' ? 'normal' : 'compact'));
    const delay = dlg.querySelector('#cfg-delay'), delayOut = dlg.querySelector('#cfg-delay-out');
    const size = dlg.querySelector('#cfg-size'), sizeOut = dlg.querySelector('#cfg-size-out');
    function paintRanges() {
      delayOut.textContent = Math.round(cfg.cursorDelay * 1000);
      sizeOut.textContent = Number(cfg.cursorSize).toFixed(1);
      dlg.querySelector('.switch#cfg-compact').setAttribute('aria-checked', String(cfg.density === 'compact'));
      dlg.querySelector('.switch#cfg-motion').setAttribute('aria-checked', String(cfg.motion === 'reduced'));
    }
    delay.addEventListener('input', () => { set('cursorDelay', Number(delay.value)); paintRanges(); });
    size.addEventListener('input', () => { set('cursorSize', Number(size.value)); paintRanges(); });

    const open = () => { apply(); paintRanges(); dlg.showModal(); };
    document.addEventListener('multiplo:open-settings', open);
    document.addEventListener('click', e => {
      const t = e.target.closest('[data-open-settings]');
      if (t) { e.preventDefault(); open(); }
    });
    window.MultiploSettings = { open, cfg, set };
  }

  /* ---------------------------------------------------------------- *
   * header: relógio, som, atalhos, menu
   * ---------------------------------------------------------------- */
  function setupChrome() {
    const path = location.pathname.split('/').pop() || 'index.html';
    $$('.site-nav a, .drawer-nav a').forEach(a => {
      const href = a.getAttribute('href') || '';
      if (href.split('#')[0] === path) a.setAttribute('aria-current', 'page');
    });

    document.addEventListener('click', e => {
      const s = e.target.closest('[data-sound-toggle]');
      if (s) { set('sound', !cfg.sound); s.setAttribute('aria-pressed', String(cfg.sound)); }
      const p = e.target.closest('[data-palette]');
      if (p) { e.preventDefault(); window.MultiploPalette && window.MultiploPalette.open(); }
    });
    const soundBtn = $('[data-sound-toggle]');
    if (soundBtn) soundBtn.setAttribute('aria-pressed', String(cfg.sound));

    addEventListener('keydown', e => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); window.MultiploPalette && window.MultiploPalette.open(); return; }
      if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === '/') { e.preventDefault(); window.MultiploPalette && window.MultiploPalette.open(); }
      if (e.key === ',') { e.preventDefault(); document.dispatchEvent(new CustomEvent('multiplo:open-settings')); }
    });

    /* g depois j/l/e/n/c */
    let g = 0;
    addEventListener('keydown', e => {
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) return;
      const now = Date.now();
      if (e.key.toLowerCase() === 'g' && !e.ctrlKey && !e.metaKey) { g = now; return; }
      if (now - g < 900 && !e.ctrlKey && !e.metaKey) {
        const map = { j: 'jogos.html', l: 'links.html', e: 'estudar.html', n: 'navegar.html', c: 'creditos.html', h: 'index.html' };
        const dest = map[e.key.toLowerCase()];
        if (dest) { location.href = dest; }
      }
    });

    const drawer = $('#drawer');
    if (drawer) {
      $$('[data-drawer-open]').forEach(b => b.addEventListener('click', () => drawer.showModal()));
      drawer.addEventListener('click', e => {
        if (e.target === drawer || e.target.closest('[data-close]')) drawer.close();
      });
    }

    $$('a[data-scroll]').forEach(a => a.addEventListener('click', e => {
      const t = document.getElementById(a.dataset.scroll);
      if (!t) return;
      e.preventDefault();
      t.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }));

    /* relógio local (canto do rodapé) */
    const clocks = $$('[data-clock]');
    if (clocks.length) {
      const tick = () => {
        const d = new Date();
        const s = d.toLocaleTimeString('pt-BR', { hour12: false, hour: '2-digit', minute: '2-digit' });
        clocks.forEach(c => { c.textContent = c.dataset.clock === 'full' ? s + ' · ' + d.toLocaleDateString('pt-BR') : s; });
      };
      tick();
      setInterval(tick, 15000);
    }

    /* micro-som em cliques de botões */
    document.addEventListener('click', e => {
      const b = e.target.closest('.btn, .chip, .icon-btn, .tbtn');
      if (b) beep('tick');
    });

    /* page enter */
    const main = $('main');
    if (main && !reduceMotion) main.classList.add('page-enter');
  }

  /* ---------------------------------------------------------------- *
   * segredos: tab cloak, tecla de pânico, konami, "obrigado, ryan"
   * ---------------------------------------------------------------- */
  const CLOAKS = [
    { title: 'Google Sala de Aula', icon: 'https://ssl.gstatic.com/classroom/favicon.png' },
    { title: 'Documentos', icon: 'https://ssl.gstatic.com/docs/documents/images/kix-favicon-2023q4.ico' },
    { title: 'Minha atividade', icon: 'https://ssl.gstatic.com/classroom/favicon.png' },
    { title: 'Portal do aluno', icon: '' }
  ];
  let cloakIdx = -1;
  const baseTitle = document.title;
  const baseIcon = (document.querySelector('link[rel="icon"]') || {}).href || '';
  function setCloak(i) {
    cloakIdx = i;
    const link = document.querySelector('link[rel="icon"]');
    if (i < 0) {
      document.title = baseTitle;
      if (link) link.href = baseIcon;
      try { localStorage.removeItem('multiplo:cloak'); } catch (_) { }
      return;
    }
    const c = CLOAKS[i % CLOAKS.length];
    document.title = c.title;
    if (link && c.icon) link.href = c.icon;
    try { localStorage.setItem('multiplo:cloak', String(i)); } catch (_) { }
  }
  function setupSecrets() {
    try { const saved = localStorage.getItem('multiplo:cloak'); if (saved !== null) setCloak(Number(saved)); } catch (_) { }

    /* Shift + A + Y alterna o disfarce (mesmo atalho do links for me) */
    const held = new Set();
    addEventListener('keydown', e => {
      if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
      held.add(e.key.toLowerCase());
      if (e.shiftKey && held.has('a') && held.has('y')) {
        setCloak(cloakIdx + 1 >= CLOAKS.length ? -1 : cloakIdx + 1);
        toast(cloakIdx < 0 ? 'disfarce desligado' : 'disfarce: ' + CLOAKS[cloakIdx % CLOAKS.length].title, '◐');
        held.clear();
      }
      if (e.key === '`' || e.key === '~') {
        e.preventDefault();
        location.href = 'https://classroom.google.com/';
      }
    }, { capture: true });
    addEventListener('keyup', e => held.delete(e.key.toLowerCase()));
    addEventListener('blur', () => held.clear());

    /* konami → tema contraste + mensagem */
    const seq = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let k = 0;
    addEventListener('keydown', e => {
      if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
      if (e.key.toLowerCase() === seq[k].toLowerCase()) {
        k++;
        if (k === seq.length) {
          k = 0;
          set('theme', 'contrast');
          toast('modo contraste ligado · bem-vindo ao clube', '✳');
          document.documentElement.animate([{ filter: 'invert(1)' }, { filter: 'invert(0)' }], { duration: 700, easing: 'ease-out' });
        }
      } else k = e.key.toLowerCase() === seq[0].toLowerCase() ? 1 : 0;
    });

    /* "obrigado, ryan" na paleta — homenagem ao links for me */
    document.addEventListener('keydown', e => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'k') return;
      setTimeout(() => {
        const input = document.querySelector('#pal-input');
        if (!input) return;
        input.addEventListener('input', () => {
          if (input.value.trim().toLowerCase() === 'obrigado, ryan') {
            input.value = '';
            document.querySelector('#cmd-palette').close();
            toast('de nada, ryan. ✿ — atalho liberado', '♥');
            location.href = 'links.html';
          }
        });
      }, 60);
    });
  }

  /* ---------------------------------------------------------------- *
   * utilitários globais
   * ---------------------------------------------------------------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const shuffle = arr => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  const params = () => new URLSearchParams(location.search);

  /* ---------------------------------------------------------------- *
   * boot
   * ---------------------------------------------------------------- */
  apply();
  function boot() {
    setupCursor();
    setupScroll();
    setupPalette();
    setupSettings();
    setupChrome();
    setupSecrets();
    document.documentElement.classList.add('js');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.Multiplo = { $, $$, cfg, set, apply, store, toast, copy, beep, esc, norm, shuffle, params, DEFAULTS, ACCENTS, setCloak };
})();
