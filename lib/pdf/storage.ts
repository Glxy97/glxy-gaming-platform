/**
 * PDF Storage Layer
 * File-system based storage for uploaded PDFs and generated outputs
 */

import { writeFile, readFile, unlink, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')
const COMPOSED_DIR = path.join(process.cwd(), 'public', 'uploads', 'composed')

// Ensure directories exist
async function ensureDirectories() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true })
  }
  if (!existsSync(COMPOSED_DIR)) {
    await mkdir(COMPOSED_DIR, { recursive: true })
  }
}

export interface PdfMetadata {
  id: string
  originalName: string
  uploadedAt: Date
  size: number
  pageCount?: number
  hasFormFields?: boolean
}

/**
 * Store uploaded PDF
 */
export async function storePdf(
  buffer: Buffer,
  originalName: string
): Promise<PdfMetadata> {
  await ensureDirectories()

  const id = randomUUID()
  const filename = `${id}.pdf`
  const filepath = path.join(UPLOAD_DIR, filename)

  await writeFile(filepath, buffer)

  const metadata: PdfMetadata = {
    id,
    originalName,
    uploadedAt: new Date(),
    size: buffer.length,
  }

  // Store metadata
  const metadataPath = path.join(UPLOAD_DIR, `${id}.json`)
  await writeFile(metadataPath, JSON.stringify(metadata, null, 2))

  return metadata
}

/**
 * Retrieve PDF by ID
 */
export async function getPdf(id: string): Promise<Buffer | null> {
  const filepath = path.join(UPLOAD_DIR, `${id}.pdf`)

  if (!existsSync(filepath)) {
    return null
  }

  return await readFile(filepath)
}

/**
 * Get PDF metadata
 */
export async function getPdfMetadata(id: string): Promise<PdfMetadata | null> {
  const metadataPath = path.join(UPLOAD_DIR, `${id}.json`)

  if (!existsSync(metadataPath)) {
    return null
  }

  const data = await readFile(metadataPath, 'utf-8')
  return JSON.parse(data)
}

/**
 * Store composed (filled) PDF
 */
export async function storeComposedPdf(
  id: string,
  buffer: Buffer,
  isFlattened: boolean = false
): Promise<string> {
  await ensureDirectories()

  const suffix = isFlattened ? 'flattened' : 'filled'
  const composedId = `${id}_${suffix}_${Date.now()}`
  const filename = `${composedId}.pdf`
  const filepath = path.join(COMPOSED_DIR, filename)

  await writeFile(filepath, buffer)

  return composedId
}

/**
 * Get composed PDF
 */
export async function getComposedPdf(composedId: string): Promise<Buffer | null> {
  const filepath = path.join(COMPOSED_DIR, `${composedId}.pdf`)

  if (!existsSync(filepath)) {
    return null
  }

  return await readFile(filepath)
}

/**
 * Delete PDF and metadata
 */
export async function deletePdf(id: string): Promise<void> {
  const filepath = path.join(UPLOAD_DIR, `${id}.pdf`)
  const metadataPath = path.join(UPLOAD_DIR, `${id}.json`)

  if (existsSync(filepath)) {
    await unlink(filepath)
  }
  if (existsSync(metadataPath)) {
    await unlink(metadataPath)
  }
}

/**
 * Get public URL for PDF
 */
export function getPdfUrl(id: string): string {
  return `/uploads/${id}.pdf`
}

/**
 * Get public URL for composed PDF
 */
export function getComposedPdfUrl(composedId: string): string {
  return `/uploads/composed/${composedId}.pdf`
}
