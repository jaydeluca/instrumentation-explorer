import { mkdir, writeFile, readFile, readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { createHash } from 'crypto';
import { contentHash, createFilename, contentHashString } from './contentHash.js';
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

      const { hash, url, filename, isNew } = this.writeInstrumentation(analyzedInstr);
      versionRefs[instr.id] = { hash, url, filename };
      
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
    const projectRoot = dirname(dirname(dirname(this.options.outputDir)));
    const sharedReadmeDir = join(projectRoot, 'data', 'library_readme');

    try {
      // Look for files matching pattern: {id}-{hash}.md
      const files = await readdir(sharedReadmeDir);
      const pattern = new RegExp(`^${data.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-([0-9a-f]{12})\\.md$`);

      for (const file of files) {
        const match = file.match(pattern);
        if (match) {
          // Found matching README
          const readmePath = join(sharedReadmeDir, file);
          const markdownContent = await readFile(readmePath, 'utf-8');
          const hash = match[1]; // Extract hash from filename

          // Write to frontend markdown directory (with ID prefix)
          const { url } = this.writeMarkdown(markdownContent, data.id, hash);

          return {
            ...data,
            markdown_hash: hash,
            markdown_url: url
          };
        }
      }
    } catch (error) {
      // Shared directory doesn't exist or no matching file - that's ok
    }

    // No README found for this instrumentation
    return data;
  }

  /**
   * Write a markdown file (with deduplication)
   * @param content Markdown content
   * @param id Instrumentation ID for filename prefix
   * @param hash Content hash (if already computed)
   */
  private writeMarkdown(content: string, id: string, hash?: string): { hash: string; url: string } {
    // Use provided hash or compute it
    const contentHash = hash || contentHashString(content);

    // Check if we already have this content
    if (this.markdownHashToFile.has(contentHash)) {
      return {
        hash: contentHash,
        url: this.markdownHashToFile.get(contentHash)!
      };
    }

    // New content - write file with ID prefix
    const filename = createFilename(id, contentHash, 'md');
    const filepath = join('markdown', filename);
    const url = `${this.options.baseUrl}/${filepath}`;

    this.markdownHashToFile.set(contentHash, url);
    this.markdownHashToContent.set(contentHash, content);

    const fullPath = join(this.options.outputDir, filepath);
    writeFile(fullPath, content, 'utf-8').catch(err => {
      console.error(`Failed to write ${fullPath}:`, err);
    });

    return { hash: contentHash, url };
  }

  /**
   * Write an instrumentation file (with deduplication)
   */
  private writeInstrumentation(data: InstrumentationData): HashMapping & { isNew: boolean; filename: string } {
    const hash = contentHash(data);
    const filename = createFilename(data.id, hash, 'json');
    const filepath = join('instrumentations', filename);
    const url = `${this.options.baseUrl}/${filepath}`;

    // Check if we already have this exact file
    if (this.hashToFile.has(hash)) {
      return {
        hash,
        url: this.hashToFile.get(hash)!,
        data,
        filename,
        isNew: false
      };
    }

    // New content - write file
    this.hashToFile.set(hash, url);
    this.hashToData.set(hash, data);

    const fullPath = join(this.options.outputDir, filepath);
    writeFile(fullPath, JSON.stringify(data, null, 2)).catch(err => {
      console.error(`Failed to write ${fullPath}:`, err);
    });

    return { hash, url, data, filename, isNew: true };
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

