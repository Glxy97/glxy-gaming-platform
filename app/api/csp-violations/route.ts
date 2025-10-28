/**
 * CSP Violation Reporting Endpoint
 * Sammelt und analysiert Content Security Policy Violations
 */

import { NextRequest, NextResponse } from 'next/server'
import { CSPViolationHandler, type CSPViolationReport } from '@/lib/security-policies'

export async function POST(request: NextRequest) {
  try {
    // Parse CSP violation report
    const contentType = request.headers.get('content-type')

    if (!contentType?.includes('application/csp-report') &&
        !contentType?.includes('application/json')) {
      return NextResponse.json(
        { error: 'Invalid content type for CSP report' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // CSP reports come wrapped in a "csp-report" object
    const report: CSPViolationReport = body['csp-report'] || body

    // Validate required fields
    if (!report.documentUri || !report.violatedDirective) {
      return NextResponse.json(
        { error: 'Invalid CSP report format' },
        { status: 400 }
      )
    }

    // Process the violation
    await CSPViolationHandler.processViolation(report)

    // Log basic info (detailed logging happens in handler)
    console.log('📋 CSP Report received:', {
      directive: report.violatedDirective,
      uri: report.documentUri,
      blocked: report.blockedUri
    })

    return NextResponse.json({ status: 'received' }, { status: 200 })

  } catch (error) {
    console.error('CSP violation processing error:', error)

    return NextResponse.json(
      { error: 'Failed to process CSP report' },
      { status: 500 }
    )
  }
}

// Allow only POST requests
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405, headers: { Allow: 'POST' } }
  )
}