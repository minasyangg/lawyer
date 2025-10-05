const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🌱 Начинаем seeding новой системы аутентификации...');

    // Удаляем всех существующих пользователей (кроме тех, кто уже имеет новую структуру)
    await prisma.user.deleteMany({
      where: {
        userRole: {
          not: {
            in: ['ADMIN', 'EDITOR', 'USER']
          }
        }
      }
    });

    // Создаем единственного админа с безопасным паролем
    const adminPassword = 'admin'; // Простой пароль как запросил пользователь
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    const admin = await prisma.user.upsert({
      where: { email: 'admin@ya.ru' },
      update: {
        name: 'System Administrator',
        password: hashedPassword,
        userRole: 'ADMIN',
        status: 'ACTIVE',
        emailVerified: true,
        twoFactorEnabled: false,
        failedLoginAttempts: 0,
        updatedAt: new Date()
      },
      create: {
        name: 'System Administrator',
        email: 'admin@ya.ru',
        password: hashedPassword,
        userRole: 'ADMIN',
        status: 'ACTIVE',
        emailVerified: true,
        twoFactorEnabled: false,
        failedLoginAttempts: 0
      }
    });

    // Создание редактора
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
      }
    });

    console.log('✅ Админ создан успешно:');
    console.log(`   Email: admin@ya.ru`);
    console.log(`   Пароль: ${adminPassword}`);
    console.log('✅ Редактор создан успешно:');
    console.log(`   Email: editor@ya.ru`);
    console.log(`   Пароль: ${adminPassword}`);
    console.log(`   � ВАЖНО: Смените пароли после первого входа!`);

    console.log('✅ Seeding завершен успешно!');

  } catch (error) {
    console.error('❌ Ошибка при seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
