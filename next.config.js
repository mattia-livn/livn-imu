/** @type {import('next').NextConfig} */
module.exports = {
  webpack: (config, { isServer }) => {
    // Se siamo sul server, non dobbiamo polyfillare i moduli Node.js
    if (!isServer) {
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
    }

    // Configurazione per pdf-parse
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false
    };
    
    return config;
  }
};
