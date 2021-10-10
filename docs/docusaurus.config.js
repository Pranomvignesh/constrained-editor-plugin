// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/dracula');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');
const SITE_NAME = 'Constrained Editor Plugin';
/** @type {import('@docusaurus/types').Config} */
const config = {
  title: SITE_NAME,
  tagline: 'One of the most requested feature in monaco-editor',
  url: 'https://constrained-editor-plugin.vercel.app/',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'PranomVignesh', // Usually your GitHub org/user name.
  projectName: SITE_NAME, // Usually your repo name.
  plugins: ['docusaurus-plugin-sass'],
  presets: [
    [
      '@docusaurus/preset-classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          editUrl: 'https://github.com/Pranomvignesh/constrained-editor-plugin/docs/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.scss'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: SITE_NAME,
        logo: {
          alt: 'My Logo',
          src: 'img/PvLogo-HD.png',
        },
        items: [
          {
            type: 'doc',
            docId: 'intro',
            position: 'left',
            label: 'API Documentation',
          },
          {
            href: 'https://github.com/Pranomvignesh/constrained-editor-plugin',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Tutorial',
                to: '/docs/intro',
              },
            ],
          },
          {
            title: 'About me',
            items: [
              {
                label: 'Github',
                href: 'https://github.com/Pranomvignesh',
              },
              {
                label: 'Dev blogs',
                href: 'https://dev.to/pranomvignesh',
              },
              {
                label: 'Twitter',
                href: 'https://twitter.com/pranomvignesh',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'Gmail',
                href: 'mailto:pranomvignesh@gmail.com'
              },
              {
                label: 'Instagram',
                href: 'https://www.instagram.com/javascript.enthusiast/'
              }
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Constrained Editor Plugin, Inc. Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;
