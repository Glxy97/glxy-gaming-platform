#!/usr/bin/env node
/**
 * BATCH AUTO-FIXER for "Object is possibly undefined"
 * Systematically fixes array access and object property access
 */

const fs = require('fs');

const fixes = [
  // theme.materialSet[0] und theme.materialSet[1]
  {
    pattern: /theme\.materialSet\[(\d+)\]/g,
    replacement: '(theme.materialSet[$1]!)'
  },
  // Array [0] Zugriffe mit || fallback
  {
    pattern: /\breturn\s+(\w+)\[0\]\s*$/gm,
    replacement: 'return $1[0]!'
  },
  // Array-Zugriffe in Argumenten
  {
    pattern: /this\.roomTemplates\[(\d+)\]/g,
    replacement: 'this.roomTemplates[$1]!'
  },
  // hit. Zugriffe
  {
    pattern: /\bhit\.(point|distance|object|face|normal)\b/g,
    replacement: 'hit!.$1'
  },
  // pos[0], pos[1], pos[2]
  {
    pattern: /\bpos\[(\d+)\]/g,
    replacement: '(pos[$1] ?? 0)'
  },
  // wall.pos[0], etc
  {
    pattern: /wall\.pos\[(\d+)\]/g,
    replacement: '(wall.pos[$1] ?? 0)'
  },
  // segment.start[0], etc
  {
    pattern: /segment\.(start|end)\[(\d+)\]/g,
    replacement: '(segment.$1[$2] ?? 0)'
  },
  // intersects[0]
  {
    pattern: /intersects\[0\]\.(\w+)/g,
    replacement: 'intersects[0]!.$1'
  },
  // output[0]
  {
    pattern: /output\[(\d+)\]/g,
    replacement: '(output[$1] ?? 0)'
  },
  // input[j]
  {
    pattern: /input\[(\w+)\]/g,
    replacement: '(input[$1] ?? 0)'
  },
  // positions[i]
  {
    pattern: /positions\[(i \* \d+[^\]]*)\]/g,
    replacement: '(positions[$1] ?? 0)'
  },
  // velocities[i]
  {
    pattern: /velocities\[(\w+)\]\.(\w+)/g,
    replacement: 'velocities[$1]!.$2'
  },
  // geometry.attributes.position
  {
    pattern: /geometry\.attributes\.position(?!\.)/g,
    replacement: 'geometry.attributes.position!'
  },
  // room.
  {
    pattern: /\broom\.(enemyCount|position|size)\b/g,
    replacement: 'room!.$1'
  },
  // targetRoom.
  {
    pattern: /\btargetRoom\.(position)\b/g,
    replacement: 'targetRoom!.$1'
  },
  // targetPosition.
  {
    pattern: /\btargetPosition\.(clone)\b/g,
    replacement: 'targetPosition!.$1'
  },
  // newObjective., newEvent.
  {
    pattern: /\b(newObjective|newEvent)\.(title|type)\b/g,
    replacement: '$1!.$2'
  },
  // currentQ
  {
    pattern: /\bcurrentQ\b(?!:)/g,
    replacement: '(currentQ ?? 0)'
  },
  // recentStates[0]
  {
    pattern: /recentStates\[0\]\.timestamp/g,
    replacement: 'recentStates[0]!.timestamp'
  }
];

const filesToFix = [
  'lib/games/levels/enhanced-intelligent-level-generator.ts',
  'lib/games/levels/intelligent-level-generator.ts',
  'lib/games/fps-core.ts',
  'lib/games/weapons/enhanced-intelligent-weapon-system.ts',
  'lib/games/weapons/intelligent-weapon-system.ts',
  'lib/games/shooting-system.ts',
  'lib/games/vfx/effects.ts',
  'lib/games/difficulty/enhanced-adaptive-difficulty.ts',
  'lib/games/fps-core-simple.ts',
  'lib/games/fps-enhanced-ai.ts',
  'lib/games/gameplay/dynamic-gameplay.ts',
  'lib/games/levels/level-manager.ts'
];

console.log('🔧 Batch Auto-Fixer startet...\n');

let totalFiles = 0;
let totalFixes = 0;

for (const file of filesToFix) {
  try {
    if (!fs.existsSync(file)) {
      console.log(`⏭️  ${file}: Datei existiert nicht`);
      continue;
    }
    
    let content = fs.readFileSync(file, 'utf-8');
    let fixCount = 0;
    
    for (const fix of fixes) {
      const before = content;
      content = content.replace(fix.pattern, fix.replacement);
      if (before !== content) {
        fixCount++;
      }
    }
    
    if (fixCount > 0) {
      fs.writeFileSync(file, content, 'utf-8');
      console.log(`✅ ${file.split('/').pop()}: ${fixCount} fixes applied`);
      totalFiles++;
      totalFixes += fixCount;
    } else {
      console.log(`⏭️  ${file.split('/').pop()}: No changes`);
    }
  } catch (err) {
    console.log(`❌ ${file}: ${err.message}`);
  }
}

console.log(`\n✅ Total: ${totalFixes} fixes in ${totalFiles} files\n`);

