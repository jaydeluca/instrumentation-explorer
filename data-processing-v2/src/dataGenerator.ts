import { mkdir, writeFile, readFile, access } from 'fs/promises';
import { join, dirname } from 'path';
import { createHash } from 'crypto';
import { contentHash } from './contentHash.js';
import { parseYAML, extractInstrumentations, extractTags, hasTelemetry } from './yamlParser.js';
import { fetchConventionMappings } from './semconvFetcher.js';
import { setSemanticConventionMappings, analyzeMetric, analyzeSpan } from './semconvAnalyzer.js';
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
  private markdownHashToFile = new Map<string, string>();
  private markdownHashToContent = new Map<string, string>();
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
    
    // Fetch semantic convention mappings (with caching)
    console.log('Fetching semantic convention mappings...');
    try {
      const mappings = await fetchConventionMappings();
      setSemanticConventionMappings(mappings);
      console.log('✅ Semantic convention mappings loaded');
    } catch (error) {
      console.warn('Warning: Failed to fetch semantic conventions, continuing without semconv analysis');
      console.warn(error);
    }
    
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
    console.log(`   Total unique markdown files: ${this.markdownHashToFile.size}`);
    console.log(`   Versions processed: ${this.versionManifests.length}`);
  }

  /**
   * Create output directory structure
   */
  private async createDirectories(): Promise<void> {
    const dirs = [
      this.options.outputDir,
      join(this.options.outputDir, 'versions'),
      join(this.options.outputDir, 'instrumentations'),
      join(this.options.outputDir, 'markdown')
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
      // Analyze telemetry for semantic convention compliance
      let analyzedInstr = this.analyzeTelemetry(instr);
      
      // Add markdown content reference if it exists
      analyzedInstr = await this.addMarkdownReference(analyzedInstr, config.version);
      
      const { hash, url, isNew } = this.writeInstrumentation(analyzedInstr);
      versionRefs[instr.id] = { hash, url };
      
      if (isNew) {
        newCount++;
      }
    }

    console.log(`  New/changed instrumentations: ${newCount}`);

    // Create version manifest
    const manifest: VersionManifest = {
      version: config.version,
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
   * Analyze telemetry data for semantic convention compliance
   */
  private analyzeTelemetry(data: InstrumentationData): InstrumentationData {
    if (!data.telemetry) {
      return data;
    }

    const analyzedTelemetry = { ...data.telemetry };

    for (const [when, config] of Object.entries(analyzedTelemetry)) {
      if (config.metrics) {
        analyzedTelemetry[when] = {
          ...config,
          metrics: config.metrics.map(analyzeMetric)
        };
      }
      if (config.spans) {
        analyzedTelemetry[when] = {
          ...analyzedTelemetry[when],
          spans: config.spans.map(analyzeSpan)
        };
      }
    }

    return {
      ...data,
      telemetry: analyzedTelemetry
    };
  }

  /**
   * Add markdown content reference to instrumentation data
   */
  private async addMarkdownReference(data: InstrumentationData, version: string): Promise<InstrumentationData> {
    // Try to find markdown file in data/{version}/library_readme/
    const projectRoot = dirname(dirname(dirname(this.options.outputDir)));
    const markdownPath = join(projectRoot, 'data', version, 'library_readme', `${data.id}.md`);
    
    try {
      await access(markdownPath);
      const markdownContent = await readFile(markdownPath, 'utf-8');
      const { hash, url } = this.writeMarkdown(markdownContent);
      
      return {
        ...data,
        markdown_hash: hash,
        markdown_url: url
      };
    } catch (error) {
      // Markdown file doesn't exist - that's ok
      return data;
    }
  }

  /**
   * Write a markdown file (with deduplication)
   */
  private writeMarkdown(content: string): { hash: string; url: string } {
    const hash = createHash('sha256')
      .update(content)
      .digest('hex')
      .slice(0, 12);
    
    // Check if we already have this content
    if (this.markdownHashToFile.has(hash)) {
      return {
        hash,
        url: this.markdownHashToFile.get(hash)!
      };
    }

    // New content - write file
    const filename = `${hash}.md`;
    const filepath = join('markdown', filename);
    const url = `${this.options.baseUrl}/${filepath}`;
    
    this.markdownHashToFile.set(hash, url);
    this.markdownHashToContent.set(hash, content);

    const fullPath = join(this.options.outputDir, filepath);
    writeFile(fullPath, content, 'utf-8').catch(err => {
      console.error(`Failed to write ${fullPath}:`, err);
    });

    return { hash, url };
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

