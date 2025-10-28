/**
 * API Route: PATCH /api/web-adobe/documents/[id]/fields/[fieldId]
 * Updates a single field's properties
 */

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, fieldId } = await params

  try {
    const body = await request.json()

    // Verify document ownership
    const document = await prisma.pdfDocument.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (document.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update field
    const updatedField = await prisma.pdfField.update({
      where: { id: fieldId },
      data: {
        ...(body.pdfName !== undefined && { pdfName: body.pdfName }),
        ...(body.displayLabel !== undefined && { displayLabel: body.displayLabel }),
        ...(body.groupName !== undefined && { groupName: body.groupName }),
        ...(body.fieldType !== undefined && { fieldType: body.fieldType }),
        ...(body.required !== undefined && { required: body.required }),
        ...(body.validationPattern !== undefined && { validationPattern: body.validationPattern }),
        ...(body.datapadFieldId !== undefined && { datapadFieldId: body.datapadFieldId }),
        ...(body.suggestions !== undefined && { suggestions: body.suggestions }),
        ...(body.x !== undefined && { x: body.x }),
        ...(body.y !== undefined && { y: body.y }),
        ...(body.width !== undefined && { width: body.width }),
        ...(body.height !== undefined && { height: body.height }),
        ...(body.pageNumber !== undefined && { pageNumber: body.pageNumber }),
        ...(body.status !== undefined && { status: body.status }),
      },
    })

    return NextResponse.json({ field: updatedField })
  } catch (error) {
    console.error('Update field error:', error)
    return NextResponse.json(
      { error: 'Failed to update field' },
      { status: 500 }
    )
  }
}
