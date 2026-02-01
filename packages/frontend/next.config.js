/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@hack-money/ens", "@hack-money/yellow"],
};

module.exports = nextConfig;

