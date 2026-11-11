#!/usr/bin/env node
/**
 * Opt-in end-to-end check that actually talks to the model (spends tokens).
 *
 *   node scripts/e2e-team.mjs --yes
 *   node scripts/e2e-team.mjs --yes --delegate
 *
 * It creates a temporary Boss thread, checks a direct reply, optionally asks
 * the Boss to delegate to a teammate and waits for the report, then deletes
 * the thread. Never run from CI without an API key and budget.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const args = process.argv.slice(2)
const yes = args.includes('--yes') || process.env.DSH_BOT_E2E === '1'
const wantDelegate = args.includes('--delegate')

function apiBase() {
  if (process.env.DSH_BOT_API) return process.env.DSH_BOT_API.replace(/\/$/, '')
  const dirs = []
  if (process.env.DSH_HOME) dirs.push(path.join(process.env.DSH_HOME, 'storages', 'dsh-bot'))
  dirs.push(path.join(os.homedir(), '.dsh-official-desktop', 'storages', 'dsh-bot'))
  dirs.push(path.join(os.homedir(), '.dsh', 'storages', 'dsh-bot'))
  for (const dir of dirs) {
    try {
      const runtime = JSON.parse(fs.readFileSync(path.join(dir, 'runtime.json'), 'utf8'))
      if (runtime?.apiBase) return String(runtime.apiBase).replace(/\/$/, '')
    } catch {
      /* next */
    }
  }
  return 'http://127.0.0.1:52036/dsh-bot/api'
}

if (!yes) {
  console.log('E2E 会真实调用模型并消耗额度。确认后运行：node scripts/e2e-team.mjs --yes [--delegate]')
  process.exit(0)
}

const BASE = apiBase()
const headers = { 'x-dsh-bot-client': '1', 'content-type': 'application/json' }
const get = async (route) => (await fetch(BASE + route)).json()
const post = async (route, body) => {
  const response = await fetch(BASE + route, { method: 'POST', headers, body: JSON.stringify(body) })
  return { status: response.status, data: await response.json() }
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const failures = []

function check(name, condition, detail = '') {
  if (condition) console.log(`PASS ${name}`)
  else {
    failures.push(`${name}${detail ? `: ${detail}` : ''}`)
    console.log(`FAIL ${name}${detail ? `: ${detail}` : ''}`)
  }
}

const boot = await get('/bootstrap')
check('bootstrap', boot.ok)
const lead = (boot.bots || []).find((bot) => bot.role === 'lead')
check('lead exists', Boolean(lead))
if (!lead) {
  console.error('先添加一个 lead Bot')
  process.exit(1)
}

const created = await post('/new', { botId: lead.id })
const threadId = created.data?.thread?.id
check('temporary thread', Boolean(threadId))
if (!threadId) process.exit(1)

try {
  await post('/send', { threadId, text: '只回复一行 E2E_OK，不要调用任何工具。' })
  let direct = ''
  for (let i = 0; i < 30; i += 1) {
    await sleep(3000)
    const snapshot = await get(`/state?thread=${encodeURIComponent(threadId)}`)
    const reply = [...(snapshot.items || [])]
      .reverse()
      .find((item) => item.kind === 'assistant' && String(item.text || '').includes('E2E_OK'))
    if (reply) {
      direct = String(reply.text)
      if (!snapshot.thread.running) break
    }
  }
  check('boss direct reply', direct.includes('E2E_OK'), direct.slice(0, 120))

  if (wantDelegate) {
    const roster = (await get('/team')).roster || []
    const member = roster.find((item) => item.role !== 'lead')
    check('teammate available', Boolean(member), '先建一个队员')
    if (member) {
      const start = Date.now()
      await post('/send', {
        threadId,
        text: `让「${member.name}」只回复一行 E2E_DELEGATE_OK，不要调用工具；然后你把结果告诉我。`,
      })
      let success = false
      for (let i = 0; i < 60; i += 1) {
        await sleep(5000)
        const snapshot = await get(`/state?thread=${encodeURIComponent(threadId)}`)
        const assignment = (snapshot.assignments || []).find((item) => item.createdAt >= start)
        if (assignment?.status === 'success' && assignment.reported && !snapshot.thread.running) {
          success = true
          break
        }
      }
      check('delegation report', success)
    }
  }
} finally {
  if (threadId) await post('/delete', { threadId })
  console.log(threadId ? 'temporary thread deleted' : '')
}

console.log(failures.length === 0 ? '\nE2E passed' : `\nE2E failed: ${failures.join('; ')}`)
process.exitCode = failures.length === 0 ? 0 : 1
