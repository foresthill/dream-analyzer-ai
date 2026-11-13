#!/usr/bin/env node
// garden/ の Obsidian ノートを検証する（依存なし・Node標準のみ）。
//  - 各ノートに frontmatter の dg-publish と title があるか
//  - [[wikilink]] の参照先が garden 内に存在するか（ベース名で解決・コード内の記法は無視）
// 使い方: node scripts/garden-check.mjs
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, basename, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const GARDEN = join(ROOT, 'garden');

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (name.endsWith('.md')) out.push(p);
  }
  return out;
}

const files = walk(GARDEN);
const names = new Set(files.map((f) => basename(f, '.md')));
const problems = [];

// コードブロック/インラインコードを除去してからリンクを拾う（例示の [[...]] を誤検知しない）
function stripCode(md) {
  return md.replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '');
}

for (const f of files) {
  const rel = relative(ROOT, f);
  const raw = readFileSync(f, 'utf8');

  // frontmatter
  const fm = raw.startsWith('---') ? raw.slice(3, raw.indexOf('\n---', 3)) : '';
  if (!/\bdg-publish:\s*true\b/.test(fm)) problems.push(`${rel}: frontmatter に dg-publish: true が無い`);
  if (!/\btitle:\s*\S/.test(fm)) problems.push(`${rel}: frontmatter に title が無い`);

  // wikilinks（コード除去後）
  const body = stripCode(raw);
  const re = /\[\[([^\]|#]+)(?:[#|][^\]]*)?\]\]/g;
  let m;
  while ((m = re.exec(body))) {
    const target = m[1].trim();
    if (!names.has(target)) problems.push(`${rel}: リンク切れ [[${target}]]`);
  }
}

console.log(`garden notes: ${files.length}`);
if (problems.length === 0) {
  console.log('✓ 問題なし（frontmatter / リンクともOK）');
  process.exit(0);
} else {
  console.log(`✗ ${problems.length} 件の問題:`);
  for (const p of problems) console.log('  - ' + p);
  process.exit(1);
}
