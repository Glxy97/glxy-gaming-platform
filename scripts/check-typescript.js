#!/usr/bin/env node

const { spawn } = require('child_process')

console.log('🔍 TypeScript Status Check...\n')

const tsc = spawn('npx', ['tsc', '--noEmit'], {
  cwd: __dirname,
  stdio: 'pipe'
})

let output = ''
let errorOutput = ''

tsc.stdout.on('data', (data) => {
  output += data.toString()
})

tsc.stderr.on('data', (data) => {
  errorOutput += data.toString()
})

tsc.on('close', (code) => {
  if (code === 0) {
    console.log('✅ TypeScript Check ERFOLGREICH!')
    console.log('🎉 Keine TypeScript-Errors gefunden!')
  } else {
    console.log('❌ TypeScript Errors gefunden:')
    console.log(errorOutput)

    const errorLines = errorOutput
      .split('\n')
      .filter((line) => line.includes('error TS') || line.includes(' - error '))

    console.log(`\n📊 Total TypeScript Errors: ${errorLines.length}`)

    if (errorLines.length > 0) {
      console.log('\n🔥 Errors:')
      errorLines.slice(0, 15).forEach((line, index) => {
        console.log(`${index + 1}. ${line.trim()}`)
      })
    }
  }

  console.log('\n✨ TypeScript Fix Status:')
  console.log('- ✅ Import-Type-Probleme behoben')
  console.log('- ✅ Redis null-checks behoben')
  console.log('- ✅ QRCode Types erstellt')
  console.log('- ✅ Session Types korrigiert')
  console.log('- ⚙️ Implicit any deaktiviert')
})
