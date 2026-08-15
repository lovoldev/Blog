<script>
  import { page } from '$app/stores';

  let { overrideHref = undefined } = $props();

  // 获取当前语言
  let currentLang = $derived($page.url.pathname.startsWith('/zh') ? 'zh' : 'en');
  
  // 获取切换后的路径
  /**
   * @param {string} currentPath
   * @param {string} targetLang
   */
  function getSwitchPath(currentPath, targetLang) {
    if (targetLang === 'zh') {
      // 切换到中文 - 添加 /zh 前缀
      return '/zh' + currentPath;
    } else {
      // 切换到英文 - 移除 /zh 前缀
      if (currentPath.startsWith('/zh')) {
        return currentPath.replace('/zh', '') || '/';
      }
      return currentPath;
    }
  }
  
  let switchPath = $derived(overrideHref ?? getSwitchPath($page.url.pathname, currentLang === 'en' ? 'zh' : 'en'));
</script>

<a href={switchPath} class="lang-switch">
  {currentLang === 'en' ? '中文' : 'English'}
</a>

<style>
  .lang-switch {
    position: fixed;
    top: 24px;
    right: 24px;
    z-index: 1000;
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.875rem;
    text-decoration: none;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
  }
  
  .lang-switch:hover {
    background: rgba(251, 191, 36, 0.2);
    border-color: rgba(251, 191, 36, 0.5);
    color: #fbbf24;
  }
</style>
