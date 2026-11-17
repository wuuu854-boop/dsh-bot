const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const client = process.argv[2] || path.join(root, 'client.js');
for (const file of [path.join(root, 'index.js'), client, ...['background.js', 'content.js', 'inject.js'].map(name => path.join(root, 'browser-extension/icve-assistant', name))]) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.error?.message);
}
for (const initial of [null, 'old-build']) {
  const values = new Map(initial ? [['dshbot.build', initial]] : []);
  let registrations = 0;
  const window = {
    localStorage: { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) },
    location: { reload() { reloads++; } },
    __ModuleLoader__: { load(module) { assert.equal(module.id, '@local/dsh-bot'); assert.equal(typeof module.factory, 'function'); registrations++; } },
  };
  let reloads = 0;
  vm.runInNewContext(fs.readFileSync(client, 'utf8'), { window }, { timeout: 1000 });
  assert.equal(registrations, 1, 'Client must register exactly once');
  assert.equal(reloads, 0, 'Plugin must not reload the desktop during module activation');
}

const packageVersion = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;
const indexVersion = /const VERSION = '([^']+)'/.exec(fs.readFileSync(path.join(root, 'index.js'), 'utf8'))?.[1];
const clientVersions = [...fs.readFileSync(client, 'utf8').matchAll(/version:\s*'([0-9]+\.[0-9]+\.[0-9]+)'/g)].map(match => match[1]);
assert.ok(indexVersion, 'index.js must declare VERSION');
assert.equal(indexVersion, packageVersion, 'index.js VERSION must match package.json');
assert.ok(clientVersions.length > 0, 'client.js must expose diagnostic version');
for (const version of clientVersions) {
  assert.equal(version, packageVersion, 'client.js diagnostic version must match package.json');
}
const clientSource = fs.readFileSync(client, 'utf8');
const templateStart = clientSource.indexOf('const applyTemplate = (template) => {');
const templateEnd = clientSource.indexOf('      useEffect(', templateStart);
assert.ok(templateStart > 0 && templateEnd > templateStart);
let renderedTemplate = '';
const scriptDirectory = 'E:\\Bot Project\\scripts';
vm.runInNewContext(`${clientSource.slice(templateStart, templateEnd)}; applyTemplate({prompt: 'course'})`, {
  value: '',
  t: () => 'python scripts/icve_snapshot.py course; python scripts/icve_quiz.py --auto --dry-run; course.py play',
  paths: { python: 'E:\\Python Runtime\\python.exe', scripts: scriptDirectory },
  onChange: value => { renderedTemplate = value; },
  setTemplatesOpen() {}, requestAnimationFrame() {},
});
for (const name of ['icve_snapshot.py', 'icve_quiz.py', 'course.py']) {
  assert.ok(renderedTemplate.includes(`"${scriptDirectory}\\${name}"`), `${name} must resolve outside the plugin directory`);
}
assert.ok(!renderedTemplate.includes('scripts/'));
console.log(`PASS: server/client syntax, activation, template paths and version ${packageVersion}`);
