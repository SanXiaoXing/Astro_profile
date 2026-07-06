import type { Site, Page } from './types'

export const loaderAnimation = [
  '.loader',
  { opacity: [1, 0], pointerEvents: 'none' },
  { easing: 'ease-out' },
]

export const LINKS = {
  github: 'https://github.com/SanXiaoXing',
  linkedin: 'https://www.linkedin.com/in/bue221/',
  mail: 'mailto:mail@sanxiaoxing.cn',
  instagram: '',
  medium: '',
  discord: '',
  rss: '/rss.xml',
  gitee: 'https://gitee.com/yan-kmd',
  homepage: 'https://sanxiaoxing.cn/',
}

// Global
export const SITE: Site = {
  TITLE: 'Astro Sphere',
  DESCRIPTION:
    'Welcome to Astro Sphere, a portfolio and blog for designers and developers.',
  AUTHOR: 'Mark Horn',
}

// Work Page
export const WORK: Page = {
  TITLE: '工作经历',
  DESCRIPTION: 'Places I have worked.',
}

// Blog Page
export const BLOG: Page = {
  TITLE: 'Blog',
  DESCRIPTION: 'Writing on topics I am passionate about.',
}

// Projects Page
export const PROJECTS: Page = {
  TITLE: 'Projects',
  DESCRIPTION: 'Recent projects I have worked on.',
}

// Search Page
export const SEARCH: Page = {
  TITLE: 'Search',
  DESCRIPTION: 'Search all posts and projects by keyword.',
}

// Study Page
export const STUDIES = [
  {
    title: 'Computer Science',
    institution: 'Henan Normal University',
    link: 'https://www.htu.edu.cn/',
    date: '2019 - 2023',
  },
  {
    title: '...',
    institution: 'Bilibili',
    link: 'https://www.bilibili.com/',
    date: '2018 - 2024',
  },
  {
    title: '...',
    institution: 'Github',
    link: 'https://github.com/',
    date: '2018 - 2024',
  },
  {
    title: '...',
    institution: 'Youtube',
    link: 'https://www.youtube.com/',
    date: '2018 - 2025',
  },
  {
    title: '...',
    institution: 'ChatGPT',
    link: 'https://chat.openai.com/',
    date: '2018 - 2025',
  }, {
    title: '...',
    institution: 'CNKI',
    link: 'https://www.cnki.net/',
    date: '2018 - 2025',
  }, {
    title: '...',
    institution: 'Nature',
    link: 'https://www.nature.com/',
    date: '2018 - 2025',
  },{
    title: '...',
    institution: 'Sci-hub',
    link: 'https://www.sci-hub.st/',
    date: '2018 - 2025',
  },
]
