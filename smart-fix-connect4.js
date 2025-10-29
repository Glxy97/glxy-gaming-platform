#!/usr/bin/env node
/**
 * SMART FIX: Connect4 Board Array Access
 * Fügt Optional Chaining und Fallbacks für board[row][col] hinzu
 */

const fs = require('fs');

function fixBoardAccess(content) {
  // Pattern 1: board[row][col] === player
  content = content.replace(
    /board\[(\w+)\]\[(\w+)\]\s*===\s*(\w+)/g,
    '(board[$1]?.[$2] ?? null) === $3'
  );
  
  // Pattern 2: board[row][col] !== player
  content = content.replace(
    /board\[(\w+)\]\[(\w+)\]\s*!==\s*(\w+)/g,
    '(board[$1]?.[$2] ?? null) !== $3'
  );
  
  // Pattern 3: board[row][col]  (ohne Vergleich)
  content = content.replace(
    /(\s+)board\[(\w+)\]\[(\w+)\]([^?=\[])/g,
    '$1(board[$2]?.[$3] ?? null)$4'
  );
  
  // Pattern 4: cell[0] und cell[1] Zugriffe
  content = content.replace(
    /(\w+)\[0\]\s*(?=[,\)])/g,
    '($1[0] ?? 0)'
  );
  
  content = content.replace(
    /(\w+)\[1\]\s*(?=[,\)])/g,
    '($1[1] ?? 0)'
  );
  
  return content;
}

console.log('🔧 Smart Fix: Connect4 Board Access\n');

const files = [
  'components/games/board/connect4-2025.tsx',
  'components/games/board/connect4-engine.tsx'
];

let totalFixes = 0;

for (const file of files) {
  try {
    const original = fs.readFileSync(file, 'utf-8');
    const fixed = fixBoardAccess(original);
    
    if (original !== fixed) {
      fs.writeFileSync(file, fixed, 'utf-8');
      const changes = (fixed.match(/\?\./g) || []).length;
      console.log(`✅ ${file}: ${changes} fixes applied`);
      totalFixes += changes;
    } else {
      console.log(`⏭️  ${file}: No changes needed`);
    }
  } catch (err) {
    console.log(`❌ ${file}: ${err.message}`);
  }
}

console.log(`\n✅ Total: ${totalFixes} fixes applied\n`);

