const path = require('path');
const SENTRY_DISABLED = process.env.DISABLE_SENTRY === 'true';
let withSentryConfig;
if (!SENTRY_DISABLED) {
  try {
    ({ withSentryConfig } = require('@sentry/nextjs'));
  } catch (_) {
    // Sentry nicht verfügbar/gewünscht
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // Standalone output für Docker Deployments (IMMER aktiviert für Docker)
  // output: 'standalone', // Disabled for PM2 deployment
  outputFileTracingRoot: __dirname,
  serverExternalPackages: ['@prisma/client', 'ioredis', 'bcryptjs', 'pdf-lib', 'canvas', 'pdfjs-dist'],
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['app', 'components', 'lib']
  },
  // TypeScript-Checks aktiviert für Production-Readiness
  typescript: {
    ignoreBuildErrors: false,
    tsconfigPath: './tsconfig.json',
  },
  images: {
    unoptimized: process.env.NODE_ENV === 'development',
    domains: ['glxy.at', 'localhost'],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  experimental: {
    // Optimiere Package Imports für kleinere Bundles
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      '@radix-ui/react-select',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      'framer-motion',
    ],
    // Neue Performance-Features
    optimizeCss: true,
    scrollRestoration: true,
    // Optimiertes Bundle Splitting
    optimizeServerReact: true,
  },
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
    // React Compiler Optimierungen
    reactRemoveProperties: process.env.NODE_ENV === 'production',
    styledComponents: false,
  },
  // Performance Monitoring
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  webpack: (config, { dev, isServer }) => {
    // Server-side fallbacks for browser-only modules
    if (isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        fs: false,
      };
    }

    // Sentry im Build hart deaktivieren (spart Bundling-Kosten)
    if (SENTRY_DISABLED) {
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        '@sentry/nextjs': path.join(__dirname, 'lib', 'sentry-empty.js'),
        '@sentry/node': path.join(__dirname, 'lib', 'sentry-empty.js'),
        // Pfadalias für "@" unabhängig von TS-Plugin
        '@': path.join(__dirname),
      };
    }
    // Sicherstellen, dass der "@"-Alias immer vorhanden ist (auch wenn Sentry an ist)
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': config.resolve.alias?.['@'] || path.join(__dirname),
    };

    // Build performance optimizations
    if (!dev) {
      // Production optimizations
      config.devtool = 'source-map';
    } else {
      // Development optimizations
      config.cache = {
        type: 'filesystem',
        allowCollectingMemory: true,
        buildDependencies: {
          config: [__filename],
        },
        compression: 'gzip',
      };

      // Schnelleres HMR
      config.watchOptions = {
        ignored: /node_modules/,
        aggregateTimeout: 300,
      };
    }

    // Resolve optimizations
    config.resolve.modules = ['node_modules'];
    config.resolve.extensions = ['.js', '.jsx', '.ts', '.tsx', '.json'];

    // Externalize large dependencies for server-side
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'plotly.js': 'plotly.js',
        'chart.js': 'chart.js',
      });
    }

    return config;
  },
  // Security headers are now handled in middleware.ts for better control
  // async headers() {
  //   return [];
  // },
  ...(process.env.NODE_ENV === 'production' && {
    compress: true,
    poweredByHeader: false,
    generateEtags: true,
    // Disable modularizeImports to fix CSS MIME type issues
    // modularizeImports: {
    //   '@radix-ui/react-icons': {
    //     transform: '@radix-ui/react-icons/dist/{{member}}',
    //   },
    //   'lucide-react': {
    //     transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
    //   },
    // },
  }),
};

const sentryWebpackPluginOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI && !process.env.SENTRY_DEBUG,
  widenClientFileUpload: true,
  transpileClientSDK: true,
  tunnelRoute: '/api/sentry-tunnel',
  hideSourceMaps: true,
  disableLogger: process.env.NODE_ENV === 'production',
  automaticVercelMonitors: process.env.NODE_ENV === 'production',
};

// Temporär: Sentry Build‑Plugin nicht aktivieren
module.exports = nextConfig;
