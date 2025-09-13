/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  webpack: (config) => {
    config.resolve.alias['@ui'] = path.resolve(__dirname, '../../packages/ui');
    return config;
  },
};

module.exports = nextConfig;

