/* ==========================================================================
   múltiplo — camada de dados
   catálogos estáticos, expansão de espelhos e thumbnails locais.
   ========================================================================== */
(function () {
  'use strict';

  const CDN = {
    jsd: [
      'https://cdn.jsdelivr.net/gh/',
      'https://fastly.jsdelivr.net/gh/',
      'https://gcore.jsdelivr.net/gh/',
      'https://testingcf.jsdelivr.net/gh/'
    ],
    gnHtml: 'freebuisness/html@main/',
    gnCover: 'freebuisness/covers@main/',
    ugs: 'bubbls/ugs-singlefile@main/UGS-Files/',
    urn: 'Onex558/uranium-source-@main/',
    dmImg: 'mathlesson/mathlesson.github.io@main/',
    dm1: [
      'https://d1pgfzxl8xljfg.cloudfront.net/',
      'https://dosl6rc74a8u6.cloudfront.net/',
      'https://d1wnrmoe2jrw0g.cloudfront.net/',
      'https://dmg-db.pages.dev/',
      'https://math-a1.b-cdn.net/',
      'https://science-v1.b-cdn.net/',
      'https://uni-class.b-cdn.net/',
      'https://db.duckmath.org/'
    ],
    dm2: [
      'https://d1b8zsan60tues.cloudfront.net/',
      'https://d1imv5hmyw4kfp.cloudfront.net/',
      'https://d139khpwsw1rlp.cloudfront.net/',
      'https://db2.mathevolve.com/',
      'https://db2.duckmath.org/',
      'https://db2.englishteachepro.com/',
      'https://db2.statisticscontest.com/'
    ]
  };

  /* Mirrors confirmados com estrutura compatível: mantemos o mesmo caminho
     do jogo e só trocamos a origem. Evitamos inventar URLs para hosts que não
     são cópias do mesmo catálogo. */
  const SITE_MIRRORS = {
    bikesense: [
      'https://aokjezxu6bq.map.azionedge.net/',
      'https://2rimjouwuyw.map.azionedge.net/',
      'https://d1yd3j8ypn4f12.cloudfront.net/',
      'https://d2md2bc53t43kn.cloudfront.net/',
      'https://d3uzrhklzdl2e5.cloudfront.net/',
      'https://dz2z1x7nmgnek.cloudfront.net/',
      'https://d3acwuwzmsce84.cloudfront.net/',
      'https://2bkyzwcgwsq.map.azionedge.net/',
      'https://hk1mobtpluy.map.azionedge.net/',
      'https://kjfexwdq6eg.map.azionedge.net/',
      'https://judg0kzqjeu.map.azionedge.net/'
    ]
  };

  const cache = new Map();
  async function getJSON(url) {
    if (cache.has(url)) return cache.get(url);
    const p = fetch(url, { cache: 'no-cache' }).then(r => {
      if (!r.ok) throw new Error(url + ': ' + r.status);
      return r.json();
    });
    cache.set(url, p);
    return p;
  }

  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  const encPath = p => p.split('/').map(encodeURIComponent).join('/');

  const data = {
    games: null,
    links: null,
    thumbs: {},
    questions: null,

    async loadGames() {
      if (!data.games) data.games = await getJSON('data/games.json');
      return data.games;
    },
    async loadLinks() {
      if (!data.links) data.links = await getJSON('data/links.json');
      return data.links;
    },
    async loadThumbs() {
      try { data.thumbs = await getJSON('data/thumbs.json'); } catch (_) { data.thumbs = {}; }
      return data.thumbs;
    },
    async fingerprints() {
      if (data.thumbs && Object.keys(data.thumbs).length) return data.thumbs;
      return data.loadThumbs();
    },

    /* URL de capa: thumbnail local primeiro; depois o CDN de onde veio */
    coverFor(game) {
      const key = norm(game.n);
      if (data.thumbs[key]) return 'assets/img/thumbs/' + data.thumbs[key];
      const c = game.c || '';
      if (!c) return '';
      if (c.startsWith('{GN_COVER}/')) return CDN.jsd[0] + CDN.gnCover + encPath(c.slice(11));
      if (c.startsWith('{DM_IMG}/')) return CDN.jsd[0] + CDN.dmImg + encPath(c.slice(9));
      if (c.startsWith('{URN}/')) return CDN.jsd[0] + CDN.urn + encPath(c.slice(6));
      if (/^https?:/.test(c)) return c;
      return '';
    },

    /* candidatos de URL de jogo, na ordem de preferência */
    candidates(game) {
      const u = game.u || (game.f ? game.f : '');
      if (!u) return [];
      if (game.f) return [game.f];
      if (/^https?:/i.test(u)) {
        const out = [u];
        /* GitHub-backed jsDelivr games can use the same exact file through
           alternate CDN edges; this is a true transport mirror. */
        const jsdPath = u.match(/^https:\/\/cdn\.jsdelivr\.net\/gh\/([^?#]+)([?#].*)?$/i);
        if (jsdPath) {
          for (const base of CDN.jsd.slice(1)) {
            const candidate = base + jsdPath[1] + (jsdPath[2] || '');
            if (!out.includes(candidate)) out.push(candidate);
          }
        }
        try {
          const parsed = new URL(u);
          const mirrors = game.group === 'bikesense' || /(^|\.)bikesense\.org$/i.test(parsed.hostname) ? SITE_MIRRORS.bikesense : [];
          if (mirrors.length) {
            const tail = parsed.pathname.replace(/^\//, '') + parsed.search + parsed.hash;
            for (const base of mirrors) {
              const candidate = base + tail;
              if (!out.includes(candidate)) out.push(candidate);
            }
          }
        } catch (_) { /* endereço bruto; o player exibirá erro ao carregar */ }
        return out;
      }
      const out = [];
      const add = (base, file) => { const url = base + encPath(file); if (!out.includes(url)) out.push(url); };
      if (u.startsWith('{GN_HTML}/')) {
        const file = u.slice(10);
        for (const b of CDN.jsd) add(b + CDN.gnHtml, file);
      } else if (u.startsWith('{UGS}/')) {
        const file = u.slice(6);
        for (const b of CDN.jsd) add(b + CDN.ugs, file);
      } else if (u.startsWith('{URN}/')) {
        const file = u.slice(6);
        for (const b of CDN.jsd) add(b + CDN.urn, file);
      } else if (u.startsWith('{DM1}/')) {
        const rest = u.slice(6);
        for (const b of CDN.dm1) add(b, rest);
      } else if (u.startsWith('{DM2}/')) {
        const rest = u.slice(6);
        for (const b of CDN.dm2) add(b, rest);
      }
      return out.slice(0, 6);
    },

    groupOf(games, id) {
      return (games.groups.find(g => g.id === id) || { games: [] }).games;
    },

    all(games) {
      const out = [];
      for (const g of games.groups) for (const e of g.games) out.push({ ...e, group: g.id });
      return out;
    },

    async loadQuestions() {
      if (window.MULTIPLO_QUESTIONS) return window.MULTIPLO_QUESTIONS;
      await new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = 'data/questions.js';
        s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
      });
      return window.MULTIPLO_QUESTIONS || [];
    },

    async loadMirrorGroups() {
      const db = await data.loadLinks();
      return db.groups.filter(g => g.cat === 'espelhos');
    },

    CDN, norm
  };

  window.MultiploData = data;
})();
