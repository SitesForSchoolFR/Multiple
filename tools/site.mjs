import fs from 'node:fs';
import path from 'node:path';

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

export const NAV = [
  ['index.html', 'início'],
  ['jogos.html', 'jogos'],
  ['navegar.html', 'navegar'],
  ['links.html', 'links'],
  ['estudar.html', 'estudar'],
  ['creditos.html', 'créditos']
];

const icons = {
  sound: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h3l4 4V5L7 9H4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18 6a8.5 8.5 0 0 1 0 12"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.2"/><path d="m15.2 15.2 4.3 4.3"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M4 8h16M4 16h16"/></svg>'
};

export function head({ title, desc, page, extraCss = [], extraJs = [], bodyClass = '' }) {
  return `<!doctype html>
<html lang="pt-BR" data-theme="tinta">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta name="theme-color" content="#0a0a0a">
<meta name="color-scheme" content="dark light">
<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="assets/img/favicon.svg">
<link rel="preload" href="assets/fonts/inter-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/instrument-serif-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/css/site.css">
${extraCss.map(c => `<link rel="stylesheet" href="${c}">`).join('\n')}
<script src="assets/js/core.js"></script>
${extraJs.map(j => `<script defer src="${j}"></script>`).join('\n')}
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
</head>
<body class="${bodyClass}">
<a class="skip-link" href="#conteudo">pular para o conteúdo</a>
<div class="grain" aria-hidden="true"></div>
<div class="bg-ornament" aria-hidden="true"></div>
`;
}

export function header(active, { searchPlaceholder = 'buscar…' } = {}) {
  const links = NAV.map(([href, label]) => {
    const cur = href === active ? ' aria-current="page"' : '';
    return `<a href="${href}"${cur}>${label}</a>`;
  }).join('\n        ');
  return `<div class="shell">
<header class="site-head">
  <div class="inner">
    <a class="brand" href="index.html" aria-label="múltiplo — página inicial">
      <span class="brand-mark">múltiplo</span>
      <span class="brand-note">jogos · links · estudos</span>
    </a>
    <nav class="site-nav" aria-label="Navegação principal">
        ${links}
    </nav>
    <div class="head-actions">
      <button class="search-pill" type="button" data-palette aria-label="Abrir busca e comandos">
        ${icons.search}<span class="lbl">${searchPlaceholder}</span><kbd>ctrl k</kbd>
      </button>
      <button class="icon-btn" type="button" data-sound-toggle aria-pressed="false" aria-label="Alternar som" title="som">
        ${icons.sound}
      </button>
      <button class="icon-btn" type="button" data-open-settings aria-label="Ajustes" title="ajustes (,)">
        ${icons.settings}
      </button>
      <button class="icon-btn mobile-nav" type="button" data-drawer-open aria-label="Abrir menu">
        ${icons.menu}
      </button>
    </div>
  </div>
</header>
<dialog class="modal settings" id="drawer" style="width:min(520px,calc(100vw - 1.2rem))">
  <div class="modal-head"><h2>menu</h2><button class="modal-close" data-close>fechar ✕</button></div>
  <div class="modal-body">
    <nav class="drawer-nav" aria-label="Menu">
      ${NAV.map(([href, label], i) => `<a href="${href}">${label}<small>${String(i + 1).padStart(2, '0')}</small></a>`).join('\n      ')}
    </nav>
    <p class="tiny mt-2">atalhos: <span class="kbd">ctrl k</span> paleta · <span class="kbd">g j</span> jogos · <span class="kbd">g l</span> links · <span class="kbd">,</span> ajustes</p>
  </div>
</dialog>
<main id="conteudo">
`;
}

export function footer() {
  return `</main>
<footer class="site-foot">
  <div class="wrap">
    <div class="foot-grid">
      <div class="foot-brand">
        <div class="mark">múltiplo</div>
        <p>um lugar só para jogos, links, navegação e estudo. feito por quem também estuda — e por quem também quer dar uma pausa.</p>
        <p class="tiny mt-2">preto e branco, customizável, sem conta e sem rastreamento.</p>
      </div>
      <div class="foot-col">
        <h4>departamentos</h4>
        <ul>
          <li><a href="jogos.html">jogos <span class="k">3.500</span></a></li>
          <li><a href="links.html">links <span class="k">2.000</span></a></li>
          <li><a href="navegar.html">navegar</a></li>
          <li><a href="estudar.html">estudar</a></li>
        </ul>
      </div>
      <div class="foot-col">
        <h4>atalhos</h4>
        <ul>
          <li><a href="jogos.html?aleatorio=1">jogo aleatório <span class="k">↗</span></a></li>
          <li><a href="links.html?cat=unblockers">unblockers <span class="k">↗</span></a></li>
          <li><a href="navegar.html#mirrors">mirrors <span class="k">↗</span></a></li>
          <li><a href="creditos.html">créditos <span class="k">↗</span></a></li>
        </ul>
      </div>
      <div class="foot-col">
        <h4>fontes</h4>
        <ul>
          <li><a href="https://github.com/SitesForSchoolFR/Links" target="_blank" rel="noopener noreferrer">Links</a></li>
          <li><a href="https://sitesforschoolfr.github.io/estudoescolar/" target="_blank" rel="noopener noreferrer">estudo escolar</a></li>
          <li><a href="https://sitesforschoolfr.github.io/Nebula/" target="_blank" rel="noopener noreferrer">Nebula</a></li>
          <li><a href="https://suckinguptoessry.github.io/LuminSDK/" target="_blank" rel="noopener noreferrer">LuminSDK</a></li>
        </ul>
      </div>
    </div>
    <div class="foot-bottom">
      <span>© <span data-year>2026</span> múltiplo · sem fins comerciais</span>
      <span class="clock" data-clock="full" aria-label="Hora local">--:--</span>
      <span>feito com paciência, café e fontes abertas <span aria-hidden="true">✳</span></span>
    </div>
  </div>
</footer>
</div>
<script>document.querySelectorAll('[data-year]').forEach(function(e){e.textContent=new Date().getFullYear()});</script>
</body>
</html>
`;
}

export function page({ file, title, desc, active, body, extraCss, extraJs, bodyClass, searchPlaceholder }) {
  const html = head({ title, desc, page: file, extraCss, extraJs, bodyClass }) +
    header(active, { searchPlaceholder }) + body + footer();
  const out = path.join(ROOT, file);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  console.log('·', file, (html.length / 1024).toFixed(0) + ' KB');
}
