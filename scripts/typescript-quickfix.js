#!/usr/bin/env node

const { execSync } = require('child_process')
const path = require('path')

console.log('⚙️  Running TypeScript quick fixes...')

try {
  execSync('npx eslint --fix "**/*.{ts,tsx}"', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  })
  console.log('✅ ESLint auto-fix completed')
} catch (error) {
  console.warn('⚠️ ESLint auto-fix encountered issues')
}

try {
  execSync('npx ts-prune', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  })
  console.log('✅ ts-prune check completed')
} catch (error) {
  console.warn('⚠️ ts-prune reported unused exports')
}

console.log('✨ TypeScript quick fix run finished')
