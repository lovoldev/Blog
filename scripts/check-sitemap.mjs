#!/usr/bin/env node
/**
 * Validates that every URL in the built sitemap.xml has a corresponding
 * static file in the build output. Run after `pnpm build`:
 *   node scripts/check-sitemap.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const sitemapPath = join(root, 'build', 'sitemap.xml');

if (!existsSync(sitemapPath)) {
  console.error('build/sitemap.xml not found. Run `pnpm build` first.');
  process.exit(1);
}

const xml = readFileSync(sitemapPath, 'utf8');
const locs = [...xml.matchAll(/<loc>https:\/\/zevarc\.com([^<]*)<\/loc>/g)].map((m) => m[1]);

let missing = 0;
for (const path of new Set(locs)) {
  const file =
    path === '' || path === '/' ? join(root, 'build', 'index.html') : join(root, 'build', path + '.html');
  if (!existsSync(file)) {
    console.error(`MISSING: ${path} -> ${file}`);
    missing++;
  }
}

console.log(`Checked ${new Set(locs).size} unique URLs, ${missing} missing.`);
process.exit(missing > 0 ? 1 : 0);
