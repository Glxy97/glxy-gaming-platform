/**
 * Test User Seeder Script
 * Creates a test user for development
 */

import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding test user...')

  const email = 'test@glxy.at'
  const password = 'Test123!'
  const username = 'TestUser'

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    console.log('✅ Test user already exists:', email)
    console.log('   Username:', existingUser.username)
    console.log('   ID:', existingUser.id)
    return
  }

  // Hash password
  const hashedPassword = await hash(password, 10)

  // Create test user
  const user = await prisma.user.create({
    data: {
      email,
      username,
      name: 'Test User',
      password: hashedPassword,
      emailVerified: new Date(), // Pre-verified
      loginAttempts: 0,
    },
  })

  console.log('✅ Test user created successfully!')
  console.log('   Email:', email)
  console.log('   Password:', password)
  console.log('   Username:', username)
  console.log('   ID:', user.id)
  console.log('\n📝 Use these credentials to login:')
  console.log(`   Email: ${email}`)
  console.log(`   Password: ${password}`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding test user:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
