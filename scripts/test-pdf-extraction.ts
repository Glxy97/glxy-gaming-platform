/**
 * Test Script for PDF Field Extraction
 * Usage: tsx scripts/test-pdf-extraction.ts [path-to-pdf]
 */

import { extractFieldsFromPdf, mergeOverlappingFields } from '@/lib/web-adobe/pdf-field-extractor'
import { validateBoundingBox, checkFieldConfidence } from '@/lib/web-adobe/field-validator'
import { resolve } from 'path'

async function main() {
  const pdfPath = process.argv[2]

  if (!pdfPath) {
    console.error('❌ Usage: tsx scripts/test-pdf-extraction.ts [path-to-pdf]')
    process.exit(1)
  }

  const fullPath = resolve(pdfPath)
  console.log(`\n📄 Analyzing PDF: ${fullPath}\n`)

  try {
    // Progress callback
    const progressCallback = (progress: number, stage: string) => {
      const bar = '█'.repeat(Math.floor(progress / 5)) + '░'.repeat(20 - Math.floor(progress / 5))
      process.stdout.write(`\r[${bar}] ${progress}% - ${stage}`)
    }

    const startTime = Date.now()

    // Extract fields
    const result = await extractFieldsFromPdf(fullPath, progressCallback)

    console.log('\n') // New line after progress bar

    if (!result.success) {
      console.error('❌ Extraction failed:', result.errors?.join(', '))
      process.exit(1)
    }

    // Merge overlapping fields
    const uniqueFields = mergeOverlappingFields(result.fields)

    // Statistics
    const fieldsByType = uniqueFields.reduce((acc, field) => {
      acc[field.type] = (acc[field.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const averageConfidence = uniqueFields.reduce((sum, f) => sum + f.confidence, 0) / uniqueFields.length

    // Display results
    console.log('✅ Extraction completed successfully!\n')
    console.log('📊 Statistics:')
    console.log('─────────────────────────────────────')
    console.log(`Total Pages:       ${result.totalPages}`)
    console.log(`Total Fields:      ${uniqueFields.length}`)
    console.log(`Avg Confidence:    ${(averageConfidence * 100).toFixed(1)}%`)
    console.log(`Duration:          ${result.duration}ms`)
    console.log('')

    console.log('📋 Fields by Type:')
    console.log('─────────────────────────────────────')
    for (const [type, count] of Object.entries(fieldsByType)) {
      console.log(`  ${type.padEnd(12)} ${count}`)
    }
    console.log('')

    // Display fields
    console.log('📝 Extracted Fields:')
    console.log('─────────────────────────────────────')

    for (const field of uniqueFields.slice(0, 20)) {
      const confidenceEmoji = field.confidence >= 0.9 ? '🟢' : field.confidence >= 0.7 ? '🟡' : '🔴'
      const label = field.label || field.name

      console.log(`\n${confidenceEmoji} ${label}`)
      console.log(`   Type:       ${field.type}`)
      console.log(`   Name:       ${field.name}`)
      console.log(`   Page:       ${field.page}`)
      console.log(`   Confidence: ${(field.confidence * 100).toFixed(1)}%`)
      console.log(`   Position:   x=${field.boundingBox.x.toFixed(3)}, y=${field.boundingBox.y.toFixed(3)}`)
      console.log(`   Size:       w=${field.boundingBox.width.toFixed(3)}, h=${field.boundingBox.height.toFixed(3)}`)

      // Validate bounding box
      const bboxValidation = validateBoundingBox(field.boundingBox)
      if (!bboxValidation.valid) {
        console.log(`   ⚠️  Validation errors: ${bboxValidation.errors.join(', ')}`)
      }

      // Check confidence
      const confidenceCheck = checkFieldConfidence(field)
      if (confidenceCheck.requiresReview) {
        console.log(`   ⚠️  Requires manual review (${confidenceCheck.status} confidence)`)
      }
    }

    if (uniqueFields.length > 20) {
      console.log(`\n... and ${uniqueFields.length - 20} more fields`)
    }

    // Fields requiring review
    const lowConfidenceFields = uniqueFields.filter(f => f.confidence < 0.9)
    if (lowConfidenceFields.length > 0) {
      console.log('\n⚠️  Fields requiring review:')
      console.log('─────────────────────────────────────')
      for (const field of lowConfidenceFields) {
        console.log(`  - ${field.label || field.name} (${(field.confidence * 100).toFixed(1)}%)`)
      }
    }

    // Export to JSON (optional)
    if (process.argv.includes('--export')) {
      const fs = await import('fs/promises')
      const outputPath = pdfPath.replace('.pdf', '-fields.json')

      await fs.writeFile(outputPath, JSON.stringify({
        document: {
          path: fullPath,
          totalPages: result.totalPages,
          extractedAt: new Date().toISOString(),
        },
        statistics: {
          totalFields: uniqueFields.length,
          fieldsByType,
          averageConfidence,
          duration: result.duration,
        },
        fields: uniqueFields,
      }, null, 2))

      console.log(`\n📁 Fields exported to: ${outputPath}`)
    }

    console.log('\n✨ Analysis complete!\n')

  } catch (error) {
    console.error('\n❌ Error during extraction:', error)
    process.exit(1)
  }
}

main()
