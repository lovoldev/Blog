<script>
  import BaseBackground from './BaseBackground.svelte';

  let {
    skyGradient = 'linear-gradient(to bottom, #0f172a 0%, #1e293b 100%)',
    seaGradient = 'linear-gradient(to bottom, #1e293b 0%, #0f172a 100%)',
    showStarField = false,
    starsOpacity = 1,
    starCount = 50,
    showShootingStars = false,
    skyObjects,
    children
  } = $props();
</script>

<BaseBackground
  {skyGradient}
  {seaGradient}
  horizonGradient="linear-gradient(to bottom, rgba(15, 23, 42, 0) 0%, rgba(15, 23, 42, 0.3) 30%, rgba(3, 105, 161, 0.5) 60%, rgba(3, 105, 161, 0.8) 100%)"
  {showStarField}
  {starsOpacity}
  {starCount}
  {showShootingStars}
  {skyObjects}
  {children}
/>
