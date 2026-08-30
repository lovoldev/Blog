<script>
  import { onMount } from 'svelte';
  import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';
  import PageLogo from '$lib/components/PageLogo.svelte';
  import { getDictionary } from '$lib/i18n/index.js';

  let { lang = 'en' } = $props();
  let t = $derived(getDictionary(lang));
  const homePath = $derived(lang === 'zh' ? '/zh' : '/');

  let query = $state('');
  /** @type {any[]} */
  let results = $state([]);
  let loading = $state(false);
  let ready = $state(false);
  let searched = $state(false);
  /** @type {any} */
  let pagefind = null;

  onMount(async () => {
    try {
      const pagefindUrl = '/pagefind/pagefind.js';
      const mod = await import(pagefindUrl);
      pagefind = mod.default ?? mod;
      ready = true;
    } catch {
      ready = false;
    }
  });

  /**
   * @param {string} q
   */
  async function runSearch(q) {
    if (!pagefind || !q.trim()) {
      results = [];
      return;
    }
    loading = true;
    try {
      const res = await pagefind.search(q.trim());
      const data = await Promise.all(
        (res.results || []).slice(0, 12).map((/** @type {any} */ r) => r.data())
      );
      results = data;
      searched = true;
    } finally {
      loading = false;
    }
  }

  /**
   * @param {Event} event
   */
  function onInput(event) {
    const value = /** @type {HTMLInputElement} */ (event.target).value;
    query = value;
    runSearch(value);
  }
</script>

<svelte:head>
  <title>{t.search.title} - zevarc</title>
</svelte:head>

<LanguageSwitcher />
<PageLogo href={homePath} />

<div class="search-page">
  <header class="search-head">
    <p class="kicker">{t.search.title}</p>
    <h1 class="search-title">{t.search.title}</h1>
  </header>

  <input
    class="search-input"
    type="search"
    bind:value={query}
    oninput={onInput}
    placeholder={t.search.placeholder}
    aria-label={t.search.title}
  />

  {#if !ready}
    <p class="search-hint">{t.search.hint}</p>
  {:else if loading}
    <p class="search-status">…</p>
  {:else if results.length > 0}
    <ul class="search-results">
      {#each results as r}
        <li class="search-result">
          <a href={`/${r.url.replace(/\.html$/, '').replace(/^\//, '')}`} class="search-link">
            <span class="result-title">{r.meta?.title || r.title}</span>
            <span class="result-excerpt">{@html r.excerpt}</span>
          </a>
        </li>
      {/each}
    </ul>
  {:else if searched && query.trim()}
    <p class="search-empty">{t.search.empty}</p>
  {/if}
</div>

<style>
  .search-page {
    max-width: 720px;
    margin: 0 auto;
    padding: 120px 24px 80px;
    min-height: 100vh;
  }

  .search-head {
    margin-bottom: 28px;
  }

  .kicker {
    margin: 0 0 12px;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: var(--color-bud);
  }

  .search-title {
    font-family: var(--font-serif);
    font-weight: 600;
    font-size: clamp(2rem, 5vw, 2.8rem);
    letter-spacing: -0.015em;
    margin: 0;
    color: var(--color-ink);
  }

  .search-input {
    width: 100%;
    padding: 14px 18px;
    font-size: 1.05rem;
    border-radius: 12px;
    border: 1px solid var(--border-color);
    background: var(--color-surface-container);
    color: var(--color-on-surface);
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .search-input:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-container);
  }

  .search-hint,
  .search-status,
  .search-empty {
    margin-top: 24px;
    color: var(--text-muted);
    font-size: 0.95rem;
  }

  .search-results {
    list-style: none;
    margin: 28px 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .search-result {
    border: 1px solid var(--border-color);
    border-radius: 12px;
    transition: border-color 0.2s, transform 0.2s;
  }

  .search-result:hover {
    border-color: var(--color-primary);
    transform: translateY(-1px);
  }

  .search-link {
    display: block;
    padding: 16px 20px;
    border: none;
    text-decoration: none;
  }

  .result-title {
    display: block;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--color-on-surface);
    margin-bottom: 6px;
  }

  .result-excerpt {
    display: block;
    font-size: 0.9rem;
    line-height: 1.6;
    color: var(--text-muted);
  }

  .result-excerpt :global(mark) {
    background: var(--color-primary-container);
    color: var(--color-on-primary-container);
    padding: 0 2px;
    border-radius: 3px;
  }
</style>
