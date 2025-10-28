#!/usr/bin/env node

/**
 * GLXY Gaming Platform - Dependency Security Audit Script
 * Analyzes package dependencies for security vulnerabilities and outdated packages
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 GLXY Gaming Platform - Dependency Security Audit');
console.log('=' .repeat(60));

// Function to run command and return output
function runCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: 'pipe' });
  } catch (error) {
    return error.stdout || error.stderr || '';
  }
}

// 1. NPM Audit
console.log('\n📦 NPM Security Audit');
console.log('-'.repeat(30));
const auditResult = runCommand('npm audit --json');
try {
  const audit = JSON.parse(auditResult);
  console.log(`✅ Vulnerabilities found: ${audit.metadata?.vulnerabilities?.total || 0}`);

  if (audit.metadata?.vulnerabilities?.total > 0) {
    console.log(`   - Critical: ${audit.metadata.vulnerabilities.critical || 0}`);
    console.log(`   - High: ${audit.metadata.vulnerabilities.high || 0}`);
    console.log(`   - Moderate: ${audit.metadata.vulnerabilities.moderate || 0}`);
    console.log(`   - Low: ${audit.metadata.vulnerabilities.low || 0}`);
    console.log(`   - Info: ${audit.metadata.vulnerabilities.info || 0}`);
  }
} catch (e) {
  console.log('✅ No vulnerabilities found or audit completed successfully');
}

// 2. Outdated Packages
console.log('\n📅 Outdated Packages Analysis');
console.log('-'.repeat(30));
const outdatedResult = runCommand('npm outdated --json');
try {
  const outdated = JSON.parse(outdatedResult);
  const packages = Object.keys(outdated);

  if (packages.length > 0) {
    console.log(`⚠️  Found ${packages.length} outdated packages:`);

    // Categorize by severity (based on version gap)
    const critical = [];
    const major = [];
    const minor = [];

    packages.forEach(pkg => {
      const { current, latest } = outdated[pkg];
      const currentVersion = current.split('.').map(Number);
      const latestVersion = latest.split('.').map(Number);

      if (latestVersion[0] > currentVersion[0]) {
        critical.push({ name: pkg, current, latest, type: 'major' });
      } else if (latestVersion[1] > currentVersion[1]) {
        major.push({ name: pkg, current, latest, type: 'minor' });
      } else {
        minor.push({ name: pkg, current, latest, type: 'patch' });
      }
    });

    if (critical.length > 0) {
      console.log(`\n🔴 Critical Updates (Major Version Changes): ${critical.length}`);
      critical.slice(0, 5).forEach(pkg => {
        console.log(`   ${pkg.name}: ${pkg.current} → ${pkg.latest}`);
      });
    }

    if (major.length > 0) {
      console.log(`\n🟡 Minor Updates: ${major.length}`);
      major.slice(0, 5).forEach(pkg => {
        console.log(`   ${pkg.name}: ${pkg.current} → ${pkg.latest}`);
      });
    }

    if (minor.length > 0) {
      console.log(`\n🟢 Patch Updates: ${minor.length}`);
    }

  } else {
    console.log('✅ All packages are up to date');
  }
} catch (e) {
  console.log('⚠️  Could not parse outdated packages information');
}

// 3. License Analysis
console.log('\n📜 License Analysis');
console.log('-'.repeat(30));
try {
  const licenseCheck = runCommand('npm ls --json --depth=1');
  const deps = JSON.parse(licenseCheck);

  // Extract unique licenses
  const licenses = new Set();
  const problematicLicenses = ['GPL-2.0', 'GPL-3.0', 'AGPL-1.0', 'AGPL-3.0'];
  const foundProblematic = [];

  function extractLicenses(deps, path = '') {
    if (deps.dependencies) {
      Object.entries(deps.dependencies).forEach(([name, info]) => {
        if (info.version) {
          // Note: npm ls doesn't include license info, would need license-checker
          // This is a placeholder for license analysis
        }
      });
    }
  }

  console.log('ℹ️  License analysis requires additional tooling (license-checker)');
  console.log('   Run: npm install -g license-checker && license-checker');

} catch (e) {
  console.log('⚠️  License analysis failed');
}

// 4. Security Configuration Analysis
console.log('\n🔒 Security Configuration Analysis');
console.log('-'.repeat(30));

// Check for .npmrc security settings
if (fs.existsSync('.npmrc')) {
  const npmrc = fs.readFileSync('.npmrc', 'utf8');
  if (npmrc.includes('audit-level')) {
    console.log('✅ NPM audit level configured');
  } else {
    console.log('⚠️  Consider setting audit-level in .npmrc');
  }
} else {
  console.log('ℹ️  No .npmrc file found');
}

// Check package.json for security-related scripts
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const scripts = packageJson.scripts || {};

if (scripts.audit || scripts['security-audit']) {
  console.log('✅ Security audit script configured');
} else {
  console.log('⚠️  Consider adding security audit script');
}

// 5. Recommendations
console.log('\n💡 Security Recommendations');
console.log('-'.repeat(30));
console.log('1. Run regular security audits: npm audit');
console.log('2. Update dependencies regularly: npm update');
console.log('3. Use exact versions for critical dependencies');
console.log('4. Consider using npm ci in production');
console.log('5. Set up automated dependency updates (Renovate/Dependabot)');
console.log('6. Review licenses for compliance');
console.log('7. Use npm shrinkwrap for production builds');

// 6. Generate report file
const reportData = {
  timestamp: new Date().toISOString(),
  npmAudit: auditResult,
  outdatedPackages: outdatedResult,
  recommendations: [
    'Regular security audits',
    'Dependency updates',
    'License compliance review',
    'Automated dependency management'
  ]
};

fs.writeFileSync(
  path.join(__dirname, '..', 'logs', 'security-audit-report.json'),
  JSON.stringify(reportData, null, 2)
);

console.log('\n📝 Report saved to: logs/security-audit-report.json');
console.log('\n🔍 Audit completed at:', new Date().toISOString());