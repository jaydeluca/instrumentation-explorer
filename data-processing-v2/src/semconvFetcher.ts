/**
 * Semantic Convention Fetcher
 * Fetches semantic convention definitions from OpenTelemetry GitHub repository
 * and caches them locally to determine if attributes follow conventions
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import YAML from 'yaml';

const BASE_SEMCONV_URL = 'https://api.github.com/repos/open-telemetry/semantic-conventions/contents/model';
const CACHE_DIR = './.semconv_cache';

const ALLOWED_SEMCONV_DIRS = [
  'aws',
  'cassandra',
  'client',
  'cloud',
  'code',
  'container',
  'cpu',
  'db',
  'disk',
  'dns',
  'elasticsearch',
  'enduser',
  'error',
  'event',
  'file',
  'gen-ai',
  'graphql',
  'heroku',
  'host',
  'http',
  'jvm',
  'k8s',
  'linux',
  'log',
  'messaging',
  'network',
  'openai',
  'os',
  'peer',
  'process',
  'rpc',
  'server',
  'service',
  'system',
  'telemetry',
  'thread',
  'tls',
  'url',
];

interface ConventionMappings {
  metrics: Record<string, string>;
  attributes: Record<string, string>;
}

interface GitHubFile {
  name: string;
  download_url: string;
  type: string;
}

interface SemconvYAML {
  groups?: Array<{
    type?: string;
    metric_name?: string;
    prefix?: string;
    attributes?: Array<{
      id?: string;
      ref?: string;
    }>;
  }>;
}

/**
 * Fetches semantic convention mappings from GitHub (with local caching)
 */
export async function fetchConventionMappings(): Promise<ConventionMappings> {
  const mappings: ConventionMappings = {
    metrics: {},
    attributes: {}
  };

  const headers: Record<string, string> = {
    'User-Agent': 'instrumentation-explorer'
  };

  const githubToken = process.env.GITHUB_TOKEN;
  if (githubToken) {
    headers['Authorization'] = `token ${githubToken}`;
  }

  // Ensure cache directory exists
  await mkdir(CACHE_DIR, { recursive: true });

  for (const convType of ALLOWED_SEMCONV_DIRS) {
    const url = `${BASE_SEMCONV_URL}/${convType}`;
    const convTypeCacheDir = join(CACHE_DIR, convType);
    await mkdir(convTypeCacheDir, { recursive: true });

    const dirListingCache = join(convTypeCacheDir, '_directory_listing.json');

    let files: GitHubFile[] = [];

    // Load directory listing from cache if available
    if (existsSync(dirListingCache)) {
      console.log(`Loading directory listing for ${convType} from cache...`);
      const content = await readFile(dirListingCache, 'utf-8');
      files = JSON.parse(content);
    } else {
      try {
        console.log(`Fetching directory listing for ${convType}...`);
        const response = await fetch(url, { headers });
        
        if (!response.ok) {
          console.warn(`Warning: Failed to fetch ${convType}: ${response.statusText}`);
          continue;
        }

        files = await response.json() as GitHubFile[];
        
        // Cache the directory listing
        await writeFile(dirListingCache, JSON.stringify(files, null, 2));
      } catch (error) {
        console.warn(`Warning: Error fetching convention files from ${url}:`, error);
        continue;
      }
    }

    // Process each YAML file in the directory
    for (const file of files) {
      if (!file.name?.endsWith('.yaml')) {
        continue;
      }

      const fileName = file.name;
      const downloadUrl = file.download_url;
      const cacheFilePath = join(convTypeCacheDir, fileName);

      let data: SemconvYAML;

      // Load from cache if available
      if (existsSync(cacheFilePath)) {
        console.log(`Loading ${fileName} from cache...`);
        const content = await readFile(cacheFilePath, 'utf-8');
        data = YAML.parse(content) as SemconvYAML;
      } else {
        try {
          console.log(`Downloading ${fileName}...`);
          const response = await fetch(downloadUrl, { headers });
          
          if (!response.ok) {
            console.warn(`Warning: Failed to download ${fileName}: ${response.statusText}`);
            continue;
          }

          const content = await response.text();
          data = YAML.parse(content) as SemconvYAML;
          
          // Cache the file
          await writeFile(cacheFilePath, content);
        } catch (error) {
          console.warn(`Warning: Error fetching or parsing ${fileName}:`, error);
          continue;
        }
      }

      if (!data || !data.groups) {
        continue;
      }

      // Determine convention name
      let convName = '';
      if (convType === 'db') {
        convName = 'Database Client';
      } else if (convType === 'http') {
        if (fileName.includes('client')) {
          convName = 'HTTP Client';
        } else if (fileName.includes('server')) {
          convName = 'HTTP Server';
        } else {
          convName = 'HTTP';
        }
      } else {
        convName = convType
          .replace(/_/g, ' ')
          .replace(/-/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }

      if (!convName) {
        continue;
      }

      // Extract metrics and attributes from groups
      for (const group of data.groups) {
        // Extract metrics
        if (group.type === 'metric' && group.metric_name) {
          mappings.metrics[group.metric_name] = convName;
        }

        // Extract attributes
        const prefix = group.prefix || '';
        if (group.attributes) {
          for (const attr of group.attributes) {
            let attrName = '';
            
            if (attr.id) {
              attrName = prefix ? `${prefix}.${attr.id}` : attr.id;
            } else if (attr.ref) {
              attrName = attr.ref;
            }

            if (attrName && !mappings.attributes[attrName]) {
              mappings.attributes[attrName] = convName;
            }
          }
        }
      }
    }
  }

  console.log(`✅ Loaded ${Object.keys(mappings.attributes).length} semantic convention attributes`);
  console.log(`✅ Loaded ${Object.keys(mappings.metrics).length} semantic convention metrics`);

  return mappings;
}

/**
 * Checks if an attribute name is in the semantic conventions
 */
export function isSemanticConventionAttribute(
  attributeName: string,
  mappings: ConventionMappings
): boolean {
  return attributeName in mappings.attributes;
}

/**
 * Checks if a metric name is in the semantic conventions
 */
export function isSemanticConventionMetric(
  metricName: string,
  mappings: ConventionMappings
): boolean {
  return metricName in mappings.metrics;
}

