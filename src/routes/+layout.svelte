<script>
  import favicon from '$lib/assets/favicon.svg'
  import '../styles/main.css';
  import { page } from '$app/stores';

  const {children}=$props()

  let htmlLang = $derived($page.url.pathname.startsWith('/zh') ? 'zh' : 'en');

  $effect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = htmlLang;
    }
  });
</script>

<svelte:head>
		<link rel="icon" href={favicon} type="image/svg+xml" />
		<meta property="og:image" content="https://zevarc.com/og-image.svg" />
		<meta name="twitter:card" content="summary_large_image" />
		<meta name="twitter:title" content="zevarc" />
		<meta name="twitter:description" content="A personal site about problem decomposition and iterative evolution." />
		<meta name="twitter:image" content="https://zevarc.com/og-image.svg" />
</svelte:head>

{@render children()}