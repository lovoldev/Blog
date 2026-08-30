---
title: Everything You Need to Know About Migrating from Hugo to Astro
description: This article covers how to migrate from Hugo to Astro, including the steps involved, problems encountered, how to solve them, and ultimately achieving a working blog that can be accessed normally
date: 2024-12-13
updated: 2026-04-01
tags: ["Hugo", "Astro", "Blog"]
draft: false
---

After more than a week of effort, I finally completed the migration from Hugo to Astro, and the blog is now accessible.webp Along the way, I encountered numerous pitfalls, which I document here in hopes of helping others.webp

## Site Preview

![home](/images/posts/migrating-from-hugo-to-astro/home.webp)
![posts](/images/posts/migrating-from-hugo-to-astro/posts.webp)
![tabs](/images/posts/migrating-from-hugo-to-astro/tabs.webp)
![content](/images/posts/migrating-from-hugo-to-astro/content.webp)

## Background

My previous blog had been using Hugo for generation.webp After searching for themes for quite some time and going through Hugo and theme documentation multiple times, I finally got the blog up and running.webp Since I hadn't updated the blog for a long time afterward, when I recently posted an article, I found that Hugo generation had failed again.webp So I went to the official Hugo website and discovered that Hugo had been updated many versions, with some features removed or optimized.webp I had no choice but to modify the configuration according to the documentation.webp After making the changes, it still failed to generate, so I checked the theme documentation again and found that the theme hadn't been adapted to the latest version 0.138.webp I had to modify the theme while also updating the theme repository.webp This ordeal wasn't the end of it—after all that hassle, I realized I had no more time, and the styling in many places had changed.webp The immediate priority was to fix the date, but after struggling for a while, nothing satisfied me.webp So I started looking for new themes.webp After searching around, I was dissatisfied with this aspect or that aspect.webp Finally, I decided to just switch the generation tool altogether.webp That's when I found Astro.webp

## Astro

I'm not a professional frontend developer and don't know much about frontend frameworks, let alone Astro.webp The reason I chose Astro is simply because Astro can generate static pages and, like Hugo, makes it very convenient to use Markdown.webp

At the same time, I believe a blog website should remove as much clutter that interferes with reading as possible, keeping only the pure content—in other words, it should be fast and pure.webp Fortunately, Astro is famously fast, and in the future, making small style adjustments no longer requires running around everywhere—just directly using Astro.webp Thinking about it, it seems quite perfect.webp

Additionally, Astro has many official templates suitable for various scenarios, including one for personal blogs.webp I ran it and the effect was quite good—better looking than my current blog theme.webp Excited, I got to work.webp But I didn't expect problems to follow one after another.webp To avoid embarrassment, I gritted my teeth and spent over a week to get it done.webp

## Before You Begin

Before we begin, we need to prepare the following environment.webp

- Node
- Package Manager - Pnpm

For frontend projects, a Node environment is undoubtedly essential.webp

The package manager I chose is pnpm, mainly to save disk space and reduce the number of keystrokes for commands.webp

## Creating a New Astro Project

I created a new project following Astro's [official documentation](https://docs.astro.build/en/install-and-setup/).webp While there were no pitfalls here, there are a few points worth noting.webp

First, when creating a new project, you can specify a template.webp Templates can save a lot of configuration and file-adding operations, allowing us to quickly complete project setup and focus on business logic.webp Since I was building a blog, I used the following command:

```bash
pnpm create astro@latest -- --template blog
```

After the command starts executing, the tool will ask you to interact for project configuration.webp The thing I think needs attention is the Git configuration, because we're migrating and want to preserve previous commit history, so I chose not to create a new Git repository.webp Later, we'll use the original blog repository instead.webp My configuration choices are as follows:

![create astro project](/images/posts/migrating-from-hugo-to-astro/create-astro-project.webp)

Wait for the tool to finish executing.webp According to its prompts, go to the project root directory, run the `pnpm dev` command, and click the link to see the blog effect in your browser.webp When we make changes later, we'll keep `pnpm dev` running to see which content has problems in real time.webp Also, when configuring the project, we adhere to the principle of effect first: modify content first, then modify styles.webp If you've persisted this far, then we've successfully completed the first step.webp Let's continue.webp

