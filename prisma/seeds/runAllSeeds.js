const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const seedsDir = __dirname;
const files = fs.readdirSync(seedsDir)
  .filter(f => /^seed.*\.js$/.test(f) && f !== 'runAllSeeds.js');

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
