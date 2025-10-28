/**
 * Verification Script for PDF Field Extraction Service
 * Checks if all components are properly integrated
 */

import { resolve } from 'path'
import { existsSync } from 'fs'

interface CheckResult {
  name: string
  status: 'pass' | 'fail' | 'warn'
  message: string
}

const checks: CheckResult[] = []

function check(name: string, condition: boolean, message: string, warning = false) {
  checks.push({
    name,
    status: condition ? 'pass' : (warning ? 'warn' : 'fail'),
    message: condition ? `✅ ${message}` : (warning ? `⚠️  ${message}` : `❌ ${message}`)
  })
}

console.log('\n🔍 Verifying PDF Field Extraction Service...\n')

// ============================================
// = File Existence Checks
// ============================================

console.log('📁 Checking file structure...')

const files = {
  'Core Extractor': 'lib/web-adobe/pdf-field-extractor.ts',
  'Analysis Worker': 'lib/web-adobe/field-analysis-worker.ts',
  'Field Validator': 'lib/web-adobe/field-validator.ts',
  'Type Definitions': 'lib/web-adobe/types.ts',
  'Index Export': 'lib/web-adobe/index.ts',
  'Upload API': 'app/api/web-adobe/upload/route.ts',
  'Analyze API': 'app/api/web-adobe/analyze/[documentId]/route.ts',
  'Socket Handler': 'lib/socket-handlers/web-adobe.ts',
  'Unit Tests': 'lib/web-adobe/__tests__/pdf-field-extractor.test.ts',
  'Test Script': 'scripts/test-pdf-extraction.ts',
  'README': 'lib/web-adobe/README.md',
}

for (const [name, path] of Object.entries(files)) {
  const fullPath = resolve(process.cwd(), path)
  check(
    `File: ${name}`,
    existsSync(fullPath),
    `${name} exists at ${path}`
  )
}

// ============================================
// = Import Checks
// ============================================

console.log('\n📦 Checking imports...')

try {
  const { extractFieldsFromPdf, mergeOverlappingFields } = require('../lib/web-adobe/pdf-field-extractor')
  check('Import: pdf-field-extractor', true, 'Core extractor functions imported successfully')
} catch (error) {
  check('Import: pdf-field-extractor', false, `Failed to import: ${error}`)
}

try {
  const { analyzeDocument, reanalyzeDocument } = require('../lib/web-adobe/field-analysis-worker')
  check('Import: field-analysis-worker', true, 'Worker functions imported successfully')
} catch (error) {
  check('Import: field-analysis-worker', false, `Failed to import: ${error}`)
}

try {
  const { validateFieldValue, sanitizeFieldValue } = require('../lib/web-adobe/field-validator')
  check('Import: field-validator', true, 'Validator functions imported successfully')
} catch (error) {
  check('Import: field-validator', false, `Failed to import: ${error}`)
}

try {
  const types = require('../lib/web-adobe/types')
  check('Import: types', true, 'Type definitions imported successfully')
} catch (error) {
  check('Import: types', false, `Failed to import: ${error}`)
}

try {
  const index = require('../lib/web-adobe/index')
  check('Import: index', true, 'Index exports imported successfully')
} catch (error) {
  check('Import: index', false, `Failed to import: ${error}`)
}

// ============================================
// = Dependency Checks
// ============================================

console.log('\n📚 Checking dependencies...')

try {
  require('pdf-lib')
  check('Dependency: pdf-lib', true, 'pdf-lib is installed')
} catch {
  check('Dependency: pdf-lib', false, 'pdf-lib is NOT installed - run: npm install pdf-lib')
}

try {
  require('pdfjs-dist')
  check('Dependency: pdfjs-dist', true, 'pdfjs-dist is installed')
} catch {
  check('Dependency: pdfjs-dist', false, 'pdfjs-dist is NOT installed - run: npm install pdfjs-dist')
}

try {
  require('socket.io')
  check('Dependency: socket.io', true, 'socket.io is installed')
} catch {
  check('Dependency: socket.io', false, 'socket.io is NOT installed - run: npm install socket.io')
}

try {
  require('@prisma/client')
  check('Dependency: @prisma/client', true, '@prisma/client is installed')
} catch {
  check('Dependency: @prisma/client', false, '@prisma/client is NOT installed - run: npm install @prisma/client')
}

// ============================================
// = Database Schema Checks
// ============================================

console.log('\n🗄️  Checking database schema...')

