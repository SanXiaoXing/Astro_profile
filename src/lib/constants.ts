import type { Site, Page } from './types'

export const loaderAnimation = [
  '.loader',
  { opacity: [1, 0], pointerEvents: 'none' },
  { easing: 'ease-out' },
]

export const LINKS = {
  github: 'https://github.com/SanXiaoXing',
  linkedin: 'https://www.linkedin.com/in/bue221/',
  mail: 'mailto:yanxing1137@gmail.com',
  instagram: '',
  medium: '',
  discord: '',
  rss: '/rss.xml',
  gitee: 'https://gitee.com/yan-kmd'
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

export const EXPERIENCE = [
  {
    company: '北京某科技公司',
    location: 'Fengtai District, Beijing',
    position: '某所工装开发',
    start: '2023年9月',
    link: '',
    end: '2023年11月',
    tasks: [
      {
        title: '硬件测试与验证：',
        details: [
          '负责设计并实施全面的硬件测试流程，确保产品严格符合技术规范和性能要求，显著提高了产品的质量和可靠性。',
          '执行系统性检验工作，全面评估硬件组件的可靠性和兼容性，确保硬件系统的整体稳定性和高效运行。',
          '贯彻执行系统级测试，监控产品在不同开发阶段的性能，有效确保最终产品达到预定的性能目标和质量标准。',
        ],
      },
      {
        title: '测试软件的应用：',
        details: [
          '实施并执行详细的软件测试程序，确保按照公司标准保持测试过程的严密性与正确性。',
          '针对具体的测试需求，积极进行测试软件的优化与升级，显著提升了测试工作的效率和准确率。',
          '成功达成测试软件优化和升级项目的既定目标，显著提高了产品的测试质量和项目的交付能力。',
        ],
      },
      {
        title: '工装开发：',
        details: [
          '使用企业软件进行脚本设计和工装界面开发，以实现自动化测试，且能有效模拟真实应用环境。',
          {
            subtitle: '自动化测试与工装开发：',
            subdetails: [
              '制定测试流程的自动化策略，以提升效率和精确度。',
              '编制并调试超过十种设备控制软件以及测试工装，确保其可行性和稳定性。',
              '负责硬件与软件的集成测试，以确保产品性能和质量。',
            ],
          },
          {
            subtitle: '现场执行与数据分析：',
            subdetails: [
              '在现场进行工装设备的安装和调试工作，以确保设备运行正常。',
              '执行硬件测试，并记录结果，随后根据测试结果编写对应的测试概要和报告。',
              '对数据进行分析并进行工装设备优化，以提升产品性能和用户体验。',
            ],
          },
        ],
      },
    ],
  },
  {
    company: '北京某科技公司',
    location: 'Fengtai District, Beijing',
    position: '某厂智能IO工装开发',
    start: '2023年12月',
    link: '',
    end: '2023年3月',
    tasks: [
      {
        title: '硬件测试与验证：',
        details: [
          '负责硬件设备的全面测试与验收工作，确保设备性能达到项目要求。',
          '实施到货及出厂前的精准测试流程，通过高效的测试方法提高了设备的可靠性和稳定性。',
          '细致发现并诊断硬件系统中的软件错误，成功指导厂商复现问题，并有效推动问题的及时解决，保障了项目的顺利进行。',
        ],
      },
      {
        title: '测试软件的应用：',
        details: [
          '使公司提供的测试软件，开展具体的测试工作，保证测试过程的准确性。',
          '根据测试需求，对测试软件进行优化和升级，以提高测试效率和准确性。',
          '测试软件优化和升级都达到期望的目标。',
        ],
      },
    ],
  },

]
