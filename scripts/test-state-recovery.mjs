import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { apply } from '../index.js'

for (const [reason, primary] of [['truncated JSON', '{'], ['missing threads', '{}']]) {
  test(`recovers the latest usable backup when state.json has ${reason}`, (t) => {
    t.mock.timers.enable({ apis: ['setTimeout', 'setInterval'] })
    const tempRoot = path.resolve(os.tmpdir())
    const home = fs.mkdtempSync(path.join(tempRoot, 'dsh-bot-recovery-'))
    const previousHome = process.env.DSH_HOME
    t.after(() => {
      if (previousHome === undefined) delete process.env.DSH_HOME
      else process.env.DSH_HOME = previousHome
      assert.equal(path.dirname(home), tempRoot)
      fs.rmSync(home, { recursive: true, force: true })
    })
    process.env.DSH_HOME = home

    const dir = path.join(home, 'storages', 'dsh-bot')
    const stateFile = path.join(dir, 'state.json')
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(stateFile, primary)
    const backups = {
      'state-backup-1700000000000.json': JSON.stringify({ threads: [{ id: 'older', sessionId: 'one' }] }),
      'state-backup-1700000001000.json': JSON.stringify({ threads: [{ id: 'recovered', sessionId: 'two' }] }),
      'state-backup-1700000002000.json': '{',
      'state-backup-1700000003000.json': '{}',
    }
    for (const [name, body] of Object.entries(backups)) fs.writeFileSync(path.join(dir, name), body)

    apply({
      get: () => undefined,
      effect: () => {},
      on: () => () => {},
      webServer: { getOrigin: () => 'http://127.0.0.1:0', register: () => () => {} },
    })

    const restored = JSON.parse(fs.readFileSync(stateFile, 'utf8'))
    assert.deepEqual(restored.threads.map((thread) => thread.id), ['recovered'])
    assert.deepEqual(fs.readdirSync(dir).filter((name) => name.startsWith('state-backup-')).sort(), Object.keys(backups))
  })
}
