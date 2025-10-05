import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = [
    {
      name: "Admin User",
      email: "admin@example.com",
      role: "ADMIN" as const
    },
    {
      name: "John Editor",
      email: "john.editor@example.com", 
      role: "EDITOR" as const
    },
    {
      name: "Jane User",
      email: "jane.user@example.com",
      role: "USER" as const
    },
    {
      name: "Mike Client",
      email: "mike.client@example.com",
      role: "USER" as const
    },
    {
      name: "Sarah Editor", 
      email: "sarah.editor@example.com",
      role: "EDITOR" as const
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