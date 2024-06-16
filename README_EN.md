<div align="center">
  <img alt="logo" src="https://blog.sanxiaoxing.cn/favicon.svg" width="200" />
</div>
Astro Triple Star is a card-like blog site that is simple, lightweight and efficient.

## Language

<span>
    <a href="README.md">
        <img src="https://cdn.jsdelivr.net/gh/SanXiaoXing/Image@main/blog/Chinese.svg" alt="Chinese" width="80" height="40" style="vertical-align: middle;">
    </a>
    <a href="README_EN.md">
        <img src="https://cdn.jsdelivr.net/gh/SanXiaoXing/Image@main/blog/English.svg" alt="English" width="80" height="40" style="vertical-align: middle;">
    </a>
</span>

# Table Of Contents
1. [Key Features](#key-features)

2. [Demo](#demo)

3. [Quick start](#quick-start)

4. [Project Structure](#project-structure)

5. [Commands](#commands)

6. [Acknowledgment](#acknowledgment)

# Key Features

- Astro v4 Fast 🚀
- TailwindCSS Utility classes
- Accessible, semantic HTML markup
- Responsive & SEO-friendly
- MD & [MDX](https://docs.astro.build/en/guides/markdown-content/#mdx-only-features) posts
- Pagination
- [Automatic RSS feed](https://docs.astro.build/en/guides/rss)
- Auto-generated [sitemap](https://docs.astro.build/en/guides/integrations-guide/sitemap/)
- [Astro Icon](https://github.com/natemoo-re/astro-icon) svg icon component
- [Expressive Code](https://expressive-code.com/) source code and syntax highlighter



# Demo

Check out the [Demo💻](https://blog.sanxiaoxing.cn/)，hosted on` Vercel` 

# Quick start

> ##  🧑‍🚀How to use

```sh
git clone https://github.com/SanXiaoXing/Template_Of_Astro.git
```

 [![前往GitHub打开](https://github.com/codespaces/badge.svg)](https://github.com/SanXiaoXing/Template_Of_Astro.git)

> 🧑‍🚀 **Home page display**    

![just-the-basics](https://cdn.jsdelivr.net/gh/SanXiaoXing/Image@main/blog/SanXiaoXing_2024-06-16_17-13-17.png)

> 🧑‍🚀 **Blog presentation**  

![just-the-basics](https://cdn.jsdelivr.net/gh/SanXiaoXing/Image@main/blog/SanXiaoXing_2024-06-16_17-14-19.png)

> 🧑‍🚀 **Friends display**  

![just-the-basics](https://cdn.jsdelivr.net/gh/SanXiaoXing/Image@main/blog/SanXiaoXing_2024-06-16_17-14-41.png)


# 🚀Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/ (root)
├── public/
│   ├── fonts/                          ## (字体存放)
│   └── favicon.svg                     ## (头像存放)
├── src/
│   ├── components/                     ## (组件布局)
│   │   ├── blog/                       ## (博客样式)
│   │   │   ├── utils/                  ## (博客组件样式)
│   │   │   │   ├── Randomblogs.astro
│   │   │   │   └── TableOfContents.astro
│   │   │   ├── Categorypage.astro
│   │   │   ├── FormatteredDate.astro
│   │   │   └── Tagpage.astro
│   │   ├── sections/                   ## (组件卡片)
│   │   │   ├── AboutMe.astro
│   │   │   ├── IntroCard.astro
│   │   │   ├── Now.astro
│   │   │   ├── TimeZoneCard.astro
│   │   │   └── StudyCard.astro
│   │   ├── ui/                         ## (组件效果)
│   │   │   ├── card.tsx
│   │   │   ├── button.tsx
│   │   │   └── badge.tsx
│   │   ├── Card.astro
│   │   ├── Footer.astro
│   │   ├── Header.astro
│   │   └── HeadSEO.astro
│   ├── content/                        ## (文本内容)
│   │   ├── blog/                       ## (博客内容)
│   │   │   └── about.md                ## (在此存放及修改博客内容)
│   │   └── friendlinks/                ## (友链)
│   │       └── friends.mjs             ## (友链内容)
│   ├── layouts/                        ## (基本布局)
│   │   └── BaseLayout.astro
│   ├── pages/                          ## (界面)
│   │   ├── 404.astro
│   │   ├── work.astro
│   │   └── index.astro
│   └── styles/                         ## (css 存放)
│       └── globals.css
└── package.json
```

- Astro在`src/ages/`目录中查找`.star`或`.md`文件。每个页面都根据其文件名显示为一条路径。

- `src/Components/`没有什么特别之处，但我们喜欢在那里放置任何Astro/Reaction/Vue/Svelte/Preact组件。

- 任何静态资源，如图片，都可以放在`public/`目录下。


# 🧞Commands

Replace  `pnpm` with your choice of ` npm / yarn `

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at`localhost:4321`       |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

# 👀Acknowledgment

This theme was inspired by [AsyncX](https://blog.asyncx.top/)
