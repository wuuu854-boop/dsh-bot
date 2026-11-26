const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const source = fs.readFileSync(path.join(root, 'client.js'), 'utf8')

function rule(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = new RegExp(`^${escaped}\\s*\\{([^}]*)\\}`, 'm').exec(source)
  assert.ok(match, `${selector} must have a CSS rule`)
  return match[1]
}

assert.match(rule('.gb-chat-view'), /position:\s*relative/)
assert.match(rule('.gb-chat-view'), /flex:\s*1/)
assert.match(rule('.gb-jump'), /position:\s*absolute/)
assert.match(rule('.gb-jump'), /bottom:\s*14px/)
assert.doesNotMatch(rule('.gb-jump'), /bottom:\s*134px/)
assert.match(rule('.gb-toast'), /bottom:\s*96px/)
assert.match(source, /useEffect\(\(\) => \{[\s\S]*?setStick\(true\)[\s\S]*?\}, \[threadId, booted\]\)/)

const deck1500 = source.indexOf('@media (max-width: 1500px)')
const deck1280 = source.indexOf('@media (max-width: 1280px)')
assert.ok(deck1500 >= 0 && deck1280 > deck1500, '1500px deck rules must precede 1280px overrides')

console.log('PASS: UX layout guards (latest-jump, toast clearance, deck breakpoint order)')
