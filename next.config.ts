import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.136', '192.168.1.102', '192.168.1.*'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.soud.ru',
      },
    ],
  },
};
export default nextConfig;
