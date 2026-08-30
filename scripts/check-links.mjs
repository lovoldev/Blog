#!/usr/bin/env node
/**
 * Checks all built HTML files for broken internal links, images, scripts
 * and same-site meta URLs.
 *   node scripts/check-links.mjs
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const root = process.cwd();
const buildDir = join(root, 'build');
const SITE = 'https://zevarc.com';

if (!existsSync(buildDir)) {
  console.error('build/ not found. Run `pnpm build` first.');
  process.exit(1);
}

/** @param {string} dir @param {string[]} files */
function walk(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

/**
 * @param {string} urlPath
 * @param {string} baseFile
 */
function existsFor(urlPath, baseFile) {
  const p = urlPath.split('?')[0].split('#')[0];
  if (p.startsWith('./') || p.startsWith('../')) {
    return existsSync(resolve(join(dirname(baseFile), p)));
  }
  if (p === '' || p === '/') return existsSync(join(buildDir, 'index.html'));
  const candidates = [join(buildDir, p), join(buildDir, p + '.html'), join(buildDir, p, 'index.html')];
  return candidates.some((c) => existsSync(c) && statSync(c).isFile());
}

const files = walk(buildDir).filter((f) => f.endsWith('.html'));
let errors = 0;

for (const file of files) {
  const rel = file.replace(buildDir + '/', '');
  const html = readFileSync(file, 'utf8');

  const check = (url, kind) => {
    if (
      !url ||
      url.startsWith('#') ||
      url.startsWith('http://') ||
      url.startsWith('//') ||
      url.startsWith('mailto:') ||
      url.startsWith('tel:') ||
      url.startsWith('data:') ||
      url.startsWith('blob:')
    ) {
      return;
    }
    if (url.startsWith('https://')) {
      if (url.startsWith(SITE)) check(url.slice(SITE.length), kind);
      return;
    }
    if (!existsFor(url, file)) {
      console.error(`BROKEN ${kind}: ${url} (in ${rel})`);
      errors++;
    }
  };

  for (const m of html.matchAll(/href="([^"]+)"/g)) check(m[1], 'LINK');
  for (const m of html.matchAll(/<img[^>]+src="([^"]+)"/g)) check(m[1], 'IMG');
  for (const m of html.matchAll(/<script[^>]+src="([^"]+)"/g)) check(m[1], 'SCRIPT');
  for (const m of html.matchAll(/<(?:meta|link)[^>]+content="([^"]+)"/g)) {
    const c = m[1];
    if (c.startsWith(SITE) || c.startsWith('/')) check(c, 'META');
  }
}

console.log(`Checked ${files.length} HTML files, ${errors} broken references.`);
process.exit(errors > 0 ? 1 : 0);
