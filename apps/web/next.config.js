/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';
const repoName = 'NearBand';

const nextConfig = {
  output: 'export',
  basePath: process.env.GITHUB_ACTIONS ? `/${repoName}` : '',
  assetPrefix: process.env.GITHUB_ACTIONS ? `/${repoName}/` : '',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

module.exports = nextConfig;
