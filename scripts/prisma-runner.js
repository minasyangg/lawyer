#!/usr/bin/env node

/**
 * Простая утилита для запуска Prisma команд с правильными переменными окружения
 * Основная цель: использовать DIRECT_URL для Supabase миграций
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Загрузка .env файла
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Env file not found: ${filePath}`);
    process.exit(1);
  }

  const envContent = fs.readFileSync(filePath, 'utf-8');
  const envVars = {};

  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        let value = valueParts.join('=');
        // Убираем кавычки
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        envVars[key] = value;
      }
    }
  });

  return envVars;
}

// Основная функция
function runPrismaCommand() {
  const [command, ...args] = process.argv.slice(2);
  
  if (!command) {
    console.log('Usage: node prisma-runner.js <prisma-command> [args...]');
    console.log('Example: node prisma-runner.js migrate deploy --prod');
    process.exit(1);
  }

  // Определяем среду
  const isProd = args.includes('--prod');
  const envFile = isProd ? '.env.production' : '.env.local';
  const envPath = path.join(process.cwd(), envFile);
  
  console.log(`📊 Loading environment from: ${envFile}`);
  
  // Загружаем переменные окружения
  const envVars = loadEnvFile(envPath);
  
  // Применяем к process.env
  Object.assign(process.env, envVars);
  
  // Для Supabase миграций используем DIRECT_URL
  if (isProd && (command === 'migrate' || command === 'db')) {
    if (envVars.DIRECT_URL) {
      console.log('🔧 Using DIRECT_URL for Supabase migration (bypassing pgbouncer)');
      process.env.DATABASE_URL = envVars.DIRECT_URL;
    }
  }
  
  // Формируем команду
  const filteredArgs = args.filter(arg => arg !== '--prod');
  const prismaCommand = `npx prisma ${command} ${filteredArgs.join(' ')}`.trim();
  
  console.log(`🚀 Executing: ${prismaCommand}`);
  console.log(`🔗 Database: ${process.env.DATABASE_URL?.substring(0, 50)}...`);
  
  try {
    execSync(prismaCommand, { 
      stdio: 'inherit',
      cwd: process.cwd(),
      env: process.env
    });
    console.log('✅ Command completed successfully!');
  } catch (error) {
    console.error('❌ Command failed:', error.message);
    process.exit(1);
  }
}

runPrismaCommand();
