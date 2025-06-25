/** @type {import('next').NextConfig} */
module.exports = {
  webpack: (config) => {
    // Configurazione per pdf-parse
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
      'pdfjs-dist': false
    };
    
    config.externals = config.externals || [];
    config.externals.push({
      canvas: 'canvas',
      'pdfjs-dist': 'pdfjs-dist'
    });

    // Configurazione specifica per pdf-parse
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      stream: false,
      zlib: false,
      util: false,
      crypto: false
    };
    
    return config;
  }
};
