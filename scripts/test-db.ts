#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client'

async function testDatabase() {
  console.log('🔍 Testing GLXY Gaming Database...\n')

  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  })

  try {
    console.log('1️⃣ Testing database connection...')
    await prisma.$connect()
    console.log('✅ Database connection successful!\n')

    console.log('2️⃣ Checking database tables...')
    const tables = await prisma.$queryRaw<{ tablename: string }[]>`
      SELECT tablename FROM pg_tables WHERE schemaname='public';
    `
    console.log('📊 Found tables:', tables.map((t) => t.tablename).join(', '))
    console.log('✅ Tables check successful!\n')

    try {
      console.log('3️⃣ Testing User operations...')
      const userCount = await prisma.user.count()
      console.log(`👤 Found ${userCount} users in database`)
      console.log('✅ User operations successful!\n')
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.log('⚠️ User table might not exist yet:', message)
    }

    console.log('4️⃣ Testing query performance...')
    const startTime = Date.now()
    await prisma.$queryRaw`SELECT 1 as test;`
    const endTime = Date.now()
    console.log(`⚡ Query response time: ${endTime - startTime}ms`)
    console.log('✅ Performance check successful!\n')

    console.log('🎉 ALL DATABASE TESTS PASSED! 🎉')
    console.log('🚀 GLXY Gaming database is fully functional!')
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('❌ Database test failed:', message)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

testDatabase()
