#!/usr/bin/env node

const { exec } = require('child_process')

console.log('🔍 TypeScript Check wird ausgeführt...')

exec('npx tsc --noEmit --skipLibCheck', { cwd: __dirname }, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ TypeScript Errors gefunden:')
    console.error(stderr)
    console.error(stdout)

    const errorLines = stderr.split('\n').filter((line) => line.includes('error TS'))
    console.log(`\n📊 Total TypeScript Errors: ${errorLines.length}`)

    console.log('\n🔥 Top 10 Errors:')
    errorLines.slice(0, 10).forEach((line, index) => {
      console.log(`${index + 1}. ${line.trim()}`)
    })
  } else {
    console.log('✅ Keine TypeScript Errors gefunden!')
    console.log(stdout)
  }
})
