import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, rm, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { DataGenerator, VersionConfig } from '../src/dataGenerator.js';
import {
  InstrumentationData,
  IndexData,
  VersionsData,
  VersionManifest
} from '../src/types.js';

const TEST_OUTPUT_DIR = join(process.cwd(), 'tests', 'test-output');

// Helper to create a mock YAML file
async function createMockYAML(path: string, instrumentations: any[]) {
  const yaml = {
    file_format: '0.1',
    libraries: {
      test: instrumentations
    }
  };

  const yamlContent = `file_format: ${yaml.file_format}
libraries:
  test:
${instrumentations.map(i => `  - name: ${i.name}
    display_name: ${i.display_name}`).join('\n')}`;

  await mkdir(join(path, '..'), { recursive: true });
  await writeFile(path, yamlContent);
}

describe('DataGenerator', () => {
  beforeEach(async () => {
    // Clean test output directory
    await rm(TEST_OUTPUT_DIR, { recursive: true, force: true });
    await mkdir(TEST_OUTPUT_DIR, { recursive: true });
  });

  afterEach(async () => {
    // Clean up
    await rm(TEST_OUTPUT_DIR, { recursive: true, force: true });
  });

  it('should create required directories', async () => {
    const versions: VersionConfig[] = [
      {
        version: 'test-1.0',
        yamlPath: join(TEST_OUTPUT_DIR, 'test-1.0.yaml'),
        releaseDate: '2024-01-01',
        isLatest: true
      }
    ];

    await createMockYAML(versions[0].yamlPath, [
      { name: 'test-lib-1.0', display_name: 'Test Library' }
    ]);

    const generator = new DataGenerator({
      versions,
      outputDir: TEST_OUTPUT_DIR
    });

    await generator.generate();

    // Check directories exist
    const indexPath = join(TEST_OUTPUT_DIR, 'index.json');
    const versionsPath = join(TEST_OUTPUT_DIR, 'versions.json');
    const versionManifestPath = join(TEST_OUTPUT_DIR, 'versions', 'test-1.0.json');

    const indexContent = await readFile(indexPath, 'utf-8');
    const versionsContent = await readFile(versionsPath, 'utf-8');
    const manifestContent = await readFile(versionManifestPath, 'utf-8');

    expect(indexContent).toBeTruthy();
    expect(versionsContent).toBeTruthy();
    expect(manifestContent).toBeTruthy();
  });

  it('should generate valid index.json', async () => {
    const versions: VersionConfig[] = [
      {
        version: 'test-1.0',
        yamlPath: join(TEST_OUTPUT_DIR, 'test-1.0.yaml'),
        releaseDate: '2024-01-01',
        isLatest: true
      }
    ];

    await createMockYAML(versions[0].yamlPath, [
      {
        name: 'test-lib-1.0',
        display_name: 'Test Library',
        description: 'A test library'
      }
    ]);

    const generator = new DataGenerator({
      versions,
      outputDir: TEST_OUTPUT_DIR
    });

    await generator.generate();

    const indexPath = join(TEST_OUTPUT_DIR, 'index.json');
    const content = await readFile(indexPath, 'utf-8');
    const index: IndexData = JSON.parse(content);

    expect(index.generated_at).toBeTruthy();
    expect(index.latest_version).toBe('test-1.0');
    expect(index.instrumentations).toHaveLength(1);
    expect(index.instrumentations[0].id).toBe('test-lib-1.0');
    expect(index.instrumentations[0].display_name).toBe('Test Library');
    expect(index.instrumentations[0].library_group).toBe('test');
  });

  it('should generate valid versions.json', async () => {
    const versions: VersionConfig[] = [
      {
        version: 'test-1.0',
        yamlPath: join(TEST_OUTPUT_DIR, 'test-1.0.yaml'),
        releaseDate: '2024-01-01',
        isLatest: false
      },
      {
        version: 'test-2.0',
        yamlPath: join(TEST_OUTPUT_DIR, 'test-2.0.yaml'),
        releaseDate: '2024-02-01',
        isLatest: true
      }
    ];

    for (const v of versions) {
      await createMockYAML(v.yamlPath, [
        { name: 'test-lib-1.0', display_name: 'Test Library' }
      ]);
    }

    const generator = new DataGenerator({
      versions,
      outputDir: TEST_OUTPUT_DIR
    });

    await generator.generate();

    const versionsPath = join(TEST_OUTPUT_DIR, 'versions.json');
    const content = await readFile(versionsPath, 'utf-8');
    const data: VersionsData = JSON.parse(content);

    expect(data.versions).toHaveLength(2);
    expect(data.versions[0].version).toBe('test-1.0');
    expect(data.versions[0].is_latest).toBe(false);
    expect(data.versions[1].version).toBe('test-2.0');
    expect(data.versions[1].is_latest).toBe(true);
  });

  it('should generate version manifests', async () => {
    const versions: VersionConfig[] = [
      {
        version: 'test-1.0',
        yamlPath: join(TEST_OUTPUT_DIR, 'test-1.0.yaml'),
        releaseDate: '2024-01-01',
        isLatest: true
      }
    ];

    await createMockYAML(versions[0].yamlPath, [
      { name: 'test-lib-1.0', display_name: 'Test Library' },
      { name: 'test-lib-2.0', display_name: 'Another Library' }
    ]);

    const generator = new DataGenerator({
      versions,
      outputDir: TEST_OUTPUT_DIR
    });

    await generator.generate();

    const manifestPath = join(TEST_OUTPUT_DIR, 'versions', 'test-1.0.json');
    const content = await readFile(manifestPath, 'utf-8');
    const manifest: VersionManifest = JSON.parse(content);

    expect(manifest.version).toBe('test-1.0');
    expect(manifest.release_date).toBe('2024-01-01');
    expect(manifest.metadata.total_count).toBe(2);
    expect(Object.keys(manifest.instrumentations)).toHaveLength(2);
    expect(manifest.instrumentations['test-lib-1.0']).toBeDefined();
    expect(manifest.instrumentations['test-lib-1.0'].hash).toBeTruthy();
    expect(manifest.instrumentations['test-lib-1.0'].url).toContain('/instrumentations/');
  });

  it('should deduplicate identical instrumentations', async () => {
    const versions: VersionConfig[] = [
      {
        version: 'test-1.0',
        yamlPath: join(TEST_OUTPUT_DIR, 'test-1.0.yaml'),
        releaseDate: '2024-01-01',
        isLatest: false
      },
      {
        version: 'test-2.0',
        yamlPath: join(TEST_OUTPUT_DIR, 'test-2.0.yaml'),
        releaseDate: '2024-02-01',
        isLatest: true
      }
    ];

    // Same instrumentation in both versions
    const sameInstr = { name: 'test-lib-1.0', display_name: 'Test Library' };

    await createMockYAML(versions[0].yamlPath, [sameInstr]);
    await createMockYAML(versions[1].yamlPath, [sameInstr]);

    const generator = new DataGenerator({
      versions,
      outputDir: TEST_OUTPUT_DIR
    });

    await generator.generate();

    // Read both manifests
    const manifest1Path = join(TEST_OUTPUT_DIR, 'versions', 'test-1.0.json');
    const manifest2Path = join(TEST_OUTPUT_DIR, 'versions', 'test-2.0.json');
    
    const manifest1: VersionManifest = JSON.parse(await readFile(manifest1Path, 'utf-8'));
    const manifest2: VersionManifest = JSON.parse(await readFile(manifest2Path, 'utf-8'));

    // Both should reference the same hash
    expect(manifest1.instrumentations['test-lib-1.0'].hash)
      .toBe(manifest2.instrumentations['test-lib-1.0'].hash);

    // Stats should show deduplication
    const stats = generator.getStats();
    expect(stats.uniqueInstrumentations).toBe(1);
    expect(stats.totalInstrumentations).toBe(2);
  });

  it('should track changed instrumentations', async () => {
    const versions: VersionConfig[] = [
      {
        version: 'test-1.0',
        yamlPath: join(TEST_OUTPUT_DIR, 'test-1.0.yaml'),
        releaseDate: '2024-01-01',
        isLatest: false
      },
      {
        version: 'test-2.0',
        yamlPath: join(TEST_OUTPUT_DIR, 'test-2.0.yaml'),
        releaseDate: '2024-02-01',
        isLatest: true
      }
    ];

    await createMockYAML(versions[0].yamlPath, [
      { name: 'test-lib-1.0', display_name: 'Test Library' }
    ]);

    await createMockYAML(versions[1].yamlPath, [
      { name: 'test-lib-1.0', display_name: 'Test Library Updated' } // Changed
    ]);

    const generator = new DataGenerator({
      versions,
      outputDir: TEST_OUTPUT_DIR
    });

    await generator.generate();

    const manifest2Path = join(TEST_OUTPUT_DIR, 'versions', 'test-2.0.json');
    const manifest2: VersionManifest = JSON.parse(await readFile(manifest2Path, 'utf-8'));

    // Second version should show 1 changed instrumentation
    expect(manifest2.metadata.changed_from_previous).toBe(1);

    // Stats should show 2 unique instrumentations
    const stats = generator.getStats();
    expect(stats.uniqueInstrumentations).toBe(2);
  });
});

