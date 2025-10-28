#!/usr/bin/env node

/**
 * GLXY Gaming Platform - Security Test Suite
 * Automated security testing and validation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🛡️  GLXY Gaming Platform - Security Test Suite');
console.log('=' .repeat(60));

const TEST_RESULTS = {
  passed: 0,
  failed: 0,
  warnings: 0,
  details: []
};

// Test configuration
const SECURITY_TESTS = {
  headers: {
    required: [
      'X-Frame-Options',
      'X-Content-Type-Options',
      'X-XSS-Protection',
      'Strict-Transport-Security',
      'Content-Security-Policy'
    ],
    forbidden: [
      'Server',
      'X-Powered-By'
    ]
  },
  files: {
    shouldNotExist: [
      '.env.production',
      '.env.local',
      'docker-compose.yml' // Should use secrets version
    ],
    shouldExist: [
      'docker-compose.secrets.yml',
      'lib/auth-security.ts',
      'lib/security-middleware.ts'
    ]
  },
  code: {
    patterns: {
      dangerous: [
        /eval\s*\(/,
        /innerHTML\s*=/,
        /document\.write/,
        /dangerouslySetInnerHTML/
      ],
      secrets: [
        /password\s*=\s*['"]\w+/i,
        /secret\s*=\s*['"]\w+/i,
        /token\s*=\s*['"]\w+/i,
        /key\s*=\s*['"]\w+/i
      ]
    }
  }
};

function runTest(testName, testFunction) {
  try {
    console.log(`\n🔍 Testing: ${testName}`);
    const result = testFunction();

    if (result.passed) {
      console.log(`✅ ${testName}: PASSED`);
      TEST_RESULTS.passed++;
    } else {
      console.log(`❌ ${testName}: FAILED - ${result.reason}`);
      TEST_RESULTS.failed++;
    }

    if (result.warnings && result.warnings.length > 0) {
      result.warnings.forEach(warning => {
        console.log(`⚠️  Warning: ${warning}`);
        TEST_RESULTS.warnings++;
      });
    }

    TEST_RESULTS.details.push({
      test: testName,
      ...result
    });

  } catch (error) {
    console.log(`❌ ${testName}: ERROR - ${error.message}`);
    TEST_RESULTS.failed++;
    TEST_RESULTS.details.push({
      test: testName,
      passed: false,
      reason: error.message
    });
  }
}

// Test 1: File Security
function testFileSecurity() {
  const warnings = [];
  let failed = false;

  // Check for files that should not exist
  SECURITY_TESTS.files.shouldNotExist.forEach(file => {
    if (fs.existsSync(file)) {
      warnings.push(`Sensitive file exists: ${file}`);
      if (file.includes('.env')) {
        failed = true;
      }
    }
  });

  // Check for files that should exist
  SECURITY_TESTS.files.shouldExist.forEach(file => {
    if (!fs.existsSync(file)) {
      warnings.push(`Security file missing: ${file}`);
    }
  });

  return {
    passed: !failed,
    warnings,
    reason: failed ? 'Sensitive files found in repository' : null
  };
}

// Test 2: Environment Variable Security
function testEnvironmentSecurity() {
  const warnings = [];
  let failed = false;

  // Check if .env files contain production secrets
  const envFiles = ['.env', '.env.local', '.env.production'];

  envFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');

      // Check for actual secrets (not placeholders)
      const secretPatterns = [
        /POSTGRES_PASSWORD=(?!.*placeholder|.*example|.*your_).{8,}/,
        /REDIS_PASSWORD=(?!.*placeholder|.*example|.*your_).{8,}/,
        /GOOGLE_CLIENT_SECRET=(?!.*placeholder|.*example|.*your_).{8,}/,
        /GITHUB_CLIENT_SECRET=(?!.*placeholder|.*example|.*your_).{8,}/
      ];

      secretPatterns.forEach(pattern => {
        if (pattern.test(content)) {
          failed = true;
          warnings.push(`Real secrets found in ${file}`);
        }
      });
    }
  });

  return {
    passed: !failed,
    warnings,
    reason: failed ? 'Production secrets found in environment files' : null
  };
}

// Test 3: Code Security Analysis
function testCodeSecurity() {
  const warnings = [];
  let failed = false;

  // Find all TypeScript and JavaScript files
  const files = execSync('find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | grep -v node_modules | grep -v .next',
    { encoding: 'utf8' }).trim().split('\n').filter(Boolean);

  files.forEach(file => {
    if (!fs.existsSync(file)) return;

    const content = fs.readFileSync(file, 'utf8');

    // Check for dangerous patterns
    SECURITY_TESTS.code.patterns.dangerous.forEach((pattern, index) => {
      if (pattern.test(content)) {
        warnings.push(`Dangerous pattern found in ${file}: ${pattern}`);
      }
    });

    // Check for hardcoded secrets
    SECURITY_TESTS.code.patterns.secrets.forEach((pattern, index) => {
      const matches = content.match(pattern);
      if (matches && !matches[0].includes('placeholder') && !matches[0].includes('example')) {
        failed = true;
        warnings.push(`Potential hardcoded secret in ${file}`);
      }
    });
  });

  return {
    passed: !failed,
    warnings,
    reason: failed ? 'Hardcoded secrets found in code' : null
  };
}

// Test 4: Docker Configuration Security
function testDockerSecurity() {
  const warnings = [];
  let failed = false;

  // Check if regular docker-compose.yml contains secrets
  if (fs.existsSync('docker-compose.yml')) {
    const content = fs.readFileSync('docker-compose.yml', 'utf8');

    // Look for password patterns in environment variables
    const passwordPatterns = [
      /POSTGRES_PASSWORD=.+/,
      /REDIS_PASSWORD=.+/,
      /CLIENT_SECRET=.+/
    ];

    passwordPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        failed = true;
        warnings.push('Secrets found in docker-compose.yml');
      }
    });
  }

  // Check if secrets version exists
  if (!fs.existsSync('docker-compose.secrets.yml')) {
    warnings.push('docker-compose.secrets.yml not found');
  }

  return {
    passed: !failed,
    warnings,
    reason: failed ? 'Docker configuration contains secrets' : null
  };
}

// Test 5: Authentication Security
function testAuthSecurity() {
  const warnings = [];
  let failed = false;

  // Check if auth-security.ts exists and has proper configuration
  if (fs.existsSync('lib/auth-security.ts')) {
    const content = fs.readFileSync('lib/auth-security.ts', 'utf8');

    // Check for strong password policy
    if (!content.includes('password.length < 12')) {
      warnings.push('Password minimum length should be 12 characters');
    }

    // Check for rate limiting
    if (!content.includes('rate_limit') && !content.includes('rateLimit')) {
      warnings.push('Rate limiting not implemented');
    }

    // Check for account lockout
    if (!content.includes('lockout') && !content.includes('lockedUntil')) {
      warnings.push('Account lockout not implemented');
    }

  } else {
    failed = true;
    warnings.push('auth-security.ts file not found');
  }

  return {
    passed: !failed,
    warnings,
    reason: failed ? 'Authentication security module missing' : null
  };
}

// Test 6: Dependency Security
function testDependencySecurity() {
  const warnings = [];
  let failed = false;

  try {
    // Run npm audit
    const auditResult = execSync('npm audit --json', { encoding: 'utf8', stdio: 'pipe' });
    const audit = JSON.parse(auditResult);

    if (audit.metadata && audit.metadata.vulnerabilities) {
      const vulns = audit.metadata.vulnerabilities;

      if (vulns.critical > 0) {
        failed = true;
        warnings.push(`${vulns.critical} critical vulnerabilities found`);
      }

      if (vulns.high > 0) {
        warnings.push(`${vulns.high} high vulnerabilities found`);
      }

      if (vulns.moderate > 0) {
        warnings.push(`${vulns.moderate} moderate vulnerabilities found`);
      }
    }

  } catch (error) {
    // npm audit returns non-zero exit code when vulnerabilities found
    if (error.stdout) {
      try {
        const audit = JSON.parse(error.stdout);
        if (audit.metadata && audit.metadata.vulnerabilities.total > 0) {
          warnings.push(`${audit.metadata.vulnerabilities.total} total vulnerabilities found`);
        }
      } catch (parseError) {
        warnings.push('Could not parse npm audit results');
      }
    }
  }

  return {
    passed: !failed,
    warnings,
    reason: failed ? 'Critical security vulnerabilities in dependencies' : null
  };
}

// Test 7: CSP Configuration
function testCSPConfiguration() {
  const warnings = [];
  let failed = false;

  // Check middleware.ts for CSP
  if (fs.existsSync('middleware.ts')) {
    const content = fs.readFileSync('middleware.ts', 'utf8');

    if (!content.includes('Content-Security-Policy')) {
      warnings.push('CSP not configured in middleware');
    } else {
      // Check for unsafe CSP directives
      if (content.includes("'unsafe-eval'")) {
        warnings.push("CSP contains 'unsafe-eval' directive");
      }
      if (content.includes("'unsafe-inline'")) {
        warnings.push("CSP contains 'unsafe-inline' directive");
      }
    }
  }

  // Check next.config.js for CSP
  if (fs.existsSync('next.config.js')) {
    const content = fs.readFileSync('next.config.js', 'utf8');

    if (!content.includes('Content-Security-Policy')) {
      warnings.push('CSP not configured in next.config.js');
    }
  }

  return {
    passed: !failed,
    warnings,
    reason: failed ? 'CSP configuration issues' : null
  };
}

// Run all tests
function runAllTests() {
  console.log('\n🚀 Starting Security Test Suite...\n');

  runTest('File Security', testFileSecurity);
  runTest('Environment Security', testEnvironmentSecurity);
  runTest('Code Security', testCodeSecurity);
  runTest('Docker Security', testDockerSecurity);
  runTest('Authentication Security', testAuthSecurity);
  runTest('Dependency Security', testDependencySecurity);
  runTest('CSP Configuration', testCSPConfiguration);

  // Generate report
  console.log('\n' + '=' .repeat(60));
  console.log('📊 SECURITY TEST SUMMARY');
  console.log('=' .repeat(60));
  console.log(`✅ Tests Passed: ${TEST_RESULTS.passed}`);
  console.log(`❌ Tests Failed: ${TEST_RESULTS.failed}`);
  console.log(`⚠️  Warnings: ${TEST_RESULTS.warnings}`);

  const totalTests = TEST_RESULTS.passed + TEST_RESULTS.failed;
  const successRate = Math.round((TEST_RESULTS.passed / totalTests) * 100);
  console.log(`📈 Success Rate: ${successRate}%`);

  // Security score calculation
  let securityScore = successRate;
  if (TEST_RESULTS.warnings > 10) securityScore -= 10;
  if (TEST_RESULTS.warnings > 20) securityScore -= 10;

  console.log(`🛡️  Security Score: ${Math.max(0, securityScore)}/100`);

  // Save detailed report
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      passed: TEST_RESULTS.passed,
      failed: TEST_RESULTS.failed,
      warnings: TEST_RESULTS.warnings,
      successRate,
      securityScore: Math.max(0, securityScore)
    },
    details: TEST_RESULTS.details
  };

  const reportsDir = path.join(__dirname, '..', 'logs');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const reportPath = path.join(reportsDir, 'security-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));

  console.log(`\n📝 Detailed report saved to: ${reportPath}`);

  // Exit with appropriate code
  process.exit(TEST_RESULTS.failed > 0 ? 1 : 0);
}

// Run the test suite
runAllTests();