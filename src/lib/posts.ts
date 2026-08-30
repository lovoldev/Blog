import type { Post, PostMeta, PostRecord } from './types'
import { getLink } from '$lib/i18n';
import { calcReadTime, extractExcerpt, extractHeadings } from './reading';

function slugLangs(modules: Record<string, PostRecord>): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const path in modules) {
    const fileName = path?.split('/').pop()?.replace('.md', '') ?? '';
    const [slug, lang] = fileName.split('.');
    if (!map.has(slug)) map.set(slug, new Set());
    // Files without a language suffix default to English
    map.get(slug)!.add(lang ?? 'en');
  }
  return map;
}

/**
 * Warns at build time when a post is missing required frontmatter fields.
 */
function validateMetadata(metadata: PostMeta, filePath: string): void {
  const missing: string[] = [];
  if (!metadata.title) missing.push('title');
  if (!metadata.date) missing.push('date');
  if (missing.length > 0) {
    console.warn(`[zevarc] ${filePath} is missing frontmatter: ${missing.join(', ')}`);
  }
}

function handleContent(modules: Record<string, PostRecord>, rawModules: Record<string, string>, lang: string | undefined = undefined, basePath: string, isNotes: boolean): Post[] {
  const posts: Post[] = []
  const langs = slugLangs(modules)
  for (const path in modules) {
    const post = modules[path]
    const fileName = path?.split('/').pop()?.replace('.md', '') ?? "";
    const [slug, fileLang] = fileName.split('.')
    const effectiveLang = fileLang ?? 'en'
    const metadata = post.metadata
    validateMetadata(metadata, path)
    const raw = rawModules[path] ?? ''
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      "headline": metadata.title,
      "datePublished": metadata.date,
      "dateModified": metadata.updated,
      "author": {
        "@type": "Person",
        "name": "Zevarc"
      }

    }
    const content = {
      component: post.default, ...metadata, slug, lng: effectiveLang, url: `${basePath}/${slug}`, jsonLd, isNotes,
      hasAlt: (langs.get(slug)?.size ?? 0) > 1,
      readTime: calcReadTime(raw),
      excerpt: extractExcerpt(raw, metadata.description),
      headings: extractHeadings(raw)
    }
    !content.draft && (!lang || effectiveLang === lang) && posts.push(content)
  }
  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  return posts
}

function loadPosts(lang: string | undefined = undefined): Post[] {
  const modules = import.meta.glob('/src/content/posts/*.md', { eager: true }) as Record<string, PostRecord>;
  const raw = import.meta.glob('/src/content/posts/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
  return handleContent(modules, raw, lang, getLink('posts', lang), false);
}

function loadNotes(lang: string | undefined = undefined): Post[] {
  const modules = import.meta.glob('/src/content/notes/*.md', { eager: true }) as Record<string, PostRecord>;
  const raw = import.meta.glob('/src/content/notes/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
  return handleContent(modules, raw, lang, getLink('posts/notes', lang), true);
}

/**
 * Finds posts related to the given one, ranked by shared tags then recency.
 */
export function findRelated(post: Post, posts: Post[], limit = 3): Post[] {
  const tags = new Set((post.tags || []).map((t) => t.toLowerCase()));
  return posts
    .filter((p) => p.slug !== post.slug && !p.draft)
    .map((p) => ({
      p,
      score: (p.tags || []).filter((t) => tags.has(t.toLowerCase())).length,
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) =>
      b.score - a.score ||
      new Date(b.p.date).getTime() - new Date(a.p.date).getTime()
    )
    .slice(0, limit)
    .map((x) => x.p);
}

export { loadPosts, loadNotes };
