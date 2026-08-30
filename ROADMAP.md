# Zevarc 改版路线图

> 目标：在不破坏现有"航海叙事"视觉风格的前提下，补齐内容分发、阅读体验、设计一致性与工程质量，把个人博客做成一个可长期维护、可持续增长的技术站点。

## 现状基线（Phase 0）

- SvelteKit + adapter-static（全静态预渲染）+ Cloudflare Pages 部署
- mdsvex + Shiki 渲染 Markdown，中英双语（`en`/`zh` 成对内容 + i18n 字典）
- 页面：首页 / 文章列表 / 文章详情 / 项目 / sitemap
- 视觉：日出（首页）→ 港口（列表）→ 日落（项目）三站航海主题，SVG 动画组件齐全
- 短板：无 readTime/excerpt 展示、无代码复制、无进度条、无 TOC、无标签归档、无 RSS、无搜索、无明暗主题、文章页与其他页风格割裂、部分硬编码颜色、类型不严格

---

## Phase 1 —— 阅读体验（价值最高，风险低）

**目标**：让读者在文章页的停留体验更好，放大现有内容价值。

| 任务 | 说明 | 验收标准 |
|------|------|---------|
| 1.1 readTime + excerpt | 从正文计算阅读时长，提取摘要，填充 `Post.readTime`/`excerpt`，列表与详情展示 | 列表卡片显示阅读时长与摘要，中英文单位正确 |
| 1.2 代码复制按钮 | mdsvex + Shiki 高亮块加"复制"按钮，全局事件委托实现 | 所有代码块可一键复制，有成功反馈 |
| 1.3 阅读进度条 | 文章页顶部细进度条，随滚动推进 | 滚动时进度平滑更新，无卡顿 |
| 1.4 图片懒加载 + 灯箱 | 文章图片 `loading="lazy"`，点击放大预览 | 图片延迟加载，点击可放大/关闭/ESC 退出 |

---

## Phase 2 —— 信息架构（导航与聚合）

| 任务 | 说明 | 验收标准 |
|------|------|---------|
| 2.1 标签归档页 | `/tags/[tag]` 聚合同标签文章，列表页 tag 可点击 | 点击标签进入归档页，含中英两版 |
| 2.2 目录 TOC | mdsvex 提取 heading 生成侧边目录，当前章节高亮 | 长文有目录，点击平滑滚动，当前节高亮 |
| 2.3 相关文章推荐 | 文章底部按标签相似度推荐 | 每篇文末展示 2~4 篇相关文章 |

---

## Phase 3 —— 分发与 SEO

| 任务 | 说明 | 验收标准 |
|------|------|---------|
| 3.1 RSS/Atom Feed | `/feed.xml` 输出最近文章 | feed 可被阅读器订阅，含全文或摘要 |
| 3.2 独立 OG 图 | 为每篇文章生成独立 og 图（静态渲染） | 分享时显示文章标题的配图 |
| 3.3 sitemap 校验 | 补全 sitemap lastmod、验证 hreflang 正确 | Google/Bing 可正常抓取无报错 |

---

## Phase 4 —— 设计系统与主题

| 任务 | 说明 | 验收标准 |
|------|------|---------|
| 4.1 设计 Token 收敛 | 硬编码颜色/字号收敛到 `variables.css` 变量 | 组件无散落十六进制色值 |
| 4.2 明暗主题统一 | 文章页接入海洋主题或提供明暗切换，风格统一 | 全站视觉语言一致，可跟随系统主题 |
| 4.3 视觉叙事闭环 | 文章页引入微弱海洋/灯塔元素，三站叙事连贯 | 首页→列表→文章→项目形成完整航海体验 |

---

## Phase 5 —— 工程质量

| 任务 | 说明 | 验收标准 |
|------|------|---------|
| 5.1 frontmatter 校验 | 类型守卫校验 title/date 必填，构建时告警 | 坏数据在构建期暴露 |
| 5.2 strict 预渲染 | `adapter-static` 改 `strict: true` | 构建通过且无遗漏路由 |
| 5.3 svelte-check 清零 | 修复类型/可访问性告警 | `pnpm check` 无 error |
| 5.4 断链检查 | 检查图片/内链 404 | 无死链 |

