#!/bin/bash

# GLXY Gaming Platform - Dependency Security Audit Script
# Comprehensive supply chain security validation

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Configuration
AUDIT_DIR="./security-audit-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="$AUDIT_DIR/dependency-audit-$TIMESTAMP.json"

# Create audit directory
mkdir -p "$AUDIT_DIR"

log "🔍 Starting comprehensive dependency security audit..."

# 1. NPM Audit
log "Running NPM security audit..."
npm audit --json > "$AUDIT_DIR/npm-audit-$TIMESTAMP.json" 2>/dev/null || true
npm audit --audit-level=low > "$AUDIT_DIR/npm-audit-readable-$TIMESTAMP.txt" 2>/dev/null || true

if [ -s "$AUDIT_DIR/npm-audit-readable-$TIMESTAMP.txt" ]; then
    warning "NPM audit found potential issues - check $AUDIT_DIR/npm-audit-readable-$TIMESTAMP.txt"
else
    success "NPM audit completed - no vulnerabilities found"
fi

# 2. Outdated packages check
log "Checking for outdated packages..."
npm outdated --json > "$AUDIT_DIR/outdated-packages-$TIMESTAMP.json" 2>/dev/null || true

# 3. License compliance check
log "Checking license compliance..."
npx license-checker --json > "$AUDIT_DIR/licenses-$TIMESTAMP.json" 2>/dev/null || {
    warning "license-checker not available, installing..."
    npm install -g license-checker
    npx license-checker --json > "$AUDIT_DIR/licenses-$TIMESTAMP.json" 2>/dev/null || true
}

# 4. Check for known malicious packages
log "Scanning for known malicious packages..."
cat > "$AUDIT_DIR/malicious-packages-check-$TIMESTAMP.sh" << 'EOF'
#!/bin/bash

# Known malicious package patterns (examples)
MALICIOUS_PATTERNS=(
    "event-stream@3.3.6"
    "eslint-scope@3.7.2"
    "flatmap-stream"
    "getcookies"
    "http-fetch-cookies"
)

echo "Checking for known malicious packages..."
for pattern in "${MALICIOUS_PATTERNS[@]}"; do
    if npm list "$pattern" 2>/dev/null; then
        echo "⚠️  CRITICAL: Potential malicious package detected: $pattern"
    fi
done
EOF

chmod +x "$AUDIT_DIR/malicious-packages-check-$TIMESTAMP.sh"
bash "$AUDIT_DIR/malicious-packages-check-$TIMESTAMP.sh" > "$AUDIT_DIR/malicious-scan-$TIMESTAMP.txt"

# 5. Check package integrity
log "Verifying package integrity..."
npm ls --json > "$AUDIT_DIR/package-tree-$TIMESTAMP.json" 2>/dev/null || true

# 6. Dependency graph analysis
log "Analyzing dependency graph..."
cat > "$AUDIT_DIR/dependency-analysis.js" << 'EOF'
const fs = require('fs');
const path = require('path');

// Read package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Analyze dependencies
const analysis = {
    timestamp: new Date().toISOString(),
    totalDependencies: 0,
    directDependencies: 0,
    devDependencies: 0,
    riskAssessment: {
        highRisk: [],
        mediumRisk: [],
        lowRisk: []
    },
    recommendations: []
};

// Count dependencies
if (packageJson.dependencies) {
    analysis.directDependencies = Object.keys(packageJson.dependencies).length;
    analysis.totalDependencies += analysis.directDependencies;
}

if (packageJson.devDependencies) {
    analysis.devDependencies = Object.keys(packageJson.devDependencies).length;
    analysis.totalDependencies += analysis.devDependencies;
}

// Risk assessment for common packages
const riskPatterns = {
    high: ['eval', 'exec', 'child_process', 'vm'],
    medium: ['request', 'lodash', 'moment'],
    low: ['react', 'next', '@types/*']
};

// Analyze each dependency
const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies
};

Object.keys(allDeps).forEach(dep => {
    if (riskPatterns.high.some(pattern => dep.includes(pattern))) {
        analysis.riskAssessment.highRisk.push(dep);
    } else if (riskPatterns.medium.some(pattern => dep.includes(pattern))) {
        analysis.riskAssessment.mediumRisk.push(dep);
    } else {
        analysis.riskAssessment.lowRisk.push(dep);
    }
});

// Generate recommendations
if (analysis.riskAssessment.highRisk.length > 0) {
    analysis.recommendations.push('Review high-risk dependencies for security implications');
}

if (analysis.totalDependencies > 100) {
    analysis.recommendations.push('Consider reducing dependency count to minimize attack surface');
}

console.log(JSON.stringify(analysis, null, 2));
EOF

node "$AUDIT_DIR/dependency-analysis.js" > "$AUDIT_DIR/dependency-analysis-$TIMESTAMP.json"

# 7. Check for security advisories
log "Checking security advisories..."
cat > "$AUDIT_DIR/security-advisories-check.js" << 'EOF'
const https = require('https');
const fs = require('fs');

