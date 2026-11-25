#!/usr/bin/env node
/*
 * build-data.mjs — regenera os catálogos estáticos do múltiplo.
 *
 * Uso:
 *   node tools/build-data.mjs --src /caminho/com/repos
 *
 * O diretório --src deve conter os checkouts/clones de:
 *   estudoescolar/   (data/games.json, data/mirrors.json)
 *   Nebula/          (app.js, images/, games/)
 *   Links/           (assets/links.js, assets/unblockers.js)
 *   LuminSDK/        (assets/data/sites.json)
 *
 * Nada aqui roda no navegador: os arquivos gerados em /data são servidos
 * como estão pelo GitHub Pages.
 */
import fs from 'node:fs';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const ROOT = path.resolve(HERE, '..');
const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const SRC = path.resolve(arg('--src', path.join(ROOT, '..')));
const read = p => fs.readFileSync(p, 'utf8');
const writeJSON = (p, v) => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(v));
  console.log('·', path.relative(ROOT, p), (JSON.stringify(v).length / 1024).toFixed(0) + ' KB');
};

/* ------------------------------------------------------------------ *
 * 1. Jogos — junta o catálogo do estudoescolar com os jogos que rodam
 *    dentro do próprio site (Nebula). Uma entrada por nome.
 * ------------------------------------------------------------------ */
