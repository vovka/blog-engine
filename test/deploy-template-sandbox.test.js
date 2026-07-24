import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const workflow = fs.readFileSync(new URL('../templates/deploy.yml', import.meta.url), 'utf8');
const sandboxStart = workflow.indexOf('- name: Configure Chrome sandbox');
const processingStart = workflow.indexOf('- name: Process markdown posts');
const sandboxStep = workflow.slice(sandboxStart, processingStart);

test('configures the downloaded Chrome setuid sandbox before processing', () => {
  assert.ok(sandboxStart >= 0, 'missing Chrome sandbox step');
  assert.ok(processingStart > sandboxStart, 'sandbox must precede content processing');
  assert.match(
    sandboxStep,
    /find "\$HOME\/\.cache\/puppeteer" -type f -name chrome_sandbox -print -quit/,
  );
  assert.match(sandboxStep, /test -n "\$sandbox_path"/);
  assert.match(
    sandboxStep,
    /sudo cp -p "\$sandbox_path" \/usr\/local\/sbin\/chrome-devel-sandbox/,
  );
  assert.match(sandboxStep, /sudo chown root:root \/usr\/local\/sbin\/chrome-devel-sandbox/);
  assert.match(sandboxStep, /sudo chmod 4755 \/usr\/local\/sbin\/chrome-devel-sandbox/);
  assert.match(
    sandboxStep,
    /CHROME_DEVEL_SANDBOX=\/usr\/local\/sbin\/chrome-devel-sandbox.*"\$GITHUB_ENV"/,
  );
});

test('does not bypass Chromium sandbox selection', () => {
  assert.doesNotMatch(workflow, /--no-sandbox/);
  assert.doesNotMatch(workflow, /PUPPETEER_EXECUTABLE_PATH/);
});
