#!/usr/bin/env node
/*
 * build-pages.mjs — gera as páginas do múltiplo a partir dos dados.
 * Rodar: node tools/build-pages.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { page, ROOT } from './site.mjs';

const games = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'games.json'), 'utf8'));
const links = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'links.json'), 'utf8'));
const totalGames = games.groups.reduce((n, g) => n + g.games.length, 0);
const localGames = games.groups.find(g => g.id === 'no-site').games.length;
const counts = links.counts;

/* ------------------------------------------------------------------ *
 * INÍCIO
 * ------------------------------------------------------------------ */
page({
  file: 'index.html',
  title: 'múltiplo — jogos, links e estudos, num lugar só',
  desc: 'um site só para jogar, navegar, achar links e estudar: ' + totalGames + ' jogos, ' + links.total + ' links, proxy e quizzes. preto e branco, customizável, sem conta.',
  active: 'index.html',
  searchPlaceholder: 'buscar jogos e links…',
  body: `
<section class="hero wrap">
  <div class="hero-grid">
    <div class="hero-copy">
      <p class="eyebrow">um lugar só <span aria-hidden="true">✳</span> jogos, links & estudo</p>
      <h1 class="display hero-title">
        <span class="line"><span>tudo o que</span></span>
        <span class="line"><span>você precisa,</span></span>
        <span class="line"><span><em>num lugar só.</em></span></span>
      </h1>
      <p class="lede">os jogos, os links, os espelhos e as matérias que você já conhece — agora num site minimalista, preto e branco, que se ajusta ao seu jeito.</p>
      <div class="hero-cta">
        <a class="btn btn--solid btn--lg" href="jogos.html">explorar os jogos <span class="arr">↗</span></a>
        <a class="btn btn--lg" href="links.html">ver os links <span class="arr">↗</span></a>
        <button class="btn btn--ghost" type="button" data-palette>buscar <span class="kbd">/</span></button>
      </div>
      <div class="hero-meta">
        <span><b id="stat-games">${totalGames.toLocaleString('pt-BR')}</b> jogos</span>
        <span class="dot" aria-hidden="true"></span>
        <span><b id="stat-links">${links.total.toLocaleString('pt-BR')}</b> links</span>
        <span class="dot" aria-hidden="true"></span>
        <span><b id="stat-unblockers">${(counts.unblockers || 0).toLocaleString('pt-BR')}</b> unblockers</span>
        <span class="dot" aria-hidden="true"></span>
        <span>sem login · sem rastreamento</span>
      </div>
    </div>
    <div class="hero-art">
      <div class="hero-pair">
        <figure class="hero-poster" id="hero-poster">
          <span class="stamp"><b>01</b>edição</span>
          <picture>
            <source srcset="assets/img/hero.webp" type="image/webp">
            <img id="hero-img" src="assets/img/hero.jpg" alt="eclipse desenhado em linhas finas, capa da edição" width="700" height="700">
          </picture>
          <figcaption class="poster-tag" id="hero-caption">múltiplo / edição 01</figcaption>
        </figure>
        <figure class="hero-poster hero-poster--b">
          <picture>
            <source srcset="assets/img/collage.webp" type="image/webp">
            <img src="assets/img/collage.jpg" alt="" width="800" height="993" loading="lazy">
          </picture>
          <figcaption class="poster-tag" id="hero-pair-caption">maze · dice · pad</figcaption>
        </figure>
      </div>
      <div class="caption"><span>edição 01 / 2026</span><span>preto & branco · feito à mão</span></div>
    </div>
  </div>
</section>

<div class="stats-row wrap" style="max-width:var(--max)">
  <div class="stat"><strong id="stat-local">${localGames}</strong><span>jogos rodam aqui dentro</span></div>
  <div class="stat"><strong id="stat-groups">${games.groups.length}</strong><span>fontes de catálogo</span></div>
  <div class="stat"><strong>${(counts.estudos || 0).toLocaleString('pt-BR')}</strong><span>links de estudo</span></div>
  <div class="stat"><strong>${(counts.espelhos || 0).toLocaleString('pt-BR')}</strong><span>espelhos e mirrors</span></div>
</div>

<div class="marquee mt-3" aria-hidden="true">
  <div class="marquee-track">
    <span>sem login</span><span>sem cookies de rastreamento</span><span>preto & branco</span><span>fontes abertas</span><span>editável do seu jeito</span><span>feito pra escola</span><span>${totalGames.toLocaleString('pt-BR')} jogos</span><span>${links.total.toLocaleString('pt-BR')} links</span>
    <span>sem login</span><span>sem cookies de rastreamento</span><span>preto & branco</span><span>fontes abertas</span><span>editável do seu jeito</span><span>feito pra escola</span><span>${totalGames.toLocaleString('pt-BR')} jogos</span><span>${links.total.toLocaleString('pt-BR')} links</span>
  </div>
</div>

<section class="section wrap" id="departamentos">
  <div class="section-head">
    <div>
      <p class="eyebrow">departamentos</p>
      <h2 class="display">escolha por onde <em>começar.</em></h2>
      <p class="lede">quatro portas, a mesma casa. tudo aqui é acessível em um clique, sem cadastro, sem anúncio.</p>
    </div>
    <a class="btn aside" href="jogos.html?aleatorio=1">jogo aleatório <span class="arr">↗</span></a>
  </div>
  <div class="depts" id="home-departments">
    <a class="dept" href="jogos.html" data-reveal>
      <span class="idx">01</span>
      <div class="dept-main">
        <h3>jogos</h3>
        <p>${totalGames.toLocaleString('pt-BR')} títulos, de clássicos a ports de PC. ${localGames} rodam aqui dentro, sem sair do site.</p>
        <div class="meta"><span>${totalGames.toLocaleString('pt-BR')} títulos</span><span>${localGames} no site</span></div>
      </div>
      <span class="go" aria-hidden="true">↗</span>
    </a>
    <a class="dept" href="links.html" data-reveal data-delay="1">
      <span class="idx">02</span>
      <div class="dept-main">
        <h3>links</h3>
        <p>a coleção inteira: jogos, estudos, filmes, unblockers e os espelhos que circulam por aí — ${links.total.toLocaleString('pt-BR')} endereços.</p>
        <div class="meta"><span>${links.groups.length} coleções</span><span>${(counts.unblockers || 0).toLocaleString('pt-BR')} unblockers</span></div>
      </div>
      <span class="go" aria-hidden="true">↗</span>
    </a>
    <a class="dept" href="navegar.html" data-reveal data-delay="2">
      <span class="idx">03</span>
      <div class="dept-main">
        <h3>navegar</h3>
        <p>um proxy no próprio navegador (Scramjet + Ultraviolet) e uma lista de espelhos para abrir qualquer site, até os mais teimosos.</p>
        <div class="meta"><span>scramjet</span><span>ultraviolet</span><span>wisp</span></div>
      </div>
      <span class="go" aria-hidden="true">↗</span>
    </a>
    <a class="dept" href="estudar.html" data-reveal data-delay="3">
      <span class="idx">04</span>
      <div class="dept-main">
        <h3>estudar</h3>
        <p>quizzes de matemática, português, ciências, história e geografia, do 1º ano ao ensino médio — com explicação em cada resposta.</p>
        <div class="meta"><span>12 anos e séries</span><span>foco & notas</span></div>
      </div>
      <span class="go" aria-hidden="true">↗</span>
    </a>
  </div>
</section>

<section class="section wrap" id="aqui-dentro">
  <div class="section-head">
    <div>
      <p class="eyebrow">roda aqui dentro</p>
      <h2 class="display">jogos que não <em>saem daqui.</em></h2>
      <p class="lede">alguns funcionam direto no site — pressione jogar e pronto. do Doom ao GTA, passando por emuladores.</p>
    </div>
    <a class="btn aside" href="jogos.html?grupo=no-site">ver todos os ${localGames} <span class="arr">↗</span></a>
  </div>
  <div class="strip-scroll" id="strip-local" aria-label="jogos no site">
    <div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>
  </div>
</section>

<section class="section wrap">
  <div class="section-head">
    <div>
      <p class="eyebrow">sorte</p>
      <h2 class="display">deixa a sorte <em>escolher.</em></h2>
      <p class="lede">aperte o botão e um jogo qualquer aparece. se não gostar, sorteia de novo — a gente não julga.</p>
    </div>
  </div>
  <div class="spin-card">
    <div class="spin-art" id="spin-art"><span class="ph" aria-hidden="true">✦</span></div>
    <div class="spin-body" id="spin-body">
      <span class="kind" id="spin-src">sorteando…</span>
      <h3 id="spin-title">—</h3>
      <p class="tiny" id="spin-note">o botão escolhe um dos ${totalGames.toLocaleString('pt-BR')} jogos do catálogo.</p>
      <div class="actions">
        <a class="btn btn--solid" id="spin-open" href="jogos.html">jogar <span class="arr">↗</span></a>
        <button class="btn" id="spin-next" type="button">outro ↻</button>
        <a class="btn btn--ghost" id="spin-link" href="links.html">procurar espelho</a>
      </div>
    </div>
  </div>
</section>

<section class="section wrap">
  <div class="section-head">
    <div>
      <p class="eyebrow">links</p>
      <h2 class="display">a coleção <em>cresce.</em></h2>
      <p class="lede">quando alguém manda uma leva nova de espelhos, ela entra aqui. aperte e veja um link aleatório.</p>
    </div>
    <a class="btn aside" href="links.html">abrir a coleção <span class="arr">↗</span></a>
  </div>
  <div class="steps">
    <div class="step" data-reveal><span class="k">passo 01</span><h3>ache</h3><p>busque por nome, domínio ou matéria. ${links.total.toLocaleString('pt-BR')} endereços catalogados em ${links.groups.length} coleções.</p></div>
    <div class="step" data-reveal data-delay="1"><span class="k">passo 02</span><h3>teste</h3><p>cada linha tem um botão de proxy: se o site estiver bloqueado, abra por dentro do navegar.</p></div>
    <div class="step" data-reveal data-delay="2"><span class="k">passo 03</span><h3>guarde</h3><p>favorite o que funcionar. os favoritos ficam no seu navegador e podem ser exportados.</p></div>
  </div>
</section>

<section class="section wrap">
  <div class="quote" data-reveal>feito para quem estuda <em>e</em> para quem precisa de uma pausa entre uma matéria e outra.</div>
  <div class="row mt-3">
    <a class="btn" href="creditos.html">de onde vem tudo isso <span class="arr">↗</span></a>
    <span class="tiny">as fontes originais estão nos créditos — sem elas, nada disso existiria.</span>
  </div>
</section>
`,
  extraJs: ['assets/js/data.js', 'assets/js/pages.js']
});

