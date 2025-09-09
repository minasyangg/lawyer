/**
 * Скрипт для миграции URL файлов при переходе на новую систему хранения
 */

import { PrismaClient } from '@prisma/client';
import { getStorageInfo } from '../src/lib/utils/universal-file-utils';

const prisma = new PrismaClient();

interface MigrationStats {
  totalFiles: number;
  migrated: number;
  skipped: number;
  errors: number;
}

/**
 * Мигрирует URL файлов с учетом текущего провайдера хранения
 */
async function migrateFileUrls(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    totalFiles: 0,
    migrated: 0,
    skipped: 0,
    errors: 0
  };

  try {
    const storageInfo = getStorageInfo();
    console.log(`🔧 Starting file URL migration for ${storageInfo.provider} provider...`);

    // Получаем все файлы из базы данных
    const files = await prisma.file.findMany({
      select: {
        id: true,
        originalName: true,
        filename: true,
        path: true,
        uploadedBy: true
      }
    });

    stats.totalFiles = files.length;
    console.log(`📁 Found ${files.length} files to process`);

    for (const file of files) {
      try {
        let needsUpdate = false;
        let newPath = file.path;

        if (storageInfo.isLocal) {
          // Миграция для локального провайдера
          if (file.path.startsWith('https://')) {
            // Если файл сейчас в облаке, а мы переходим на локальное хранение
            // Пропускаем - физический файл нужно сначала скачать
            console.log(`⚠️  Skipping cloud file (needs manual download): ${file.originalName}`);
            stats.skipped++;
            continue;
          } else if (!file.path.startsWith('uploads/') && !file.path.startsWith('/uploads/')) {
            // Нормализуем путь для локального хранения
            newPath = `uploads/user_${file.uploadedBy}/${file.filename}`;
            needsUpdate = true;
          }
        } else if (storageInfo.isSupabase) {
          // Миграция для Supabase провайдера
          if (!file.path.startsWith('https://')) {
            // Если файл локальный, а мы переходим на Supabase
            // Пропускаем - физический файл нужно сначала загрузить
            console.log(`⚠️  Skipping local file (needs manual upload): ${file.originalName}`);
            stats.skipped++;
            continue;
          }
        }

        if (needsUpdate) {
          await prisma.file.update({
            where: { id: file.id },
            data: { path: newPath }
          });

          console.log(`✅ Migrated: ${file.originalName} -> ${newPath}`);
          stats.migrated++;
        } else {
          stats.skipped++;
        }

      } catch (error) {
        console.error(`❌ Error migrating file ${file.originalName}:`, error);
        stats.errors++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   Total files: ${stats.totalFiles}`);
    console.log(`   Migrated: ${stats.migrated}`);
    console.log(`   Skipped: ${stats.skipped}`);
    console.log(`   Errors: ${stats.errors}`);

    return stats;

  } catch (error) {
    console.error('💥 Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Проверка состояния файлов в базе данных
 */
async function checkFileStatus(): Promise<void> {
  try {
    console.log('🔍 Checking file status...');

    const files = await prisma.file.findMany({
      select: {
        id: true,
        originalName: true,
        path: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    console.log('\n📋 Recent files:');
    files.forEach((file, index) => {
      const isLocal = !file.path.startsWith('https://');
      const icon = isLocal ? '📁' : '☁️';
      console.log(`   ${index + 1}. ${icon} ${file.originalName} -> ${file.path}`);
    });

    const totalFiles = await prisma.file.count();
    const localFiles = await prisma.file.count({
      where: {
        path: {
          not: {
            startsWith: 'https://'
          }
        }
      }
    });
    const cloudFiles = totalFiles - localFiles;

    console.log('\n📊 File distribution:');
    console.log(`   📁 Local files: ${localFiles}`);
    console.log(`   ☁️  Cloud files: ${cloudFiles}`);
    console.log(`   📄 Total files: ${totalFiles}`);

  } catch (error) {
    console.error('Error checking file status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Запуск скрипта
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case 'migrate':
      migrateFileUrls()
        .then(stats => {
          console.log('✅ Migration completed successfully!');
          process.exit(0);
        })
        .catch(error => {
          console.error('❌ Migration failed:', error);
          process.exit(1);
        });
      break;

    case 'check':
      checkFileStatus()
        .then(() => {
          console.log('✅ Check completed!');
          process.exit(0);
        })
        .catch(error => {
          console.error('❌ Check failed:', error);
          process.exit(1);
        });
      break;

    default:
      console.log('📖 Usage:');
      console.log('   node scripts/migrate-file-urls.js check   - Check current file status');
      console.log('   node scripts/migrate-file-urls.js migrate - Migrate file URLs');
      process.exit(1);
  }
}

export { migrateFileUrls, checkFileStatus };
