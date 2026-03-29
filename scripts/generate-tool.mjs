#!/usr/bin/env node
/**
 * Minimal scaffold helper: copies template files into src/tools/<toolId>/
 * Usage: node scripts/generate-tool.mjs <toolId>
 */
import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const toolId = process.argv[2];

if (!toolId || !/^[a-z0-9-]+$/.test(toolId)) {
  console.error('Usage: node scripts/generate-tool.mjs <tool-id>');
  process.exit(1);
}

const destDir = join(root, 'src', 'tools', toolId);
if (existsSync(destDir)) {
  console.error(`Already exists: ${destDir}`);
  process.exit(1);
}

mkdirSync(destDir, { recursive: true });

const templateDir = join(root, 'tools', 'scaffold-template');
copyFileSync(join(templateDir, 'tool-definition.json'), join(destDir, 'tool-definition.json'));
copyFileSync(join(templateDir, 'compliance-checklist.md'), join(destDir, 'compliance-checklist.md'));

console.log(`Created ${destDir}`);
console.log('Next: add a standalone component and register it in tool-component.registry.ts');
