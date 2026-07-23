import { runDoctor } from './doctor.js';
import { setupEnhancer } from './enhancer.js';
import { loadLock, updatePins } from './lock.js';
import { run } from './process.js';
import { validatePrerequisites } from './prerequisites.js';
import { prepareWorkspace } from './setup.js';
import { parsePinChanges, updateWorkspace } from './update.js';

const runEngine = (bin, command, options = {}) => run(
  process.execPath,
  [bin, command],
  { cwd: options.cwd, env: options.env },
);

const processContent = (bin, projectRoot, strict = false) => runEngine(bin, 'process', {
  cwd: projectRoot,
  env: strict ? { ...process.env, GEEK_BLOG_STRICT_CONFIG: '1' } : process.env,
});

const runPrepared = (command, projectRoot, lock, engineRoot) => {
  const bin = prepareWorkspace(projectRoot, lock, engineRoot);
  if (command === 'process') return processContent(bin, projectRoot);
  if (command === 'build') {
    processContent(bin, projectRoot, true);
    return runEngine(bin, 'build', { cwd: projectRoot });
  }
  if (command === 'dev') {
    processContent(bin, projectRoot);
    return runEngine(bin, 'dev', { cwd: projectRoot });
  }
  return runEngine(bin, command, { cwd: projectRoot });
};

export const executeWorkspaceCommand = (command, args, projectRoot, engineRoot) => {
  let lock = loadLock(projectRoot);
  if (command === 'setup') return prepareWorkspace(projectRoot, lock, engineRoot);
  if (command === 'doctor') return runDoctor(projectRoot, lock, engineRoot);
  if (command === 'update') {
    const changes = parsePinChanges(args);
    validatePrerequisites();
    lock = updatePins(projectRoot, changes);
    return updateWorkspace(projectRoot, lock, engineRoot, changes);
  }
  if (command === 'enhance') {
    prepareWorkspace(projectRoot, lock, engineRoot);
    const bin = setupEnhancer(projectRoot, lock);
    return run(process.execPath, [bin, 'enhance', ...args], { cwd: projectRoot });
  }
  if (['dev', 'build', 'process', 'preview'].includes(command)) {
    return runPrepared(command, projectRoot, lock, engineRoot);
  }
  throw new Error(`Unknown workspace command: ${command}.`);
};
