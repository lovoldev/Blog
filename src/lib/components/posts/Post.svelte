<script>
    import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';

    const { post } = $props();

    const lang = $derived(post.url.startsWith('zh/') ? 'zh' : 'en');
    const contentUrl = $derived(post.url.startsWith('zh/') ? post.url.slice(3) : post.url);
    const enUrl = $derived(contentUrl);
    const zhUrl = $derived(`zh/${contentUrl}`);

    const homePath = $derived(lang === 'zh' ? '/zh' : '/');
    const postsPath = $derived(lang === 'zh' ? '/zh/posts' : '/posts');
    const switchPath = $derived(post.hasAlt ? undefined : (lang === 'zh' ? '/' : '/zh'));

    const json = $derived(
        JSON.stringify(post.jsonLd)
            .replace(/&/g, '\\u0026')
            .replace(/</g, '\\u003c')
            .replace(/>/g, '\\u003e')
    );

    /**
     * @param {string} dateStr
     */
    function formatDate(dateStr) {
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}.${month}.${day}`;
    }
</script>

<svelte:head>
    <title>{post.title} - zevarc</title>
    <meta name="description" content={post.description} />
    <meta property="og:title" content={post.title} />
    <meta property="og:description" content={post.description} />
    <meta property="og:type" content="article" />
    <meta property="og:url" content={`https://zevarc.com/${post.url}`} />
    <link rel="canonical" href={`https://zevarc.com/${post.url}`} />
    {#if post.hasAlt}
        <link rel="alternate" hreflang="en" href={`https://zevarc.com/${enUrl}`} />
        <link rel="alternate" hreflang="zh" href={`https://zevarc.com/${zhUrl}`} />
        <link rel="alternate" hreflang="x-default" href={`https://zevarc.com/${enUrl}`} />
    {/if}
    {@html `<script type="application/ld+json">${json}</script>`}
</svelte:head>

<LanguageSwitcher overrideHref={switchPath} />

<header class="site-nav">
    <a class="nav-link" href={homePath}>Home</a>
    <a class="nav-link" href={postsPath}>Posts</a>
</header>

<article>
    <header class="post-header">
        <h1>{post.title}</h1>
        <div class="post-meta">
            <span class="post-date">{formatDate(post.date)}</span>
            {#if post.updated && post.updated !== post.date}
                <span class="post-updated">Updated {formatDate(post.updated)}</span>
            {/if}
            {#if post.tags?.length}
                <div class="post-tags">
                    {#each post.tags as tag}
                        <span class="tag">{tag}</span>
                    {/each}
                </div>
            {/if}
        </div>
    </header>
    <main>
        {@render post.component()}
    </main>
</article>

<style>
    .site-nav {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 900;
        display: flex;
        gap: 20px;
        padding: 16px 24px;
        background: rgba(248, 250, 240, 0.9);
        backdrop-filter: blur(10px);
        border-bottom: 1px solid var(--border-color);
    }

    .nav-link {
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--text-muted);
        border: none;
        transition: color 0.2s;
    }

    .nav-link:hover {
        color: var(--primary);
        border: none;
    }

    article {
        max-width: 72ch;
        margin: 0 auto;
        padding: 96px clamp(16px, 4vw, 24px) clamp(16px, 4vw, 24px);
        line-height: 1.7;
        -webkit-font-smoothing: antialiased;
        text-rendering: optimizeLegibility;
    }

    .post-header {
        margin-bottom: 2.5rem;
        padding-bottom: 1.5rem;
        border-bottom: 1px solid var(--border-color);
    }

    .post-header h1 {
        margin: 0 0 1rem;
    }

    .post-meta {
        display: flex;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
        font-family: var(--font-mono);
        font-size: 0.875rem;
    }

    .post-date {
        color: var(--primary);
    }

    .post-updated {
        color: var(--text-muted);
    }

    .post-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }

    .tag {
        display: inline-flex;
        align-items: center;
        padding: 3px 10px;
        border-radius: 999px;
        background: var(--color-surface-container);
        color: var(--text-muted);
        font-size: 0.8rem;
        border: 1px solid var(--border-color);
    }

    :global(article > * + *) {
        margin-top: 1.2em;
    }
    :global(img) {
        display: block;
        max-width: 100%;
        height: auto;
        margin: 2.5rem auto;
        border-radius: 6px;
        border: 1px solid var(--border-color);
        box-shadow: 0 4px 12px var(--color-shadow);
        object-fit: contain;
    }

    :global(img + em) {
        display: block;
        text-align: center;
        font-size: 0.9rem;
        color: var(--text-muted);
        margin-top: -1.5rem;
        margin-bottom: 2rem;
    }

    :global(ul, ol) {
        padding-left: 1.4em;
        margin: 1em 0;
    }

    :global(li) {
        margin: 0.4em 0;
    }

    :global(li::marker) {
        color: var(--color-outline);
    }
</style>
