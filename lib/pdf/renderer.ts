/**
 * Server-Side PDF Renderer
 * Converts PDF pages to PNG images using pdfjs-dist + canvas
 *
 * Note: Uses local self-shim (not global polyfill) for pdfjs-dist Node.js compatibility
 */

import { createCanvas } from 'canvas'

export interface RenderOptions {
  page?: number // Page number (1-indexed)
  scale?: number // Scale factor (default: 2 for retina)
  format?: 'png' | 'jpeg' | 'webp'
}

/**
 * Render PDF page to image buffer using pdfjs-dist + canvas
 * Uses lazy import with local self-shim for server-side compatibility
 */
export async function renderPdfPage(
  pdfBuffer: Buffer,
  options: RenderOptions = {}
): Promise<Buffer> {
  const {
    page = 1,
    scale = 2,
  } = options

  try {
    // Local self-shim for pdfjs-dist (server-only, no global pollution)
    if (typeof (globalThis as any).self === 'undefined') {
      (globalThis as any).self = globalThis
    }

    // Lazy import pdfjs-dist (server-only)
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')

    // Node.js: no worker needed
    // pdfjs.GlobalWorkerOptions.workerSrc is undefined in Node context

    // Load PDF with pdfjs-dist
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(pdfBuffer),
      useSystemFonts: true,
    })

    const pdfDoc = await loadingTask.promise
    const pageCount = pdfDoc.numPages

    if (page < 1 || page > pageCount) {
      throw new Error(`Page ${page} out of range (1-${pageCount})`)
    }

    // Get page
    const pdfPage = await pdfDoc.getPage(page)
    const viewport = pdfPage.getViewport({ scale })

    // Create canvas
    const canvas = createCanvas(viewport.width, viewport.height)
    const context = canvas.getContext('2d')

    // Render PDF page to canvas
    const renderContext = {
      canvasContext: context as any,
      viewport: viewport,
      canvas: canvas as any, // Required by pdfjs RenderParameters
    }

    await pdfPage.render(renderContext).promise

    // Convert canvas to buffer
    const imageBuffer = canvas.toBuffer('image/png')

    console.log(`[PDF Renderer] ✓ Rendered page ${page}/${pageCount} (${viewport.width}x${viewport.height}px)`)

    return imageBuffer
  } catch (error) {
    console.error('[PDF Renderer] Error:', error)
    throw error
  }
}

/**
 * Get PDF page count
 */
export async function getPdfPageCount(pdfBuffer: Buffer): Promise<number> {
  try {
    // Local self-shim
    if (typeof (globalThis as any).self === 'undefined') {
      (globalThis as any).self = globalThis
    }

    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')

    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(pdfBuffer),
    })
    const pdfDoc = await loadingTask.promise
    return pdfDoc.numPages
  } catch (error) {
    console.error('[PDF Renderer] Error getting page count:', error)
    throw error
  }
}

/**
 * Get PDF page dimensions
 */
export async function getPdfPageDimensions(
  pdfBuffer: Buffer,
  page: number = 1
): Promise<{ width: number; height: number }> {
  try {
    // Local self-shim
    if (typeof (globalThis as any).self === 'undefined') {
      (globalThis as any).self = globalThis
    }

    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')

    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(pdfBuffer),
    })
    const pdfDoc = await loadingTask.promise
    const pdfPage = await pdfDoc.getPage(page)
    const viewport = pdfPage.getViewport({ scale: 1 })

    return {
      width: viewport.width,
      height: viewport.height,
    }
  } catch (error) {
    console.error('[PDF Renderer] Error getting dimensions:', error)
    throw error
  }
}
