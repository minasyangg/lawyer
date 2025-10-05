const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Создаем или обновляем админ пользователя
  const hashedPassword = await bcrypt.hash('admin', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ya.ru' },
    update: {
      name: 'Administrator',
      password: hashedPassword,
      userRole: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      twoFactorEnabled: false,
      failedLoginAttempts: 0,
      updatedAt: new Date()
    },
    create: {
      name: 'Administrator',
      email: 'admin@ya.ru',
      password: hashedPassword,
      userRole: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      twoFactorEnabled: false,
      failedLoginAttempts: 0
    },
  });
  console.log('Admin user created or updated:', admin.email);

  // Создаем или обновляем редактора
  const editor = await prisma.user.upsert({
    where: { email: 'editor@ya.ru' },
    update: {
      name: 'Editor',
      password: hashedPassword,
      userRole: 'EDITOR',
      status: 'ACTIVE',
      emailVerified: true,
      twoFactorEnabled: false,
      failedLoginAttempts: 0,
      updatedAt: new Date()
    },
    create: {
      name: 'Editor',
      email: 'editor@ya.ru',
      password: hashedPassword,
      userRole: 'EDITOR',
      status: 'ACTIVE',
      emailVerified: true,
      twoFactorEnabled: false,
      failedLoginAttempts: 0
    },
  });
  console.log('Editor user created or updated:', editor.email);

  // Создаем или обновляем обычного пользователя
  const userPassword = await bcrypt.hash('user', 12);
  const user = await prisma.user.upsert({
    where: { email: 'user@lawyer.com' },
    update: {
      name: 'Test User',
      password: userPassword,
      userRole: 'USER',
      status: 'ACTIVE',
      emailVerified: true,
      twoFactorEnabled: false,
      failedLoginAttempts: 0,
      updatedAt: new Date()
    },
    create: {
      name: 'Test User',
      email: 'user@lawyer.com',
      password: userPassword,
      userRole: 'USER',
      status: 'ACTIVE',
      emailVerified: true,
      twoFactorEnabled: false,
      failedLoginAttempts: 0
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