## Copying Original Blog Content

First, let's look at the current project structure.webp

```bash
├── README.md
├── astro.config.mjs
├── package.json
├── pnpm-lock.yaml
├── public
│   ├── blog-placeholder-1.jpg
│   ├── blog-placeholder-2.jpg
│   ├── blog-placeholder-3.jpg
│   ├── blog-placeholder-4.jpg
│   ├── blog-placeholder-5.jpg
│   ├── blog-placeholder-about.jpg
│   ├── favicon.svg
│   └── fonts
│       ├── atkinson-bold.woff
│       └── atkinson-regular.woff
├── src
│   ├── components
│   │   ├── BaseHead.astro
│   │   ├── Footer.astro
│   │   ├── FormattedDate.astro
│   │   ├── Header.astro
│   │   └── HeaderLink.astro
│   ├── consts.ts
│   ├── content
│   │   └── blog
│   │       ├── first-post.md
│   │       ├── markdown-style-guide.md
│   │       ├── second-post.md
│   │       ├── third-post.md
│   │       └── using-mdx.mdx
│   ├── content.config.ts
│   ├── layouts
│   │   └── BlogPost.astro
│   ├── pages
│   │   ├── about.astro
│   │   ├── blog
│   │   │   ├── [...slug].astro
│   │   │   └── index.astro
│   │   ├── index.astro
│   │   └── rss.xml.js
│   └── styles
│       └── global.css
└── tsconfig.json
```

There are a few parts here worth noting.webp

`public` is where static assets are stored, such as images and fonts.webp

All content is under the `src` directory.webp Inside is a `pages` folder containing all pages, where our page logic will be.webp `content` is where Markdown files are stored, which we'll discuss later.webp

To see the content as quickly as possible, we need to copy the following directories to their corresponding locations:

```bash
.git        =>  .git
static      =>  public
content     =>  src/content
```

After completing these steps, all our old blog content has been migrated over, just without any of the original styles.webp At this point, if you're running in development mode and looking at the console, you'll see an error indicating it can't find the `posts` directory.webp

