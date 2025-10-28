/**
 * Server-Side PDF Editor
 * Upload → Preview → Edit Fields → Compose → Download
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Upload, Download, FileText, Loader2, Check } from 'lucide-react'

interface FormField {
  name: string
  type: string
  value?: string
}

interface UploadedPdf {
  id: string
  name: string
  size: number
  formFields: FormField[]
  previewUrl: string
  downloadUrl: string
}

interface ComposedPdf {
  id: string
  downloadUrl: string
  previewUrl: string
  flattened: boolean
}

export default function PdfEditorPage() {
  const [isUploading, setIsUploading] = useState(false)
  const [isComposing, setIsComposing] = useState(false)
  const [uploadedPdf, setUploadedPdf] = useState<UploadedPdf | null>(null)
  const [composedPdf, setComposedPdf] = useState<ComposedPdf | null>(null)
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
  const [flattenOnCompose, setFlattenOnCompose] = useState(false)

  /**
   * Handle PDF upload
   */
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadedPdf(null)
    setComposedPdf(null)
    setFieldValues({})

    try {
      const formData = new FormData()
      formData.append('pdf', file)

      const response = await fetch('/api/pdf/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const data = await response.json()
      setUploadedPdf(data.pdf)

      // Initialize field values
      const initialValues: Record<string, string> = {}
      data.pdf.formFields.forEach((field: FormField) => {
        initialValues[field.name] = field.value || ''
      })
      setFieldValues(initialValues)

      toast.success('PDF uploaded successfully!')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsUploading(false)
    }
  }

  /**
   * Handle field value change
   */
  const handleFieldChange = (fieldName: string, value: string) => {
    setFieldValues(prev => ({
      ...prev,
      [fieldName]: value,
    }))
  }

  /**
   * Compose PDF with filled fields
   */
  const handleCompose = async () => {
    if (!uploadedPdf) return

    setIsComposing(true)

    try {
      const fields = Object.entries(fieldValues).map(([name, value]) => ({
        name,
        value,
      }))

      const response = await fetch(`/api/pdf/${uploadedPdf.id}/compose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields,
          flatten: flattenOnCompose,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Compose failed')
      }

      const data = await response.json()
      setComposedPdf(data.composed)

      toast.success('PDF composed successfully!')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsComposing(false)
    }
  }

  /**
   * Download composed PDF
   */
  const handleDownload = () => {
    if (!composedPdf) return

    window.open(composedPdf.downloadUrl, '_blank')
    toast.success('Download started!')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Server-Side PDF Editor</h1>
            <p className="text-muted-foreground">
              Upload → Preview → Edit → Compose → Download
            </p>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">1. Upload PDF</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept=".pdf"
              onChange={handleUpload}
              disabled={isUploading}
              className="flex-1"
            />
            {isUploading && <Loader2 className="h-5 w-5 animate-spin" />}
            {uploadedPdf && <Check className="h-5 w-5 text-green-500" />}
          </div>

          {uploadedPdf && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{uploadedPdf.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(uploadedPdf.size / 1024).toFixed(1)} KB · {uploadedPdf.formFields.length} form fields
                  </p>
                </div>
                <a
                  href={uploadedPdf.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  View Original
                </a>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Preview Section */}
      {uploadedPdf && (
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">2. Preview & Edit Fields</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Preview */}
            <div>
              <Label className="mb-2 block">PDF Preview (Page 1)</Label>
              <div className="border rounded-lg overflow-hidden bg-gray-50">
                <img
                  src={`${uploadedPdf.previewUrl}?page=1`}
                  alt="PDF Preview"
                  className="w-full"
                />
              </div>
            </div>

            {/* Form Fields */}
            <div>
              <Label className="mb-2 block">Form Fields ({uploadedPdf.formFields.length})</Label>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {uploadedPdf.formFields.map((field) => (
                  <div key={field.name}>
                    <Label htmlFor={field.name} className="text-sm">
                      {field.name}
                      <Badge variant="outline" className="ml-2 text-xs">
                        {field.type}
                      </Badge>
                    </Label>
                    <Input
                      id={field.name}
                      value={fieldValues[field.name] || ''}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      placeholder={`Enter ${field.type} value`}
                      className="mt-1"
                    />
                  </div>
                ))}

                {uploadedPdf.formFields.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No form fields found in PDF
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Compose Button */}
          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="flatten"
                checked={flattenOnCompose}
                onChange={(e) => setFlattenOnCompose(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="flatten" className="text-sm cursor-pointer">
                Flatten fields (convert to static text)
              </Label>
            </div>
            <Button
              onClick={handleCompose}
              disabled={isComposing || uploadedPdf.formFields.length === 0}
              className="ml-auto"
            >
              {isComposing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Composing...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Compose PDF
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Download Section */}
      {composedPdf && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">3. Download Composed PDF</h2>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Check className="h-5 w-5 text-green-600" />
                <p className="font-medium text-green-900">PDF Successfully Composed!</p>
              </div>
              <p className="text-sm text-green-700">
                {composedPdf.flattened
                  ? 'Fields have been flattened (static text)'
                  : 'Fields remain editable'}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Preview */}
              <div>
                <Label className="mb-2 block">Composed PDF Preview</Label>
                <div className="border rounded-lg overflow-hidden bg-gray-50">
                  <img
                    src={`${composedPdf.previewUrl}?page=1`}
                    alt="Composed PDF Preview"
                    className="w-full"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <Button onClick={handleDownload} size="lg" className="w-full">
                  <Download className="mr-2 h-5 w-5" />
                  Download PDF
                </Button>
                <a
                  href={composedPdf.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-center text-sm text-blue-600 hover:underline"
                >
                  Open in new tab
                </a>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Status */}
      {!uploadedPdf && !isUploading && (
        <div className="text-center py-12">
          <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Upload a PDF to get started</p>
        </div>
      )}
    </div>
  )
}
