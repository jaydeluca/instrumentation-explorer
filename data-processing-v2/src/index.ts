#!/usr/bin/env node
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { DataGenerator, VersionConfig } from './dataGenerator.js';
import { detectVersions, getLatestVersion, getRecentVersions } from './versionDetector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface CliOptions {
  mode: 'latest' | 'recent' | 'all' | 'specific';
  count?: number;
  versions?: string[];
  include3_0?: boolean;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }
  
  // Default: process 2 most recent versions
  const options: CliOptions = {
    mode: 'recent',
    count: 2,
    include3_0: false
  };
  
  if (args.includes('--latest')) {
    options.mode = 'latest';
  } else if (args.includes('--all')) {
    options.mode = 'all';
  } else if (args.includes('--recent')) {
    options.mode = 'recent';
    const countIdx = args.indexOf('--recent');
    if (args[countIdx + 1] && !args[countIdx + 1].startsWith('--')) {
      options.count = parseInt(args[countIdx + 1], 10);
    }
  } else if (args.includes('--versions')) {
    options.mode = 'specific';
    const versionIdx = args.indexOf('--versions');
    const versionArgs = args.slice(versionIdx + 1).filter(a => !a.startsWith('--'));
    options.versions = versionArgs;
  }
  
  if (args.includes('--include-3.0')) {
    options.include3_0 = true;
  }
  
  return options;
}

function printHelp() {
  console.log(`
Content-Addressed Storage Generator - OpenTelemetry Instrumentation Explorer

Usage:
  npm run generate [options]

Options:
  --latest              Process only the latest stable version
  --recent [N]          Process N most recent versions (default: 2)
  --all                 Process all available versions
  --versions V1 V2...   Process specific versions (e.g., --versions 2.19.0 2.20.0)
  --include-3.0         Include the hypothetical 3.0 version
  -h, --help            Show this help message

Examples:
  npm run generate                    # Process 2 most recent versions
  npm run generate -- --latest        # Process only latest
  npm run generate -- --recent 3      # Process 3 most recent versions
  npm run generate -- --all           # Process all versions
  npm run generate -- --versions 2.20.0   # Process only 2.20.0
  npm run generate -- --include-3.0   # Include 3.0 in processing

Notes:
  - YAML files are auto-detected from instrumentation-list-*.yaml in repo root
  - Version 3.0 is excluded by default (use --include-3.0 to include it)
  - The latest stable version is always marked as isLatest=true
  `);
}

async function main() {
  console.log('🚀 Content-Addressed Storage Generator');
  console.log('=====================================\n');

  const options = parseArgs();
  const repoRoot = join(__dirname, '../../..');
  
  console.log(`Mode: ${options.mode}`);
  if (options.mode === 'recent') {
    console.log(`Count: ${options.count}`);
  }
  console.log(`Include 3.0: ${options.include3_0}\n`);

  let detectedVersions: Awaited<ReturnType<typeof detectVersions>> = [];

  try {
    // Detect versions based on mode
    switch (options.mode) {
      case 'latest': {
        const latest = await getLatestVersion(repoRoot);
        if (!latest) {
          console.error('❌ No versions found in repository');
          console.error('   Expected to find instrumentation-list-*.yaml files');
          process.exit(1);
        }
        detectedVersions = [latest];
        break;
      }

      case 'recent': {
        detectedVersions = await getRecentVersions(
          repoRoot,
          options.count || 2,
          options.include3_0
        );
        if (detectedVersions.length === 0) {
          console.error('❌ No versions found in repository');
          process.exit(1);
        }
        break;
      }

      case 'all': {
        detectedVersions = await detectVersions(repoRoot);
        if (!options.include3_0) {
          detectedVersions = detectedVersions.filter(v => v.version !== '3.0.0');
        }
        if (detectedVersions.length === 0) {
          console.error('❌ No versions found in repository');
          process.exit(1);
        }
        break;
      }

      case 'specific': {
        if (!options.versions || options.versions.length === 0) {
          console.error('❌ No versions specified with --versions');
          process.exit(1);
        }
        const allVersions = await detectVersions(repoRoot);
        detectedVersions = allVersions.filter(v => 
          options.versions!.includes(v.version)
        );
        if (detectedVersions.length === 0) {
          console.error(`❌ None of the specified versions found: ${options.versions.join(', ')}`);
          process.exit(1);
        }
        // Ensure at least one is marked as latest
        if (!detectedVersions.some(v => v.isLatest)) {
          detectedVersions[detectedVersions.length - 1].isLatest = true;
        }
        break;
      }
    }

    console.log(`📂 Found ${detectedVersions.length} version(s) to process:`);
    for (const v of detectedVersions) {
      console.log(`   - ${v.version}${v.isLatest ? ' (latest)' : ''}`);
    }
    console.log();

    // Convert detected versions to VersionConfig format
    const versions: VersionConfig[] = detectedVersions.map(v => ({
      version: v.version,
      yamlPath: v.yamlPath,
      releaseDate: v.releaseDate || new Date().toISOString().split('T')[0],
      isLatest: v.isLatest
    }));

    const outputDir = join(__dirname, '../output');

    const generator = new DataGenerator({
      versions,
      outputDir,
      baseUrl: '/data'
    });

    await generator.generate();

    const stats = generator.getStats();
    console.log('\n📊 Statistics:');
    console.log(`   Unique instrumentations: ${stats.uniqueInstrumentations}`);
    console.log(`   Versions processed: ${stats.versionsProcessed}`);
    console.log(`   Total instrumentations: ${stats.totalInstrumentations}`);
    
    if (stats.totalInstrumentations > stats.uniqueInstrumentations) {
      const dedup = ((1 - stats.uniqueInstrumentations / stats.totalInstrumentations) * 100).toFixed(1);
      console.log(`   Deduplication savings: ${dedup}%`);
    }

  } catch (error) {
    console.error('❌ Generation failed:', error);
    process.exit(1);
  }
}

main();
