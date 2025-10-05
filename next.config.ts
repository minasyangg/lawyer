import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Настройки для загрузки файлов
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Соответствует MAX_FILE_SIZE в file-utils.ts
    },
  },
  
  // Оптимизация сборки для решения проблем с памятью
  webpack: (config, { isServer }) => {
    // Оптимизация для уменьшения использования памяти
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: -10,
            chunks: 'all',
          },
        },
      },
    };
    
    return config;
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