/* ------------------------------------------------------------------ *
 * JOGOS
 * ------------------------------------------------------------------ */
page({
  file: 'jogos.html',
  title: 'jogos — múltiplo',
  desc: totalGames + ' jogos para navegador: ports de PC, clássicos, emuladores, ' + localGames + ' rodando direto no site.',
  active: 'jogos.html',
  searchPlaceholder: 'buscar jogos…',
  body: `
<section class="page-head wrap">
  <p class="eyebrow">acervo</p>
  <h1>jogos</h1>
  <p class="lede">${totalGames.toLocaleString('pt-BR')} títulos vindos das suas fontes de sempre — mais ${localGames} que rodam aqui dentro, sem sair da página. escolha um e vá.</p>
  <div class="stats-row stats-row" style="max-width:720px">
    <div class="stat"><strong id="stat-local">${localGames}</strong><span>no site</span></div>
    <div class="stat"><strong>${totalGames.toLocaleString('pt-BR')}</strong><span>no total</span></div>
    <div class="stat"><strong id="fav-count">0</strong><span>favoritos</span></div>
    <div class="stat"><strong>${games.groups.length}</strong><span>fontes</span></div>
  </div>
</section>

<section class="section wrap" style="padding-top:1.3rem">
  <div class="toolbar" role="search">
    <label class="search-box" for="search">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.2"/><path d="m15.2 15.2 4.3 4.3"/></svg>
      <input id="search" type="search" placeholder="nome, autor, gênero…" autocomplete="off" aria-label="Buscar jogos">
      <kbd>/</kbd>
    </label>
    <div class="chips" id="group-chips" role="group" aria-label="Filtrar por fonte"></div>
    <select class="mini" id="sort" aria-label="Ordenar">
      <option value="destaque">destaque</option>
      <option value="az">a → z</option>
      <option value="za">z → a</option>
      <option value="aleatorio">aleatório</option>
    </select>
    <select class="mini" id="density" aria-label="Densidade dos cartões">
      <option value="padrao">padrão</option>
      <option value="compacto">compacto</option>
      <option value="capa">capa grande</option>
    </select>
    <button class="chip" type="button" id="shuffle">sortear ↻</button>
  </div>
  <div class="result-line"><span id="result-count">carregando…</span><span>favoritos: ♥ no canto da capa</span></div>
  <div class="game-grid" id="game-grid" aria-live="polite">
    <div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>
  </div>
  <div class="empty-state hide" id="empty"><span class="glyph">∅</span><p>nada encontrado com esse filtro.</p><button class="btn" type="button" onclick="location.href='jogos.html'">limpar filtros</button></div>
  <div class="load-more hide" id="load-more"><button class="btn" type="button">carregar mais</button></div>
  <div class="notice mt-4">
    <span class="g">!</span>
    <div><strong>sobre jogos de terceiros</strong>os títulos vêm de projetos públicos (GN-Math, DuckMath, BlogPaste, Mantle, BikeSense e outros) e podem sair do ar sem aviso. quando o site original recusa abrir dentro de outro, o player avisa e oferece abrir em nova aba ou pelo proxy.</div>
  </div>
</section>
`,
  extraJs: ['assets/js/data.js', 'assets/js/jogos.js']
});

