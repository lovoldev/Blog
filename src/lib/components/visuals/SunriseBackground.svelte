<script>
  import BaseBackground from './BaseBackground.svelte';

  let {
    skyGradient = 'linear-gradient(to bottom, #13203a 0%, #263a56 100%)',
    seaGradient = 'linear-gradient(to bottom, #10233a 0%, #14283c 100%)',
    starsOpacity = 1,
    starCount = 50,
    showStarField = true,
    showShootingStars = false,
    skyObjects,
    children
  } = $props();
</script>

<BaseBackground
  {skyGradient}
  {seaGradient}
  horizonGradient="linear-gradient(to bottom, rgba(15, 23, 42, 0) 0%, rgba(15, 23, 42, 0.22) 40%, rgba(78, 100, 128, 0.4) 70%, rgba(96, 118, 146, 0.55) 100%)"
  {showStarField}
  {starsOpacity}
  {starCount}
  {showShootingStars}
  {skyObjects}
  {children}
/>
