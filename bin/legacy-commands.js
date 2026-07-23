import { spawn } from 'node:child_process';
import path from 'node:path';

const run = (command, args, options = {}) => {
  const child = spawn(command, args, { stdio: 'inherit', ...options });
  child.on('error', error => {
    console.error(error.message);
    process.exitCode = 1;
  });
  child.on('exit', code => {
    process.exitCode = code ?? 1;
  });
};

export const runVite = (engineRoot, args) => {
  const config = path.join(engineRoot, 'vite.config.js');
  run('npx', ['vite', ...args, '--config', config]);
};

export const processContent = engineRoot => {
  run(process.execPath, [path.join(engineRoot, 'bin/process-content.js')]);
};

export const runWorkspace = (engineRoot, command, args) => {
  run(process.execPath, [path.join(engineRoot, 'bin/workspace.js'), command, ...args]);
};