/* ------------------------------------------------------------------ *
 * NAVEGAR
 * ------------------------------------------------------------------ */
const shortcuts = [
  ['Google', 'https://www.google.com/'],
  ['YouTube', 'https://www.youtube.com/'],
  ['Wikipedia', 'https://pt.wikipedia.org/'],
  ['Classroom', 'https://classroom.google.com/'],
  ['Duolingo', 'https://www.duolingo.com/'],
  ['Khan Academy', 'https://pt.khanacademy.org/']
];
page({
  file: 'navegar.html',
  title: 'navegar — múltiplo',
  desc: 'abra qualquer site por dentro do múltiplo com Scramjet e Ultraviolet, e use a lista de espelhos quando um site cair.',
  active: 'navegar.html',
  searchPlaceholder: 'navegar…',
  body: `
<section class="page-head wrap">
  <p class="eyebrow">proxy & espelhos</p>
  <h1>navegar</h1>
  <p class="lede">um proxy que roda no seu navegador, sem servidor próprio: escreva um endereço, abra dentro da página ou numa aba disfarçada. e, se um site estiver fora do ar, os espelhos estão logo abaixo.</p>
</section>

<section class="section wrap" id="proxy">
  <div class="proxy-card">
    <form class="proxy-form" id="proxy-form" autocomplete="off">
      <div class="proxy-url">
        <span class="scheme" aria-hidden="true">↗</span>
        <input id="proxy-url" type="text" inputmode="url" spellcheck="false" placeholder="exemplo.com" aria-label="Endereço para abrir" value="">
      </div>
      <div class="proxy-actions">
        <button class="btn btn--solid" id="proxy-embed" type="button">abrir aqui <span class="arr">↘</span></button>
        <button class="btn" id="proxy-cloak" type="button">abrir disfarçado ↗</button>
        <div class="grow"></div>
        <a class="proxy-note" href="proxy/index.html">abrir o navegador do proxy →</a>
      </div>
      <div class="row between">
        <div class="shortcuts" aria-label="Atalhos">
          ${shortcuts.map(([n, u]) => `<button class="shortcut" type="button" data-url="${u}"><b>→</b>${n}</button>`).join('')}
        </div>
        <span class="proxy-note">scramjet principal · ultraviolet reserva</span>
      </div>
    </form>
  </div>
  <div class="proxy-card mt-3" style="padding:clamp(1rem,3vw,1.6rem);display:flex;flex-wrap:wrap;gap:1rem;align-items:center;justify-content:space-between">
    <div style="display:grid;gap:.25rem">
      <span class="eyebrow">axiom</span>
      <h3 class="serif" style="font-size:1.6rem">navegador completo, dentro do site</h3>
      <p class="tiny" style="max-width:52ch">um navegador com abas, favoritos e o proxy já embutido. bom para quando o site é teimoso e você quer um ambiente inteiro à mão.</p>
    </div>
    <a class="btn btn--solid" href="axwork/index.html">abrir o axiom <span class="arr">↗</span></a>
  </div>
  <div class="steps mt-3">
    <div class="step"><span class="k">como funciona</span><h3>service worker</h3><p>o proxy registra um service worker em <span class="mono">/proxy/</span> e reescreve o tráfego do site aberto. tudo acontece na sua máquina — nenhuma página passa por um servidor nosso.</p></div>
    <div class="step"><span class="k">dois motores</span><h3>scramjet + uv</h3><p>o scramjet é o principal; o ultraviolet é o plano b. dá para alternar o transporte entre epoxy e libcurl se um servidor wisp cair.</p></div>
    <div class="step"><span class="k">backup</span><h3>seu próprio wisp</h3><p>a lista de servidores fica em <span class="mono">proxy/config.js</span>. para mais estabilidade, suba o backend que está em <span class="mono">proxy/backend-server.js</span>.</p></div>
  </div>
  <div class="notice mt-3"><span class="g">i</span><div><strong>o que esperar</strong>sites com login em outros domínios (Google, Microsoft) e serviços que exigem DRM podem não funcionar dentro do proxy. em caso de tela branca, tente o outro transporte ou o disfarce em nova aba.</div></div>
</section>

<section class="section wrap" id="mirrors">
  <div class="section-head">
    <div>
      <p class="eyebrow">espelhos</p>
      <h2 class="display">quando um cai, <em>outro sobe.</em></h2>
      <p class="lede">endereços alternativos de portais de jogos e estudos. cada cartão abre o primeiro espelho direto no proxy; a lista completa está na coleção.</p>
    </div>
    <a class="btn aside" href="links.html?cat=espelhos">todos os espelhos <span class="arr">↗</span></a>
  </div>
  <div class="mirror-grid" id="mirror-grid" hidden>
    <div class="skeleton" style="aspect-ratio:auto;height:110px"></div><div class="skeleton" style="aspect-ratio:auto;height:110px"></div><div class="skeleton" style="aspect-ratio:auto;height:110px"></div><div class="skeleton" style="aspect-ratio:auto;height:110px"></div>
  </div>
</section>

<section class="section wrap">
  <div class="section-head">
    <div>
      <p class="eyebrow">fora do proxy</p>
      <h2 class="display">caminhos que <em>sempre funcionam.</em></h2>
    </div>
  </div>
  <div class="editorial-list">
    <a class="editorial-row" href="https://www.google.com/search?q=" target="_blank" rel="noopener noreferrer"><span class="n">01</span><span class="t">pesquisar no google<small>a busca continua funcionando quando o resto cai.</small></span><span class="arrow">↗</span></a>
    <a class="editorial-row" href="https://pt.wikipedia.org/" target="_blank" rel="noopener noreferrer"><span class="n">02</span><span class="t">wikipédia<small>quase sempre liberada, e tem quase tudo.</small></span><span class="arrow">↗</span></a>
    <a class="editorial-row" href="https://classroom.google.com/" target="_blank" rel="noopener noreferrer"><span class="n">03</span><span class="t">google sala de aula<small>para lembrar que o trabalho não é só jogar.</small></span><span class="arrow">↗</span></a>
    <a class="editorial-row" href="estudar.html"><span class="n">04</span><span class="t">estudar aqui<small>quizzes com explicação, sem precisar de proxy.</small></span><span class="arrow">→</span></a>
  </div>
</section>
`,
  extraJs: ['assets/js/data.js', 'assets/js/pages.js']
});

