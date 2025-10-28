import { NextRequest, NextResponse } from 'next/server'
import { CacheManager, RateLimiter } from '@/lib/redis-server'
import { validatePasswordStrength, sanitizeInput } from '@/lib/auth-security'

const KEY = (sid: string) => `chatbot:session:${sid}`
const TTL = 7 * 24 * 60 * 60 // 7 Tage

type Role = 'user' | 'assistant'
interface ChatMessage { id: string; role: Role; content: string; createdAt: string }

// Enhanced AI Assistant for Gaming Platform
function generateGamingAIResponse(input: string): string {
  const lower = input.toLowerCase()

  // Gaming-related responses
  if (lower.includes('chess') || lower.includes('schach')) {
    return 'Als Gaming-AI kann ich dir bei Chess-Strategien helfen! GLXY bietet ein vollwertiges Schachspiel mit Echtzeitmatches. Möchtest du Eröffnungstipps, taktische Tricks oder Endspielstrategien lernen?'
  }

  if (lower.includes('racing') || lower.includes('rennen')) {
    return 'Racing-Games auf GLXY sind spannend! Ich kann dir Fahrtipps geben, optimale Streckenführung erklären oder bei der Fahrzeugabstimmung helfen. Welcher Aspekt des Rennsports interessiert dich?'
  }

  if (lower.includes('uno')) {
    return 'UNO auf GLXY macht richtig Spaß! Ich kenne alle Strategien: Von der richtigen Kartenauswahl bis zu psychologischen Tricks gegen deine Mitspieler. Brauchst du Tipps für das perfekte UNO-Spiel?'
  }

  if (lower.includes('fps') || lower.includes('shooter')) {
    return 'FPS-Games erfordern Geschick und Strategie! Ich kann dir bei Aim-Training, Map-Kontrolle, Teamwork und taktischen Manövern helfen. Was ist dein Hauptproblem in Shootern?'
  }

  // Programming and development
  if (lower.includes('javascript') || lower.includes('js') || lower.includes('programmier')) {
    return 'Als dein Coding-Assistent helfe ich gern bei JavaScript, TypeScript, React, Next.js und allen anderen Programmiersprachen! Zeige mir deinen Code oder beschreibe dein Problem - ich erkläre es Schritt für Schritt.'
  }

  if (lower.includes('css') || lower.includes('styling') || lower.includes('design')) {
    return 'CSS und Design sind meine Stärken! Von Flexbox über Grid bis zu Animationen und responsive Design. Auch bei UI/UX-Fragen bin ich dein Experte. Was möchtest du gestalten?'
  }

  if (lower.includes('database') || lower.includes('sql') || lower.includes('datenbank')) {
    return 'Datenbank-Design ist essentiell! Ich helfe bei SQL-Queries, Datenbankarchitektur, Performance-Optimierung und allem rund um PostgreSQL, MySQL oder MongoDB. Was ist deine Herausforderung?'
  }

  // GLXY platform specific
  if (lower.includes('glxy') || lower.includes('platform')) {
    return 'GLXY Gaming Platform bietet Chess, Racing, UNO, FPS-Games und viele weitere Features! Mit Echtzeitchat, Achievements, Leaderboards und modernster Technologie. Welchen Bereich möchtest du erkunden?'
  }

  if (lower.includes('help') || lower.includes('hilfe')) {
    return 'Gerne helfe ich dir! Ich bin dein intelligenter Gaming- und Programmier-Assistent. Ich kann bei Spielstrategien, Code-Problemen, Technologie-Fragen und kreativen Projekten unterstützen. Woran arbeitest du gerade?'
  }

  // Technology questions
  if (lower.includes('next.js') || lower.includes('nextjs') || lower.includes('react')) {
    return 'Next.js und React sind fantastische Technologien! Ich helfe bei App Router, Server Components, API Routes, Performance-Optimierung und allem was moderne Web-Entwicklung ausmacht. Welche Herausforderung hast du?'
  }

  if (lower.includes('docker') || lower.includes('deployment') || lower.includes('server')) {
    return 'DevOps und Deployment sind wichtige Themen! Ich unterstütze bei Docker, CI/CD, Server-Konfiguration, Monitoring und allem rund um professionelle Entwicklung. Was planst du zu deployen?'
  }

  // Greetings
  if (lower.includes('hallo') || lower.includes('hi') || lower.includes('hey')) {
    return 'Hallo und willkommen! 🎮 Ich bin dein GLXY AI Assistant - spezialisiert auf Gaming, Programmierung und Technologie. Ich kann dir bei Spielstrategien, Code-Problemen, Webentwicklung und kreativen Projekten helfen. Was beschäftigt dich heute?'
  }

  // Default response with capabilities
  return `Interessante Frage! Als GLXY AI Assistant kann ich dir in vielen Bereichen helfen:

🎮 Gaming: Chess-Strategien, Racing-Tipps, UNO-Taktiken, FPS-Skills
💻 Programmierung: JavaScript, TypeScript, React, Next.js, CSS, SQL
🛠️ Technologie: Web-Development, APIs, Datenbanken, DevOps
🎨 Kreatives: UI/UX Design, Projektplanung, Problemlösung

Stelle mir eine konkrete Frage oder beschreibe dein Problem - ich erkläre es gerne ausführlich!`
}

