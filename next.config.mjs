/** @type {import('next').NextConfig} */
const nextConfig = {
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
      stream: require.resolve('stream-browserify'),
      zlib: require.resolve('browserify-zlib'),
      util: require.resolve('util/'),
      crypto: require.resolve('crypto-browserify'),
    };
    
    return config;
  }
};

export default nextConfig;
