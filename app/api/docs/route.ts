import { NextResponse } from 'next/server'
import { generateSwaggerSpec } from '@/lib/swagger'

/**
 * @swagger
 * /api/docs:
 *   get:
 *     summary: Get OpenAPI specification
 *     description: Returns the complete OpenAPI 3.0 specification for the GLXY Gaming Platform API
 *     tags: [Documentation]
 *     responses:
 *       200:
 *         description: OpenAPI specification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
export async function GET() {
  try {
    const spec = await generateSwaggerSpec()
    return NextResponse.json(spec)
  } catch (error) {
    console.error('Error generating Swagger spec:', error)
    return NextResponse.json(
      { error: 'Failed to generate API documentation' },
      { status: 500 }
    )
  }
}

