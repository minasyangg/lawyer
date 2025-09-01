const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkAuth() {
  try {
    // Найдем пользователя
    const user = await prisma.user.findUnique({
      where: { email: 'admin@lawyer.com' }
    });

    if (!user) {
      console.log('Пользователь не найден');
      return;
    }

    console.log('Пользователь найден:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      hasPassword: !!user.password
    });

    // Проверим пароль
    const passwordValid = await bcrypt.compare('admin123', user.password);
    console.log('Пароль корректный:', passwordValid);

    // Попробуем также другие варианты
    const passwords = ['admin123', 'Admin123', 'ADMIN123'];
    for (const pwd of passwords) {
      const valid = await bcrypt.compare(pwd, user.password);
      console.log(`Пароль "${pwd}":`, valid);
    }

  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAuth();