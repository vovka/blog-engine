#!/usr/bin/env node
import { Command } from 'commander';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeBlog } from './init-blog.js';
import { processContent, runVite, runWorkspace } from './legacy-commands.js';

const engineRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const program = new Command();

program.name('blog-engine').description('CLI for Geek Blog Engine').version('1.0.0');

program.command('init')
  .description('Initialize a blog content repository')
  .action(() => initializeBlog(engineRoot));

program.command('process')
  .description('Process Markdown content')
  .action(() => processContent(engineRoot));

program.command('dev')
  .description('Start the development server')
  .action(() => runVite(engineRoot, []));

program.command('build')
  .description('Build the static site')
  .action(() => runVite(engineRoot, ['build']));

program.command('preview')
  .description('Preview the static build')
  .action(() => runVite(engineRoot, ['preview']));

program.command('workspace <workspace-command> [args...]')
  .allowUnknownOption()
  .description('Run the pinned Yalc workspace workflow')
  .action((command, args = []) => runWorkspace(engineRoot, command, args));

program.parse();
