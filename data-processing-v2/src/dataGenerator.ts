import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { contentHash } from './contentHash.js';
import { parseYAML, extractInstrumentations, extractTags, hasTelemetry } from './yamlParser.js';
import {
  InstrumentationData,
  IndexData,
  IndexInstrumentation,
  VersionsData,
  VersionInfo,
  VersionManifest,
  InstrumentationReference,
  HashMapping
} from './types.js';

export interface VersionConfig {
  version: string;
  yamlPath: string;
  releaseDate: string;
  isLatest: boolean;
}

export interface GeneratorOptions {
  versions: VersionConfig[];
  outputDir: string;
  baseUrl?: string;
}

export class DataGenerator {
  private hashToFile = new Map<string, string>();
  private hashToData = new Map<string, InstrumentationData>();
  private versionManifests: VersionManifest[] = [];
  private options: GeneratorOptions;

  constructor(options: GeneratorOptions) {
    this.options = {
      ...options,
      baseUrl: options.baseUrl || '/data'
    };
  }

  /**
   * Main generation process
   */
  async generate(): Promise<void> {
    console.log('Starting data generation...');
    
    // Create output directories
    await this.createDirectories();

    // Process each version
    for (const versionConfig of this.options.versions) {
      console.log(`Processing version ${versionConfig.version}...`);
      await this.processVersion(versionConfig);
    }

    // Generate index.json (lightweight)
    console.log('Generating index.json...');
    await this.generateIndex();

    // Generate versions.json
    console.log('Generating versions.json...');
    await this.generateVersionsList();

    console.log(`✅ Generation complete! Output in: ${this.options.outputDir}`);
    console.log(`   Total unique instrumentations: ${this.hashToFile.size}`);
    console.log(`   Versions processed: ${this.versionManifests.length}`);
  }

  /**
   * Create output directory structure
   */
  private async createDirectories(): Promise<void> {
    const dirs = [
      this.options.outputDir,
      join(this.options.outputDir, 'versions'),
      join(this.options.outputDir, 'instrumentations')
    ];

    for (const dir of dirs) {
      await mkdir(dir, { recursive: true });
    }
  }

  /**
   * Process a single version
   */
  private async processVersion(config: VersionConfig): Promise<void> {
    const yamlData = await parseYAML(config.yamlPath);
    const instrumentations = extractInstrumentations(yamlData);

    console.log(`  Found ${instrumentations.length} instrumentations`);

    // Track which instrumentations are in this version
    const versionRefs: Record<string, InstrumentationReference> = {};
    let newCount = 0;

    for (const instr of instrumentations) {
      const { hash, url, isNew } = this.writeInstrumentation(instr);
      versionRefs[instr.id] = { hash, url };
      
      if (isNew) {
        newCount++;
      }
    }

    console.log(`  New/changed instrumentations: ${newCount}`);

    // Create version manifest
    const manifest: VersionManifest = {
      version: config.version,
      release_date: config.releaseDate,
      agent_version: config.version,
      instrumentations: versionRefs,
      metadata: {
        total_count: instrumentations.length,
        changed_from_previous: this.versionManifests.length > 0 ? newCount : undefined
      }
    };

    this.versionManifests.push(manifest);

    const manifestPath = join(this.options.outputDir, 'versions', `${config.version}.json`);
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  }

  /**
   * Write an instrumentation file (with deduplication)
   */
  private writeInstrumentation(data: InstrumentationData): HashMapping & { isNew: boolean } {
    const hash = contentHash(data);
    
    // Check if we already have this content
    if (this.hashToFile.has(hash)) {
      return {
        hash,
        url: this.hashToFile.get(hash)!,
        data,
        isNew: false
      };
    }

    // New content - write file
    const filename = `${hash}.json`;
    const filepath = join('instrumentations', filename);
    const url = `${this.options.baseUrl}/${filepath}`;
    
    this.hashToFile.set(hash, url);
    this.hashToData.set(hash, data);

    const fullPath = join(this.options.outputDir, filepath);
    writeFile(fullPath, JSON.stringify(data, null, 2)).catch(err => {
      console.error(`Failed to write ${fullPath}:`, err);
    });

    return { hash, url, data, isNew: true };
  }

  /**
   * Generate index.json (lightweight for initial load)
   */
  private async generateIndex(): Promise<void> {
    // Use the latest version's instrumentations for the index
    const latestManifest = this.versionManifests.find(m => {
      const config = this.options.versions.find(v => v.version === m.version);
      return config?.isLatest;
    });

    if (!latestManifest) {
      throw new Error('No latest version found');
    }

    const indexInstrumentations: IndexInstrumentation[] = [];

    for (const [id, ref] of Object.entries(latestManifest.instrumentations)) {
      const data = this.hashToData.get(ref.hash);
      
      if (!data) {
        console.warn(`Warning: No data found for hash ${ref.hash} (${id})`);
        continue;
      }

      indexInstrumentations.push({
        id: data.id,
        display_name: data.display_name,
        library_group: data.library_group,
        description: data.description,
        tags: extractTags(data),
        semantic_conventions: data.semantic_conventions,
        features: data.features,
        has_telemetry: hasTelemetry(data)
      });
    }

    const indexData: IndexData = {
      generated_at: new Date().toISOString(),
      latest_version: latestManifest.version,
      instrumentations: indexInstrumentations
    };

    const indexPath = join(this.options.outputDir, 'index.json');
    await writeFile(indexPath, JSON.stringify(indexData, null, 2));
  }

  /**
   * Generate versions.json
   */
  private async generateVersionsList(): Promise<void> {
    const versions: VersionInfo[] = this.options.versions.map(config => ({
      version: config.version,
      release_date: config.releaseDate,
      manifest_url: `${this.options.baseUrl}/versions/${config.version}.json`,
      is_latest: config.isLatest
    }));

    const versionsData: VersionsData = { versions };

    const versionsPath = join(this.options.outputDir, 'versions.json');
    await writeFile(versionsPath, JSON.stringify(versionsData, null, 2));
  }

  /**
   * Get generation statistics
   */
  getStats() {
    return {
      uniqueInstrumentations: this.hashToFile.size,
      versionsProcessed: this.versionManifests.length,
      totalInstrumentations: this.versionManifests.reduce(
        (sum, m) => sum + m.metadata.total_count,
        0
      )
    };
  }
}

