<script>
  import { onMount } from 'svelte';

  const { posts, readMoreLabel = 'Read More →' } = $props();

  let visible = $state(false);
  /** @type {HTMLDivElement | null} */
  let sectionEl = null;

  /**
   * @param {string} dateStr
   */
  function formatDate(dateStr) {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  }

  onMount(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            visible = true;
          }
        });
      },
      { threshold: 0.1 },
    );

    if (sectionEl) {
      observer.observe(sectionEl);
    }

    return () => observer.disconnect();
  });
</script>

<div class="posts-container" bind:this={sectionEl} class:visible={visible}>
  {#each posts as post, i}
    <article class="post-card" style={`animation-delay: ${0.1 + i * 0.1}s`}>
      <div class="post-meta">
        <span class="post-date">{formatDate(post.date)}</span>
        {#if post.readTime}
          <span class="post-readtime">{post.readTime}</span>
        {/if}
      </div>
      <h2 class="post-title">{post.title}</h2>
      {#if post.tags?.length}
        <div class="post-tags">
          {#each post.tags as tag}
            <span class="tag">{tag}</span>
          {/each}
        </div>
      {/if}
      <p class="post-excerpt">{post.excerpt}</p>
      <a class="read-more" href={`/${post.url}`}>{readMoreLabel}</a>
    </article>
  {/each}
</div>

<style>
  .posts-container {
    display: flex;
    flex-direction: column;
    gap: 24px;
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .posts-container.visible {
    opacity: 1;
    transform: translateY(0);
  }

  .post-card {
    border-top: 1px solid rgba(148, 163, 184, 0.1);
    padding: 32px;
    -webkit-backdrop-filter: blur(10px);
    backdrop-filter: blur(10px);
  }

  .post-card:hover {
    border: 1px solid #ddd;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  .post-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 10px;
    font-size: 0.875rem;
    color: #cbd5e1;
    font-family: JetBrains Mono, monospace;
  }

  .post-date {
    color: #fbbf24;
  }

  .post-readtime {
    color: #94a3b8;
  }

  .post-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #f1f5f9;
    margin: 0 0 10px;
  }

  .post-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
  }

  .tag {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    border-radius: 999px;
    background: rgba(56, 189, 248, 0.12);
    color: #38bdf8;
    font-size: 0.875rem;
    border: 1px solid rgba(56, 189, 248, 0.4);
  }

  .post-excerpt {
    font-size: 1rem;
    color: #94a3b8;
    margin: 0 0 20px;
    line-height: 1.6;
  }

  .read-more {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: #38bdf8;
    text-decoration: none;
    font-weight: 500;
    transition: gap 0.3s ease;
  }

  .read-more:hover {
    gap: 12px;
  }

  @media (max-width: 767px) {
    .post-card {
      padding: 24px;
    }

    .post-title {
      font-size: 1.2rem;
    }

    .post-excerpt {
      display: none;
    }
  }
</style>
