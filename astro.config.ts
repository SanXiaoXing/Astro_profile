import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import tailwind from '@astrojs/tailwind'
// import remarkFigureCaption from '@microflash/remark-figure-caption';
import remarkDirective from 'remark-directive';
import remarkCalloutDirectives from "./src/components/mdrenders/remark-callout-directives-customized.mjs"
import { remarkReadingTime } from './src/components/mdrenders/remark-reading-time.mjs';
import { pluginCollapsibleSections } from '@expressive-code/plugin-collapsible-sections'
import sitemap from '@astrojs/sitemap';
import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers'

import expressiveCode from "astro-expressive-code";

// https://astro.build/config
export default defineConfig({
  site: process.env.CI
    ? 'https://blog.sanxiaoxing.cn'
    : 'http://localhost:4321',
  integrations: [sitemap(),
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
    expressiveCode({
      plugins: [pluginCollapsibleSections(),pluginLineNumbers()],
      themes: ['dracula-soft'],
      styleOverrides: {
        // You can also override styles
        borderRadius: '10px',
        borderWidth: '1px',
        frames: {
        },
      },
      defaultProps: {
        // Enable word wrap by default
        wrap: true,
        // Disable wrapped line indentation for terminal languages
        overridesByLang: {
          // 'bash,ps,sh': { preserveIndent: false },
        },
      },
    })
  ],
  vite: {
    ssr: {
      noExternal: ['mdast-util-from-markdown', 'mdast-util-to-string']
    }
  },
  markdown: {
    remarkPlugins: [remarkDirective, remarkCalloutDirectives, remarkReadingTime],
  },

})