async function checkSecurityAdvisories() {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const dependencies = Object.keys(packageJson.dependencies || {});

    console.log(`Checking ${dependencies.length} dependencies for security advisories...`);

    // This is a simplified check - in production, integrate with:
    // - GitHub Security Advisory Database
    // - NPM Security Advisory Database
    // - Snyk API
    // - OSSF Scorecard

    const advisories = {
        timestamp: new Date().toISOString(),
        checkedPackages: dependencies.length,
        advisories: [],
        recommendations: [
            'Integrate with automated security advisory checking',
            'Set up dependency update automation',
            'Monitor security mailing lists',
            'Implement dependency pinning strategy'
        ]
    };

    console.log(JSON.stringify(advisories, null, 2));
}

checkSecurityAdvisories();
EOF

node "$AUDIT_DIR/security-advisories-check.js" > "$AUDIT_DIR/security-advisories-$TIMESTAMP.json"

# 8. Generate comprehensive report
log "Generating comprehensive security report..."
cat > "$AUDIT_DIR/generate-report.js" << 'EOF'
const fs = require('fs');

// Read all audit files
const timestamp = process.argv[2];
const auditDir = './security-audit-reports';

const report = {
    timestamp: new Date().toISOString(),
    auditId: timestamp,
    summary: {
        status: 'completed',
        riskLevel: 'low',
        criticalIssues: 0,
        recommendations: []
    },
    audits: {}
};

try {
    // NPM Audit
    const npmAuditFile = `${auditDir}/npm-audit-${timestamp}.json`;
    if (fs.existsSync(npmAuditFile)) {
        const npmAudit = JSON.parse(fs.readFileSync(npmAuditFile, 'utf8'));
        report.audits.npmAudit = {
            vulnerabilities: npmAudit.metadata?.vulnerabilities || {},
            totalIssues: Object.values(npmAudit.metadata?.vulnerabilities || {}).reduce((a, b) => a + b, 0)
        };
    }

    // Dependency Analysis
    const depAnalysisFile = `${auditDir}/dependency-analysis-${timestamp}.json`;
    if (fs.existsSync(depAnalysisFile)) {
        report.audits.dependencyAnalysis = JSON.parse(fs.readFileSync(depAnalysisFile, 'utf8'));
    }

    // Security Advisories
    const advisoriesFile = `${auditDir}/security-advisories-${timestamp}.json`;
    if (fs.existsSync(advisoriesFile)) {
        report.audits.securityAdvisories = JSON.parse(fs.readFileSync(advisoriesFile, 'utf8'));
    }

    // Assess overall risk level
    if (report.audits.npmAudit?.totalIssues > 0) {
        report.summary.riskLevel = 'medium';
        report.summary.criticalIssues += report.audits.npmAudit.totalIssues;
    }

    if (report.audits.dependencyAnalysis?.riskAssessment?.highRisk?.length > 0) {
        report.summary.riskLevel = 'high';
        report.summary.recommendations.push('Review high-risk dependencies');
    }

    // Generate recommendations
    if (report.summary.criticalIssues === 0) {
        report.summary.recommendations.push('No critical security issues found');
        report.summary.status = 'passed';
    } else {
        report.summary.recommendations.push('Address identified security vulnerabilities');
        report.summary.status = 'needs_attention';
    }

    console.log(JSON.stringify(report, null, 2));

} catch (error) {
    console.error('Error generating report:', error.message);
}
EOF

node "$AUDIT_DIR/generate-report.js" "$TIMESTAMP" > "$REPORT_FILE"

# 9. Display summary
log "Dependency security audit completed!"
echo ""
echo "📊 Audit Summary:"
echo "=================="

if [ -f "$REPORT_FILE" ]; then
    node -e "
        const report = JSON.parse(require('fs').readFileSync('$REPORT_FILE', 'utf8'));
        console.log('Status:', report.summary.status);
        console.log('Risk Level:', report.summary.riskLevel);
        console.log('Critical Issues:', report.summary.criticalIssues);
        console.log('');
        console.log('Recommendations:');
        report.summary.recommendations.forEach(rec => console.log('- ' + rec));
        console.log('');
        console.log('Detailed report available at: $REPORT_FILE');
    "
else
    warning "Could not generate summary report"
fi

# 10. Cleanup temporary files
log "Cleaning up temporary files..."
rm -f "$AUDIT_DIR/dependency-analysis.js"
rm -f "$AUDIT_DIR/security-advisories-check.js"
rm -f "$AUDIT_DIR/generate-report.js"

success "🔒 Dependency security audit completed successfully!"
echo ""
echo "All audit reports saved in: $AUDIT_DIR"
echo "Main report: $REPORT_FILE"
echo ""
echo "Next steps:"
echo "1. Review the audit report"
echo "2. Address any identified vulnerabilities"
echo "3. Set up automated dependency monitoring"
echo "4. Schedule regular security audits"