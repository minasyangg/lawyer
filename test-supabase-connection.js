import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.production' });

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Проверяем подключение к Supabase...');
    console.log('URL:', process.env.DATABASE_URL?.substring(0, 50) + '...');
    
    // Простая проверка подключения
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Подключение к Supabase успешно!');
    
    // Проверяем таблицы
    const result = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `;
    
    console.log('📋 Таблицы в базе данных:');
    console.log(result);
    
  } catch (error) {
    console.error('❌ Ошибка подключения:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
