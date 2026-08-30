#!/usr/bin/env node
/**
 * 向 IndexNow (Bing / Yandex / Seznam) 提交站点 URL，触发即时索引。
 * 密钥文件: static/68781e944f7546ebbcdab929af26e2c7.txt（内容 = key）
 * 用法: node scripts/notify-indexnow.mjs [--limit 100]
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const HOST = 'zevarc.com';
const KEY = process.env.INDEXNOW_KEY || '68781e944f7546ebbcdab929af26e2c7';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : 10000;

const sitemapPath = join(process.cwd(), 'build', 'sitemap.xml');
if (!existsSync(sitemapPath)) {
  console.error('build/sitemap.xml not found. Run `pnpm build` first.');
  process.exit(1);
}

const xml = readFileSync(sitemapPath, 'utf8');
const urls = [...new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]))].slice(0, limit);

if (urls.length === 0) {
  console.error('No URLs found in sitemap.');
  process.exit(1);
}

console.log(`Submitting ${urls.length} URLs to IndexNow (key: ${KEY.slice(0, 6)}…)...`);

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls
  })
});

console.log(`IndexNow API: ${res.status} ${res.statusText}`);
if (!res.ok) {
  console.error(await res.text());
  process.exit(1);
}
console.log(`Done. Key file: ${KEY_LOCATION}`);
