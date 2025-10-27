import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV !== "production",
  },
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV !== "production",
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'corwj2q0xb.ufs.sh',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'utfs.io',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'uploadthing.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.jsdelivr.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'vimeo.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.vimeocdn.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.jwplayer.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'player.vimeo.com',
        pathname: '/**',
      },
    ],
  },
  output: "standalone",
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : undefined,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },
	env: {
    NEXT_PUBLIC_ADMIN_URL: process.env.ADMIN_URL,
    NEXT_PUBLIC_ALLOW_ADMIN_ON_MAIN_SITE: process.env.ALLOW_ADMIN_ON_MAIN_SITE,
  },
};

export default nextConfig;
