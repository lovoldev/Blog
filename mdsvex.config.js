import { defineMDSveXConfig as defineConfig,escapeSvelte } from 'mdsvex';
import { getSingletonHighlighter } from 'shiki';

const highlighter=await getSingletonHighlighter({
  themes: ['github-dark','github-light','monokai'],
  langs: ['javascript', 'typescript', 'svelte', 'css', 'html','jade','kotlin','python','shell','java','cpp','cmake','groovy','astro']
});

/** Add `loading="lazy"` and `decoding="async"` to article images. */
function rehypeLazyImages() {
  /** @param {any} node */
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (node.type === 'element' && node.tagName === 'img') {
      node.properties = node.properties || {};
      node.properties.loading = 'lazy';
      node.properties.decoding = 'async';
    }
    if (node.children) walk(node.children);
  };
  return (tree) => walk(tree);
}

/**
 * Add unique `id` attributes to headings so the TOC can anchor to them.
 * Supports CJK titles; de-duplicates repeated headings.
 */
function rehypeSlug() {
  /** @param {any} node */
  const nodeText = (node) => {
    if (node.type === 'text') return node.value;
    if (node.type === 'element') return (node.children || []).map(nodeText).join('');
    return '';
  };

  /** @param {string} text */
  const slugify = (text) =>
    text
      .toLowerCase()
      .replace(/[^\w\u3400-\u9fff\u4e00-\u9fff\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');

  /** @param {any} node */
  const walk = (node, seen) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach((child) => walk(child, seen));
      return;
    }
    if (node.type === 'element' && /^h[1-6]$/.test(node.tagName)) {
      const text = (node.children || []).map(nodeText).join('').trim();
      if (text) {
        let id = slugify(text) || 'section';
        const count = seen.get(id) || 0;
        seen.set(id, count + 1);
        if (count > 0) id = `${id}-${count}`;
        node.properties = node.properties || {};
        node.properties.id = id;
      }
    }
    if (node.children) walk(node.children, seen);
  };
  return (tree) => walk(tree, new Map());
}

const config = defineConfig({
  extensions: ['.md'],

  highlight: {
    highlighter: async (code, lang) => {
      const inner = escapeSvelte(highlighter.codeToHtml(code, { lang: lang ?? 'text', theme: 'github-dark' }));
      const html = `<div class="code-block"><button type="button" class="code-copy" aria-label="Copy code">Copy</button>${inner}</div>`;
      return `{@html \`${html}\` }`;
    }
  },

  remarkPlugins: [],
  rehypePlugins: [rehypeLazyImages, rehypeSlug]
});

export default config;