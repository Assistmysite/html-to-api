#!/usr/bin/env node
/**
 * Master build script. Runs all build steps in order.
 * Run from html-to-api/: node scripts/build.js  or  npm run build
 */

const { spawnSync } = require('child_process');
const path = require('path');

const scriptsDir = path.join(__dirname);
const scripts = [
  'build-blog-list.js',
  'build-blog-singles.js',
];

console.log('Building...\n');

for (const script of scripts) {
  const scriptPath = path.join(scriptsDir, script);
  console.log(`Running ${script}...`);
  const result = spawnSync(process.execPath, [scriptPath], {
    stdio: 'inherit',
    cwd: path.dirname(scriptsDir),
  });
  if (result.status !== 0) {
    console.error(`\n${script} failed with exit code ${result.status}`);
    process.exit(result.status);
  }
}

console.log('\nBuild complete.');
