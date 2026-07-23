#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { executeWorkspaceCommand } from './workspace/commands.js';

const engineRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const [command, ...args] = process.argv.slice(2);

if (!command) {
  console.error('Usage: blog-engine workspace <setup|dev|build|process|preview|enhance|doctor|update>');
  process.exit(1);
}

try {
  await executeWorkspaceCommand(command, args, process.cwd(), engineRoot);
} catch (error) {
  console.error(`Workspace error: ${error.message}`);
  process.exit(1);
}
