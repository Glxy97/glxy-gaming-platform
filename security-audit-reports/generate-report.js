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
