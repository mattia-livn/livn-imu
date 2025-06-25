/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
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
  
  // Configurazione per development
  experimental: {
    allowedDevOrigins: ['192.168.1.86']
  }
};

export default nextConfig;