![can't find posts](/images/posts/migrating-from-hugo-to-astro/cant-find-posts.webp)

Because at this point, my `content` directory looks like this:

```bash
content
│   ├── about
│   ├── blog
│   ├── posts
```

So the next step is to configure Markdown content.webp

## Linking to Markdown Files

Astro uses content collections to manage Markdown files.webp The main documentation is [here](https://docs.astro.build/en/guides/content-collections/).webp I'll summarize it briefly:

- Direct subdirectories under `content` are each a content collection.webp For example, my directory above has three content collections, corresponding to `about`, `blog`, and `posts`.webp
- Content collections can be nested, using subdirectories to organize content.webp
- Markdown files in content collections need to store some metadata (frontmatter) in a specific format, such as titles and dates for the rendering stage.webp
- Content collections can validate Markdown files at compile time, ensuring Markdown files have valid frontmatter.webp
- The content within collections needs to be exported by us, along with defining the frontmatter to validate.webp

With this information, we have enough to continue.webp

First, we need to configure content collections in `src/content.config.ts`.webp You can see that `blog` already exists.webp We just need to add `posts` following the same format.webp

```typescript
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
	loader: glob({ base: './src/content/posts', pattern: '**/*.{md,mdx}' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		date: z.coerce.date(),
		tags: z.array(z.string()),
		draft: z.boolean().optional()
	}),
});

// Same for about

// Remember to export at the end
export const collections = { posts,about };
```

The `defineCollection` function takes an object with two properties: `loader` and `schema`.webp `loader` is a function that tells it where to look and what files to find.webp `schema` is a Zod object used to validate the frontmatter of Markdown files.webp Hugo's Markdown files happen to have this information.webp We just need to ensure these data formats match.webp

If everything goes well, the Markdown files are now imported into the project.webp But if any Markdown file's frontmatter format is incorrect, it will throw an error, as shown below.webp

![invalid frontmatter](/images/posts/migrating-from-hugo-to-astro/invalid-format.webp)

Just go through the paths and fix them one by one.webp If there are too many, you can simply remove the validation in `src/content.config.ts`.webp

## Accessing Markdown Files

In the previous step, we imported the Markdown files, but we can't access them yet because there are no routes—Astro doesn't know where to find the page to display when you enter an address, and the displayed page doesn't know which Markdown file to use.webp So to see our articles, we need to do two things: route configuration and page configuration.webp

### Route Configuration

Configuring [routes](https://docs.astro.build/en/guides/routing/) in Astro is simple—just **create corresponding directories and files based on the URL**.webp For example, the template file's `/blog/first-post` corresponds to `src/pages/blog/[...slug].astro`.webp Following this rule, my original blog structure was `/posts/xxx/index.md`, so the corresponding route is `/posts/xxx`.webp Here, `posts` is easy to understand—just create a `/posts/` directory under `src/content/`.webp But `xxx` is more troublesome because article names are arbitrary and will constantly be added or deleted.webp It's impossible to configure a separate folder for each Markdown file.webp Fortunately, Astro thought of this and introduced dynamic routing.webp

Before explaining dynamic routing, let's discuss static routing.webp Static routing boils down to two rules:

- The route path matches the file path.webp
- When directly accessing a directory, Astro looks for the `index.astro` file in that directory as the rendering page.webp

If the directory name is `/posts/[slug]`, then when accessing `/posts/123`, Astro will use `src/pages/posts/[slug]/index.astro` to render the page.webp In other words, `[xxx]` represents a variable directory name.webp Note that `[]` is required, and the `xxx` inside can be any name.webp This only handles the case where a single directory level is variable.webp If the URL hierarchy is variable—could be one level or multiple—then you need to use rest parameters.webp Rest parameters in the form `[...slug].astro` can match multiple levels.webp For example, for `/posts/123/456/789`, when accessing `/posts/123/456`, Astro will use `src/pages/posts/[...slug].astro` to render the page.webp

In summary, by **creating a `posts` directory under `src/content/` and creating a `[...slug].astro` file under `posts`, all Markdown files can be matched to this page**.webp However, the route configuration process is far from over, because **dynamic routing consists of two parts: file structure configuration and route export configuration**.webp How do we understand this? When we access a correct Markdown file, we want to render its content.webp When accessing a path not in the content collection, we want Astro to return 404.webp We need to tell Astro which are correct and which are incorrect.webp The way to tell it is by exporting a `getStaticPaths` function in the file.webp

With the `getStaticPaths` function's purpose clarified, its implementation is not difficult to deduce.webp We need to somehow query all Markdown files, use paths to populate the dynamic routing parameters, and return an array.webp Each element in the array is an object with two properties: `params` and `props`.webp `params` is the dynamic routing parameter, and `props` is the data the page needs.webp For querying Markdown files, continuing from the content collections section, Astro provides the `getCollection` function.webp It takes a content collection name and returns an array, where each element is the metadata of a Markdown file.webp The metadata includes `id`, `title`, `description`, etc.webp We just need to use `id` as the parameter and other data as `props` to complete the route configuration.webp Here's the code in our `src/pages/posts/[...slug].astro` file:

```astro
---
import { type CollectionEntry, getCollection } from 'astro:content';
import BlogPost from '../../layouts/BlogPost.astro';
import { render } from 'astro:content';

export async function getStaticPaths() {
	const posts = await getCollection('posts');
	return posts.map((post) => ({
		params: { slug: post.id },
		props: post,
	}));
}
type Props = CollectionEntry<'posts'>;

const post = Astro.props;
const { Content } = await render(post);
---

<BlogPost {...post.data}>
	<Content />
</BlogPost>
```

At this point, if you're in development mode, you should be able to see the corresponding page by entering a Markdown file's path.webp But manually entering URLs is tedious.webp We can follow the template file's content, create an `index.astro` file under `src/pages/posts/`, copy the template file's content, and replace `blog` with `posts`.webp This way, we can directly enter `http://localhost:4321/posts` in the browser to see all Markdown files.webp Clicking on a list item will show the correct page.webp

### Page Configuration

Although we've successfully seen rendered pages, we don't yet understand what's happening.webp Let's continue from the previous section and discuss where the page comes from.webp

Astro divides an `.astro` file into two parts: **the top half is script, the bottom half is page**.webp Scripts are wrapped with `---` and execute during the build phase by default.webp The page following the script generates the UI.webp It can use various UI frameworks or regular HTML tags.webp During compilation, the compiler first executes `getStaticPaths` to get routing information, then executes the remaining script content based on the routing information to get rendering data, and finally combines the rendering data with the page template to get the final page.webp

Taking the previous example, in the script content, besides the exported `getStaticPaths` function and import statements, there are just the last two lines of code.webp

Let's look at the first line:

```astro
const post = Astro.props;
```

The purpose of this line is to read the metadata of the Markdown file corresponding to the route.webp Remember where this data came from? It was returned in `getStaticPaths`.webp After getting the source data, the second line uses the official library `render` to render the Markdown file into UI.webp At this point, it's still just data, and remember this executes during the build phase.webp Next, let's look at the page section to see how the UI uses this data.webp

```astro
<BlogPost {...post.data}>
	<Content />
</BlogPost>
```

In the UI section, we can see that the page uses variables generated from script execution: `post` and `Content`.webp This is also a rule in Astro—**pages can directly use variables generated by scripts**.webp

Based on this example, let me try to summarize the entire process: The developer obtains routing information through some logic and returns the corresponding routes and data via `getStaticPaths`.webp During compilation, the compiler calls `getStaticPaths`, gets routing information, and uses the routes to generate pages one by one.webp During each page generation, the script section executes first to get the data needed for rendering the UI.webp Finally, the script data is combined with the page template to get the final HTML page.webp This is the basic process of Astro static page generation.webp

Other concepts like components and layouts are common and won't be detailed here—you can check the official documentation when needed.webp So far, it seems like our blog migration is complete.webp But in reality, we've only reached Zunyi on a long march.webp There are still two major topics ahead: internationalization and theming.webp

## Internationalization

### Routing

Since the previous blog had an English version, internationalization support is essential.webp Although there are currently only Chinese and English, considering future changes, I still didn't use the method from the [official documentation](https://docs.astro.build/en/guides/internationalization/).webp The official documentation offers only two internationalization methods:

1.webp Use default language plus other languages.webp The advantage is that it perfectly matches my previous Hugo routing format.webp The disadvantage is that there will be two essentially identical files distributed in different directories.webp
2.webp All languages use the same file, but when accessing an address without a language prefix, a 404 error occurs.webp

Both methods have pros and cons, but they're still different from what I envisioned.webp First, I want all multilingual files to exist in only one copy, with multilingualism reflected in the data.webp Second, I want to remove the default language prefix for Chinese.webp Through experimentation, I found `Astro.rewrite`.webp

First, using official method 2, I created the `src/pages/[lng]` directory and created an `index.astro` file in that directory as the blog's home page.webp So to support both Chinese and English, I need to return a language array in `getStaticPaths` so Astro generates routes for the corresponding languages.webp

```astro
export async function getStaticPaths() {
  return ['zh','en'].map(lng => ({ params: { lng } }))
}
```

Now, both `http://localhost:4321/zh` and `http://localhost:4321/en` can access the same home page.webp However, accessing `http://localhost:4321/` results in a 404.webp According to previous knowledge, we should create an `index.astro` in the `src/pages/` directory.webp But what about the content? We can't just copy `src/pages/[lng]/index.astro`, as that would follow the official approach.webp Here, just one simple statement can achieve the same effect as accessing `http://localhost:4321/zh`.webp

```astro
---
return Astro.rewrite("/zh")
---
```

With the routing issue solved, the next step is filling in the content data.webp We need a way to extract the corresponding language data when executing the script and populate it into the page.webp

### Localization

The main content of localization is reading the localization file and returning the corresponding data based on language information.webp So we need to create a directory to store localization files.webp Create an `i18n` directory under `src`, and create `ui.ts` in that directory containing the localization object:

```typescript
export const ui = {
    en: {
        'title': 'Deep thinking home page',
        'description': 'A home page for deep thinking, share some articles about Android, OpenGLES, Python, HTML/CSS etc.'
    },
    zh: {
        'title': '低头沉思博客主页',
        'description': '低头沉思博客主页，分享有关Android，OpenGLES，Python，HTML/CSS等文章',
    }
}
```

Then create a `utils.ts` file in the same directory to look up corresponding language entries.webp

```typescript
import { ui, defaultLanguage,simpleLanguages } from './ui';

export function useTranslations(lang: string|undefined) {
  return function t(key: keyof typeof ui[typeof defaultLanguage]) {
    return ui[lang??defaultLanguage][key] || ui[defaultLanguage][key];
  }
}
```

With the utilities ready, let's see how to use them on the home page.webp

Open `src/pages/[lng]/index.astro` and add the following code:

```astro
---
import { useTranslations } from "../../i18n/utils";
const { lng } = await Astro.params;
const t = useTranslations(lng);
---
<!doctype html>
<html lang={lng}>
	<head>
		<BaseHead title={t('title')} description={t('description')} />
	</head>
	<body>
		<h1>{t('title')}</h1>
	</body>
</html>
```

Here I used something new: `Astro.params`.webp It represents the route parameters for the page being compiled.webp For example, we returned `[{params:{lng:'zh'}},{params:{lng:'en'}}]` in `getStaticPaths`.webp The compiler executes page generation in order.webp When generating the Chinese home page, the `lng` property of `Astro.params` is `zh`.webp Similarly, for English it's `en`.webp Then use the utility class to find the corresponding localization object.webp In the page, use `t('name')` to get the corresponding localization entry data.webp

At this point, the blog website has taken shape.webp You can access articles, and it has internationalization functionality like the old site.webp

## Theming

Theming is key to personalization, so first we need to clarify our customization approach.webp My requirements are: custom website colors, easy modification, and support for light/dark mode.webp Although the template already has a beautiful style, it's not personalized enough, and the style files are scattered in various places, making modification inconvenient.webp So I searched extensively online, looked through various standards and reference articles, and chose `Tailwind CSS` as the theming framework.webp It's not only simple to use but also very flexible for personalization.webp

The framework is chosen, but we still need to select custom colors.webp Based on previous experience, I went to [Material Design](https://m3.material.io/styles/color/system/overview) for inspiration, where I found a color tool called [Material Theme Builder](https://www.figma.com/community/plugin/1034969338659738588/material-theme-builder).webp It can not only export color files but also simultaneously support dark mode—it's as if it was made for me.webp

Next, let me briefly explain the customization approach using the framework and tools.webp

### Choosing Colors

Open Material Theme Builder in Figma, find the Source color, click the color icon in front of it, and a color palette will appear for you to choose colors.webp Colors update in real-time on the page, so you can get satisfactory colors based on the display effect.webp If you don't know which color you like, just click the crossed arrow icon at the back, and it will generate a new color scheme with random colors.webp When you're satisfied with all effects, click Export at the bottom and select Web to export a compressed file.webp After extracting, you get both light and dark CSS files.webp

### Configuring the Theme

Back in the project, we need to install dependencies before using `Tailwind CSS`:

```bash
pnpm astro add tailwind
```

During installation, it will modify our project configuration file `astro.config.mjs` and add its own configuration file `tailwind.config.mjs`.webp Just follow the prompts.webp After installation, you can make custom configurations in `src/style/global.css`.webp

First, because I wanted to completely do my own styling, I removed all content from `src/style/global.css` and added Tailwind CSS's default styles:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

This gives me a website with no styles.webp Since I want the website to display the light theme by default, I need to move the `.light` section from `light.css` into `src/style/global.css` and use it as variables in the root styles.webp

```css
@layer base {
	:root {
		--md-sys-color-primary: rgb(27 101 133);
		--md-sys-color-surface-tint: rgb(27 101 133);
        ...webp
    }
}
```

Then define a dark mode class for the root styles, moving the `.dark` section from `dark.css` into `src/style/global.css` and appending it.webp This is how my file content looks:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
	:root {
		--md-sys-color-primary: rgb(27 101 133);
		--md-sys-color-surface-tint: rgb(27 101 133);
        ...webp
    }
    :root .dark {
        --md-sys-color-primary: rgb(143 206 243);
        --md-sys-color-surface-tint: rgb(143 206 243);
    }
}
```

Although you can also modify these using `tailwind.config.mjs`, it requires format conversion and is inconvenient for later modifications.webp So I use this direct approach.webp The benefit is that you can directly use variables in pages to specify colors:

```astro
<header class="bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]">
</header>
```

The code above uses `--md-sys-color-surface-container` to specify the background color and `--md-sys-color-on-surface` to specify the text color.webp To switch to dark mode, just add `class="dark"` to `body`—it's perfect.webp

That's a complete customization approach.webp The subsequent work is to continuously adjust styles, layouts, and interactions based on the website's display effects until you're satisfied.webp

## Article Pagination

This section is included here because as styling modifications progressed, I found that displaying all articles on one page showed too much data and pagination was needed.webp There are two points worth noting in this section.webp

First is routing.webp When users click the [Articles] menu, the navigation address is `lng/posts`.webp But this page's data needs pagination, so it should access `lng/posts/1/`.webp Using the previously introduced `Astro.rewrite('/lng/posts/1')` solves this.webp

Second is the pagination function.webp The official documentation has pagination function instructions, but the examples aren't rich enough.webp My blog needs to not only display pagination but also handle pagination while considering internationalization.webp

Before explaining the solution, let's look at the project's file structure:

```
├── src
│   ├── pages
│   │   ├── blog
│   │   │   ├── [...slug].astro
│   │   │   ├── [page].astro
│   │   │   └── index.astro
```

First, to solve both routing and pagination issues, we need to create a `[page].astro` file with pagination logic.webp Obviously, this uses dynamic routing again.webp Next, we need to move the content from `index.astro` into `[page].astro`.webp The modified `index.astro` looks like this:

```astro
---
import { getStaticPaths } from "../../../i18n/utils";
export { getStaticPaths };

const {lng}=Astro.params
return Astro.rewrite(`${lng}/posts/1`)
---
```

This solves the first problem.webp

Next is pagination.webp According to the official [documentation](https://docs.astro.build/en/guides/routing/#pagination), pagination is implemented by adding function parameters in the `getStaticPaths` function.webp Following previous experience, we query all articles, then return the article list as the return value.webp The difficulty is matching both language and articles.webp So the approach is to first query all articles by language, then use the article list and language as parameters to construct the return value for pagination.webp

```ts
export async function getStaticPaths({ paginate }) {
    return (
        await Promise.all(
            simpleLanguages.flatMap(async (lng) => {
                const posts = await getPosts(lng);
                return paginate(posts, { pageSize: 10, params: { lng } });
            }),
        )
    ).flat();
}
```

The key point here is to provide `params` along with `posts`; otherwise, you'll get a `Missing parameter: lng` error.webp

## Summary

Migrating from Hugo to Astro is generally straightforward, but the migration process needs to follow a certain process and method.webp Focusing on the big picture and letting go of minor details can greatly boost confidence and ensure successful migration.webp During the migration process, the first thing to focus on is content, so import the content successfully first.webp The import process involves routing and page-related knowledge, so you can refer to the official website for more on these topics.webp Second, during the personalization process, first clarify your requirements, choose appropriate tools, and plan well.webp Otherwise, if halfway through personalization you find some requirements are difficult to implement, the cost of starting over is quite high.webp For this part, I recommend using `Tailwind CSS`.webp

If there's anything unclear, you're welcome to check my corresponding source code at https://github.com/zevarc/Blog.webp I've minimized encapsulation as much as possible to ensure code purity.webp You're also welcome to visit my blog website (https://zevarc.com/) to see the actual display effect.webp

## References

1.webp [Astro](https://docs.astro.build/)
2.webp [Material you](https://m3.material.io)
2.webp [Material theme builder](https://www.figma.com/community/plugin/1034969338659738588/material-theme-builder)
2.webp [Tailwind CSS](https://tailwindcss.com/)
3.webp [Source code](https://github.com/zevarc/Blog)
