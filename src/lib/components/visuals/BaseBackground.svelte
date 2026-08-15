<script>
  /**
   * BaseBackground - 基础背景容器，提供天空/海面/星空层和插槽。
   * @prop {string} skyGradient - 天空渐变
   * @prop {string} seaGradient - 海面渐变
   * @prop {string} horizonGradient - 地平线过渡渐变
   * @prop {boolean} showStarField - 是否显示星空
   * @prop {number} starsOpacity - 星空透明度
   * @prop {number} starCount - 星星数量
   * @prop {boolean} showShootingStars - 是否显示流星
   * @prop {Snippet} skyObjects - 天空中的物体（太阳/月亮等）
   * @prop {Snippet} children - 海面内容（波浪/小船等）
   */

  import StarField from './StarField.svelte';

  let {
    skyGradient = 'linear-gradient(to bottom, #020617 0%, #0f172a 100%)',
    seaGradient = 'linear-gradient(to bottom, #000814 0%, #001219 100%)',
    horizonGradient = 'linear-gradient(to bottom, rgba(15, 23, 42, 0) 0%, rgba(15, 23, 42, 0.3) 30%, rgba(3, 105, 161, 0.5) 60%, rgba(3, 105, 161, 0.8) 100%)',
    showStarField = true,
    starsOpacity = 1,
    starCount = 50,
    showShootingStars = false,
    skyObjects,
    children
  } = $props();
</script>

<div class="theme-background">
  <div class="sky" style={`background: ${skyGradient}`}>
    {#if showStarField}
      <div class="stars-layer" style={`opacity: ${starsOpacity}`}>
        <StarField count={starCount} opacity={starsOpacity} showShootingStars={showShootingStars} />
      </div>
    {/if}
    {#if skyObjects}
      {@render skyObjects()}
    {/if}
  </div>

  <div class="horizon-blend" style={`background: ${horizonGradient}`}></div>

  <div class="sea" style={`background: ${seaGradient}`}>
    {#if children}
      {@render children()}
    {/if}
  </div>

  <div class="vignette"></div>
</div>

<style>
  .theme-background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
  }

  .sky {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 60%;
    transition: background 1.5s ease;
  }

  .stars-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transition: opacity 1s ease;
  }

  .horizon-blend {
    position: absolute;
    top: 55%;
    left: 0;
    width: 100%;
    height: 15%;
    filter: blur(8px);
    z-index: 2;
    pointer-events: none;
  }

  .sea {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 45%;
    transition: background 1.5s ease;
    overflow: hidden;
  }

  .vignette {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0.4) 100%);
    pointer-events: none;
    z-index: 15;
  }
</style>
