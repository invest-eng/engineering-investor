// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://invest-eng.github.io',
  base: '/engineering-investor',
  integrations: [sitemap()],
});