/* ------------------------------------------------------------------ *
 * LINKS
 * ------------------------------------------------------------------ */
page({
  file: 'links.html',
  title: 'links — múltiplo',
  desc: links.total + ' links em ' + links.groups.length + ' coleções: jogos, estudos, filmes, unblockers e espelhos.',
  active: 'links.html',
  searchPlaceholder: 'buscar links…',
  body: `
<section class="page-head wrap">
  <p class="eyebrow">a coleção</p>
  <h1>links</h1>
  <p class="lede">${links.total.toLocaleString('pt-BR')} endereços em ${links.groups.length} coleções — jogos, estudos, filmes, unblockers e aquele monte de espelhos que circula por aí. busque, favorite, copie ou abra direto no proxy.</p>
  <div class="row mt-2">
    <button class="btn btn--solid" type="button" id="link-random">sortear um link <span class="arr">↗</span></button>
    <button class="btn" type="button" id="links-export">exportar favoritos</button>
    <span class="tiny">atalhos: <span class="kbd">g</span> <span class="kbd">l</span> volta pra cá de qualquer página.</span>
  </div>
</section>

<section class="section wrap" style="padding-top:1.3rem">
  <div class="toolbar" role="search">
    <label class="search-box" for="link-search">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.2"/><path d="m15.2 15.2 4.3 4.3"/></svg>
      <input id="link-search" type="search" placeholder="domínio, nome, tipo…" autocomplete="off" aria-label="Buscar links">
      <kbd>/</kbd>
    </label>
    <div class="chips" id="cat-chips" role="group" aria-label="Categorias"></div>
    <div class="chips" id="kind-chips" role="group" aria-label="Tipo"></div>
  </div>
  <div class="result-line"><span id="link-count">carregando…</span><span>♥ guarda nos favoritos · ⎘ copia · ◱ abre no proxy</span></div>
  <div class="link-index" id="link-index"></div>
  <div class="load-more" id="links-more"><button class="btn" type="button">ver mais coleções</button></div>
  <div class="notice mt-4"><span class="g">!</span><div><strong>links de terceiros</strong>a maior parte veio de projetos públicos e de colagens da comunidade. nada aqui é verificado um a um — se um endereço mudou de dono ou saiu do ar, é só ignorar. cuidado com dados pessoais em qualquer site que pedir login.</div></div>
</section>
`,
  extraJs: ['assets/js/data.js', 'assets/js/links.js']
});

