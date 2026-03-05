/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed ignoreBuildErrors - we need to see and fix type errors!
  // This was masking potential runtime bugs
  images: {
    unoptimized: true,
  },
  
  // Performance optimizations
  swcMinify: true, // Use SWC for faster minification
  
  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  
  // Bundle analyzer (run with: ANALYZE=true npm run build)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config) => {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: './analyze.html',
          openAnalyzer: true,
        })
      );
      return config;
    },
  }),
}

export default nextConfig
