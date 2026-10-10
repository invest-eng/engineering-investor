// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  site: 'https://invest-eng.github.io',
  base: '/engineering-investor',
  integrations: [sitemap(), react()],
  // Knjižnica za izvoz v Excel se naloži šele ob kliku. Vite jo mora pripraviti že ob zagonu, sicer jo pripravi
  // sredi seje in prvi klik na izvoz ne uspe (3. 10. 2026).
  vite: { optimizeDeps: { include: ['xlsx'] } },
});
