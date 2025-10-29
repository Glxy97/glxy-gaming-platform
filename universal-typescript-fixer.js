#!/usr/bin/env node
/**
 * UNIVERSAL TYPESCRIPT AUTO-FIXER
 * Behebt systematisch "Object is possibly undefined" Fehler
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Universal TypeScript Auto-Fixer\n');

// Hole Liste aller Dateien mit Fehlern
console.log('📋 Phase 1: Analysiere TypeScript-Fehler...');
let errorOutput;
try {
  execSync('npx tsc --noEmit --pretty false 2>&1', {
    encoding: 'utf-8',
    maxBuffer: 50 * 1024 * 1024
  });
  console.log('✅ Keine Fehler gefunden!');
  process.exit(0);
} catch (error) {
  errorOutput = error.stdout || error.message;
}

// Parse Fehler
const fileErrors = {};
const lines = errorOutput.split('\n');

for (const line of lines) {
  const match = line.match(/^(.+\.tsx?)\((\d+),(\d+)\):\s*error\s+TS\d+:\s*(.+)$/);
  if (match) {
    const [, file, lineNum, col, message] = match;
    if (!fileErrors[file]) {
      fileErrors[file] = [];
    }
    fileErrors[file].push({
      line: parseInt(lineNum),
      col: parseInt(col),
      message: message.trim()
    });
  }
}

const sortedFiles = Object.entries(fileErrors).sort((a, b) => b[1].length - a[1].length);

console.log(`\n📊 Gefunden: ${sortedFiles.length} Dateien mit Fehlern`);
console.log('Top 10 Dateien:');
sortedFiles.slice(0, 10).forEach(([file, errors], i) => {
  console.log(`  ${i + 1}. ${file}: ${errors.length} Fehler`);
});

// Erstelle Auto-Fix Funktionen
function fixArrayAccess(content) {
  // array[index] === value
  content = content.replace(
    /(\w+)\[(\d+|[a-zA-Z_$][\w$]*)\]\s*===\s*/g,
    '($1[$2] ?? null) === '
  );
  
  // array[index] !== value
  content = content.replace(
    /(\w+)\[(\d+|[a-zA-Z_$][\w$]*)\]\s*!==\s*/g,
    '($1[$2] ?? null) !== '
  );
  
  return content;
}

function fixObjectAccess(content) {
  // object.property ohne Optional Chaining - NUR wenn Fehler "Object is possibly undefined"
  // VORSICHT: Nur in spezifischen Kontexten
  return content;
}

function fixTypeUndefined(content) {
  // Type 'X | undefined' is not assignable to type 'X'
  // Füge || fallback hinzu
  return content;
}

console.log('\n🔧 Phase 2: Auto-Fix Array-Zugriffe...');

let totalFixed = 0;
const filesToFix = sortedFiles.slice(0, 15); // Top 15 Dateien

for (const [file, errors] of filesToFix) {
  try {
    const original = fs.readFileSync(file, 'utf-8');
    let fixed = original;
    
    // Apply fixes
    fixed = fixArrayAccess(fixed);
    
    if (original !== fixed) {
      fs.writeFileSync(file, fixed, 'utf-8');
      const changes = (fixed.match(/\?\?/g) || []).length;
      console.log(`  ✅ ${path.basename(file)}: ~${changes} fixes`);
      totalFixed++;
    }
  } catch (err) {
    console.log(`  ❌ ${path.basename(file)}: ${err.message}`);
  }
}

console.log(`\n✅ ${totalFixed} Dateien automatisch gefixt!`);

// Re-check Fehler
console.log('\n📊 Prüfe verbleibende Fehler...');
try {
  execSync('npx tsc --noEmit --pretty false 2>&1', {
    encoding: 'utf-8',
    stdio: 'pipe',
    maxBuffer: 50 * 1024 * 1024
  });
  console.log('✅ KEINE Fehler mehr!');
} catch (error) {
  const output = error.stdout || error.message;
  const remaining = (output.match(/error TS/g) || []).length;
  console.log(`⚠️  Verbleibend: ${remaining} Fehler`);
  
  // Zeige Top 5 verbleibende Dateien
  const remainingFiles = {};
  output.split('\n').forEach(line => {
    const match = line.match(/^(.+\.tsx?)\(/);
    if (match) {
      const file = match[1];
      remainingFiles[file] = (remainingFiles[file] || 0) + 1;
    }
  });
  
  const top5 = Object.entries(remainingFiles)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
    
  console.log('\nTop 5 verbleibende Dateien:');
  top5.forEach(([file, count], i) => {
    console.log(`  ${i + 1}. ${path.basename(file)}: ${count} Fehler`);
  });
}

console.log('\n✅ Auto-Fix Batch abgeschlossen!\n');

