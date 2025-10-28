/**
 * Web-Adobe DataPad Health Check API
 * Returns health status of DataPad integration
 */

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`

    // Check if DataPad integration is configured
    const datapadEnabled = process.env.DATAPAD_API_URL ? true : false
    const datapadApiUrl = process.env.DATAPAD_API_URL || null

    // Count documents with DataPad field mappings
    const documentsWithDatapad = await prisma.pdfField.count({
      where: {
        datapadFieldId: {
          not: null,
        },
      },
    })

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'connected',
        datapad: {
          enabled: datapadEnabled,
          apiUrl: datapadApiUrl,
          fieldMappings: documentsWithDatapad,
        },
      },
    })
  } catch (error) {
    console.error('DataPad health check error:', error)
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    )
  }
}
