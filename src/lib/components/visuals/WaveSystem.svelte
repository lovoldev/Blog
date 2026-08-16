<script>
  /**
   * WaveSystem - 可复用的波浪动画组件
   * @prop {string} theme - 主题: 'sunrise' | 'harbor' | 'sunset' | 'starry'
   * @prop {number} opacity - 整体透明度 (0-1)
  * @prop {boolean} shimmer - 是否显示水面波光
  * @prop {number} shimmerOpacity - 波光透明度 (0-1)
   */
  
  let { 
    theme = 'sunrise',
    opacity = 1,
    shimmer = false,
    shimmerOpacity = 0.5
  } = $props();
  
  // 波浪动画速度配置（全部朝同一方向流动，近处快、远处慢）
  /** @type {Record<string, { far: number; mid: number; near: number }>} */
  const waveSpeeds = {
    sunrise: { far: 46, mid: 32, near: 22 },
    harbor: { far: 52, mid: 38, near: 26 },
    sunset: { far: 52, mid: 38, near: 26 },
    starry: { far: 58, mid: 42, near: 30 }
  };
  
  // 获取当前主题的波浪颜色
  /**
   * @param {string} t
   */
  const getWaveColors = (t) => {
    /** @type {Record<string, { far: string; mid: string; near: string }>} */
    const colors = {
      sunrise: {
        far: 'rgba(56, 189, 248, 0.12)',
        mid: 'rgba(56, 189, 248, 0.24)',
        near: 'rgba(56, 189, 248, 0.42)'
      },
      harbor: {
        far: 'rgba(148, 163, 184, 0.1)',
        mid: 'rgba(148, 163, 184, 0.18)',
        near: 'rgba(148, 163, 184, 0.3)'
      },
      sunset: {
        far: 'rgba(148, 163, 184, 0.1)',
        mid: 'rgba(148, 163, 184, 0.18)',
        near: 'rgba(148, 163, 184, 0.3)'
      },
      starry: {
        far: 'rgba(148, 163, 184, 0.08)',
        mid: 'rgba(148, 163, 184, 0.12)',
        near: 'rgba(148, 163, 184, 0.2)'
      }
    };
    return colors[t] || colors.sunrise;
  };
  
  let speeds = $derived(waveSpeeds[theme] || waveSpeeds.sunrise);
  let colors = $derived(getWaveColors(theme));
</script>

<div class="wave-system" style="opacity: {opacity}">
  <!-- 远景波浪（最淡、最慢） -->
  <div 
    class="wave-layer wave-far"
    style="animation-duration: {speeds.far}s; color: {colors.far}"
  >
    <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
      <path d="M0,120 C120,120 180,88 300,88 C420,88 480,120 600,120 C720,120 780,88 900,88 C1020,88 1080,120 1200,120 L1200,120 L0,120 Z" fill="currentColor"/>
    </svg>
  </div>
  
  <!-- 中景波浪 -->
  <div 
    class="wave-layer wave-mid"
    style="animation-duration: {speeds.mid}s; color: {colors.mid}"
  >
    <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
      <path d="M0,120 C120,120 180,60 300,60 C420,60 480,120 600,120 C720,120 780,60 900,60 C1020,60 1080,120 1200,120 L1200,120 L0,120 Z" fill="currentColor"/>
    </svg>
  </div>
  
  <!-- 近景波浪（最深、最快） -->
  <div 
    class="wave-layer wave-near"
    style="animation-duration: {speeds.near}s; color: {colors.near}"
  >
    <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
      <path d="M0,120 C120,120 180,12 300,12 C420,12 480,120 600,120 C720,120 780,12 900,12 C1020,12 1080,120 1200,120 L1200,120 L0,120 Z" fill="currentColor"/>
    </svg>
  </div>

  {#if shimmer}
    <div class="shimmer" style="opacity: {shimmerOpacity}">
      <div class="shimmer-line"></div>
      <div class="shimmer-line" style="animation-delay: 0.5s"></div>
      <div class="shimmer-line" style="animation-delay: 1s"></div>
    </div>
  {/if}
</div>

<style>
  .wave-system {
    position: absolute;
    top: 0;
    left: 0;
    width: 200%;
    height: 100%;
    display: flex;
    pointer-events: none;
  }
  
  .wave-layer {
    position: absolute;
    left: 0;
    width: 200%;
    height: 48px;
    display: flex;
    will-change: transform;
  }
  
  .wave-layer svg {
    width: 50%;
    height: 100%;
  }
  
  .wave-far {
    top: -8px;
    animation: wave-move 40s linear infinite;
  }
  
  .wave-mid {
    top: 4px;
    animation: wave-move 28s linear infinite;
  }
  
  .wave-near {
    top: 16px;
    animation: wave-move 18s linear infinite;
  }
  
  @keyframes wave-move {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }

  .shimmer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    pointer-events: none;
  }

  .shimmer-line {
    position: absolute;
    width: 200%;
    height: 2px;
    background: linear-gradient(90deg, transparent 0%, rgba(251, 191, 36, 0.18) 20%, rgba(251, 191, 36, 0.3) 50%, rgba(251, 191, 36, 0.18) 80%, transparent 100%);
    top: 20%;
    animation: shimmer 7s ease-in-out infinite;
  }

  @keyframes shimmer {
    0%, 100% { transform: translateX(-50%) scaleX(0.5); opacity: 0.18; }
    50% { transform: translateX(0%) scaleX(1); opacity: 0.4; }
  }
  
  @media (max-width: 768px) {
    .wave-layer {
      height: 36px;
    }
    
    .wave-far { top: -6px; }
    .wave-mid { top: 3px; }
    .wave-near { top: 12px; }
  }
  
  @media (prefers-reduced-motion: reduce) {
    .wave-far,
    .wave-mid,
    .wave-near {
      animation: none;
    }
  }
</style>
