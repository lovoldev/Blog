<script>
  /**
   * Scene - 复用的海天场景容器，封装背景 + 波浪 + 小船。
   * @prop {Component} backgroundComponent - 背景组件（默认 BaseBackground）
   * @prop {object} backgroundProps - 传给背景组件的属性
   * @prop {object} waveProps - 传给 WaveSystem 的属性
   * @prop {object} boatProps - 传给 SailingBoat 的属性；设 { show: false } 可隐藏
   * @prop {boolean} showWave - 是否展示波浪
   * @prop {string} seaClass - 额外附加到海层容器的类名
   * @prop {Snippet} skyObjects - 天空中的物体（太阳/月亮等）
   */
  import BaseBackground from './BaseBackground.svelte';
  import WaveSystem from './WaveSystem.svelte';
  import SailingBoat from './SailingBoat.svelte';

  let {
    backgroundComponent: Background = BaseBackground,
    backgroundProps = {},
    waveProps = { theme: 'sunrise', shimmer: false, shimmerOpacity: 0.5, opacity: 1 },
    boatProps = { show: true, theme: 'sunrise', scale: 1, rock: true, opacity: 1 },
    showWave = true,
    seaClass = '',
    skyObjects
  } = $props();

  const showBoat = $derived(boatProps?.show !== false);
</script>

<Background {...backgroundProps} {skyObjects}>
  <div class={`scene-sea ${seaClass}`}>
    {#if showWave}
      <WaveSystem {...waveProps} />
    {/if}

    {#if showBoat}
      <SailingBoat {...boatProps} />
    {/if}
  </div>
</Background>

<style>
  .scene-sea {
    position: absolute;
    inset: 0;
  }
</style>