function buildGames() {
  const source = path.join(SRC, 'estudoescolar', 'data', 'games.json');
  const raw = JSON.parse(read(source));
  const byName = new Map();
  for (const g of raw) {
    const key = String(g.n || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
    if (!key) continue;
    const prev = byName.get(key);
    if (!prev || (g.p || 0) > (prev.p || 0)) byName.set(key, g);
  }
  const groups = [
    { id: 'no-site', name: 'No site', note: 'Rodam aqui dentro, sem sair da página.' },
    { id: 'mantle', name: 'Mantle', note: 'Menu Mantle — projetos no navegador.' },
    { id: 'gn-math', name: 'GN-Math', note: 'Ports de PC, clássicos Flash e emuladores.' },
    { id: 'duckmath', name: 'DuckMath', note: 'Foco em Chromebooks e jogos leves.' },
    { id: 'night', name: 'BlogPaste', note: 'Night.Games — acervo variado.' },
    { id: 'driveu7', name: 'Drive U-7', note: 'Unblocked Games G+.' },
    { id: 'bikesense', name: 'BikeSense', note: 'Achroma — muita coisa em um só lugar.' },
    { id: 'p2p', name: 'P2P', note: 'Ported2Browser e conversões de PC.' },
  ];
  const out = Object.fromEntries(groups.map(g => [g.id, []]));
  for (const g of byName.values()) {
    const src0 = Array.isArray(g.s) && g.s.length ? g.s[0] : '';
    const id = groups.some(x => x.id === src0) ? src0 : '';
    if (!id) continue;
    const entry = { n: g.n, u: g.u, m: g.m === 'iframe' ? 'i' : 'h' };
    if (g.c) entry.c = g.c;
    if (g.a) entry.a = g.a;
    if (g.al) entry.al = g.al;
    if (g.d) entry.d = g.d;
    if (Array.isArray(g.k) && g.k.length) entry.k = g.k;
    out[id].push(entry);
  }
  for (const id of Object.keys(out)) out[id].sort((a, b) => a.n.localeCompare(b.n, 'pt-BR'));

  /* Jogos locais (Nebula) — 26 arquivos que moram no repositório. */
  const nebulaSrc = read(path.join(SRC, 'Nebula', 'app.js'));
  const start = nebulaSrc.indexOf('const GAMES = [');
  let s = nebulaSrc.indexOf('[', start), depth = 0, j = s;
  for (; j < nebulaSrc.length; j++) {
    if (nebulaSrc[j] === '[') depth++;
    else if (nebulaSrc[j] === ']' && --depth === 0) break;
  }
  const I = 'images/', REF = 'images/', GN1 = 'GN1:', GN2 = 'GN2:', DUCK = 'DUCK';
  const list = eval('(' + nebulaSrc.slice(s, j + 1) + ')');
  const local = [];
  const external = [];
  const localGamesDir = path.join(ROOT, 'play', 'games');
  for (const item of list) {
    const [name, cover, play] = item;
    if (!play || !(play.startsWith('u:') || play.startsWith('r:'))) continue;
    const folder = play.startsWith('u:') ? 'uranium' : 'retro';
    const file = play.slice(2);
    const from = path.join(SRC, 'Nebula', 'games', folder, file);
    if (!fs.existsSync(from)) continue;
    fs.mkdirSync(localGamesDir, { recursive: true });
    const to = path.join(localGamesDir, file);
    fs.copyFileSync(from, to);
    /* botão flutuante para voltar ao múltiplo, injetado em cada jogo local */
    const back = '<style id="multiplo-player-back">#mpl-back{position:fixed;left:10px;bottom:10px;z-index:2147483000;font:600 11px/1 ui-monospace,monospace;letter-spacing:.08em;text-transform:uppercase;color:#f3f1ea;background:rgba(10,10,10,.82);border:1px solid rgba(243,241,234,.35);border-radius:3px;padding:7px 9px;text-decoration:none;backdrop-filter:blur(6px)}#mpl-back:hover{background:#f3f1ea;color:#0a0a0a}</style><a id="mpl-back" href="../../jogos.html" target="_top">← múltiplo</a>';
    let html = fs.readFileSync(to, 'utf8');
    if (!html.includes('multiplo-player-back')) {
      const i = html.toLowerCase().lastIndexOf('</body>');
      html = i > -1 ? html.slice(0, i) + back + html.slice(i) : html + back;
      fs.writeFileSync(to, html);
    }
    const thumb = cover ? path.basename(cover) : '';
    local.push({ n: name, f: "play/games/" + file, c: thumb });
  }
  for (const item of list) if (item[2] === 'w') external.push({ name: item[0] });
  out['no-site'] = local;

  fs.writeFileSync(path.join(ROOT, 'tools', 'sources', 'nebula-web.json'), JSON.stringify(external, null, 0));
  const data = {
    v: 1,
    updated: new Date().toISOString().slice(0, 10),
    groups: groups.map(g => ({ ...g, count: out[g.id].length, games: out[g.id] })),
  };
  writeJSON(path.join(ROOT, 'data', 'games.json'), data);
  console.log('  jogos:', Object.values(out).reduce((a, b) => a + b.length, 0));
}

/* ------------------------------------------------------------------ *
 * 2. Links — coleção pessoal (Links), portais/mirrors (estudoescolar)
 *    e diretório de sites (LuminSDK). Tudo vira uma lista só.
 * ------------------------------------------------------------------ */
function buildLinks() {
  const groups = [];

  /* 2a. coleção pessoal */
  const linksSrc = read(path.join(SRC, 'Links', 'assets', 'links.js'));
  const m = linksSrc.match(/const LINK_GROUPS = (\[[\s\S]*?\n\]);/);
  const collection = eval(m[1]);
  const unblockersSrc = read(path.join(SRC, 'Links', 'assets', 'unblockers.js'));
  const unblockers = new Set([...unblockersSrc.matchAll(/'([^']+\|[^']+)'/g)].map(x => x[1]));
  for (const g of collection) {
    const urls = [...new Set(g.links.split('\n').map(l => l.trim()).filter(Boolean))];
    groups.push({
      name: g.name,
      cat: g.category === 'Jogos' ? 'jogos' : g.category === 'Estudos' ? 'estudos' : 'midia',
      kind: unblockers.has(g.category + '|' + g.name) ? 'unblocker' : 'site',
      credit: 'Links',
      links: urls.map(u => ({ u })),
    });
  }

  /* 2b. portais + mirrors */
  const mirrors = JSON.parse(read(path.join(SRC, 'estudoescolar', 'data', 'mirrors.json')));
  for (const p of mirrors.portals || []) {
    groups.push({
      name: p.name,
      cat: 'espelhos',
      kind: 'mirror',
      credit: p.credit || '',
      note: p.description || '',
      links: (p.mirrors || []).map(x => ({ n: x.label, u: x.url })),
    });
  }

  /* 2c. diretório de sites (famílias do LuminSDK) */
  const sites = JSON.parse(read(path.join(SRC, 'LuminSDK', 'assets', 'data', 'sites.json')));
  const label = { jogos: 'jogos', estudo: 'estudos', pacotes: 'espelhos' };
  for (const f of sites.families || []) {
    groups.push({
      name: f.name,
      cat: label[f.cat] || 'estudos',
      kind: f.cat === 'jogos' ? 'site' : 'mirror',
      credit: f.name === 'gn-math' ? 'GN-Math · freebuisness' : '',
      links: (f.sites || []).map(x => ({ n: x.name, u: x.url })).filter(x => x.u),
    });
  }

  const counts = {};
  let total = 0;
  for (const g of groups) {
    counts[g.cat] = (counts[g.cat] || 0) + g.links.length;
    total += g.links.length;
  }
  writeJSON(path.join(ROOT, 'data', 'links.json'), {
    v: 1,
    updated: new Date().toISOString().slice(0, 10),
    total,
    counts,
    groups,
  });
  console.log('  links:', total);
}

/* ------------------------------------------------------------------ *
 * 3. Perguntas — banco do StudyHub (LuminSDK) + quizzes do Links.
 * ------------------------------------------------------------------ */
function buildQuestions() {
  const out = [];
  const studySrc = read(path.join(SRC, 'LuminSDK', 'assets', 'js', 'study-questions.js'));
  const arrSrc = studySrc.slice(studySrc.indexOf('STUDY_QUESTIONS = ') + 18).replace(/;\s*$/, '');
  const list = eval(arrSrc);
  for (const q of list) out.push({ s: q[0], m: q[1], q: q[2], o: q[3], a: q[4], e: q[5] });

  const linksStudy = read(path.join(SRC, 'Links', 'assets', 'study.js'));
  const bankStart = linksStudy.indexOf('const studyQuestions = {');
  const end = linksStudy.indexOf('\n};', bankStart);
  if (bankStart > -1 && end > -1) {
    const bankSrc = linksStudy.slice(bankStart + 'const studyQuestions ='.length, end + 2);
    const bank = eval('(' + bankSrc + ')');
    const grade = {
      '1º ano': '1', '2º ano': '2', '3º ano': '3', '4º ano': '4', '5º ano': '5',
      '6º ano': '6', '7º ano': '7', '8º ano': '8', '9º ano': '9',
      '1ª série do ensino médio': 'em1', '2ª série do ensino médio': 'em2', '3ª série do ensino médio': 'em3'
    };
    for (const [g, qs] of Object.entries(bank)) {
      for (const q of qs) {
        out.push({ s: grade[g] || g, m: 'matematica', q: q[0], o: q[1], a: q[2], e: q[3] });
      }
    }
  }
  const js = '/* Gerado por tools/build-data.mjs — não edite à mão. */\nwindow.MULTIPLO_QUESTIONS = ' + JSON.stringify(out) + ';\n';
  fs.writeFileSync(path.join(ROOT, 'data', 'questions.js'), js);
  console.log('· data/questions.js', (js.length / 1024).toFixed(0) + ' KB', '(' + out.length + ' perguntas)');
}

const which = arg('--only', '');
if (!which || which === 'games') buildGames();
if (!which || which === 'links') buildLinks();
if (!which || which === 'questions') buildQuestions();
