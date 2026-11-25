#!/usr/bin/env node
/*
 * build-thumbs.mjs — gera data/thumbs.json a partir de assets/img/thumbs/
 * (e opcionalmente converte imagens com o ImageMagick, se `--convert` for passado).
 */
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const dir = path.join(ROOT, 'assets', 'img', 'thumbs');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.webp'));
const map = {};
for (const f of files) map[f.replace(/^thumb_/, '').replace(/\.webp$/, '')] = f;
fs.writeFileSync(path.join(ROOT, 'data', 'thumbs.json'), JSON.stringify(map));
console.log(`thumbs ${Object.keys(map).length} → data/thumbs.json`);
