<script>
  let { href = '#', label = '', onClick } = $props();

  /**
   * @param {MouseEvent} event
   */
  function handleClick(event) {
    if (onClick) {
      onClick(event);
    }
  }
</script>

<a href={href} class="nav-link" onclick={handleClick}>
  {label}
  <svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
</a>

<style>
  .nav-link {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    padding: 16px 32px;
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    color: #0f172a;
    text-decoration: none;
    font-weight: 700;
    font-size: 1.05rem;
    border-radius: 50px;
    transition: all 0.3s ease;
    box-shadow: 0 4px 20px rgba(251, 191, 36, 0.3);
  }

  .nav-link:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(251, 191, 36, 0.35);
  }

  .arrow {
    width: 20px;
    height: 20px;
  }
</style>
