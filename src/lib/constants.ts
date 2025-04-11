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

export const EXPERIENCE = [
  {
    company: '北京某科技公司',
    location: 'Fengtai District, Beijing',
    position: '动环测试与训练系统',
    start: '2024.10',
    link: '',
    end: '2024.12',
    tasks: [
      {
        title: '核心硬件验证：',
        details: [
          '主导麒麟系统备选主板的兼容性测试，确保系统稳定运行；',
          '负责RS485模块与DIO模块的功能验证与集成测试；',
          '发现并修复5+个硬件-软件交互缺陷；',
          '通过优化配置与代码改进，使系统整体稳定性提升30%。'
        ]
      },
      {
        title: '现场技术支持：',
        details: [
          '完成华为交换机信号采集器的仿真信号匹配测试；',
          '对水浸、烟感、温湿度传感器进行信号采集测试；',
          '完成红外探测器、门禁、电压监测设备的信号匹配验证；',
          '通过调整采样参数，优化信号采样频率；',
          '设定并验证系统容错阈值，提升数据采集可靠性。',
        ]
      },
      {
        title: '视频流模拟开发:',
        details: [
          '使用Python和FFmpeg技术栈开发视频流生成工具，实现H.265编码格式的多线程处理；',
          '通过性能优化，将单个视频流的生成时间由50秒降低到30秒；',
          '显著提升处理效率达40%，为交换机监控系统提供可靠的视频数据传输测试支持。'
        ]
      },
      {
        title: '产品交付管理：',
        details: [
          '制定标准化出厂检验流程，包含传感器信号完整性测试和协议兼容性验证；',
          '完成4批次共120台设备的全项测试，实现100%通过率；',
          '产品质量获得客户高度认可，一次性达成5星验收评级。'
        ]
      },
    ]
  },
  {
    company: '北京某科技公司',
    location: 'Fengtai District, Beijing',
    position: '某厂便携式时间响应工装开发及软硬件联调',
    start: '2024.05',
    link: '',
    end: '2024.10',
    tasks: [
      {
        title: '便携式时间响应工装开发：',
        details: [
          '负责便携式的工装开发，包括界面的搭建及修改、脚本的编写及测试；',
          '及时与客户沟通以及时响应客户需求并作出对应的修改；',
          '完成三次代码的重构及修整，通过修改react界面以满足客户需求；',
          '通过硬件组与驱动组沟通，并修改lua脚本工装开发，以便满足时间响应的性能指标要求；',
          '通过lua脚本完成开关量的输入输出、模拟量的输入输出、脉冲的输出、热电偶热电阻的输出，并且可以通过硬件返回的信息来确定不同模式下的响应时间；',
          '通过lua脚本实现模拟量输出与脉冲、热电偶、热电阻输出的转换；',
          '完成鼠标点击器的工装开发及集成在原有的工装中；',
          '完成光敏采集信号并获取对应的响应时间；',
          '实现各个信号的响应时间在界面中的显示并存储在数据库中，并将其进行不同的运算。',
        ],
      },
      {
        title: '便携式时间响应硬件测试',
        details: [
          '通过工装的开发，对便携式时间响应的硬件测试，开关量、模拟量、脉冲、热电偶、热电阻、屏幕点击器及光敏均通过硬件测试；',
          '测试多功能卡不同类型之间的相互转换，分别为模拟量电压模式、模拟量电流模式、脉冲、热电偶以及热电阻五种模式的相互转换及转换后的精度确定；',
          '完成现场与客户的被测设备的联调测试，以及精度的确定。',
        ],
      },
      {
        title: '便携式时间响应文档内容编写',
        details: [
          '完成集成测试的测试计划书、测试说明书、测试报告等相关文档；',
          '完成联调测试的测试计划书、测试说明书、测试报告、测试大纲、测试用例等相关文档；',
          '完成软件部分测试的测试计划书、测试说明书、测试报告等相关文档；',
          '完成验收的验收计划书、验收说明书、验收报告等相关文档。',
        ],
      },
    ],
  },
  {
    company: '北京某科技公司',
    location: 'Fengtai District, Beijing',
    position: '某厂智能IO工装开发',
    start: '2024.03',
    link: '',
    end: '2024.06',
    tasks: [
      {
        title: '硬件测试与验证：',
        details: [
          '负责硬件设备的全面测试与验收工作，确保设备性能达到项目要求。',
          '在客户现场通过工装开发的软件进行硬件的测试与调试，通过高效的测试方法提高了设备的可靠性和稳定性。',
          '硬件测试模拟量输入输出卡，脉冲卡，开关量输入输出卡，热电偶、热电阻卡，通过5G、以太网以及modbus协议三种不同方式进行协议的收发数据',
        ],
      },
      {
        title: '测试软件的开发：',
        details: [
          '通过使用lua脚本语言开发与硬件调试的测试工装，完成开关量的工装的开发',
          '根据公司内部的软件进行开发，使用sqlite封装数据库，以供后续工装开发的使用',
        ],
      },
    ],
  },
  {
    company: '北京某科技公司',
    location: 'Fengtai District, Beijing',
    position: '温湿度监控与数据上传系统',
    start: '2024.02',
    link: '',
    end: '2023.04',
    tasks: [
      {
        title: '串口数据传输与MQTT上传：',
        details: [
          '通过串口接收温湿度传感器数据；',
          '对采集的数据进行预处理和格式化；',
          '使用MQTT协议建立稳定的数据传输通道；',
          '实现温湿度数据的实时上传与监控；',
          '通过数据校验机制确保数据的准确性。',
        ]
      },
      {
        title: '系统集成与调试：',
        details: [
          '负责协调硬件、嵌入式与软件开发团队的工作；',
          '成功实现数据采集模块与MQTT服务器的系统集成；',
          '通过严格的测试验证，确保整体系统一次性通过率达到98%；',
        ]
      },
      {
        title: '自动化测试：',
        details: [
          '基于Lua脚本开发自动化测试工装界面，实现测试流程的可视化操作；',
          '通过TCP/UDP网络协议，建立稳定的远程数据传输通道；',
          '优化测试流程和数据处理机制，使整体测试效率提升40%。',
        ]
      },
    ]
  },
  {
    company: '北京某科技公司',
    location: 'Fengtai District, Beijing',
    position: '某所工装开发',
    start: '2023.09',
    link: '',
    end: '2023.11',
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
    position: '嵌入式测试大赛试验箱测试',
    start: '2023.09',
    link: '',
    end: '2023.11',
    tasks: [
      {
        title: '综合接口验证:',
        details: [
          '使用串口对公司嵌入式测试大赛的试验箱进行测试，完成试验箱基本功能的验证；',
          '对汽车中控系统的串口通信功能进行全面测试，确保数据传输的准确性和稳定性；',
          '验证CAN总线通信功能，测试数据帧的发送和接收是否符合规范；',
          '测试开关量信号的输入输出功能，验证信号状态切换的准确性；',
          '对模拟量信号进行测量和校准，确保信号采集的精度满足要求。',
        ]
      },
      {
        title: '共享单车控制测试:',
        details: [
          '基于串口通信测试共享单车停靠功能，验证系统响应时间和准确性；',
          '测试共享单车归还流程的完整性，确保锁定机制可靠运行；',
          '对系统稳定性进行长期测试，验证在高频使用场景下的性能表现。',
        ]
      }
    ]
  }

]
