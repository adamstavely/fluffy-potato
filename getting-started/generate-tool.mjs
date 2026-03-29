#!/usr/bin/env node
/**
 * Scaffolds metadata files under src/app/tools/<category>/<tool-id>/.
 * Usage: node getting-started/generate-tool.mjs <category> <tool-id>
 *        npm run generate-tool -- <category> <tool-id>
 */
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const TOOL_CATEGORIES = [
  'language',
  'data',
  'identity',
  'financial',
  'productivity',
];

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const category = process.argv[2];
const toolId = process.argv[3];

if (!category || !toolId || !TOOL_CATEGORIES.includes(category)) {
  console.error(
    `Usage: node getting-started/generate-tool.mjs <category> <tool-id>\n` +
      `  category: ${TOOL_CATEGORIES.join(', ')}\n` +
      `  tool-id: must match ^[a-z0-9-]+$`,
  );
  process.exit(1);
}

if (!/^[a-z0-9-]+$/.test(toolId)) {
  console.error('tool-id must match ^[a-z0-9-]+$ (lowercase letters, digits, hyphens).');
  process.exit(1);
}

const destDir = join(root, 'src', 'app', 'tools', category, toolId);
if (existsSync(destDir)) {
  console.error(`Already exists: ${destDir}`);
  process.exit(1);
}

mkdirSync(destDir, { recursive: true });

const templateDir = join(__dirname, 'scaffold-template');
const templatePath = join(templateDir, 'tool-definition.json');
const data = JSON.parse(readFileSync(templatePath, 'utf8'));
data.id = toolId;
data.category = category;
writeFileSync(join(destDir, 'tool-definition.json'), JSON.stringify(data, null, 2) + '\n');

console.log(`Created ${destDir}`);
console.log(
  `Next: add ${toolId}-tool.component.ts, register in tool-component.registry.ts, icons, and tools-registry.json.`,
);
