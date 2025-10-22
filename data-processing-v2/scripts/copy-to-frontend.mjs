#!/usr/bin/env node
/**
 * Copies generated data from output/ to frontend/public/data/
 */

import { cp, mkdir, rm } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SOURCE_DIR = join(__dirname, '../dist/output');
const TARGET_DIR = join(__dirname, '../../frontend/public/data');

async function copyData() {
  console.log('Copying generated data to frontend...\n');

  // Check if source exists
  if (!existsSync(SOURCE_DIR)) {
    console.error('❌ Error: Source directory does not exist:', SOURCE_DIR);
    console.error('   Run "npm run generate" first to create the data.\n');
    process.exit(1);
  }

  // Check required files
  const requiredFiles = ['index.json', 'versions.json'];
  for (const file of requiredFiles) {
    if (!existsSync(join(SOURCE_DIR, file))) {
      console.error(`❌ Error: Required file missing: ${file}`);
      console.error('   Run "npm run generate" to create the data.\n');
      process.exit(1);
    }
  }

  try {
    // Remove existing target directory if it exists
    if (existsSync(TARGET_DIR)) {
      console.log(`🗑️  Removing existing data at ${TARGET_DIR}`);
      await rm(TARGET_DIR, { recursive: true, force: true });
    }

    // Create target directory
    console.log(`📁 Creating directory: ${TARGET_DIR}`);
    await mkdir(TARGET_DIR, { recursive: true });

    // Copy all files recursively
    console.log(`📋 Copying files from ${SOURCE_DIR}`);
    await cp(SOURCE_DIR, TARGET_DIR, { recursive: true });

    console.log('\n✅ Successfully copied data to frontend!');
    console.log(`   Location: ${TARGET_DIR}\n`);

    // Show summary
    const { readdir, stat } = await import('fs/promises');
    const instrumentationFiles = await readdir(join(TARGET_DIR, 'instrumentations'));
    const versionFiles = await readdir(join(TARGET_DIR, 'versions'));

    console.log('📊 Summary:');
    console.log(`   - index.json: ✓`);
    console.log(`   - versions.json: ✓`);
    console.log(`   - Version manifests: ${versionFiles.length}`);
    console.log(`   - Instrumentation files: ${instrumentationFiles.length}`);

    // Calculate total size
    let totalSize = 0;
    const statsIndex = await stat(join(TARGET_DIR, 'index.json'));
    const statsVersions = await stat(join(TARGET_DIR, 'versions.json'));
    totalSize += statsIndex.size + statsVersions.size;

    for (const file of versionFiles) {
      const s = await stat(join(TARGET_DIR, 'versions', file));
      totalSize += s.size;
    }

    for (const file of instrumentationFiles) {
      const s = await stat(join(TARGET_DIR, 'instrumentations', file));
      totalSize += s.size;
    }

    const sizeMB = (totalSize / 1024 / 1024).toFixed(2);
    const sizeKB = (totalSize / 1024).toFixed(0);
    console.log(`   - Total size: ${sizeKB} KB (${sizeMB} MB)\n`);

  } catch (error) {
    console.error('❌ Error copying data:', error.message);
    process.exit(1);
  }
}

copyData();