export async function GET(req: NextRequest) {
  const sid = req.headers.get('x-session-id') || ''
  if (!sid) return NextResponse.json({ error: 'Missing session id' }, { status: 400 })
  const convo = (await CacheManager.get<{ messages: ChatMessage[] }>(KEY(sid))) || { messages: [] }
  return NextResponse.json({ conversation: convo }, { status: 200 })
}

export async function POST(req: NextRequest) {
  const sid = req.headers.get('x-session-id') || ''
  if (!sid) return NextResponse.json({ error: 'Missing session id' }, { status: 400 })

  // Enhanced rate limiting for AI chatbot
  const rl = await RateLimiter.checkRateLimit('ai-chatbot', 20, 60_000, sid) // 20 req/min pro Session
  if (!rl.allowed) {
    return NextResponse.json({
      error: 'Zu viele Anfragen. Bitte verlangsame dich etwas - auch KI braucht Pausen! 😊',
      retryAfter: Math.ceil((rl.resetTime - Date.now()) / 1000)
    }, { status: 429 })
  }

  let body: { message?: string } | null = null
  try {
    body = await req.json()
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 })
  }

  const rawText = (body?.message || '').toString()
  const text = sanitizeInput(rawText).slice(0, 2000).trim()

  if (!text) {
    return NextResponse.json({ error: 'Nachricht darf nicht leer sein' }, { status: 400 })
  }

  // Block potentially harmful content
  if (text.length < 1 || text.includes('eval(') || text.includes('<script')) {
    return NextResponse.json({ error: 'Ungültige Nachricht' }, { status: 400 })
  }

  const now = new Date().toISOString()
  const convo = (await CacheManager.get<{ messages: ChatMessage[] }>(KEY(sid))) || { messages: [] }
  const userMsg: ChatMessage = {
    id: `${Date.now()}-u-${Math.random().toString(36).slice(2)}`,
    role: 'user',
    content: text,
    createdAt: now
  }
  convo.messages.push(userMsg)

  // Enhanced AI response with context awareness
  const reply = generateGamingAIResponse(text)
  const botMsg: ChatMessage = {
    id: `${Date.now()}-a-${Math.random().toString(36).slice(2)}`,
    role: 'assistant',
    content: reply,
    createdAt: new Date().toISOString()
  }
  convo.messages.push(botMsg)

  // Keep conversation history manageable (max 50 messages)
  if (convo.messages.length > 50) {
    convo.messages = convo.messages.slice(-40) // Keep last 40 messages
  }

  await CacheManager.set(KEY(sid), convo, TTL)
  return NextResponse.json({ conversation: convo }, { status: 200 })
}

// This function is now moved above and enhanced as generateGamingAIResponse

