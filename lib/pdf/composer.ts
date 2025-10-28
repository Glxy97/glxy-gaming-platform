/**
 * PDF Composer
 * Fill PDF form fields with values and optionally flatten
 */

import { PDFDocument, PDFTextField, PDFCheckBox, PDFDropdown, StandardFonts } from 'pdf-lib'

export interface FieldValue {
  name: string
  value: string | boolean
  type?: 'text' | 'checkbox' | 'dropdown'
}

export interface ComposeOptions {
  flatten?: boolean // Convert form fields to static text
  saveFormData?: boolean // Keep form fields editable
}

/**
 * Fill PDF form fields with provided values
 */
export async function composePdf(
  pdfBuffer: Buffer,
  fieldValues: FieldValue[],
  options: ComposeOptions = {}
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(pdfBuffer)
  const form = pdfDoc.getForm()
  const fields = form.getFields()

  console.log(`[PDF Composer] Processing ${fields.length} form fields`)
  console.log(`[PDF Composer] Applying ${fieldValues.length} field values`)

  // Embed standard font for proper appearance rendering
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)

  // Fill each field
  for (const fieldValue of fieldValues) {
    try {
      const field = form.getField(fieldValue.name)

      if (field instanceof PDFTextField) {
        field.setText(String(fieldValue.value))
        // Update field appearance with embedded font
        field.updateAppearances(helveticaFont)
        console.log(`[PDF Composer] ✓ Text field "${fieldValue.name}" = "${fieldValue.value}"`)
      } else if (field instanceof PDFCheckBox) {
        if (fieldValue.value === true || fieldValue.value === 'true') {
          field.check()
        } else {
          field.uncheck()
        }
        console.log(`[PDF Composer] ✓ Checkbox "${fieldValue.name}" = ${fieldValue.value}`)
      } else if (field instanceof PDFDropdown) {
        field.select(String(fieldValue.value))
        console.log(`[PDF Composer] ✓ Dropdown "${fieldValue.name}" = "${fieldValue.value}"`)
      }
    } catch (error) {
      console.warn(`[PDF Composer] ⚠️  Failed to set field "${fieldValue.name}":`, error)
    }
  }

  // Flatten if requested (convert form fields to static content)
  if (options.flatten) {
    console.log('[PDF Composer] Flattening form fields...')
    form.flatten()
  } else {
    // Set NeedAppearances flag as fallback for viewers that don't auto-generate appearances
    // This ensures filled fields are visible even in basic PDF readers
    form.acroForm.dict.set(pdfDoc.context.obj('NeedAppearances'), pdfDoc.context.obj(true))
  }

  // Save PDF
  const pdfBytes = await pdfDoc.save({
    useObjectStreams: false, // Better compatibility
  })

  console.log(`[PDF Composer] ✓ Composed PDF (${pdfBytes.length} bytes, flattened: ${!!options.flatten})`)

  return Buffer.from(pdfBytes)
}

/**
 * Extract form field names and types from PDF
 */
export async function extractFormFieldInfo(pdfBuffer: Buffer): Promise<{
  name: string
  type: string
  value?: string
}[]> {
  const pdfDoc = await PDFDocument.load(pdfBuffer)
  const form = pdfDoc.getForm()
  const fields = form.getFields()

  return fields.map(field => {
    const name = field.getName()
    let type = 'unknown'
    let value: string | undefined

    if (field instanceof PDFTextField) {
      type = 'text'
      value = field.getText() || ''
    } else if (field instanceof PDFCheckBox) {
      type = 'checkbox'
      value = field.isChecked() ? 'true' : 'false'
    } else if (field instanceof PDFDropdown) {
      type = 'dropdown'
      const selected = field.getSelected()
      value = selected.length > 0 ? selected[0] : ''
    }

    return { name, type, value }
  })
}
