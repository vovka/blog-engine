import { spawnSync } from 'node:child_process';

const formatCommand = (command, args) => [command, ...args].join(' ');

export const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    env: options.env || process.env,
    encoding: 'utf8',
    stdio: options.capture ? 'pipe' : 'inherit',
  });
  if (result.status === 0) return options.capture ? result.stdout.trim() : '';
  const detail = options.capture ? (result.stderr || result.stdout).trim() : '';
  throw new Error(`${formatCommand(command, args)} failed.${detail ? ` ${detail}` : ''}`);
};

export const commandExists = command => {
  const probe = process.platform === 'win32' ? ['where', [command]] : ['command', ['-v', command]];
  const result = spawnSync(probe[0], probe[1], { shell: process.platform !== 'win32' });
  return result.status === 0;
};
