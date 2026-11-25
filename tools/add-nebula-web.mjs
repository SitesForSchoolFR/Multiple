#!/usr/bin/env node
/*
 * add-nebula-web.mjs
 * Os jogos "w" da Nebula moram em links externos do projeto original.
 * Eles entram na coleção como entradas nomeadas (sem URL própria), então a
 * página de jogos os mostra como "só no projeto original" em vez de inventar
 * um endereço. Idempotente.
 */
import fs from 'node:fs';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const ROOT = path.resolve(HERE, '..');
const db = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'links.json'), 'utf8'));
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'games.json'), 'utf8'));
const extra = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'sources', 'nebula-web.json'), 'utf8'));

const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
const known = new Set(catalog.groups.flatMap(g => g.games.map(e => norm(e.n))));
const missing = extra.filter(e => !known.has(norm(e.name)));

const groups = new Map();
for (const e of missing) {
  let g = 'Jogos da Nebula';
  let m;
  if ((m = e.name.match(/^Friday Night Funkin\s*(.*)$/i))) g = 'Friday Night Funkin · mods';
  else if (/^3 Pandas/.test(e.name)) g = '3 Pandas';
  else if (e.name === 'Tomcat F-14 Flight Sim' || e.name === 'Minecraft Tower Defense') g = 'Clássicos do navegador';
  if (!groups.has(g)) groups.set(g, []);
  groups.get(g).push({ n: e.name, u: 'https://www.google.com/search?q=' + encodeURIComponent(e.name + ' jogo'), search: true });
}

const target = db.groups.find(g => g.name === 'Jogos da Nebula') || (() => {
  const g = { name: 'Jogos da Nebula', cat: 'jogos', kind: 'site', credit: 'Nebula · Onex558', links: [] };
  db.groups.push(g);
  return g;
})();
let added = 0;
for (const [name, items] of groups) {
  let g = db.groups.find(x => x.name === name);
  if (!g) {
    g = { name, cat: 'jogos', kind: 'site', credit: 'Nebula · Onex558', links: [] };
    db.groups.push(g);
  }
  for (const it of items) {
    if (g.links.some(l => l.n === it.n)) continue;
    g.links.push(it);
    added++;
  }
}
db.total = db.groups.reduce((n, g) => n + g.links.length, 0);
db.counts = {};
for (const g of db.groups) db.counts[g.cat] = (db.counts[g.cat] || 0) + g.links.length;
db.updated = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(ROOT, 'data', 'links.json'), JSON.stringify(db));
console.log(`entradas sem URL adicionadas: ${added} · total: ${db.total}`);