/* ------------------------------------------------------------------ *
 * ESTUDAR
 * ------------------------------------------------------------------ */
page({
  file: 'estudar.html',
  title: 'estudar — múltiplo',
  desc: 'quizzes de matemática, português, ciências, história e geografia, cronômetro de foco e bloco de notas. tudo local, sem conta.',
  active: 'estudar.html',
  searchPlaceholder: 'estudar…',
  body: `
<section class="page-head wrap">
  <p class="eyebrow">sala de estudo</p>
  <h1>estudar</h1>
  <p class="lede">questões do 1º ano ao ensino médio, com explicação em cada resposta. do lado, cronômetro de foco, notas que ficam salvas e seu progresso — tudo neste navegador, sem conta.</p>
</section>

<section class="section wrap" style="padding-top:1.3rem">
  <div class="study-shell">
    <div class="stack">
      <div class="quiz-card" id="quiz-card">
        <div class="quiz-top">
          <div class="row" style="flex:1;min-width:0">
            <select class="mini" id="subject-select" aria-label="Matéria"></select>
            <select class="mini" id="grade-select" aria-label="Ano escolar"></select>
          </div>
          <div class="quiz-progress" id="quiz-progress" role="progressbar" aria-label="Progresso do quiz"></div>
          <span class="tiny num" id="quiz-counter">1 / 10</span>
        </div>
        <div class="quiz-body">
          <p class="mono muted" id="quiz-meta">—</p>
          <p class="quiz-q" id="quiz-q">carregando as perguntas…</p>
          <div class="quiz-options" id="quiz-options"></div>
          <div class="quiz-explain" id="quiz-explain" hidden></div>
        </div>
        <div class="quiz-foot">
          <button class="btn btn--ghost" type="button" id="quiz-skip">pular →</button>
          <div class="row">
            <button class="btn btn--ghost" type="button" id="quiz-restart">reiniciar ↻</button>
            <button class="btn btn--solid" type="button" id="quiz-next" hidden>próxima →</button>
          </div>
        </div>
      </div>

      <div class="side-card" style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem">
        <div><span class="tiny mono">acertos na sessão</span><div class="big serif" id="quiz-score">0</div></div>
        <div><span class="tiny mono">acertos diferentes</span><div class="big serif" id="quiz-progress-total">0</div></div>
        <div><span class="tiny mono">banco de questões</span><div class="big serif" id="quiz-total">—</div></div>
      </div>

      <div class="stack" style="gap:.5rem">
        <p class="eyebrow">buscar no conteúdo</p>
        <form id="study-search-form" class="search-box" style="max-width:none">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.2"/><path d="m15.2 15.2 4.3 4.3"/></svg>
          <input id="study-search" type="search" placeholder="frações, ângulos, plantas, crase…" aria-label="Buscar no conteúdo">
          <button class="btn btn--ghost" type="submit" style="padding:.2rem .4rem">ir</button>
        </form>
        <div id="study-results" class="editorial-list" aria-live="polite"><p class="tiny">pesquise uma palavra para achar questões e explicações.</p></div>
      </div>
    </div>

    <aside class="study-side" aria-label="ferramentas de estudo">
      <div class="side-card">
        <h3>foco</h3>
        <div class="timer-face" id="timer" aria-live="off">25:00</div>
        <div class="row">
          <select class="mini" id="timer-duration" aria-label="Duração">
            <option value="25">25 min</option>
            <option value="15">15 min</option>
            <option value="5">5 min</option>
            <option value="45">45 min</option>
          </select>
          <button class="btn" type="button" id="timer-toggle" style="flex:1;justify-content:center">começar</button>
        </div>
        <p class="tiny" id="timer-status" role="status">o cronômetro não é salvo ao fechar a página.</p>
      </div>
      <div class="side-card">
        <h3>notas</h3>
        <textarea class="notes-area" id="notes" maxlength="8000" placeholder="o que você quer lembrar hoje?"></textarea>
        <p class="tiny" id="notes-status" role="status">salvo só neste navegador ♡</p>
      </div>
      <div class="side-card">
        <h3>progresso</h3>
        <p class="tiny">o site lembra quais questões você já acertou — cada uma conta uma vez.</p>
        <button class="btn" type="button" id="progress-reset" style="justify-content:center">limpar progresso</button>
      </div>
      <div class="side-card">
        <h3>de onde vem</h3>
        <p class="tiny">o banco de perguntas é adaptado do StudyHub (LuminSDK) e dos quizzes do links for me, com autoria de Ryan Smith. licença MIT.</p>
        <a class="btn btn--ghost" href="creditos.html">créditos <span class="arr">↗</span></a>
      </div>
    </aside>
  </div>
</section>
`,
  extraJs: ['assets/js/data.js', 'data/questions.js', 'assets/js/estudar.js']
});

