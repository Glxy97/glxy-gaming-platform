/**
 * Test Script for PDF Services
 * Tests both /api/process-pdf and /api/generate-pdf endpoints
 *
 * Usage:
 * tsx scripts/test-pdf-services.ts
 */

import { readFile } from 'fs/promises'
import { join } from 'path'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

// ============================================================================
// Test Data
// ============================================================================

const testGenerateData = {
  fields: [
    {
      id: '1',
      name: 'firstName',
      type: 'text',
      label: 'First Name',
      value: 'John',
      required: true,
    },
    {
      id: '2',
      name: 'lastName',
      type: 'text',
      label: 'Last Name',
      value: 'Doe',
      required: true,
    },
    {
      id: '3',
      name: 'email',
      type: 'email',
      label: 'Email Address',
      value: 'john.doe@example.com',
      required: true,
    },
    {
      id: '4',
      name: 'phone',
      type: 'text',
      label: 'Phone Number',
      value: '+49 123 456789',
      required: false,
    },
    {
      id: '5',
      name: 'terms',
      type: 'checkbox',
      label: 'I accept the terms and conditions',
      value: true,
      required: true,
    },
  ],
  template: 'contact-form',
  settings: {
    pageSize: 'A4',
    orientation: 'Portrait',
    fillable: false,
    encrypted: false,
    metadata: {
      title: 'Contact Form Submission',
      author: 'GLXY Gaming Platform',
      subject: 'User Contact Information',
      keywords: ['contact', 'form', 'test'],
      creator: 'PDF Services Test Script',
    },
  },
}

// ============================================================================
// Helper Functions
// ============================================================================

function log(message: string, type: 'info' | 'success' | 'error' = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
  }
  const reset = '\x1b[0m'
  console.log(`${colors[type]}${message}${reset}`)
}

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ============================================================================
// Test Functions
// ============================================================================

async function testGeneratePdf() {
  log('\n=== Testing PDF Generation ===', 'info')

  try {
    log('Sending generate request...')
    const response = await fetch(`${API_BASE_URL}/api/generate-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testGenerateData),
    })

    const result = await response.json()

    if (!response.ok) {
      log(`Error: ${result.error?.message || 'Unknown error'}`, 'error')
      if (result.error?.details) {
        console.log('Details:', result.error.details)
      }
      return false
    }

    log('PDF generated successfully!', 'success')
    console.log('Response:', {
      success: result.success,
      fileId: result.fileId,
      fileName: result.fileName,
      fileSize: `${(result.fileSize / 1024).toFixed(2)} KB`,
      downloadUrl: result.downloadUrl,
      expiresAt: result.expiresAt,
    })

    // Test download
    log('\nTesting download...')
    const downloadResponse = await fetch(`${API_BASE_URL}${result.downloadUrl}`)

    if (downloadResponse.ok) {
      const buffer = await downloadResponse.arrayBuffer()
      log(`Download successful: ${buffer.byteLength} bytes`, 'success')
      return true
    } else {
      log('Download failed', 'error')
      return false
    }
  } catch (error) {
    log(`Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
    return false
  }
}

async function testProcessPdf() {
  log('\n=== Testing PDF Processing ===', 'info')

  try {
    // Create a test PDF buffer (minimal valid PDF)
    const testPdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test PDF Document) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000317 00000 n
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
410
%%EOF`

    const testPdfBuffer = Buffer.from(testPdfContent)
    const formData = new FormData()

    // Convert buffer to Blob
    const blob = new Blob([testPdfBuffer], { type: 'application/pdf' })
    formData.append('file', blob, 'test-document.pdf')
    formData.append('extractText', 'true')
    formData.append('extractFormFields', 'true')
    formData.append('analyzeStructure', 'true')

    log('Sending process request...')
    const response = await fetch(`${API_BASE_URL}/api/process-pdf`, {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()

    if (!response.ok) {
      log(`Error: ${result.error?.message || 'Unknown error'}`, 'error')
      if (result.error?.details) {
        console.log('Details:', result.error.details)
      }
      return false
    }

    log('PDF processed successfully!', 'success')
    console.log('Response:', {
      success: result.success,
      fileId: result.data.fileId,
      fileName: result.data.fileName,
      fileSize: `${(result.data.fileSize / 1024).toFixed(2)} KB`,
      pageCount: result.data.pageCount,
      processingTime: `${result.data.processingTime}ms`,
      hasExtractedText: !!result.data.extractedText,
      hasFormFields: !!result.data.formFields,
      downloadUrl: result.data.downloadUrl,
    })

    if (result.data.extractedText) {
      log('\nExtracted Text Preview:')
      console.log(result.data.extractedText.substring(0, 200) + '...')
    }

    return true
  } catch (error) {
    log(`Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
    return false
  }
}

async function testApiDocumentation() {
  log('\n=== Testing API Documentation ===', 'info')

  try {
    // Test generate-pdf docs
    log('Fetching /api/generate-pdf docs...')
    const generateDocs = await fetch(`${API_BASE_URL}/api/generate-pdf`)
    const generateDocsData = await generateDocs.json()

    if (generateDocs.ok && generateDocsData.endpoint) {
      log('Generate PDF docs: OK', 'success')
    } else {
      log('Generate PDF docs: FAILED', 'error')
      return false
    }

    // Test process-pdf docs
    log('Fetching /api/process-pdf docs...')
    const processDocs = await fetch(`${API_BASE_URL}/api/process-pdf`)
    const processDocsData = await processDocs.json()

    if (processDocs.ok && processDocsData.endpoint) {
      log('Process PDF docs: OK', 'success')
    } else {
      log('Process PDF docs: FAILED', 'error')
      return false
    }

    return true
  } catch (error) {
    log(`Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
    return false
  }
}

// ============================================================================
// Main Test Runner
// ============================================================================

async function runAllTests() {
  console.log('\n')
  log('╔════════════════════════════════════════════╗', 'info')
  log('║   PDF Services Integration Test Suite     ║', 'info')
  log('╚════════════════════════════════════════════╝', 'info')
  log(`API Base URL: ${API_BASE_URL}\n`)

  const results: { name: string; passed: boolean }[] = []

  // Test 1: API Documentation
  const docsResult = await testApiDocumentation()
  results.push({ name: 'API Documentation', passed: docsResult })
  await delay(1000)

  // Test 2: PDF Generation
  const generateResult = await testGeneratePdf()
  results.push({ name: 'PDF Generation', passed: generateResult })
  await delay(1000)

  // Test 3: PDF Processing
  const processResult = await testProcessPdf()
  results.push({ name: 'PDF Processing', passed: processResult })

  // Summary
  log('\n=== Test Summary ===', 'info')
  results.forEach((result) => {
    const status = result.passed ? 'PASSED' : 'FAILED'
    const type = result.passed ? 'success' : 'error'
    log(`${result.name}: ${status}`, type)
  })

  const totalPassed = results.filter((r) => r.passed).length
  const totalTests = results.length

  log(`\nTotal: ${totalPassed}/${totalTests} tests passed`, totalPassed === totalTests ? 'success' : 'error')

  process.exit(totalPassed === totalTests ? 0 : 1)
}

// Run tests
runAllTests().catch((error) => {
  log(`Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
  console.error(error)
  process.exit(1)
})
