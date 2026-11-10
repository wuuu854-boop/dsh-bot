const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const client = process.argv[2] || path.join(root, 'client.js');
for (const file of [path.join(root, 'index.js'), client]) {
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
console.log('PASS: server/client syntax; fresh/stale client activates without hard reload');
