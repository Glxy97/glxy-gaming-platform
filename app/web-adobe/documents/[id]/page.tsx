/**
 * Document Viewer Page
 * Dynamic Route: /web-adobe/documents/[id]
 *
 * Features:
 * - Side-by-side PDF Viewer (70%) + Properties Panel (30%)
 * - Field overlays synchronized with Database
 * - Real-time updates via Socket.IO
 * - Header with document actions
 *
 * NOTE: This is a server component that renders a client component
 * to avoid SSR issues with PDF.js during build
 */

import { DocumentViewerClient } from './document-viewer-client'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function DocumentViewerPage({ params }: PageProps) {
  // Skip rendering during build phase to avoid pdfjs SSR issues
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return null
  }

  const { id } = await params

  return <DocumentViewerClient documentId={id} />
}

// Route Segment Config: Disable static generation to avoid SSR issues with pdfjs
export const dynamic = 'force-dynamic'
export const dynamicParams = true

/**
 * Prevent static generation of document pages
 * Return empty array to skip pre-rendering during build
 */
export async function generateStaticParams() {
  return []
}
