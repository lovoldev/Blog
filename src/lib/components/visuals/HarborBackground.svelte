<script>
  import BaseBackground from './BaseBackground.svelte';

  let {
    skyGradient = 'linear-gradient(to bottom, #15223a 0%, #263852 100%)',
    seaGradient = 'linear-gradient(to bottom, #1f3049 0%, #15263a 100%)',
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
  horizonGradient="linear-gradient(to bottom, rgba(15, 23, 42, 0) 0%, rgba(15, 23, 42, 0.25) 40%, rgba(60, 82, 112, 0.42) 70%, rgba(74, 96, 126, 0.58) 100%)"
  {showStarField}
  {starsOpacity}
  {starCount}
  {showShootingStars}
  {skyObjects}
  {children}
/>
