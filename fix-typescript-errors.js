#!/usr/bin/env node
/**
 * PROFESSIONELLER TYPESCRIPT AUTO-FIX
 * Behebt systematisch "Object is possibly undefined" Fehler
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 TypeScript Auto-Fix startet...\n');

// Strategie: Entferne @ts-nocheck und lass TypeScript die Fehler zeigen
// Dann können wir gezielt fixen

const filesWithTsNocheck = [];

function findTsNocheckFiles(dir, baseDir = dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      if (!file.name.startsWith('.') && file.name !== 'node_modules') {
        findTsNocheckFiles(fullPath, baseDir);
      }
    } else if (file.name.endsWith('.ts') || file.name.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      if (content.includes('@ts-nocheck')) {
        const relativePath = path.relative(baseDir, fullPath);
        filesWithTsNocheck.push(relativePath);
      }
    }
  }
}

// Phase 1: Finde alle Dateien mit @ts-nocheck
console.log('📋 Phase 1: Scanne Dateien...');
findTsNocheckFiles('lib');
findTsNocheckFiles('components/games');

console.log(`✅ Gefunden: ${filesWithTsNocheck.length} Dateien mit @ts-nocheck\n`);

// Phase 2: Entferne @ts-nocheck von den ersten 20 Dateien
console.log('📋 Phase 2: Entferne @ts-nocheck von 20 Dateien...');
const batch1 = filesWithTsNocheck.slice(0, 20);

let removed = 0;
for (const file of batch1) {
  try {
    let content = fs.readFileSync(file, 'utf-8');
    if (content.includes('// @ts-nocheck')) {
      content = content.replace(/^\/\/ @ts-nocheck\r?\n/, '');
      fs.writeFileSync(file, content, 'utf-8');
      removed++;
      console.log(`  ✓ ${file}`);
    }
  } catch (err) {
    console.log(`  ✗ ${file}: ${err.message}`);
  }
}

console.log(`\n✅ @ts-nocheck entfernt von ${removed} Dateien`);

// Phase 3: TypeScript Check auf diese Dateien
console.log('\n📋 Phase 3: TypeScript Check...');
try {
  execSync('npx tsc --noEmit', { encoding: 'utf-8', stdio: 'inherit' });
  console.log('✅ Keine Fehler!');
} catch (error) {
  console.log('⚠️  Fehler gefunden - müssen manuell gefixt werden');
}

console.log('\n📊 Statistik:');
console.log(`  Gesamt: ${filesWithTsNocheck.length} Dateien`);
console.log(`  Bearbeitet: ${removed} Dateien`);
console.log(`  Verbleibend: ${filesWithTsNocheck.length - removed} Dateien`);

// Speichere Liste der verbleibenden Dateien
fs.writeFileSync('remaining-ts-nocheck.json', JSON.stringify({
  total: filesWithTsNocheck.length,
  processed: removed,
  remaining: filesWithTsNocheck.slice(20),
  processed_files: batch1
}, null, 2));

console.log('\n✅ Batch 1 abgeschlossen!');
console.log('📝 Verbleibende Dateien: remaining-ts-nocheck.json\n');

