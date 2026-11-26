const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const server = fs.readFileSync(path.join(root, 'index.js'), 'utf8')
const client = fs.readFileSync(path.join(root, 'client.js'), 'utf8')

assert.match(
  server,
  /inputTokens[\s\S]{0,120}outputTokens[\s\S]{0,120}reasoningTokens/,
  'run budget must count input, output and reasoning tokens',
)
assert.match(server, /budgetWarned50/, 'budget must have a 50% warning flag')
assert.match(server, /budgetWarned90/, 'budget must have a 90% warning flag')
assert.match(server, /tokenRatio\s*>=\s*0\.5/, 'budget must warn at 50% token usage')
assert.match(server, /tokenRatio\s*>=\s*0\.8/, 'budget must warn at 80% token usage')
assert.match(server, /tokenRatio\s*>=\s*0\.9/, 'budget must warn at 90% token usage')
assert.match(server, /DAILY_MAX_TOKENS/, 'daily token quota must exist')
assert.match(server, /dailyRatio\s*>=\s*1/, 'daily quota must hard stop')
assert.match(server, /quota: normalizeQuota/, 'quota must be persisted and normalized')
assert.match(server, /quotaTokens/, 'per-run quota accounting must avoid double counting')
assert.match(server, /dailyTokens/, 'daily cap must be configurable')
assert.match(client, /budgetDailyUsage/, 'settings must show daily usage')
assert.match(client, /budgetDailyTokens/, 'settings must allow editing the daily cap')
assert.match(client, /budgetPreset/, 'settings must expose budget profiles')
assert.match(client, /budgetUsage/, 'settings must show token usage against the cap')
assert.match(client, /reasoningTokens/, 'thread token display must include reasoning tokens')

console.log('PASS: token budget accounting, warnings, profiles and usage display')
