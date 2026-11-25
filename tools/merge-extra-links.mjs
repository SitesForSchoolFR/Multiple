#!/usr/bin/env node
/*
 * merge-extra-links.mjs
 * Lê tools/sources/links-extra.txt, extrai TODAS as URLs (ignorando nomes,
 * datas, horas e mensagens) e agrupa por marca/domínio. Atualiza
 * data/links.json somando os grupos novos sem duplicar endereços.
 */
import fs from 'node:fs';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const ROOT = path.resolve(HERE, '..');
const SRC = path.join(ROOT, 'tools', 'sources', 'links-extra.txt');
const OUT = path.join(ROOT, 'data', 'links.json');

const raw = fs.readFileSync(SRC, 'utf8');
const urls = [...raw.matchAll(/https?:\/\/[^\s<>"'`)\]]+/g)].map(m => m[0].replace(/[.,;]+$/, ''));
/* URLs quebradas na colagem: "…adcsapem.com.arhttps//au…" e "…/ https://…" */
const cleaned = [];
for (const u of urls) {
  const parts = u.split(/(?=https?:\/\/)/);
  for (const p of parts) if (/^https?:\/\/[^/]+/.test(p)) cleaned.push(p);
}
const unique = [...new Set(cleaned)];

const host = u => { try { return new URL(u).hostname.toLowerCase(); } catch { return ''; } };
const isSvg = u => /\.svg(\?|$)/i.test(u);

/* regras em ordem: a primeira que casar define o grupo */
const rules = [
  { name: 'Securly · disfarces', kind: 'unblocker', cat: 'unblockers', test: h => /^securly\d?\./.test(h) },
  { name: 'GoGuardian · disfarces', kind: 'unblocker', cat: 'unblockers', test: h => /^goguardian\d?\./.test(h) },
  { name: 'ContentKeeper · disfarces', kind: 'unblocker', cat: 'unblockers', test: h => /^contentkeeper\d?\./.test(h) },
  { name: 'tb2.net', kind: 'site', cat: 'unblockers', test: h => h === 'tb2.net' || h.endsWith('.tb2.net') },
  { name: 'born2host', kind: 'site', cat: 'unblockers', test: h => h.endsWith('.born2host.com') },
  { name: '1776arms', kind: 'site', cat: 'unblockers', test: h => h.endsWith('.1776arms.com') },
  { name: 'myapl', kind: 'site', cat: 'unblockers', test: h => h.endsWith('.myapl.org') },
  { name: 'tbt.mx · lote mega', kind: 'site', cat: 'unblockers', test: h => h.endsWith('.tbt.mx') },
  { name: 'mega · 5 espelhos por domínio', kind: 'mirror', cat: 'espelhos', test: h => /^mega\d?\./.test(h) },
  { name: 'G2G (asia, my)', kind: 'site', cat: 'unblockers', test: h => h.endsWith('.g2g.asia') || h.endsWith('.g2g.my') },
  { name: 'corea.is', kind: 'site', cat: 'unblockers', test: h => h.endsWith('.corea.is') },
  { name: 'vampi.info', kind: 'site', cat: 'unblockers', test: h => h.endsWith('.vampi.info') },
  { name: 'janroe', kind: 'site', cat: 'unblockers', test: h => h.endsWith('.janroe.org') },
  { name: 'level10 · oldquad · mort11', kind: 'site', cat: 'unblockers', test: h => /(level10\.org|oldquad\.org|mort11\.org)$/.test(h) },
  { name: 'numerados · 0 a 100', kind: 'site', cat: 'unblockers', test: (h, u) => /^https?:\/\/(\d{1,3})\./.test(u) },
  { name: 'china.is · japan.is · tiger.ar', kind: 'site', cat: 'unblockers', test: h => /\.(china\.is|japan\.is|tiger\.ar)$/.test(h) },
  { name: 'anko · meowd · sunny (estudante)', kind: 'site', cat: 'unblockers', test: h => /(anko\.rest|anko\.lol|meowd\.rest|sunny\.lat)$/.test(h) },
  { name: 'silksky · espelhos', kind: 'site', cat: 'unblockers', test: h => h.endsWith('silksky.com') },
  { name: 'zodiac', kind: 'site', cat: 'unblockers', test: (h, u) => /\bzodiac/i.test(u) },
  { name: 'milky', kind: 'site', cat: 'unblockers', test: (h, u) => /\bmilky/i.test(u) },
  { name: 'ivy', kind: 'site', cat: 'unblockers', test: (h, u) => /\bivy/i.test(u) },
  { name: 'bull', kind: 'site', cat: 'unblockers', test: (h, u) => /bull/i.test(u) },
  { name: 'cherri · cherry', kind: 'site', cat: 'unblockers', test: (h, u) => /cherri/i.test(u) },
  { name: 'DogeUB · Doge', kind: 'site', cat: 'unblockers', test: (h, u) => /doge/i.test(u) },
  { name: 'Chillzone · Luminal', kind: 'site', cat: 'unblockers', test: (h, u) => /(chillzone|luminal|chilling)/i.test(u) },
  { name: 'Windows Azure · z*.web.core.windows.net', kind: 'site', cat: 'unblockers', test: h => h.endsWith('.web.core.windows.net') },
  { name: 'Amazon S3 · bullsobk / bullpxbk', kind: 'mirror', cat: 'espelhos', test: h => /(amazonaws\.com|bullsobk|bullpxbk)/i.test(h) },
  { name: 'ícones SVG (jsDelivr, esm.sh)', kind: 'mirror', cat: 'espelhos', test: (h, u) => isSvg(u) },
  { name: 'Froggies Arcade · SVG', kind: 'mirror', cat: 'espelhos', test: (h, u) => /froggies\.svg/i.test(u) },
  { name: 'miinideck · dplooy · droply', kind: 'site', cat: 'unblockers', test: h => /(miinideck\.com|dplooy\.com|droply\.id|supadrop\.site)$/.test(h) },
  { name: 'novos domínios (luna, estudos e afins)', kind: 'site', cat: 'unblockers', test: () => true },
];

const groups = new Map();
for (const u of unique) {
  const h = host(u);
  const rule = rules.find(r => r.test(h, u));
  const key = rule.name + '|' + rule.kind;
  if (!groups.has(key)) groups.set(key, { name: rule.name, cat: rule.cat, kind: rule.kind, credit: 'Colagem da comunidade', links: [] });
  groups.get(key).links.push({ u });
}

const db = JSON.parse(fs.readFileSync(OUT, 'utf8'));
const seen = new Set();
for (const g of db.groups) for (const l of g.links) seen.add(l.u);
let added = 0;
for (const g of groups.values()) {
  g.links = g.links.filter(l => !seen.has(l.u) && (seen.add(l.u), true));
  if (!g.links.length) continue;
  added += g.links.length;
  db.groups.push({ ...g, name: g.name });
}
db.total = db.groups.reduce((n, g) => n + g.links.length, 0);
db.counts = {};
for (const g of db.groups) db.counts[g.cat] = (db.counts[g.cat] || 0) + g.links.length;
db.updated = new Date().toISOString().slice(0, 10);
fs.writeFileSync(OUT, JSON.stringify(db));
console.log(`URLs na colagem: ${urls.length} · únicas: ${unique.length} · novas: ${added} · total no site: ${db.total}`);
console.log(groups.size + ' grupos');
