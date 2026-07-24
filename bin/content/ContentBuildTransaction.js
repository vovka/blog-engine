import fs from 'node:fs/promises';
import path from 'node:path';

const exists = target => fs.access(target).then(() => true, () => false);

const scopedPath = (root, relative) => {
  const target = path.resolve(root, relative);
  if (path.relative(root, target).startsWith('..')) {
    throw new Error(`Generated output escapes project scope: ${relative}`);
  }
  return target;
};

export class ContentBuildTransaction {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.stateRoot = path.join(projectRoot, '.geek-blog');
    this.contentStage = path.join(this.stateRoot, `content-next-${process.pid}`);
    this.backupRoot = path.join(this.stateRoot, `build-backup-${process.pid}`);
  }

  async commit(mermaidStage, generatedModules) {
    const operations = await this.#stage(mermaidStage, generatedModules);
    const backups = [];
    const promoted = [];
    let removeBackup = false;
    try {
      await this.#backup(operations, backups);
      await this.#promote(operations, promoted);
      removeBackup = true;
    } catch (error) {
      try {
        await this.#rollback(backups, promoted);
        removeBackup = true;
      } catch (rollbackError) {
        throw new AggregateError(
          [error, rollbackError],
          `Build promotion failed; recovery files remain in ${this.backupRoot}`,
        );
      }
      throw error;
    } finally {
      await this.#cleanup(removeBackup);
    }
  }

  async #stage(mermaidStage, generatedModules) {
    await fs.rm(this.contentStage, { recursive: true, force: true });
    await fs.mkdir(this.contentStage, { recursive: true });
    const operations = [{
      stage: mermaidStage,
      target: path.join(this.stateRoot, 'mermaid'),
      backup: path.join(this.backupRoot, '.geek-blog', 'mermaid'),
    }];
    for (const [relative, content] of Object.entries(generatedModules)) {
      const stage = scopedPath(this.contentStage, relative);
      await fs.mkdir(path.dirname(stage), { recursive: true });
      await fs.writeFile(stage, content);
      operations.push({
        stage,
        target: scopedPath(this.projectRoot, relative),
        backup: scopedPath(this.backupRoot, relative),
      });
    }
    return operations;
  }

  async #backup(operations, backups) {
    await fs.rm(this.backupRoot, { recursive: true, force: true });
    await fs.mkdir(this.backupRoot, { recursive: true });
    for (const operation of operations) {
      if (!await exists(operation.target)) continue;
      await fs.mkdir(path.dirname(operation.backup), { recursive: true });
      await fs.rename(operation.target, operation.backup);
      backups.push(operation);
    }
  }

  async #promote(operations, promoted) {
    for (const operation of operations) {
      await fs.mkdir(path.dirname(operation.target), { recursive: true });
      await fs.rename(operation.stage, operation.target);
      promoted.push(operation);
    }
  }

  async #rollback(backups, promoted) {
    for (const operation of promoted.reverse()) {
      await fs.rm(operation.target, { recursive: true, force: true });
    }
    for (const operation of backups.reverse()) {
      await fs.rename(operation.backup, operation.target);
    }
  }

  async #cleanup(removeBackup) {
    await fs.rm(this.contentStage, { recursive: true, force: true });
    if (removeBackup) await fs.rm(this.backupRoot, { recursive: true, force: true });
  }
}
