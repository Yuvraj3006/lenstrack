/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@lenstrack/ui", "@lenstrack/config"],
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "prisma", "bcryptjs", "puppeteer"],
  },
};

module.exports = nextConfig;
