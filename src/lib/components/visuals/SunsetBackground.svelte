<script>
  import BaseBackground from './BaseBackground.svelte';

  let {
    skyGradient = 'linear-gradient(to bottom, #1e3a5f, #475569, #fd746c)',
    seaGradient = 'linear-gradient(to bottom, #1e3a5f, #0f172a)',
    showStarField = false,
    starsOpacity = 0,
    starCount = 0,
    showShootingStars = false,
    skyObjects,
    children
  } = $props();
</script>

<BaseBackground
  {skyGradient}
  {seaGradient}
  horizonGradient="linear-gradient(to bottom, rgba(124, 45, 18, 0) 0%, rgba(124, 45, 18, 0.3) 30%, rgba(30, 41, 59, 0.5) 60%, rgba(30, 41, 59, 0.8) 100%)"
  {showStarField}
  {starsOpacity}
  {starCount}
  {showShootingStars}
  {skyObjects}
  {children}
/>
