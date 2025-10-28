/**
 * Web-Adobe Properties Panel Verification Script
 * Verifies all components, types, and utilities are correctly installed
 */

import { existsSync } from 'fs'
import { resolve } from 'path'

interface VerificationResult {
  name: string
  path: string
  exists: boolean
  size?: number
}

const COMPONENT_FILES = [
  'components/web-adobe/properties-panel.tsx',
  'components/web-adobe/field-property-section.tsx',
  'components/web-adobe/validation-builder.tsx',
  'components/web-adobe/position-editor.tsx',
  'components/web-adobe/datapad-mapper.tsx',
  'components/web-adobe/bulk-edit-panel.tsx',
  'components/web-adobe/index.ts',
  'components/web-adobe/README.md',
]

const TYPE_FILES = [
  'types/web-adobe.ts',
]

const UTILITY_FILES = [
  'lib/web-adobe/validation-presets.ts',
  'lib/web-adobe/field-defaults.ts',
]

const HOOK_FILES = [
  'hooks/use-properties-panel.ts',
]

const DEMO_FILES = [
  'app/web-adobe/demo/page.tsx',
]

const DOC_FILES = [
  'docs/web-adobe/ACCESSIBILITY_AUDIT.md',
  'docs/web-adobe/DESIGN_SYSTEM.md',
  'docs/web-adobe/QUICK_START.md',
  'WEB_ADOBE_PROPERTIES_PANEL_SUMMARY.md',
]

function verifyFile(filePath: string): VerificationResult {
  const fullPath = resolve(process.cwd(), filePath)
  const exists = existsSync(fullPath)

  return {
    name: filePath,
    path: fullPath,
    exists,
  }
}

function printResults(category: string, results: VerificationResult[]) {
  console.log(`\n## ${category}`)
  console.log('='.repeat(60))

  let successCount = 0
  let failCount = 0

  results.forEach((result) => {
    const status = result.exists ? '✅' : '❌'
    console.log(`${status} ${result.name}`)

    if (result.exists) {
      successCount++
    } else {
      failCount++
      console.log(`   ⚠️  File not found: ${result.path}`)
    }
  })

  console.log(`\nTotal: ${successCount}/${results.length} files found`)

  return { successCount, failCount, total: results.length }
}

async function main() {
  console.log('🔍 Web-Adobe Properties Panel Verification\n')
  console.log('Project:', process.cwd())
  console.log('Date:', new Date().toISOString())

  const allResults = {
    components: 0,
    types: 0,
    utilities: 0,
    hooks: 0,
    demos: 0,
    docs: 0,
  }

  // Verify Components
  const componentResults = COMPONENT_FILES.map(verifyFile)
  const componentStats = printResults('📦 Components', componentResults)
  allResults.components = componentStats.successCount

  // Verify Types
  const typeResults = TYPE_FILES.map(verifyFile)
  const typeStats = printResults('🏷️  Type Definitions', typeResults)
  allResults.types = typeStats.successCount

  // Verify Utilities
  const utilityResults = UTILITY_FILES.map(verifyFile)
  const utilityStats = printResults('🛠️  Utility Functions', utilityResults)
  allResults.utilities = utilityStats.successCount

  // Verify Hooks
  const hookResults = HOOK_FILES.map(verifyFile)
  const hookStats = printResults('🪝 React Hooks', hookResults)
  allResults.hooks = hookStats.successCount

  // Verify Demo
  const demoResults = DEMO_FILES.map(verifyFile)
  const demoStats = printResults('🎮 Demo Pages', demoResults)
  allResults.demos = demoStats.successCount

  // Verify Documentation
  const docResults = DOC_FILES.map(verifyFile)
  const docStats = printResults('📚 Documentation', docResults)
  allResults.docs = docStats.successCount

  // Summary
  console.log('\n')
  console.log('='.repeat(60))
  console.log('## 📊 SUMMARY')
  console.log('='.repeat(60))

  const totalSuccess = Object.values(allResults).reduce((a, b) => a + b, 0)
  const totalFiles =
    COMPONENT_FILES.length +
    TYPE_FILES.length +
    UTILITY_FILES.length +
    HOOK_FILES.length +
    DEMO_FILES.length +
    DOC_FILES.length

  console.log(`\n✅ Components:     ${allResults.components}/${COMPONENT_FILES.length}`)
  console.log(`✅ Types:          ${allResults.types}/${TYPE_FILES.length}`)
  console.log(`✅ Utilities:      ${allResults.utilities}/${UTILITY_FILES.length}`)
  console.log(`✅ Hooks:          ${allResults.hooks}/${HOOK_FILES.length}`)
  console.log(`✅ Demos:          ${allResults.demos}/${DEMO_FILES.length}`)
  console.log(`✅ Documentation:  ${allResults.docs}/${DOC_FILES.length}`)

  console.log(`\n${'='.repeat(60)}`)
  console.log(`📈 TOTAL: ${totalSuccess}/${totalFiles} files verified`)
  console.log('='.repeat(60))

  if (totalSuccess === totalFiles) {
    console.log('\n🎉 SUCCESS! All Web-Adobe files are correctly installed!')
    console.log('\n📝 Next Steps:')
    console.log('   1. Run: npm run dev')
    console.log('   2. Navigate to: http://localhost:3000/web-adobe/demo')
    console.log('   3. Start editing PDF form fields!\n')
    process.exit(0)
  } else {
    console.log('\n⚠️  WARNING! Some files are missing.')
    console.log('   Check the file paths above and ensure all files are present.\n')
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('❌ Verification failed:', error)
  process.exit(1)
})
