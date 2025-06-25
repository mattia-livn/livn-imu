/** @type {import('next').NextConfig} */
module.exports = {
  webpack: (config) => {
    // Configurazione per pdf-parse
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false
    };
    
    // Configurazione specifica per pdf-parse
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      stream: false,
      zlib: false,
      util: false,
      crypto: false,
      http: false,
      https: false,
      url: false
    };
    
    return config;
  }
};
