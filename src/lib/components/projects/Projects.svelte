<script>
  import { onMount } from 'svelte';

  let visible = $state(false);
  /** @type {HTMLDivElement | null} */
  let sectionEl = null;

  let { projects } = $props();

  onMount(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            visible = true;
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionEl) {
      observer.observe(sectionEl);
    }

    return () => observer.disconnect();
  });
</script>

<div class="projects-container" bind:this={sectionEl} class:visible>
  <div class="projects-list">
    {#each projects as project, i}
      <article 
        class="project-card"
        style="animation-delay: {i * 150}ms"
      >
        <div class="project-header">
          <div class="project-meta">
            <span class="project-year">{project.year}</span>
            <h3 class="project-title">{project.title}</h3>
          </div>
          <div class="project-links">
          {#if project.website}
            <a href={project.website} class="project-link" target="_blank" rel="noopener">
              <img src={project.image} alt="{project.title}"/>
            </a>
            {/if}
            {#if project.github}
            <a href={project.github} class="project-link" target="_blank" rel="noopener">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"/>
              </svg>
              Github
            </a>
            {/if}
          </div>
        </div>

        <div class="project-body">
          <p>{project.description}</p>
        </div>

        <div class="project-footer">
          <div class="tech-stack">
            {#each project.tags as tech}
              <span class="tech-tag">{tech}</span>
            {/each}
          </div>
        </div>
      </article>
    {/each}
  </div>
</div>

<style>
  .projects-container {
    max-width: 900px;
    margin: 0 auto;
    padding: 0 24px 80px;
    opacity: 0;
    transform: translateY(30px);
    transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  }
  
  .projects-container.visible {
    opacity: 1;
    transform: translateY(0);
  }
  
  .projects-list {
    display: flex;
    flex-direction: column;
    gap: 32px;
  }
  
  .project-card {
    background: rgba(17, 24, 39, 0.6);
    border: 1px solid rgba(31, 41, 55, 0.5);
    border-radius: 16px;
    padding: 28px;
    opacity: 0;
    transform: translateY(20px);
    animation: cardAppear 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    animation-delay: inherit;
    transition: all 0.4s ease;
  }
  
  @keyframes cardAppear {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .project-card:hover {
    border-color: #F59E0B;
    box-shadow: 0 0 40px rgba(245, 158, 11, 0.1);
    transform: translateY(-2px);
  }
  
  .project-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 16px;
  }
  
  .project-meta {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  
  .project-year {
    font-size: .875rem;
    color: #fbbf24;
    font-family: JetBrains Mono, monospace;
    margin-bottom: 8px;
  }
  
  .project-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #f1f5f9;
    margin: 0;
  }
  
  .project-links {
    display: flex;
    gap: 14px;
  }
  
  .project-link {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 0.8rem;
    color: #9CA3AF;
    text-decoration: none;
    transition: color 0.3s ease;
  }
  
  .project-link:hover {
    color: #F59E0B;
  }
  
  img {
    width: 32px;
    height: 32px;
  }
  
  .project-body {
    display: grid;
    gap: 16px;
    margin-bottom: 20px;
  }
  
  .project-footer {
    padding-top: 16px;
    border-top: 1px solid rgba(31, 41, 55, 0.5);
  }
  
  .tech-stack {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  
  .tech-tag {
    font-family: 'JetBrains Mono', monospace;
    border: 1px solid rgba(31, 41, 55, 0.5);
    padding: 6px 14px;
    background: #64748b4d;
    color: #e2e8f0;
    font-size: .875rem;
    border-radius: 6px;
  }
  
  @media (max-width: 767px) {
    .project-card {
      padding: 20px;
    }
    
    .project-header {
      flex-direction: column;
    }
    
    .project-links {
      width: 100%;
      justify-content: flex-start;
    }
    
    .project-title {
      font-size: 1.15rem;
    }
  }
</style>
