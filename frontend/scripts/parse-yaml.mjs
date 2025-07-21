
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';

const yamlFilePath = path.resolve('../instrumentation-list-2.17.yaml');
const jsonFilePath = path.resolve('src/instrumentation-list.json');

try {
  const fileContents = fs.readFileSync(yamlFilePath, 'utf8');
  const data = yaml.load(fileContents);
  fs.writeFileSync(jsonFilePath, JSON.stringify(data, null, 2));
  console.log('Successfully converted YAML to JSON.');
} catch (e) {
  console.error(e);
}
