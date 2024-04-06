import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Senrokumon Learning Blog",
  description: "A VitePress Site",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Examples', link: '/markdown-examples' },
      { text: 'Engineering', link: '/engineering/' },
      { text: 'Frontend', link: '/frontend/' },
    ],

    sidebar: [
      {
        text: 'Examples',
        items: [
          { text: 'Markdown Examples', link: '/markdown-examples' },
          { text: 'Runtime API Examples', link: '/api-examples' }
        ]
      },
      {
        text: 'Engineering',
        items: [
          { text: 'Engineering', link: '/engineering/' },
          { text: 'Code Review Checklist', link: '/engineering/code-review-checklist' }
        ]
      },
      {
        text: 'Frontend',
        items: [
          { text: 'Frontend', link: '/frontend/' },
          { text: 'Migrate from CRA to Vite', link: '/frontend/migrate-from-cra-to-vite'}
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  },
  locales: {
    root: {
      label: 'English',
      lang: 'en'
    },
    jp: {
      label: '日本語',
      lang: 'ja',
    },
    zh: {
      label: '简体中文',
      lang: 'zh'
    }
  }
})
