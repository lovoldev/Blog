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
  
  // 波浪动画速度配置
  /** @type {Record<string, { far: number; mid: number; near: number }>} */
  const waveSpeeds = {
    sunrise: { far: 25, mid: 18, near: 12 },
    harbor: { far: 30, mid: 22, near: 15 },
    sunset: { far: 30, mid: 22, near: 15 },
    starry: { far: 35, mid: 25, near: 18 }
  };
  
  // 获取当前主题的波浪颜色
  /**
   * @param {string} t
   */
  const getWaveColors = (t) => {
    /** @type {Record<string, { far: string; mid: string; near: string }>} */
    const colors = {
      sunrise: {
        far: 'rgba(56, 189, 248, 0.2)',
        mid: 'rgba(56, 189, 248, 0.35)',
        near: 'rgba(56, 189, 248, 0.5)'
      },
      harbor: {
        far: 'rgba(148, 163, 184, 0.15)',
        mid: 'rgba(148, 163, 184, 0.25)',
        near: 'rgba(148, 163, 184, 0.35)'
      },
      sunset: {
        far: 'rgba(148, 163, 184, 0.15)',
        mid: 'rgba(148, 163, 184, 0.25)',
        near: 'rgba(148, 163, 184, 0.35)'
      },
      starry: {
        far: 'rgba(148, 163, 184, 0.1)',
        mid: 'rgba(148, 163, 184, 0.15)',
        near: 'rgba(148, 163, 184, 0.2)'
      }
    };
    return colors[t] || colors.sunrise;
  };
  
  let speeds = $derived(waveSpeeds[theme] || waveSpeeds.sunrise);
  let colors = $derived(getWaveColors(theme));
</script>

<div class="wave-system" style="opacity: {opacity}">
  <!-- 远景波浪 -->
  <div 
    class="wave-layer wave-far"
    style="animation-duration: {speeds.far}s; color: {colors.far}"
  >
    <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
      <path d="M0,60 C150,90 350,30 600,60 C850,90 1050,30 1200,60 L1200,120 L0,120 Z" fill="currentColor"/>
    </svg>
  </div>
  
  <!-- 中景波浪 -->
  <div 
    class="wave-layer wave-mid"
    style="animation-duration: {speeds.mid}s; color: {colors.mid}"
  >
    <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
      <path d="M0,60 C200,100 400,20 600,60 C800,100 1000,20 1200,60 L1200,120 L0,120 Z" fill="currentColor"/>
    </svg>
  </div>
  
  <!-- 近景波浪 -->
  <div 
    class="wave-layer wave-near"
    style="animation-duration: {speeds.near}s; color: {colors.near}"
  >
    <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
      <path d="M0,60 C300,120 600,0 900,60 C1050,90 1150,30 1200,60 L1200,120 L0,120 Z" fill="currentColor"/>
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
    height: 80px;
    display: flex;
    transition: opacity 1s ease;
  }
  
  .wave-layer svg {
    width: 50%;
    height: 100%;
  }
  
  .wave-far {
    top: -20px;
    animation: wave-move 25s linear infinite;
  }
  
  .wave-mid {
    top: 10px;
    animation: wave-move 18s linear infinite reverse;
  }
  
  .wave-near {
    top: 35px;
    animation: wave-move 12s linear infinite;
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
    background: linear-gradient(90deg, transparent 0%, rgba(251, 191, 36, 0.3) 20%, rgba(251, 191, 36, 0.5) 50%, rgba(251, 191, 36, 0.3) 80%, transparent 100%);
    top: 20%;
    animation: shimmer 4s ease-in-out infinite;
  }

  @keyframes shimmer {
    0%, 100% { transform: translateX(-50%) scaleX(0.5); opacity: 0.3; }
    50% { transform: translateX(0%) scaleX(1); opacity: 0.6; }
  }
  
  @media (max-width: 768px) {
    .wave-layer {
      height: 40px;
    }
    
    .wave-far { top: -10px; }
    .wave-mid { top: 5px; }
    .wave-near { top: 20px; }
  }
  
  @media (prefers-reduced-motion: reduce) {
    .wave-far,
    .wave-mid,
    .wave-near {
      animation: none;
    }
  }
</style>
