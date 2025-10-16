import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { detectVersions, getLatestVersion, getRecentVersions } from '../src/versionDetector.js';

const TEST_REPO_DIR = join(process.cwd(), 'tests', 'test-repo');

describe('versionDetector', () => {
  beforeEach(async () => {
    await rm(TEST_REPO_DIR, { recursive: true, force: true });
    await mkdir(TEST_REPO_DIR, { recursive: true });
  });

  afterEach(async () => {
    await rm(TEST_REPO_DIR, { recursive: true, force: true });
  });

  async function createYamlFile(version: string) {
    const filename = `instrumentation-list-${version}.yaml`;
    const filepath = join(TEST_REPO_DIR, filename);
    await writeFile(filepath, `file_format: 0.1\nlibraries: {}`);
  }

  describe('detectVersions', () => {
    it('should detect versions from YAML files', async () => {
      await createYamlFile('2.18.0');
      await createYamlFile('2.19.0');
      await createYamlFile('2.20.0');

      const versions = await detectVersions(TEST_REPO_DIR);

      expect(versions).toHaveLength(3);
      expect(versions.map(v => v.version)).toEqual(['2.18.0', '2.19.0', '2.20.0']);
    });

    it('should mark the latest stable version', async () => {
      await createYamlFile('2.18.0');
      await createYamlFile('2.19.0');
      await createYamlFile('2.20.0');

      const versions = await detectVersions(TEST_REPO_DIR);

      expect(versions.find(v => v.version === '2.20.0')?.isLatest).toBe(true);
      expect(versions.find(v => v.version === '2.19.0')?.isLatest).toBe(false);
    });

    it('should sort versions in semantic order', async () => {
      await createYamlFile('2.20.0');
      await createYamlFile('2.8.0');
      await createYamlFile('2.19.0');

      const versions = await detectVersions(TEST_REPO_DIR);

      expect(versions.map(v => v.version)).toEqual(['2.8.0', '2.19.0', '2.20.0']);
    });

    it('should handle 3.0 version specially', async () => {
      await createYamlFile('2.19.0');
      await createYamlFile('2.20.0');
      await createYamlFile('3.0');

      const versions = await detectVersions(TEST_REPO_DIR);

      // 3.0 should be sorted last
      expect(versions.map(v => v.version)).toEqual(['2.19.0', '2.20.0', '3.0']);
      
      // Latest should be 2.20.0, not 3.0
      expect(versions.find(v => v.isLatest)?.version).toBe('2.20.0');
    });

    it('should return empty array when no YAML files exist', async () => {
      const versions = await detectVersions(TEST_REPO_DIR);
      expect(versions).toHaveLength(0);
    });

    it('should include full path to YAML file', async () => {
      await createYamlFile('2.20.0');

      const versions = await detectVersions(TEST_REPO_DIR);

      expect(versions[0].yamlPath).toBe(join(TEST_REPO_DIR, 'instrumentation-list-2.20.0.yaml'));
    });
  });

  describe('getLatestVersion', () => {
    it('should return the latest stable version', async () => {
      await createYamlFile('2.18.0');
      await createYamlFile('2.19.0');
      await createYamlFile('2.20.0');

      const latest = await getLatestVersion(TEST_REPO_DIR);

      expect(latest?.version).toBe('2.20.0');
      expect(latest?.isLatest).toBe(true);
    });

    it('should exclude 3.0 from latest', async () => {
      await createYamlFile('2.20.0');
      await createYamlFile('3.0');

      const latest = await getLatestVersion(TEST_REPO_DIR);

      expect(latest?.version).toBe('2.20.0');
    });

    it('should return null when no files exist', async () => {
      const latest = await getLatestVersion(TEST_REPO_DIR);
      expect(latest).toBeNull();
    });
  });

  describe('getRecentVersions', () => {
    it('should return N most recent versions', async () => {
      await createYamlFile('2.17.0');
      await createYamlFile('2.18.0');
      await createYamlFile('2.19.0');
      await createYamlFile('2.20.0');

      const recent = await getRecentVersions(TEST_REPO_DIR, 2);

      expect(recent).toHaveLength(2);
      expect(recent.map(v => v.version)).toEqual(['2.19.0', '2.20.0']);
    });

    it('should exclude 3.0 by default', async () => {
      await createYamlFile('2.19.0');
      await createYamlFile('2.20.0');
      await createYamlFile('3.0');

      const recent = await getRecentVersions(TEST_REPO_DIR, 2);

      expect(recent.map(v => v.version)).toEqual(['2.19.0', '2.20.0']);
    });

    it('should include 3.0 when requested', async () => {
      await createYamlFile('2.19.0');
      await createYamlFile('2.20.0');
      await createYamlFile('3.0');

      const recent = await getRecentVersions(TEST_REPO_DIR, 3, true);

      expect(recent.map(v => v.version)).toEqual(['2.19.0', '2.20.0', '3.0']);
    });

    it('should handle when fewer versions exist than requested', async () => {
      await createYamlFile('2.20.0');

      const recent = await getRecentVersions(TEST_REPO_DIR, 5);

      expect(recent).toHaveLength(1);
      expect(recent[0].version).toBe('2.20.0');
    });
  });
});




