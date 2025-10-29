const { execSync } = require('child_process');
const fs = require('fs');

console.log(' Analysiere TypeScript-Fehler...\n');

try {
  execSync('npx tsc --noEmit --pretty false 2>&1', { 
    encoding: 'utf-8',
    maxBuffer: 50 * 1024 * 1024 
  });
  console.log(' Keine TypeScript-Fehler gefunden!');
} catch (error) {
  const output = error.stdout || error.message;
  const lines = output.split('\n');
  const errors = {};
  
  lines.forEach(line => {
    if (line.includes('error TS')) {
      const match = line.match(/error TS\d+: (.+)/);
      if (match) {
        const errorMsg = match[1];
        errors[errorMsg] = (errors[errorMsg] || 0) + 1;
      }
    }
  });
  
  const sorted = Object.entries(errors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  console.log(' TOP 10 TypeScript-Fehler:\n');
  sorted.forEach(([msg, count], i) => {
    console.log(`${i + 1}. [${count}x] ${msg.substring(0, 80)}${msg.length > 80 ? '...' : ''}`);
  });
  
  fs.writeFileSync('ts-errors-analysis.json', JSON.stringify({
    totalErrors: lines.filter(l => l.includes('error TS')).length,
    topErrors: sorted
  }, null, 2));
  
  console.log('\n Analyse gespeichert: ts-errors-analysis.json');
}