/* ------------------------------------------------------------------ *
 * CRÉDITOS
 * ------------------------------------------------------------------ */
page({
  file: 'creditos.html',
  title: 'créditos — múltiplo',
  desc: 'as fontes, autores e licenças de tudo que aparece no múltiplo.',
  active: 'creditos.html',
  searchPlaceholder: 'créditos…',
  body: `
<section class="page-head wrap">
  <p class="eyebrow">de onde vem tudo isso</p>
  <h1>créditos</h1>
  <p class="lede">nada aqui foi inventado do zero: cada catálogo, link e pergunta tem gente por trás. esta página é o agradecimento e a lista de fontes.</p>
  <div class="stats-row" style="max-width:860px">
    <div class="stat"><strong id="credit-games">—</strong><span>jogos catalogados</span></div>
    <div class="stat"><strong id="credit-local">—</strong><span>jogos no site</span></div>
    <div class="stat"><strong id="credit-links">—</strong><span>links</span></div>
    <div class="stat"><strong id="credit-groups">—</strong><span>coleções</span></div>
  </div>
</section>

<section class="section wrap">
  <div class="section-head"><div><p class="eyebrow">os de sempre</p><h2 class="display">seus próprios <em>projetos.</em></h2></div></div>
  <div class="credit-list">
    <div class="credit-row">
      <h3>Links · links for me</h3>
      <div class="body">
        <p>a coleção pessoal que virou base da aba de links: jogos, estudos, filmes, temas, o modo de estudos com o atalho “obrigado, ryan” e o cursor com anel de atraso que este site usa como referência. muitos links têm crédito ao <a href="https://github.com/ByePassHub" target="_blank" rel="noopener noreferrer">ByePassHub</a>.</p>
        <div class="credit-tags"><span>coleção</span><span>temas</span><span>cursor</span><span>quizzes</span></div>
      </div>
    </div>
    <div class="credit-row">
      <h3>estudo escolar</h3>
      <div class="body">
        <p>o catálogo de jogos (GN-Math, DuckMath, BlogPaste, Drive U-7, BikeSense, P2P, Mantle), o proxy com Scramjet + Ultraviolet, o backend WISP opcional e a página de portais e mirrors.</p>
        <div class="credit-tags"><span>catálogo</span><span>proxy</span><span>mirrors</span></div>
      </div>
    </div>
    <div class="credit-row">
      <h3>Nebula</h3>
      <div class="body">
        <p>os ${localGames} jogos que rodam dentro do site e suas capas vieram do Nebula, que por sua vez organiza material de Onex558 (uranium-source e retro-games) com o apoio do UGS. sem o Nebula, a seção “roda aqui dentro” não existiria.</p>
        <div class="credit-tags"><span>Onex558</span><span>UGS</span><span>retro-games</span></div>
      </div>
    </div>
    <div class="credit-row">
      <h3>LuminSDK</h3>
      <div class="body">
        <p>o acervo do GN-Math, o diretório de sites em famílias e o banco de questões do StudyHub, de autoria de Ryan Smith, sob licença MIT.</p>
        <div class="credit-tags"><span>studyhub</span><span>gn-math</span><span>MIT</span></div>
      </div>
    </div>
    <div class="credit-row">
      <h3>Axiom</h3>
      <div class="body">
        <p>o navegador completo que abre em <span class="mono">/axwork/</span>, com proxy embutido e uma lista própria de servidores WISP.</p>
        <div class="credit-tags"><span>navegador</span><span>wisp</span></div>
      </div>
    </div>
    <div class="credit-row">
      <h3>Mantle · Mineral</h3>
      <div class="body">
        <p>menu Mantle de dobberr e o projeto Horizon (Minecraft Java via Rust + WebAssembly + WebGPU), além dos mirrors oficiais pages.dev e workers.dev.</p>
        <div class="credit-tags"><span>dobberr</span><span>horizon</span></div>
      </div>
    </div>
    <div class="credit-row">
      <h3>noahstutoring.com</h3>
      <div class="body">
        <p>o domínio dos estudos do Mantle — hoje é a vitrine do projeto e continua citado nos créditos originais do menu, junto de noahstutoring.academy.</p>
        <div class="credit-tags"><span>mantle</span><span>espelhos</span></div>
      </div>
    </div>
    <div class="credit-row">
      <h3>classlink.online · kiwi</h3>
      <div class="body">
        <p>a ideia de esconder o site atrás de uma cara de sala de aula veio daqui: o kiwi abre dentro de um invólucro discreto, como se fosse o Google Sala de Aula. este site faz parecido com o disfarce de aba (shift + a + y).</p>
        <div class="credit-tags"><span>dispersão</span><span>aulas</span></div>
      </div>
    </div>
  </div>
</section>

<section class="section wrap">
  <div class="section-head">
    <div><p class="eyebrow">por quantidade</p><h2 class="display">quem mandou <em>mais links.</em></h2><p class="lede">somando as coleções por origem declarada. quem mandou uma leva de espelhos entra como “colagem da comunidade”.</p></div>
    <a class="btn aside" href="links.html">ver a coleção <span class="arr">↗</span></a>
  </div>
  <div class="editorial-list" id="credit-sources"><p class="tiny">calculando…</p></div>
</section>

<section class="section wrap">
  <div class="section-head"><div><p class="eyebrow">licenças & ferramentas</p><h2 class="display">o que sustenta <em>o resto.</em></h2></div></div>
  <div class="credit-list">
    <div class="credit-row">
      <h3>fontes</h3>
      <div class="body"><p><a href="https://rsms.me/inter/" target="_blank" rel="noopener noreferrer">Inter</a> (Rasmus Andersson, SIL OFL), <a href="https://fonts.google.com/specimen/Instrument+Serif" target="_blank" rel="noopener noreferrer">Instrument Serif</a> (Rodrigo Fuenzalida, SIL OFL) e <a href="https://www.jetbrains.com/lp/mono/" target="_blank" rel="noopener noreferrer">JetBrains Mono</a> (JetBrains, SIL OFL). arquivos servidos localmente, sem CDN de fontes.</p><div class="credit-tags"><span>OFL</span><span>local</span></div></div>
    </div>
    <div class="credit-row">
      <h3>proxy</h3>
      <div class="body"><p><a href="https://github.com/MercuryWorkshop/scramjet" target="_blank" rel="noopener noreferrer">Scramjet</a> e <a href="https://github.com/titaniumnetwork-dev/Ultraviolet" target="_blank" rel="noopener noreferrer">Ultraviolet</a> (Mercury Workshop / Titanium Network), <a href="https://github.com/MercuryWorkshop/bare-mux" target="_blank" rel="noopener noreferrer">BareMux</a> e o transporte Epoxy, com WISP público de wisp.mercurywork.shop.</p><div class="credit-tags"><span>AGPL</span><span>WISP</span></div></div>
    </div>
    <div class="credit-row">
      <h3>catálogos de jogos</h3>
      <div class="body"><p>GN-Math (genizy, breadbb e comunidade, mirrors Why2ITry), DuckMath (Maddox e equipe), BlogPaste / Night.Games, Drive U-7, BikeSense / Achroma, Ported2Browser e os espelhos em jsDelivr, esm.sh, githack e statically.</p><div class="credit-tags"><span>gn-math</span><span>duckmath</span><span>p2b</span></div></div>
    </div>
    <div class="credit-row">
      <h3>imagens</h3>
      <div class="body"><p>as capas dos jogos vêm dos próprios projetos de origem e são usadas como referência visual para identificar o título. as marcas e artes pertencem a seus donos; se algo precisar sair, é só pedir no repositório.</p><div class="credit-tags"><span>referência</span><span>fair use</span></div></div>
    </div>
    <div class="credit-row">
      <h3>este site</h3>
      <div class="body"><p>html, css e javascript sem framework, sem build e sem dependências em tempo de execução. os scripts de manutenção ficam em <span class="mono">tools/</span>. sem contas, sem analytics, sem cookies — só preferências salvas no seu navegador.</p><div class="credit-tags"><span>estático</span><span>github pages</span><span>sem rastreio</span></div></div>
    </div>
  </div>
  <div class="notice mt-4"><span class="g">♡</span><div><strong>e um obrigado especial</strong>a quem mantém todos esses catálogos de graça, no tempo livre. se um dia este site crescer, a primeira coisa que ele deve fazer é devolver o crédito — como está fazendo agora.</div></div>
</section>
`,
  extraJs: ['assets/js/data.js', 'assets/js/pages.js']
});

