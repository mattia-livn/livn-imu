import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config: any) => {
    // Configurazione per pdf-parse
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };
    
    config.externals = config.externals || [];
    config.externals.push({
      canvas: 'canvas',
    });

    // Configurazione specifica per pdf-parse
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };
    
    return config;
  },
  // Supporto per package esterni
  serverExternalPackages: ['pdf-parse'],
};

export default nextConfig;
