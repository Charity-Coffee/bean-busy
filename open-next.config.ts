import { defineCloudflareConfig } from '@opennextjs/cloudflare';

// `npm run build` runs the OpenNext bundler, which calls plain `next build` itself.
export default { ...defineCloudflareConfig(), buildCommand: 'next build' };
