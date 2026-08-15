<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';
  import Hero from './Hero.svelte';
  import { SunriseBackground, Scene, Sun } from '$lib/components/visuals/index.js';
  import { getDictionary, getLink } from '$lib/i18n/index.js';

  const { lang='en' } = $props();
  let t = $derived(getDictionary(lang));

  let progress = $state(0);
  let contentVisible = $state(false);
  let boatSailing = $state(false);
  let isNavigating = $state(false);

  let sunOpacity = $derived(Math.max(0, Math.min(1, (progress - 0.1) * 2)));
  let starsOpacity = $derived(Math.max(0, 1 - progress * 1.5));
  let boatOpacity = $derived(Math.max(0, Math.min(1, (progress - 0.5) * 3)));

  let sunX = $derived(50 + Math.sin(progress * Math.PI) * 35);
  let sunY = $derived(85 - progress * 65);

  let skyColorTop = $derived(interpolateColor('#020617', '#1e3a5f', progress));
  let skyColorBottom = $derived(interpolateColor('#0f172a', '#7dd3fc', progress));
  let seaColorTop = $derived(interpolateColor('#000814', '#0369a1', progress));
  let seaColorBottom = $derived(interpolateColor('#001219', '#0c1929', progress));

  const nextLink = $derived(getLink('posts',lang));

  /**
   * @param {string} color1
   * @param {string} color2
   * @param {number} t
   */
  function interpolateColor(color1, color2, t) {
    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);
    const r = Math.round(c1.r + (c2.r - c1.r) * t);
    const g = Math.round(c1.g + (c2.g - c1.g) * t);
    const b = Math.round(c1.b + (c2.b - c1.b) * t);
    return `rgb(${r}, ${g}, ${b})`;
  }

  /**
   * @param {string} hex
   */
  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  onMount(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      progress = 1;
      contentVisible = true;
      return;
    }

    const startTimer = setTimeout(() => {
      animate();
    }, 500);

    return () => clearTimeout(startTimer);
  });

  function animate() {
    const duration = 4000;
    const startTime = performance.now();

    /**
     * @param {number} currentTime
     */
    function frame(currentTime) {
      const elapsed = currentTime - startTime;
      progress = Math.min(1, elapsed / duration);

      if (progress >= 1) {
        setTimeout(() => {
          contentVisible = true;
        }, 300);
      }

      if (progress < 1) {
        requestAnimationFrame(frame);
      }
    }

    requestAnimationFrame(frame);
  }

  async function handleExplore() {
    if (isNavigating) return;
    isNavigating = true;
    boatSailing = true;
    contentVisible = false;

    await new Promise(resolve => setTimeout(resolve, 800));

    await goto(nextLink);
  }
</script>

<svelte:head>
  <title>{t.seo.home.title}</title>
  <meta name="description" content={t.seo.home.description} />
  <meta property="og:title" content={t.seo.home.title} />
  <meta property="og:description" content={t.seo.home.description} />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
  <!-- 多语言 SEO -->
  <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
  <link rel="canonical" href={'en'==lang?'https://zevarc.com/':'https://zevarc.com/zh'} />
  <link rel="alternate" hreflang="en" href="https://zevarc.com/" />
  <link rel="alternate" hreflang="zh" href="https://zevarc.com/zh" />
  <link rel="alternate" hreflang="x-default" href="https://zevarc.com/" />
</svelte:head>

<LanguageSwitcher />

<div class="hero-container">
  <Scene
    backgroundComponent={SunriseBackground}
    backgroundProps={{
      skyGradient: `linear-gradient(to bottom, ${skyColorTop} 0%, ${skyColorBottom} 100%)`,
      seaGradient: `linear-gradient(to bottom, ${seaColorTop} 0%, ${seaColorBottom} 100%)`,
      starsOpacity,
      starCount: 50,
    }}
    waveProps={{ theme: 'sunrise', shimmer: true, shimmerOpacity: progress * 0.5 }}
    boatProps={{ theme: 'sunrise', opacity: boatOpacity, sailOut: boatSailing, rock: !boatSailing }}
    seaClass="sea-layer"
  >
    {#snippet skyObjects()}
      <Sun x={sunX} y={sunY} opacity={sunOpacity} />
    {/snippet}
  </Scene>

  <Hero
    {nextLink}
    {contentVisible}
    {t}
    topics={t.hero.topics}
    onExplore={handleExplore}
  />
</div>

<style>
  .hero-container {
    position: relative;
    width: 100%;
    height: 100vh;
    overflow: hidden;
  }
</style>
