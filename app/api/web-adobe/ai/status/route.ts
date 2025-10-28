/**
 * Web-Adobe AI Status API
 * Returns AI service status and capabilities
 */

import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Check AI service configuration
    const openaiKey = process.env.OPENAI_API_KEY
    const anthropicKey = process.env.ANTHROPIC_API_KEY
    const aiEnabled = !!(openaiKey || anthropicKey)

    const capabilities = {
      documentAnalysis: aiEnabled,
      fieldExtraction: aiEnabled,
      smartSuggestions: aiEnabled,
      textRecognition: aiEnabled,
      dataValidation: aiEnabled,
    }

    const providers = {
      openai: !!openaiKey,
      anthropic: !!anthropicKey,
    }

    return NextResponse.json({
      status: aiEnabled ? 'operational' : 'disabled',
      timestamp: new Date().toISOString(),
      capabilities,
      providers,
      models: {
        primary: openaiKey ? 'gpt-4-turbo-preview' : anthropicKey ? 'claude-3-opus-20240229' : null,
        fallback: openaiKey && anthropicKey ? 'gpt-3.5-turbo' : null,
      },
      limits: {
        maxFileSize: '10MB',
        maxPagesPerDocument: 50,
        rateLimit: '100 requests/hour',
      },
    })
  } catch (error) {
    console.error('AI status check error:', error)
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
