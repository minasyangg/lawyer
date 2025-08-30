import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
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
    },
    {
      name: "Mike Client",
      email: "mike.client@example.com",
      role: "user"
    },
    {
      name: "Sarah Manager", 
      email: "sarah.manager@example.com",
      role: "moderator"
    }
  ];

  for (const user of users) {
    await prisma.user.create({
      data: user
    });
  }

  console.log('Users seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });