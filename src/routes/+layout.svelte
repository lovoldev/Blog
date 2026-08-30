<script>
  import favicon from '$lib/assets/favicon.svg'
  import '../styles/main.css';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { setupLightbox } from '$lib/lightbox.js';

  const {children}=$props()

  let htmlLang = $derived($page.url.pathname.startsWith('/zh') ? 'zh' : 'en');
  const isPostPage = $derived(/^\/(?:zh\/)?posts\/.+/.test($page.url.pathname));

  $effect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = htmlLang;
    }
  });

  onMount(() => {
    const isZh = () => document.documentElement.lang === 'zh';
    /**
     * @param {boolean} copied
     */
    const copyLabel = (copied) => isZh() ? (copied ? '已复制' : '复制') : (copied ? 'Copied!' : 'Copy');

    // 初始文案按当前语言设置
    document.querySelectorAll('.code-copy').forEach((btn) => {
      btn.textContent = copyLabel(false);
    });

    /**
     * @param {Event} event
     */
    async function handleClick(event) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const btn = target.closest('.code-copy');
      if (!btn) return;
      const code = btn.closest('.code-block')?.querySelector('code')?.textContent ?? '';
      try {
        await navigator.clipboard.writeText(code);
        btn.textContent = copyLabel(true);
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = copyLabel(false);
          btn.classList.remove('copied');
        }, 2000);
      } catch {
        // clipboard unavailable
      }
    }

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  });

  onMount(() => setupLightbox());
</script>

<svelte:head>
		<link rel="icon" href={favicon} type="image/svg+xml" />
		<link rel="alternate" type="application/rss+xml" title="zevarc RSS" href={$page.url.pathname.startsWith('/zh') ? '/zh/feed.xml' : '/feed.xml'} />
		{#if !isPostPage}
			<meta property="og:image" content="https://zevarc.com/og-image.svg" />
		{/if}
		<meta name="twitter:card" content="summary_large_image" />
		<meta name="twitter:title" content="zevarc" />
		<meta name="twitter:description" content="A personal site about problem decomposition and iterative evolution." />
		{#if !isPostPage}
			<meta name="twitter:image" content="https://zevarc.com/og-image.svg" />
		{/if}
</svelte:head>

{@render children()}