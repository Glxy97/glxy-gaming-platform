// @ts-nocheck
/**
 * Field Mapper Utilities
 * Transforms between Database (Prisma) and PDF Viewer Field formats
 */

import type { FormField as ViewerFormField } from '@/types/pdf-viewer'
import type { FormField as EditorFormField } from '@/types/web-adobe'
import type { PdfField as PrismaField } from '@prisma/client'

/**
 * Prisma PdfField → PDF Viewer FormField
 * Converts database field to format expected by PdfViewer component
 */
export function prismaToViewerField(prismaField: PrismaField): ViewerFormField {
  return {
    id: prismaField.id,
    name: prismaField.pdfName,
    displayName: prismaField.displayLabel || prismaField.pdfName,
    type: mapFieldType(prismaField.fieldType),
    value: null,
    page: prismaField.pageNumber,
    rect: {
      x: prismaField.x,
      y: prismaField.y,
      width: prismaField.width,
      height: prismaField.height,
    },
    required: prismaField.required,
    readOnly: false,
    multiline: false,
    metadata: {
      pdfFieldName: prismaField.pdfName,
    },
  }
}

/**
 * PDF Viewer FormField → Properties Panel FormField
 * Converts viewer field to format expected by PropertiesPanel
 */
export function viewerToEditorField(viewerField: ViewerFormField): EditorFormField {
  return {
    id: viewerField.id,
    name: viewerField.name,
    displayName: viewerField.displayName,
    type: viewerField.type as any,
    position: {
      x: viewerField.rect.x,
      y: viewerField.rect.y,
      width: viewerField.rect.width,
      height: viewerField.rect.height,
      page: viewerField.page,
    },
    style: {
      fontSize: viewerField.metadata.fontSize || 12,
      fontFamily: viewerField.metadata.fontName || 'Arial',
      color: viewerField.metadata.textColor
        ? rgbToHex(viewerField.metadata.textColor)
        : '#000000',
      backgroundColor: viewerField.metadata.backgroundColor
        ? rgbToHex(viewerField.metadata.backgroundColor)
        : '#ffffff',
      borderColor: viewerField.metadata.borderColor
        ? rgbToHex(viewerField.metadata.borderColor)
        : '#000000',
      borderWidth: viewerField.metadata.borderWidth || 1,
      borderStyle: 'solid',
      textAlign: viewerField.metadata.alignment || 'left',
      padding: 4,
    },
    validation: {
      required: viewerField.required,
      pattern: viewerField.validation?.pattern,
      customMessage: viewerField.validation?.message,
    },
    behavior: {
      readOnly: viewerField.readOnly,
      hidden: false,
      calculated: false,
    },
    typeProperties: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

/**
 * Properties Panel FormField → Prisma Update Data
 * Extracts only updatable fields for database PATCH
 */
export function editorToPrismaUpdate(editorField: Partial<EditorFormField>) {
  return {
    ...(editorField.name && { pdfName: editorField.name }),
    ...(editorField.displayName && { displayLabel: editorField.displayName }),
    ...(editorField.type && { fieldType: editorField.type }),
    ...(editorField.validation?.required !== undefined && {
      required: editorField.validation.required,
    }),
    ...(editorField.validation?.pattern && {
      validationPattern: editorField.validation.pattern,
    }),
    ...(editorField.position && {
      x: editorField.position.x,
      y: editorField.position.y,
      width: editorField.position.width,
      height: editorField.position.height,
      pageNumber: editorField.position.page,
    }),
  }
}

/**
 * Map Prisma field type to PDF Viewer field type
 */
function mapFieldType(prismaType: string): ViewerFormField['type'] {
  const typeMap: Record<string, ViewerFormField['type']> = {
    text: 'text',
    number: 'text',
    email: 'text',
    date: 'text',
    checkbox: 'checkbox',
    radio: 'radio',
    dropdown: 'dropdown',
    signature: 'signature',
  }

  return typeMap[prismaType] || 'text'
}

/**
 * Convert RGB array [0-255, 0-255, 0-255] to hex color string
 */
function rgbToHex(rgb: [number, number, number]): string {
  const [r, g, b] = rgb
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

/**
 * Convert hex color to RGB array
 */
export function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0]
}

/**
 * Batch convert Prisma fields to Viewer fields
 */
export function batchPrismaToViewer(prismaFields: PrismaField[]): ViewerFormField[] {
  return prismaFields.map(prismaToViewerField)
}