/* ------------------------------------------------------------------ *
 * PLAYER (sem cabeçalho/rodapé normais)
 * ------------------------------------------------------------------ */
const player = `<!doctype html>
<html lang="pt-BR" data-theme="tinta">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>jogar — múltiplo</title>
<meta name="description" content="player do múltiplo">
<meta name="robots" content="noindex">
<meta name="theme-color" content="#0a0a0a">
<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
<link rel="preload" href="assets/fonts/inter-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/css/site.css">
<script src="assets/js/core.js"></script>
<script>/* alguns jogos portados do Game Stash chamam a API de anúncios do host original; aqui vira no-op */window.maeExportApis_=function(){};window.maeExportApis=window.maeExportApis_;</script>
<script defer src="assets/js/data.js"></script>
<script defer src="assets/js/jogar.js"></script>
</head>
<body class="player-shell">
<div class="grain" aria-hidden="true"></div>
<header class="player-bar">
  <a class="icon-btn" href="jogos.html" aria-label="voltar aos jogos" title="voltar aos jogos">←</a>
  <img id="game-thumb" alt="" style="width:26px;height:26px;object-fit:cover;border-radius:2px;border:1px solid var(--line)" onerror="this.remove()">
  <span class="name" id="game-name">carregando…</span>
  <span class="sep" aria-hidden="true">/</span>
  <span class="tiny mono" id="game-src"></span>
  <span class="sp"></span>
  <span class="tiny mono nowrap" style="display:none" id="hide-mobile">espelho <b id="mirror-idx">1</b></span>
  <button class="tbtn" type="button" id="next-mirror" title="trocar espelho (r)">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h13l-3-3M20 16H7l3 3"/></svg><span>espelho</span></button>
  <button class="tbtn" type="button" id="spot-search" title="procurar na coleção">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 4.2 4.2"/></svg><span>coleção</span></button>
  <button class="tbtn fav-toggle" type="button" id="fav-toggle" aria-pressed="false" title="favoritar" aria-label="favoritar este jogo">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7-4.4-7-9.3A4.1 4.1 0 0 1 12 7a4.1 4.1 0 0 1 7 3.7C19 15.6 12 20 12 20z"/></svg></button>
  <button class="tbtn" type="button" id="copy-link" title="copiar link" aria-label="copiar link">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><rect x="8" y="8" width="11" height="12" rx="1.5"/><path d="M5 15V5a1 1 0 0 1 1-1h8"/></svg></button>
  <button class="tbtn" type="button" id="fs" title="tela cheia (f)" aria-label="tela cheia">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></button>
</header>
<main class="player-stage" id="stage">
  <div class="player-loading" id="loading"><div class="loader"></div><span>abrindo o jogo…</span></div>
  <iframe id="frame" title="jogo" allow="fullscreen; gamepad; autoplay; clipboard-read; clipboard-write; pointer-lock" allowfullscreen referrerpolicy="no-referrer"></iframe>
  <div class="player-error" id="error" hidden></div>
</main>
</body>
</html>
`;
fs.writeFileSync(path.join(ROOT, 'jogar.html'), player);
console.log('· jogar.html', (player.length / 1024).toFixed(0) + ' KB');
