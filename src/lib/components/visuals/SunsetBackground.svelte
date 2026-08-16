<script>
  import BaseBackground from './BaseBackground.svelte';

  let {
    skyGradient = 'linear-gradient(to bottom, #1c2a44, #3d4f6b, #776a7d)',
    seaGradient = 'linear-gradient(to bottom, #27405a, #1a2c40)',
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
  horizonGradient="linear-gradient(to bottom, rgba(20, 25, 38, 0) 0%, rgba(20, 25, 38, 0.25) 40%, rgba(96, 84, 108, 0.42) 70%, rgba(116, 100, 124, 0.55) 100%)"
  {showStarField}
  {starsOpacity}
  {starCount}
  {showShootingStars}
  {skyObjects}
  {children}
/>