try {
  const fs = require('fs')
  const schemaPath = resolve(process.cwd(), 'prisma/schema.prisma')
  const schema = fs.readFileSync(schemaPath, 'utf-8')

  check(
    'Schema: PdfDocument model',
    schema.includes('model PdfDocument'),
    'PdfDocument model exists in schema'
  )

  check(
    'Schema: PdfField model',
    schema.includes('model PdfField'),
    'PdfField model exists in schema'
  )

  check(
    'Schema: PdfDocumentStatus enum',
    schema.includes('enum PdfDocumentStatus'),
    'PdfDocumentStatus enum exists'
  )

  check(
    'Schema: ANALYZING status',
    schema.includes('ANALYZING'),
    'ANALYZING status exists in enum'
  )

} catch (error) {
  check('Schema Check', false, `Failed to read schema: ${error}`)
}

// ============================================
// = API Route Checks
// ============================================

console.log('\n🌐 Checking API routes...')

try {
  const fs = require('fs')

  const uploadPath = resolve(process.cwd(), 'app/api/web-adobe/upload/route.ts')
  const uploadCode = fs.readFileSync(uploadPath, 'utf-8')

  check(
    'API: Upload auto-trigger',
    uploadCode.includes('analyzeDocument'),
    'Upload route includes analyzeDocument call'
  )

  check(
    'API: Upload error handling',
    uploadCode.includes('catch'),
    'Upload route has error handling'
  )

  const analyzePath = resolve(process.cwd(), 'app/api/web-adobe/analyze/[documentId]/route.ts')
  check(
    'API: Analyze route',
    existsSync(analyzePath),
    'Analyze route exists'
  )

} catch (error) {
  check('API Routes', false, `Failed to check routes: ${error}`)
}

// ============================================
// = Socket.IO Handler Checks
// ============================================

console.log('\n🔌 Checking Socket.IO integration...')

try {
  const fs = require('fs')
  const socketPath = resolve(process.cwd(), 'lib/socket-handlers/web-adobe.ts')
  const socketCode = fs.readFileSync(socketPath, 'utf-8')

  check(
    'Socket.IO: publishAnalysisEvent',
    socketCode.includes('publishAnalysisEvent'),
    'publishAnalysisEvent function exists'
  )

  check(
    'Socket.IO: analysis events',
    socketCode.includes('analysis:start') &&
    socketCode.includes('analysis:progress') &&
    socketCode.includes('analysis:complete'),
    'All analysis events are defined'
  )

} catch (error) {
  check('Socket.IO', false, `Failed to check socket handler: ${error}`)
}

// ============================================
// = Test Checks
// ============================================

console.log('\n🧪 Checking tests...')

try {
  const fs = require('fs')
  const testPath = resolve(process.cwd(), 'lib/web-adobe/__tests__/pdf-field-extractor.test.ts')
  const testCode = fs.readFileSync(testPath, 'utf-8')

  check(
    'Tests: calculateFieldArea',
    testCode.includes('calculateFieldArea'),
    'calculateFieldArea tests exist'
  )

  check(
    'Tests: doBoxesOverlap',
    testCode.includes('doBoxesOverlap'),
    'doBoxesOverlap tests exist'
  )

  check(
    'Tests: mergeOverlappingFields',
    testCode.includes('mergeOverlappingFields'),
    'mergeOverlappingFields tests exist'
  )

} catch (error) {
  check('Tests', false, `Failed to check tests: ${error}`)
}

// ============================================
// = Summary
// ============================================

console.log('\n' + '='.repeat(60))
console.log('VERIFICATION SUMMARY')
console.log('='.repeat(60) + '\n')

const passed = checks.filter(c => c.status === 'pass').length
const failed = checks.filter(c => c.status === 'fail').length
const warned = checks.filter(c => c.status === 'warn').length

checks.forEach(check => {
  console.log(check.message)
})

console.log('\n' + '─'.repeat(60))
console.log(`Total Checks: ${checks.length}`)
console.log(`✅ Passed: ${passed}`)
console.log(`❌ Failed: ${failed}`)
console.log(`⚠️  Warnings: ${warned}`)
console.log('─'.repeat(60) + '\n')

if (failed === 0) {
  console.log('🎉 All critical checks passed! PDF Field Extraction Service is ready.\n')
  process.exit(0)
} else {
  console.log('⚠️  Some checks failed. Please review the issues above.\n')
  process.exit(1)
}
