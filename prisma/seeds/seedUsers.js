const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Создаем или обновляем админ пользователя
  const hashedPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@lawyer.com' },
    update: {
      name: 'Administrator',
      password: hashedPassword,
      role: 'admin',
    },
    create: {
      name: 'Administrator',
      email: 'admin@lawyer.com',
      password: hashedPassword,
      role: 'admin',
    },
  });
  console.log('Admin user created or updated:', admin.email);

  // Создаем или обновляем обычного пользователя
  const userPassword = await bcrypt.hash('user123', 12);
  const user = await prisma.user.upsert({
    where: { email: 'user@lawyer.com' },
    update: {
      name: 'Test User',
      password: userPassword,
      role: 'user',
    },
    create: {
      name: 'Test User',
      email: 'user@lawyer.com',
      password: userPassword,
      role: 'user',
    },
  });
  console.log('Test user created or updated:', user.email);
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