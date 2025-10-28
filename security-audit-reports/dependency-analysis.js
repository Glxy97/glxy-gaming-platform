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
