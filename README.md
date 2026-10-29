<div align="center">
  <img alt="logo" src="https://blog.sanxiaoxing.cn/favicon.svg" width="200" />
</div>
Astro SanXiaoXing是一个卡片式的博客网站，简易、轻量、高效

## 更换语言

<span>
    <a href="README.md">
        <img src="https://cdn.jsdelivr.net/gh/SanXiaoXing/Image@main/blog/Chinese.svg" alt="Chinese" width="80" height="40" style="vertical-align: middle;">   </a>
    <a href="README_EN.md">
        <img src="https://cdn.jsdelivr.net/gh/SanXiaoXing/Image@main/blog/English.svg" alt="English" width="80" height="40" style="vertical-align: middle;">
    </a>
</span>

# 目录
1. [主要特点](#主要特点)

2. [演示](#演示)

3. [如何使用](#如何使用)

4. [项目框架](#项目框架)

5. [命令](#命令)

6. [致谢](#致谢)

# 主要特点

- Astro v4 更加快速 🚀
- TailwindCSS 实用的程序类
- 可访问的语义 HTML 标记
- 响应式和友好的SEO
- MD & [MDX](https://docs.astro.build/en/guides/markdown-content/#mdx-only-features) 文章使用
- 分页
- [RSS自动摘要](https://docs.astro.build/en/guides/rss)
- 自动生成网络站点 [sitemap](https://docs.astro.build/en/guides/integrations-guide/sitemap/)
- [Astro 图标](https://github.com/natemoo-re/astro-icon) svg图标组件
- [Expressive Code](https://expressive-code.com/) 源代码和语法高亮显示



# 演示

查看[演示💻](https://blog.sanxiaoxing.cn/)，托管在` Vercel` 上

# Astro 博客预览与使用方法

### 文章创作标识

文章默认归为原创。文章详情页显示创作标识，列表中仅为 AIGC 和 AIGC 辅助文章显示角标。在 Markdown 顶部的 frontmatter 中通过 `creation` 设置：

```yaml
creation: ai-assisted
```

- `original`：原创；不填写时默认使用。
- `aigc`：主要依靠 AI 创作的内容必须标记为 AIGC，不计入原创文章。
- `ai-assisted`：使用 AI 辅助润色、查找资料等时，建议标记为 AIGC 辅助。

标识由作者自行设置，不会自动判断内容的创作方式；加入申请由维护组成员人工判断是否为 AIGC。

> ##  🧑‍🚀如何使用

```sh
git clone https://github.com/SanXiaoXing/Template_Of_Astro.git
```

 [![前往GitHub打开](https://github.com/codespaces/badge.svg)](https://github.com/SanXiaoXing/Template_Of_Astro.git)

> 🧑‍🚀 **首页展示**    

![just-the-basics](https://cdn.jsdelivr.net/gh/SanXiaoXing/Image@main/blog/SanXiaoXing_2024-06-16_17-13-17.png)

> 🧑‍🚀 **博客展示**  

![just-the-basics](https://cdn.jsdelivr.net/gh/SanXiaoXing/Image@main/blog/SanXiaoXing_2024-06-16_17-14-19.png)

> 🧑‍🚀 **友链展示**  

![just-the-basics](https://cdn.jsdelivr.net/gh/SanXiaoXing/Image@main/blog/SanXiaoXing_2024-06-16_17-14-41.png)


# 🚀项目框架

在Astro项目中，您将看到以下文件夹和文件：

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


# 🧞命令

将  `pnpm` 替换成您选择的 ` npm / yarn `

| Command                   | Action                                            |
| :------------------------ | :------------------------------------------------ |
| `npm install`             | 安装依赖                                          |
| `npm run dev`             | 启动本地开发服务器 `localhost:4321`               |
| `npm run build`           | 构建项目 `./dist/`                                |
| `npm run preview`         | 在部署之前，请在本地预览生成                      |
| `npm run astro ...`       | 运行命令行界面命令，如 `astro add`, `astro check` |
| `npm run astro -- --help` | 获取使用Astro CLI的帮助                           |

# 👀致谢

主题灵感来源于 [AsyncX](https://blog.asyncx.top/)

---
![Alt](https://repobeats.axiom.co/api/embed/53c74bef592e6037c37916f9fabce28514cbe1ba.svg "Repobeats analytics image")
