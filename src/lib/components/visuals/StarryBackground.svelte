<script>
  import BaseBackground from './BaseBackground.svelte';

  let {
    skyGradient = 'linear-gradient(to bottom, #020617 0%, #0f172a 60%, #1e293b 100%)',
    seaGradient = 'linear-gradient(to bottom, #0f172a 0%, #020617 100%)',
    showStarField = true,
    starsOpacity = 1,
    starCount = 80,
    showShootingStars = true,
    skyObjects,
    children
  } = $props();
</script>

<BaseBackground
  {skyGradient}
  {seaGradient}
  horizonGradient="linear-gradient(to bottom, rgba(15, 23, 42, 0) 0%, rgba(15, 23, 42, 0.3) 30%, rgba(15, 23, 42, 0.5) 60%, rgba(15, 23, 42, 0.8) 100%)"
  {showStarField}
  {starsOpacity}
  {starCount}
  {showShootingStars}
  {skyObjects}
  {children}
/>
