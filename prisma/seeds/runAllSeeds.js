const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const seedsDir = __dirname;

// Определяем порядок запуска seed файлов
const orderedFiles = [
  'seed.js',                    // Сначала аутентификация
  'seedServices.js',            // Затем услуги
  'seedServiceDetails.js',      // Детали услуг (зависит от услуг)
  'seedServiceHeroImages.js',   // Hero изображения (зависит от услуг)
  'seedTags.js',
  'seedTags.new.js',
  'seedUsers.js'
];

// Фильтруем только существующие файлы
const files = orderedFiles.filter(f => fs.existsSync(path.join(seedsDir, f)));

if (files.length === 0) {
  console.log('No seed files found.');
  process.exit(0);
}

for (const file of files) {
  const fullPath = path.join(seedsDir, file);
  console.log(`\nRunning seed: ${file}`);
  const result = spawnSync('node', [fullPath], { stdio: 'inherit' });
  if (result.status !== 0) {
    console.error(`Seed ${file} failed with exit code ${result.status}`);
    process.exit(result.status);
  }
}

console.log('\nAll seeds completed successfully.');
