import { withPWA } from 'next-pwa';

const isProd = process.env.NODE_ENV === 'production';

export default withPWA({
  output: 'export',
  trailingSlash: true,
  basePath: isProd ? '/dot' : '',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true
  },
  pwa: {
    dest: 'public',
    disable: !isProd,
    register: true,
    skipWaiting: true,
  },
});
