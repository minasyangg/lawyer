const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 Проверяем пользователей в базе данных...\n');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        userRole: true,
        status: true,
        emailVerified: true
      }
    });

    if (users.length === 0) {
      console.log('❌ Пользователи не найдены в базе данных');
      return;
    }

    console.log(`✅ Найдено пользователей: ${users.length}\n`);
    
    users.forEach((user, index) => {
      console.log(`👤 Пользователь ${index + 1}:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Имя: ${user.name}`);
      console.log(`   Роль: ${user.userRole}`);
      console.log(`   Статус: ${user.status}`);
      console.log(`   Email подтвержден: ${user.emailVerified}`);
      console.log('');
    });

    // Проверяем конкретно админа
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@ya.ru' }
    });

    if (admin) {
      console.log('✅ Админ найден:');
      console.log(`   Email: ${admin.email}`);
      console.log(`   Роль: ${admin.userRole}`);
      console.log(`   Статус: ${admin.status}`);
    } else {
      console.log('❌ Админ admin@ya.ru не найден');
    }

  } catch (error) {
    console.error('❌ Ошибка при проверке пользователей:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();