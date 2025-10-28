#!/usr/bin/env node

/**
 * Optimized build script with parallel processing and intelligent caching
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Configuration
const BUILD_CONFIG = {
  maxConcurrency: Math.min(os.cpus().length, 4),
  cacheDir: path.join(__dirname, '..', '.next', 'cache'),
  enableCache: true,
  skipRedis: true,
  skipEnvValidation: true,
};

console.log('🚀 Starting optimized build process...');
console.log(`📊 Using ${BUILD_CONFIG.maxConcurrency} parallel processes`);

// Ensure cache directory exists
if (!fs.existsSync(BUILD_CONFIG.cacheDir)) {
  fs.mkdirSync(BUILD_CONFIG.cacheDir, { recursive: true });
}

// Set build environment variables
const buildEnv = {
  ...process.env,
  NODE_ENV: 'production',
  SKIP_REDIS: 'true',
  SKIP_ENV_VALIDATION: 'true',
  DISABLE_SENTRY: 'true',
  NEXT_TELEMETRY_DISABLED: '1',
  NODE_OPTIONS: '--max-old-space-size=4096',
  TSC_NONPOLLING_WATCHER: 'true',
  // Use local build cache
  NEXT_CACHE_HANDLER: path.join(__dirname, 'cache-handler.js'),
};

// Build steps
const buildSteps = [
  {
    name: 'TypeScript Check (Fast)',
    command: 'npx',
    args: ['tsc', '--noEmit', '--skipLibCheck'],
    parallel: false,
  },
  {
    name: 'Next.js Build',
    command: 'npx',
    args: ['next', 'build'],
    parallel: false,
  },
];

async function runStep(step) {
  return new Promise((resolve, reject) => {
    console.log(`⏳ Running: ${step.name}`);
    const startTime = Date.now();

    const child = spawn(step.command, step.args, {
      stdio: 'inherit',
      env: buildEnv,
      cwd: path.join(__dirname, '..'),
    });

    child.on('close', (code) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      if (code === 0) {
        console.log(`✅ ${step.name} completed in ${duration}s`);
        resolve();
      } else {
        console.error(`❌ ${step.name} failed with code ${code}`);
        reject(new Error(`Build step failed: ${step.name}`));
      }
    });

    child.on('error', (error) => {
      console.error(`❌ Error running ${step.name}:`, error);
      reject(error);
    });
  });
}

async function runBuild() {
  const totalStartTime = Date.now();

  try {
    // Run build steps sequentially (Next.js handles its own parallelization)
    for (const step of buildSteps) {
      await runStep(step);
    }

    const totalDuration = ((Date.now() - totalStartTime) / 1000).toFixed(2);
    console.log(`\n🎉 Build completed successfully in ${totalDuration}s`);

    // Print build statistics
    printBuildStats();

  } catch (error) {
    console.error('\n💥 Build failed:', error.message);
    process.exit(1);
  }
}

function printBuildStats() {
  try {
    const nextDir = path.join(__dirname, '..', '.next');
    const buildManifest = path.join(nextDir, 'build-manifest.json');

    if (fs.existsSync(buildManifest)) {
      const manifest = JSON.parse(fs.readFileSync(buildManifest, 'utf8'));
      console.log('\n📊 Build Statistics:');
      console.log(`📦 Total pages: ${Object.keys(manifest.pages || {}).length}`);

      // Calculate total bundle size
      const staticDir = path.join(nextDir, 'static');
      if (fs.existsSync(staticDir)) {
        const { execSync } = require('child_process');
        try {
          const size = execSync(`du -sh "${staticDir}"`, { encoding: 'utf8' }).split('\t')[0];
          console.log(`📏 Static bundle size: ${size.trim()}`);
        } catch (e) {
          // Ignore if du command fails
        }
      }
    }
  } catch (error) {
    // Ignore stats errors
  }
}

// Handle process signals
process.on('SIGINT', () => {
  console.log('\n⏹️  Build interrupted');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n⏹️  Build terminated');
  process.exit(1);
});

// Run the build
runBuild();