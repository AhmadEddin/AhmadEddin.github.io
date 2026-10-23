// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Set `site` to the production URL before deploying: canonical, OG and sitemap depend on it.
export default defineConfig({
  site: 'https://ahmadeddin.github.io',
  integrations: [sitemap()],
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  build: { inlineStylesheets: 'auto' },
  trailingSlash: 'ignore',
});
