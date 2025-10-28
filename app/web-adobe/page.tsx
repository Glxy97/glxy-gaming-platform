/**
 * Web-Adobe - PDF Form Management
 * Main entry page for PDF form editing and DataPad integration
 */

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { UploadDialog } from '@/components/web-adobe/upload-dialog'
import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'

export default async function WebAdobePage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/web-adobe')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Web-Adobe PDF Editor</h1>
        <p className="text-lg text-muted-foreground mb-8">
          AI-gestützter PDF-Formular-Editor mit DataPad-Integration
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Upload Card */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-2xl font-semibold mb-3">📄 PDF hochladen</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Laden Sie PDF-Formulare hoch zur automatischen Felderkennung
            </p>
            <UploadDialog
              maxFiles={5}
              maxSizeBytes={50 * 1024 * 1024}
              onUploadComplete={(documentIds) => {
                // Redirect to first document after upload
                if (documentIds.length > 0) {
                  window.location.href = `/web-adobe/documents/${documentIds[0]}`
                }
              }}
            />
          </div>

          {/* Documents Card */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-2xl font-semibold mb-3">📋 Meine Dokumente</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Verwalten Sie Ihre hochgeladenen PDF-Formulare
            </p>
            <Link href="/web-adobe/documents" className="block">
              <Button variant="secondary" className="w-full">
                <FileText className="mr-2 h-4 w-4" />
                Dokumente anzeigen
              </Button>
            </Link>
          </div>

          {/* DataPad Integration Card */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-2xl font-semibold mb-3">🔗 DataPad</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Synchronisieren Sie Felder mit DataPad
            </p>
            <Button variant="secondary" className="w-full" disabled>
              Verbinden
            </Button>
          </div>

          {/* AI Assistant Card */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-2xl font-semibold mb-3">🤖 AI-Assistent</h2>
            <p className="text-sm text-muted-foreground mb-4">
              KI-gestützte Feldvorschläge und -erkennung
            </p>
            <Button variant="secondary" className="w-full" disabled>
              AI aktivieren
            </Button>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 rounded-lg border bg-muted/50 p-6">
          <h3 className="text-lg font-semibold mb-2">ℹ️ Über Web-Adobe</h3>
          <p className="text-sm text-muted-foreground">
            Web-Adobe ist ein AI-gestützter PDF-Formular-Editor, der die Bearbeitung
            von PDF-Formularen ähnlich wie Adobe Acrobat DC ermöglicht. Mit automatischer
            Felderkennung, DataPad-Integration und intelligenten Vorschlägen.
          </p>
        </div>
      </div>
    </div>
  )
}
