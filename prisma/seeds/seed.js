const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    const users = [
      {
        name: "Admin User",
        email: "admin@example.com",
        role: "admin"
      },
      {
        name: "John Moderator",
        email: "john.moderator@example.com", 
        role: "moderator"
      },
      {
        name: "Jane User",
        email: "jane.user@example.com",
        role: "user"
      }
    ];

    for (const user of users) {
      await prisma.user.upsert({
        where: { email: user.email },
        update: user,
        create: user
      });
    }

    console.log('Users seeded successfully');
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
