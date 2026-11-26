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
assert.match(rule('.gb-toast'), /pointer-events:\s*none/)
assert.match(rule('.gb-toast-close'), /pointer-events:\s*auto/)
assert.match(source, /useEffect\(\(\) => \{[\s\S]*?setStick\(true\)[\s\S]*?\}, \[threadId, booted\]\)/)
assert.match(source, /setPending\([\s\S]{0,220}setStick\(true\)/, 'sending must return to the live edge')
assert.match(source, /className: 'gb-deck-backdrop'/, 'narrow Deck must expose a backdrop close target')
assert.match(source, /className: 'gb-rail-backdrop'/, 'narrow rail must expose a backdrop close target')
assert.match(source, /discardChanges:/, 'unsaved-change copy must exist')
assert.match(source, /const requestClose = \(\) => \{/, 'editors must guard unsaved close')
assert.match(source, /gb-modal-body', onChange: \(\) => setDirty\(true\)/)
assert.match(source, /const requestCloseEditor = \(\) => \{/, 'routine editor must guard unsaved close')
assert.match(source, /gb-routine-form', onChange: \(\) => setRoutineDirty\(true\)/)
assert.match(source, /settingsLoadFailed:|settingsRetry:/, 'settings load failure must be actionable')
assert.match(source, /memoryLoadFailed:|memoryRetry:/, 'memory load failure must be actionable')
assert.match(source, /searchFailed:/, 'search failure copy must exist')
assert.match(source, /setSearchError\(/, 'search failure must not masquerade as empty results')
assert.match(source, /disabled: busy \|\| !dirty/, 'settings save must require a pending edit')
assert.doesNotMatch(source, /max-width:\s*1020px/, 'rail breakpoint must use the 1100px value')

const rail1100 = source.indexOf('@media (max-width: 1100px)')
assert.ok(rail1100 >= 0, '1100px rail breakpoint must exist')
const mobileRail = source.slice(rail1100)
assert.match(mobileRail, /\.gb-rail\s*\{[^}]*position:\s*fixed/)

const deck1500 = source.indexOf('@media (max-width: 1500px)')
const deck1280 = source.indexOf('@media (max-width: 1280px)')
assert.ok(deck1500 >= 0 && deck1280 > deck1500, '1500px deck rules must precede 1280px overrides')

const deck760 = source.indexOf('@media (max-width: 760px)')
const mobileDeck = source.slice(deck760)
assert.match(mobileDeck, /\.gb-deck-backdrop\s*\{[^}]*display:\s*block/)

console.log('PASS: UX layout guards (latest-jump, toast clearance, deck breakpoint order)')
