import type { Post, PostRecord } from './types'
import { getLink } from '$lib/i18n';

function slugLangs(modules: Record<string, PostRecord>): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const path in modules) {
    const fileName = path?.split('/').pop()?.replace('.md', '') ?? '';
    const [slug, lang] = fileName.split('.');
    if (!map.has(slug)) map.set(slug, new Set());
    if (lang) map.get(slug)!.add(lang);
  }
  return map;
}

function handleContent(modules: Record<string, PostRecord>, lang: string | undefined = undefined, basePath: string, isNotes: boolean): Post[] {
  const posts: Post[] = []
  const langs = slugLangs(modules)
  for (const path in modules) {
    const post = modules[path]
    const fileName = path?.split('/').pop()?.replace('.md', '') ?? "";
    const [slug, fileLang] = fileName.split('.')
    const metadata = post.metadata
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
      component: post.default, ...metadata, slug, lng: fileLang, url: `${basePath}/${slug}`, jsonLd, isNotes,
      hasAlt: (langs.get(slug)?.size ?? 0) > 1
    }
    !content.draft && (!lang || fileLang === lang) && posts.push(content)
  }
  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  return posts
}

function loadPosts(lang: string | undefined = undefined): Post[] {
  return handleContent(import.meta.glob('/src/content/posts/*.md', { eager: true }), lang, getLink('posts', lang), false);
}

function loadNotes(lang: string | undefined = undefined): Post[] {
  return handleContent(import.meta.glob('/src/content/notes/*.md', { eager: true }), lang, getLink('posts/notes', lang), true);
}

export { loadPosts, loadNotes };
