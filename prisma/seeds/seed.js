const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🌱 Начинаем seeding новой системы аутентификации...');

    // Удаляем всех существующих пользователей (кроме тех, кто уже имеет новую структуру)
    await prisma.user.deleteMany({
      where: {
        role: {
          not: {
            in: ['ADMIN', 'EDITOR', 'USER']
          }
        }
      }
    });

    // Создаем единственного админа с безопасным паролем
    const adminPassword = 'AdminPass123!'; // В продакшене должен быть изменен
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    const admin = await prisma.user.upsert({
      where: { email: 'admin@lawyer-site.com' },
      update: {
        name: 'System Administrator',
        password: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
        isActive: true,
        emailVerified: true,
        twoFactorEnabled: false, // Будет включена при первом входе
        failedLoginAttempts: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      create: {
        name: 'System Administrator',
        email: 'admin@lawyer-site.com',
        password: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
        isActive: true,
        emailVerified: true,
        twoFactorEnabled: false,
        failedLoginAttempts: 0
      }
    });

    console.log('✅ Админ создан успешно:');
    console.log(`   Email: admin@lawyer-site.com`);
    console.log(`   Пароль: ${adminPassword}`);
    console.log(`   🔒 ВАЖНО: Смените пароль после первого входа!`);
    console.log(`   📱 2FA будет обязательна для настройки при первом входе`);

    console.log('✅ Seeding завершен успешно!');

  } catch (error) {
    console.error('❌ Ошибка при seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
