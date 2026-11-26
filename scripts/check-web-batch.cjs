const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const script = fs.readFileSync(path.join(root, 'scripts', 'web_batch.py'), 'utf8')
const helper = path.join(root, 'scripts', 'address_exec.ps1')

assert.match(script, /javascript:void\(eval\(atob/, 'batch must execute through a void javascript URL')
assert.match(script, /ord\(ch\) < 128/, 'base64 payload must be ASCII-escaped before eval')
assert.match(script, /children\.length===0/, 'question header matching must prefer leaf headers')
assert.match(script, /scrollDelta/, 'batch must report scroll delta')
assert.ok(fs.existsSync(helper), 'address bar helper must exist')
assert.match(fs.readFileSync(helper, 'utf8'), /ValuePattern/, 'address helper must set the address bar')

console.log('PASS: no-scroll DOM batch guards')
