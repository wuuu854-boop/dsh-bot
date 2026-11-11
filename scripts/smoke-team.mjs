#!/usr/bin/env node
/**
 * Read-only smoke test for the team features. Requires a running DSH Bot host.
 * It never sends model prompts; it only checks the host state and API shape.
 *
 *   node scripts/smoke-team.mjs
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

function stateDirs() {
  const dirs = []
  if (process.env.DSH_HOME) dirs.push(path.join(process.env.DSH_HOME, 'storages', 'dsh-bot'))
  dirs.push(path.join(os.homedir(), '.dsh-official-desktop', 'storages', 'dsh-bot'))
  dirs.push(path.join(os.homedir(), '.dsh', 'storages', 'dsh-bot'))
  return dirs
}

function apiBase() {
  if (process.env.DSH_BOT_API) return process.env.DSH_BOT_API.replace(/\/$/, '')
  for (const dir of stateDirs()) {
    try {
      const runtime = JSON.parse(fs.readFileSync(path.join(dir, 'runtime.json'), 'utf8'))
      if (runtime?.apiBase) return String(runtime.apiBase).replace(/\/$/, '')
    } catch {
      /* next */
    }
  }
  return 'http://127.0.0.1:52036/dsh-bot/api'
}

const BASE = apiBase()
const failures = []
let checks = 0

function check(name, condition, detail = '') {
  checks += 1
  if (condition) {
    console.log(`PASS ${name}`)
  } else {
    failures.push(`${name}${detail ? `: ${detail}` : ''}`)
    console.log(`FAIL ${name}${detail ? `: ${detail}` : ''}`)
  }
}

async function get(route) {
  const response = await fetch(`${BASE}${route}`)
  const data = await response.json()
  return { status: response.status, data }
}

const boot = await get('/bootstrap')
check('bootstrap responds', boot.status === 200 && boot.data?.ok, `status ${boot.status}`)
check('version present', typeof boot.data?.bot?.version === 'string', boot.data?.bot?.version)
check('at least one bot', (boot.data?.bots || []).length >= 1)
const lead = (boot.data?.bots || []).find((bot) => bot.role === 'lead')
check('lead bot exists', Boolean(lead), 'add a lead bot first')

const team = await get('/team')
check('team endpoint', team.status === 200 && team.data?.ok)
if (lead) {
  check('team roster includes lead', (team.data?.roster || []).some((member) => member.id === lead.id))
}

const meeting = await get('/meeting')
check('meeting state', meeting.status === 200 && meeting.data?.ok)
check('meeting has date field', typeof meeting.data?.date === 'string')
if (meeting.data?.groupId) {
  const group = await get(`/state?thread=${encodeURIComponent(meeting.data.groupId)}`)
  check('meeting group loads', group.status === 200 && group.data?.ok)
  check('meeting group is a group', group.data?.thread?.kind === 'group', group.data?.thread?.kind)
  check('meeting group members', (group.data?.channel?.members || []).length >= 2)
}

if (lead) {
  const memory = await get(`/memory?botId=${encodeURIComponent(lead.id)}`)
  check('lead memory endpoint', memory.status === 200 && typeof memory.data?.text === 'string')
}

const group = await get('/state?thread=' + encodeURIComponent(boot.data.thread.id))
check('active thread loads', group.status === 200 && group.data?.ok)

console.log(`\n${checks - failures.length}/${checks} checks passed`)
if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exitCode = 1
}
