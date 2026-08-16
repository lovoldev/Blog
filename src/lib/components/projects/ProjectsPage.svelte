<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';
  import SectionHeader from '$lib/components/SectionHeader.svelte';
  import NavButton from '$lib/components/NavButton.svelte';
  import ProjectsList from '$lib/components/projects/Projects.svelte';
  import { Scene, SunsetBackground } from '$lib/components/visuals/index.js';
  import { getDictionary,getLink } from '$lib/i18n/index.js';

  const { lang = 'en' } = $props();

  let t = $derived(getDictionary(lang));
  let visible = $state(false);

  const nextPath = $derived("en"===lang?"/":"/zh");

  onMount(() => {
    const timer = setTimeout(() => {
      visible = true;
    }, 120);

    return () => clearTimeout(timer);
  });

  /**
   * @param {MouseEvent} event
   */
  function handleNext(event) {
    event.preventDefault();
    goto(nextPath);
  }
</script>

<svelte:head>
  <title>{t.seo.projects.title}</title>
  <meta name="description" content={t.seo.projects.description} />
  <link rel="canonical" href={`https://zevarc.com/${getLink('projects', lang)}`} />
  <link rel="alternate" hreflang="en" href="https://zevarc.com/projects" />
  <link rel="alternate" hreflang="zh" href="https://zevarc.com/zh/projects" />
  <link rel="alternate" hreflang="x-default" href="https://zevarc.com/projects" />
</svelte:head>

<div class="page">
  <LanguageSwitcher />

  <Scene
    backgroundComponent={SunsetBackground}
    waveProps={{ theme: 'harbor', shimmer: true, shimmerOpacity: 0.2 }}
    boatProps={{ theme: 'harbor', scale: 0.7, rock: true }}
    seaClass="sea-slot"
  >
    {#snippet skyObjects()}
      <div class="sunset">
        <div class="sun"></div>
      </div>
    {/snippet}
  </Scene>

  <section class="content" class:visible={visible}>
    <SectionHeader station={t.projects.station} title={t.projects.title} subtitle={t.projects.subtitle} />

    <ProjectsList projects={t.projects.projects} />

    <div class="navigation-section">
      <NavButton href={nextPath} label={t.projects.next} onClick={handleNext} />
    </div>
  </section>
</div>

<style>
  .page {
    position: relative;
    width: 100%;
    min-height: 100vh;
    min-height: 100dvh;
    overflow: hidden;
  }

  .content {
    position: relative;
    z-index: 10;
    max-width: 960px;
    margin: 0 auto;
    padding: 72px 24px 72px;
    opacity: 0;
    transform: translateY(30px);
    transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
    color: #f8fafc;
  }

  .content.visible {
    opacity: 1;
    transform: translateY(0);
  }

  .sunset {
    position: absolute;
    bottom: 20%;
    right: 20%;
    width: 80px;
    height: 80px;
  }

  .sun {
    width: 100%;
    height: 100%;
    box-shadow: rgba(238, 190, 160, 0.32) 0px 0px 60px;
    background: radial-gradient(
      circle,
      rgb(238, 190, 160) 0%,
      rgb(214, 170, 128) 50%,
      transparent 70%
    );
    border-radius: 50%;
  }

  .navigation-section {
    margin-top: 32px;
    text-align: center;
  }

  @media (max-width: 768px) {
    .content {
      padding: 80px 20px 100px;
    }
  }
</style>
