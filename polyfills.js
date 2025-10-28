/**
 * Critical Server-Side Polyfills
 *
 * Usage: node --require ./polyfills.js server.js
 * Or set NODE_OPTIONS="--require ./polyfills.js" in environment
 *
 * This file MUST be loaded BEFORE Next.js starts to prevent "self is not defined" errors.
 */

// Polyfill 'self' for webpack chunk loading (IMMEDIATELY at module load)
if (typeof self === 'undefined') {
  global.self = global
  console.log('[Polyfills] ✓ self polyfill applied')
}

// Polyfill globalThis if needed
if (typeof globalThis === 'undefined') {
  global.globalThis = global
  console.log('[Polyfills] ✓ globalThis polyfill applied')
}
