#!/usr/bin/env node
// @ts-nocheck

/**
 * GLXY Gaming Platform - Custom Server
 * Integrates Next.js with Socket.IO for real-time multiplayer gaming
 * Architecture:
 * - Port 3000: Next.js Frontend + Socket.IO (UNIFIED SERVER)
 *
 * FIXED: Socket.IO läuft jetzt auf dem GLEICHEN Server wie Next.js
 * Kein separater Port 3001 mehr nötig!
 */

const { createServer } = require('http')
const next = require('next')
const path = require('path')

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || 'localhost'
const nextPort = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port: nextPort })
const handler = app.getRequestHandler()

app.prepare().then(async () => {
  // Create unified HTTP server for both Next.js AND Socket.IO
  const server = createServer(async (req, res) => {
    await handler(req, res)
  })

  // Initialize Socket.IO on the SAME server (after Next.js is ready)
  let io = null

  // Load Socket.IO initialization dynamically
  // In development: try to require the TS file directly using Node.js loader
  // In production: use the compiled version
  try {
    let initializeSocketServer

    if (dev) {
      // Development: use dynamic import for ESM/TS support
      // Falls das nicht klappt, einfach ohne Socket.IO starten
      try {
        // Node 18+ supports --loader tsx for TypeScript
        // Alternativ: tsx/ts-node
        const socketModule = require('./lib/socket-server.ts')
        initializeSocketServer = socketModule.initializeSocketServer
      } catch (tsError) {
        console.warn('⚠️  TypeScript module loading failed, checking build output...')
        // Fallback: try build output
        const socketServerPath = path.join(__dirname, '.next/server/chunks/lib_socket-server_ts.js')
        try {
          const socketModule = require(socketServerPath)
          initializeSocketServer = socketModule.initializeSocketServer
        } catch (buildError) {
          console.warn('⚠️  Socket.IO server not available yet.')
          console.warn('   Run "npm run build" first or use tsx: npm run dev:tsx')
        }
      }
    } else {
      // Production: use compiled version
      const socketServerPath = path.join(__dirname, '.next/server/chunks/lib_socket-server_ts.js')
      const socketModule = require(socketServerPath)
      initializeSocketServer = socketModule.initializeSocketServer
    }

    if (initializeSocketServer) {
      io = await initializeSocketServer(server)
      console.log('✅ Socket.IO initialized on Next.js server')
    }
  } catch (e) {
    console.error('❌ Failed to initialize Socket.IO:', e.message)
    console.log('📝 Server will run without Socket.IO support')
  }

  // Start unified server
  server.listen(nextPort, () => {
    console.log(`🚀 Next.js Frontend ready on http://${hostname}:${nextPort}`)
    if (io) {
      console.log(`⚡ Socket.IO Server ready on http://${hostname}:${nextPort}/api/socket/io`)
    } else {
      console.log(`⚠️  Socket.IO NOT available (build required or use dev:tsx)`)
    }
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
  })

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully...')
    server.close(() => {
      process.exit(0)
    })
  })

  process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT, shutting down gracefully...')
    server.close(() => {
      process.exit(0)
    })
  })
})
