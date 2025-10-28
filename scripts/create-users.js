import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

async function createVerifiedUsers() {
  console.log('👤 Creating Verified Demo Users...\n');

  const prisma = new PrismaClient();

  try {
    const users = [
      {
        email: 'chessking@gaming.com',
        username: 'ChessKing',
        password: 'chess123',
        level: 15,
        xp: 3500
      },
      {
        email: 'gamemaster@gaming.com',
        username: 'GameMaster',
        password: 'game123',
        level: 22,
        xp: 5800
      }
    ];

    console.log('🔧 Creating users with emailVerified: true\n');

    for (const userData of users) {
      const passwordHash = await bcrypt.hash(userData.password, 12);

      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {
          emailVerified: true,
          level: userData.level,
          globalXP: userData.xp
        },
        create: {
          email: userData.email,
          username: userData.username,
          password: passwordHash,
          level: userData.level,
          globalXP: userData.xp,
          coins: 1000,
          emailVerified: true,
          bio: `${userData.username} - Verified Demo Account`
        }
      });

      console.log(`✅ Created: ${user.username} (${user.email}) - Verified: ${user.emailVerified}`);
      console.log(`   Password: ${userData.password}`);
      console.log(`   Level: ${user.level}, XP: ${user.globalXP}\n`);
    }

    // Create Game Stats
    for (const userData of users) {
      const user = await prisma.user.findUnique({ where: { email: userData.email } });
      if (user) {
        await prisma.gameStats.upsert({
          where: {
            userId_gameType: {
              userId: user.id,
              gameType: 'chess'
            }
          },
          update: {},
          create: {
            userId: user.id,
            gameType: 'chess',
            xp: Math.floor(Math.random() * 1000) + 500,
            level: Math.floor(Math.random() * 5) + 5,
            wins: Math.floor(Math.random() * 25) + 5,
            losses: Math.floor(Math.random() * 20),
            stats: { skillLevel: 'intermediate' }
          }
        });
        console.log(`⚡ Created game stats for: ${userData.username}`);
      }
    }

    console.log('\n🎉 DEMO USERS SUCCESSFULLY CREATED!');
    console.log('🔐 Login Credentials:');
    console.log('   ChessKing: chessking@gaming.com / chess123');
    console.log('   GameMaster: gamemaster@gaming.com / game123');
    console.log('\n🌟 Both users are emailVerified and can login immediately!');
    console.log('🎮 Ready for Multiplayer Game Testing!');

  } catch (error) {
    console.error('❌ Error creating users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createVerifiedUsers();
