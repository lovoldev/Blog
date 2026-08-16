<script>
  // Sun visual
  let { x = 50, y = 50, opacity = 1, animated = true } = $props();
</script>

<div class="sun" style="left: {x}%; top: {y}%; opacity: {opacity}">
  <div class="sun-core"></div>
  <div class="sun-glow" class:animated={animated}></div>
</div>

<style>
  .sun {
    position: absolute;
    transform: translate(-50%, -50%);
    transition: all 0.3s ease-out;
  }

  .sun-core {
    width: 56px;
    height: 56px;
    background: linear-gradient(135deg, #fdf3e3, #f6d9a8);
    border-radius: 50%;
    position: relative;
    z-index: 2;
  }

  .sun-glow {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 140px;
    height: 140px;
    background: radial-gradient(circle, rgba(246, 217, 168, 0.28) 0%, transparent 70%);
    border-radius: 50%;
    z-index: 1;
  }

  .sun-glow.animated {
    animation: pulse 6s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
    50% { transform: translate(-50%, -50%) scale(1.05); opacity: 0.7; }
  }

  @media (prefers-reduced-motion: reduce) {
    .sun-glow.animated { animation: none; }
  }
</style>
