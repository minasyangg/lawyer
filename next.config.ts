import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Настройки для загрузки файлов
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Соответствует MAX_FILE_SIZE в file-utils.ts
    },
  },
  
  // Дополнительные настройки безопасности для файлов
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/**',
      },
    ],
  },
};

export default nextConfig;