---

## Phase 6 —— 搜索与性能

| 任务 | 说明 | 验收标准 |
|------|------|---------|
| 6.1 Pagefind 搜索 | 静态站全文搜索 | 站点内可搜索文章，支持中英文 |
| 6.2 视觉组件降级 | 移动端/低端机降采样粒子、惰性启动动画 | 移动端帧率稳定、`prefers-reduced-motion` 生效 |
| 6.3 图片现代化 | PNG 转 WebP/AVIF + 响应式 `srcset` | 首屏体积下降 |

---

## 进度跟踪

- [x] Phase 0 基线梳理
- [x] Phase 1 阅读体验 ✅
  - [x] 1.1 readTime + excerpt（`src/lib/reading.ts` + `posts.ts` 填充 + 列表/详情展示，中英单位）
  - [x] 1.2 代码复制按钮（mdsvex highlight 注入 + 全局事件委托 + 反馈）
  - [x] 1.3 阅读进度条（Post 页顶部，`transform: scaleX` 高性能）
  - [x] 1.4 图片懒加载 + 灯箱（rehype 插件 + `src/lib/lightbox.js`）
- [ ] Phase 2 信息架构（2.1 标签归档页按需求跳过）
  - [x] 2.2 目录 TOC（rehypeSlug 生成唯一 heading id + 客户端提取 + IntersectionObserver 高亮 + sticky 侧边栏，移动端隐藏）
  - [x] 2.3 相关文章推荐（`findRelated` 按标签相似度 + 时效排序，文章底部展示，中英双语）
- [ ] Phase 3 分发与 SEO ✅
  - [x] 3.1 RSS/Atom Feed（`/feed.xml` + `/zh/feed.xml`，20 条，含 language/excerpt，head 中加 discovery 链接）
  - [x] 3.2 独立 OG 图（`/og/[slug].svg` 中英双语，航海主题 + 标题自动换行，文章页 og:image 指向专属图）
  - [x] 3.3 sitemap 校验（加 lastmod，`scripts/check-sitemap.mjs` 校验所有 URL 存在；顺带修复 avd-on-macos.md 无语言后缀被排除的 bug）
- [ ] Phase 4 设计系统与主题 ✅
  - [x] 4.1 设计 Token 收敛（文章页/列表/项目/首页等 10 个组件硬编码 → `--ocean-*`/`--color-*` 语义变量；新增 `--color-sun-strong`）
  - [x] 4.2 明暗主题统一（文章页深色阅读模式跟随系统 `prefers-color-scheme`，Material dark 色板覆盖；代码块统一 github-dark；导航/边框/正文自动适配）
  - [x] 4.3 视觉叙事闭环（文章页导航加 zevarc logo + 导航文案 i18n 修复）
- [ ] Phase 5 工程质量 ✅
  - [x] 5.1 frontmatter 校验（title/date 缺失时构建期 `console.warn` 告警）
  - [x] 5.2 strict 预渲染（`adapter({strict: true})`，构建通过）
  - [x] 5.3 svelte-check 清零（0 错误 0 警告，`pnpm check` script）
  - [x] 5.4 断链检查（`scripts/check-links.mjs`：58 HTML 0 断链；顺带修复 LanguageSwitcher 的 /zh/ 尾斜杠断链）
- [ ] Phase 6 搜索与性能 ✅
  - [x] 6.1 Pagefind 搜索（`/search` + `/zh/search`，构建后自动索引，中英分离 30+30 页，结果带标题/摘要/高亮；`hooks.server.js` 修复 SSR html lang；vite preview 不服务 postbuild 文件的局限不影响生产）
  - [x] 6.2 视觉组件降级（StarField 移动端星星减半/reduced-motion 移除；WaveSystem 移动端隐藏远景波+波光）
  - [x] 6.3 图片现代化（49 张 PNG/JPG → WebP，最大图 2.4MB→46KB，平均 -80%+；`scripts/optimize-images.mjs` 可复用）

## 完成状态

全部 6 个阶段完成 ✅ 建议部署验证后归档本文件。
