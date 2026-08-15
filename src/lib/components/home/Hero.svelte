<script>
  const { t, topics, contentVisible, nextLink, onExplore } = $props();

  /**
   * @param {MouseEvent} event
   */
  function handleExplore(event) {
    event.preventDefault();
    onExplore?.(event);
  }
</script>

<div class="content" class:visible={contentVisible}>
  <h1 class="title">
    {t.hero.title}
    <span class="phonetic">{t.hero.phonetic}</span>
  </h1>

  <!-- 词源解释 -->
  <div class="etymology">
    <span class="etym-item">{t.hero.etymology.zero}</span>
    <span class="etym-plus">+</span>
    <span class="etym-item">{t.hero.etymology.evolution}</span>
    <span class="etym-plus">+</span>
    <span class="etym-item">{t.hero.etymology.arc}</span>
  </div>

  <p class="slogan">{t.hero.slogan}</p>

  <!-- 技术标签 -->
  <div class="topics">
    {#each topics as topic}
      <span class="topic-tag">{topic}</span>
    {/each}
  </div>

  <p class="description">{t.hero.description}</p>

  <a href={nextLink} class="cta-button" onclick={handleExplore}>
    {t.hero.cta}
    <span class="arrow">→</span>
  </a>
</div>

<style>
  .content {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    color: white;
    z-index: 20;
    padding: 0 20px;
    opacity: 0;
    transition: opacity 0.8s ease;
    max-width: 700px;
  }

  .content.visible {
    opacity: 1;
  }

  .title {
    font-size: clamp(3rem, 8vw, 5rem);
    font-weight: 700;
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    flex-wrap: wrap;
  }

  .phonetic {
    position: relative;
    margin-top: 1.5em;
    font-size: clamp(1rem, 2.5vw, 1.5rem);
    font-weight: 300;
    font-family: "Noto Serif", "Charis SIL", "Doulos SIL", "Times New Roman",
      serif;
    color: rgba(251, 191, 36, 0.9);
  }

  /* 词源解释 */
  .etymology {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin: 24px 0;
    flex-wrap: wrap;
  }

  .etym-item {
    font-family: "JetBrains Mono", monospace;
    font-size: clamp(0.875rem, 2vw, 1.125rem);
    padding: 8px 16px;
    background: rgba(56, 189, 248, 0.15);
    border: 1px solid rgba(56, 189, 248, 0.3);
    border-radius: 8px;
    color: #7dd3fc;
  }

  .etym-plus {
    font-size: 1.25rem;
    color: rgba(251, 191, 36, 0.8);
  }

  .slogan {
    font-size: clamp(1.125rem, 2.5vw, 1.5rem);
    margin: 20px 0;
    font-weight: 500;
    color: #f8fafc;
  }

  /* 技术标签 */
  .topics {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin: 20px 0;
    flex-wrap: wrap;
  }

  .topic-tag {
    padding: 6px 14px;
    background: rgba(251, 191, 36, 0.15);
    border: 1px solid rgba(251, 191, 36, 0.3);
    border-radius: 20px;
    font-size: 0.875rem;
    color: #fbbf24;
    transition: all 0.3s ease;
  }

  .topic-tag:hover {
    background: rgba(251, 191, 36, 0.25);
    transform: translateY(-2px);
  }

  .description {
    font-size: clamp(0.875rem, 2vw, 1rem);
    margin: 20px 0 30px;
    opacity: 0.9;
    max-width: 500px;
  }

  .cta-button {
    display: inline-flex;
    align-items: center;
    color: rgb(15, 23, 42);
    font-weight: 600;
    font-size: 1.0625rem;
    box-shadow: rgba(56, 189, 248, 0.3) 0px 4px 20px;
    gap: 12px;
    padding: 16px 32px;
    background: linear-gradient(135deg, rgb(56, 189, 248), rgb(129, 140, 248));
    text-decoration: none;
    border-radius: 12px;
    transition: 0.3s;
  }

  .cta-button:hover {
    transform: translateY(-3px);
    box-shadow: rgba(56, 189, 248, 0.4) 0px 8px 30px;
  }

  .arrow {
    animation: arrow-bounce 1.5s ease-in-out infinite;
  }

  .cta-button:hover .arrow {
    transform: translateX(4px);
    animation: none;
  }

  @keyframes arrow-bounce {
    0%, 100% {
      transform: translateX(0);
    }
    50% {
      transform: translateX(6px);
    }
  }

  @media (max-width: 768px) {
    .title {
      letter-spacing: 0.05em;
    }

    .etymology {
      gap: 8px;
    }

    .etym-item {
      padding: 6px 12px;
      font-size: 0.75rem;
    }

    .cta-button {
      padding: 0.875rem 1.5rem;
      font-size: 0.875rem;
    }
  }
</style>
