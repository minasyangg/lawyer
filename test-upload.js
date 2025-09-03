// Простой тест для проверки загрузки файлов в подпапки
// Запустите этот файл после создания тестовых папок в файловом менеджере

import fs from 'fs';
import path from 'path';

function checkUploadStructure() {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  
  console.log('Проверка структуры папок загрузки...');
  console.log('Директория uploads:', uploadsDir);
  
  try {
    if (fs.existsSync(uploadsDir)) {
      const userDirs = fs.readdirSync(uploadsDir);
      console.log('Найденные пользовательские папки:', userDirs);
      
      userDirs.forEach(userDir => {
        if (userDir.startsWith('user_')) {
          const userPath = path.join(uploadsDir, userDir);
          const stats = fs.statSync(userPath);
          
          if (stats.isDirectory()) {
            console.log(`\nПапка пользователя: ${userDir}`);
            
            function listDirectoryRecursive(dirPath, level = 0) {
              const items = fs.readdirSync(dirPath);
              const indent = '  '.repeat(level);
              
              items.forEach(item => {
                const itemPath = path.join(dirPath, item);
                const itemStats = fs.statSync(itemPath);
                
                if (itemStats.isDirectory()) {
                  console.log(`${indent}📁 ${item}/`);
                  listDirectoryRecursive(itemPath, level + 1);
                } else {
                  const fileSize = (itemStats.size / 1024).toFixed(2);
                  console.log(`${indent}📄 ${item} (${fileSize} KB)`);
                }
              });
            }
            
            listDirectoryRecursive(userPath);
          }
        }
      });
    } else {
      console.log('Папка uploads не найдена');
    }
  } catch (error) {
    console.error('Ошибка при проверке структуры:', error);
  }
}

checkUploadStructure();
