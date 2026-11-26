const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const driver = fs.readFileSync(path.join(root, 'scripts', 'browser_driver.py'), 'utf8')

assert.match(driver, /playwright\.sync_api/, 'driver must use Playwright sync API')
assert.match(driver, /choice_browser/, 'driver must auto-select an installed browser')
assert.match(driver, /launch_persistent_context/, 'driver must support persistent profiles')
assert.match(driver, /connect_over_cdp/, 'driver must support attaching to an existing browser')
assert.match(driver, /FILL_FUNCTION/, 'driver must share one DOM fill function')
assert.match(driver, /scrollDelta/, 'driver must report scroll delta')
assert.ok(fs.existsSync(path.join(root, 'docs', 'BROWSER_DRIVER.md')), 'browser driver docs must exist')

console.log('PASS: cross-browser driver guards')
