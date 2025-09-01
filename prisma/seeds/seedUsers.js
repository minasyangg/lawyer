const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Создаем админ пользователя
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const admin = await prisma.user.create({
    data: {
      name: 'Administrator',
      email: 'admin@lawyer.com',
      password: hashedPassword,
      role: 'admin'
    }
  });

  console.log('Admin user created:', admin.email);
  
  // Создаем обычного пользователя
  const userPassword = await bcrypt.hash('user123', 12);
  
  const user = await prisma.user.create({
    data: {
      name: 'Test User',
      email: 'user@lawyer.com', 
      password: userPassword,
      role: 'user'
    }
  });

  console.log('Test user created:', user.email);
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