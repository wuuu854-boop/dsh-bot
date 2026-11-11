#!/usr/bin/env node
/**
 * DSH Bot CLI — drive the running DSH Bot host without the Web UI.
 *
 *   node scripts/bot_cli.mjs bots
 *   node scripts/bot_cli.mjs tasks [--bot NAME]
 *   node scripts/bot_cli.mjs status [--thread ID]
 *   node scripts/bot_cli.mjs send --thread ID --text "..."
 *   node scripts/bot_cli.mjs group create --name "增长复盘" --members "DSH,AI 调度"
 *   node scripts/bot_cli.mjs group list
 *   node scripts/bot_cli.mjs memory get --bot DSH
 *   node scripts/bot_cli.mjs memory set --bot DSH --file memory.md
 *   node scripts/bot_cli.mjs memory history --bot DSH
 *   node scripts/bot_cli.mjs memory diff --bot DSH --sha abc1234
 *   node scripts/bot_cli.mjs memory restore --bot DSH --sha abc1234
 *
 * Every command prints one JSON document on stdout. The API base is resolved
 * from --api, DSH_BOT_API, storages/dsh-bot/runtime.json, or the default port.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

process.stdout.on('error', (error) => {
  if (error?.code === 'EPIPE') process.exit(0)
  throw error
})
process.on('uncaughtException', (error) => {
  if (error?.code === 'EPIPE') process.exit(0)
  process.stderr.write(`${error?.stack || error}\n`)
  process.exit(1)
})

const argv = process.argv.slice(2)
const command = argv[0] || 'help'

function flag(name, fallback = '') {
  const index = argv.indexOf(`--${name}`)
  if (index >= 0 && argv[index + 1] !== undefined) return argv[index + 1]
  const inline = argv.find((item) => item.startsWith(`--${name}=`))
  if (inline) return inline.slice(name.length + 3)
  return fallback
}

function stateDirs() {
  const home = process.env.DSH_HOME
  const candidates = []
  if (home) candidates.push(path.join(home, 'storages', 'dsh-bot'))
  candidates.push(path.join(os.homedir(), '.dsh-official-desktop', 'storages', 'dsh-bot'))
  candidates.push(path.join(os.homedir(), '.dsh', 'storages', 'dsh-bot'))
  return candidates
}

function resolveApiBase() {
  const explicit = flag('api') || process.env.DSH_BOT_API
  if (explicit) return explicit.replace(/\/$/, '')
  for (const dir of stateDirs()) {
    try {
      const runtime = JSON.parse(fs.readFileSync(path.join(dir, 'runtime.json'), 'utf8'))
      if (runtime?.apiBase) return String(runtime.apiBase).replace(/\/$/, '')
    } catch {
      /* try the next location */
    }
  }
  return 'http://127.0.0.1:52036/dsh-bot/api'
}

const API = resolveApiBase()

async function request(method, route, body) {
  const response = await fetch(`${API}${route}`, {
    method,
    headers: { 'x-dsh-bot-client': '1', 'content-type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
  let data
  try {
    data = await response.json()
  } catch {
    data = { ok: false, error: `HTTP ${response.status}` }
  }
  return { status: response.status, data }
}

function print(value, code = 0) {
  const text = `${JSON.stringify(value, null, 2)}\n`
  try {
    process.stdout.write(text)
  } catch {
    /* a closed consumer (for example `| head`) is not an error */
  }
  process.exitCode = code
}

function summarizeBot(bot) {
  return {
    id: bot.id,
    name: bot.name,
    emoji: bot.emoji,
    tagline: bot.tagline,
    model: bot.model || bot.modelLabel || null,
    privilege: bot.privilege,
    autonomy: bot.autonomy,
    role: bot.role || 'member',
  }
}

function summarizeThread(thread) {
  return {
    id: thread.id,
    kind: thread.kind,
    title: thread.title,
    botId: thread.botId,
    running: thread.running,
    members: (thread.members || []).map((member) => member.name),
    updatedAt: thread.updatedAt,
  }
}

async function main() {
  if (command === 'help' || command === '--help' || command === '-h') {
    print({
      ok: true,
      usage: [
        'bots',
        'tasks [--bot NAME]',
        'groups',
        'status [--thread ID]',
        'doctor',
        'health',
        'update [--check]',
        'send --thread ID --text "..."',
        'new [--bot NAME]',
        'group create --name NAME --members "A,B"',
        'group delete --thread ID',
        'team list | assignments | cleanup',
        'meeting status | run | reset | config --enabled 1|0 --weekdays 1|0 --only-work 1|0',
        'rename --thread ID --title "..."',
        'retry --assignment ID',
        'stop --thread ID',
        'memory get|set|history|diff|restore [--bot NAME] [--sha SHA] [--file PATH] [--text TEXT]',
      ],
      api: API,
    })
    return
  }

  const boot = await request('GET', '/bootstrap')
  if (!boot.data?.ok) {
    print({ ok: false, error: boot.data?.error || 'DSH Bot 没有响应', api: API }, 1)
    return
  }
  const bots = boot.data.bots || []

  const botByName = (name) => {
    const wanted = String(name || '').trim().toLowerCase()
    if (!wanted) return bots.find((bot) => bot.id === boot.data.activeBotId) || bots[0]
    return bots.find((bot) => bot.id === wanted || String(bot.name).toLowerCase() === wanted) || null
  }

  if (command === 'bots') {
    print({ ok: true, activeBotId: boot.data.activeBotId, bots: bots.map(summarizeBot) })
    return
  }

  if (command === 'tasks') {
    const bot = botByName(flag('bot'))
    const result = await request('GET', `/state?thread=${encodeURIComponent(boot.data.thread.id)}`)
    const threads = (result.data?.threads || []).filter((thread) => !bot || thread.botId === bot.id || (thread.members || []).length > 0)
    print({ ok: true, bot: bot?.name || null, threads: threads.map(summarizeThread) })
    return
  }

  if (command === 'groups') {
    const result = await request('GET', `/state?thread=${encodeURIComponent(boot.data.thread.id)}`)
    const threads = (result.data?.threads || []).filter((thread) => thread.kind === 'group')
    print({ ok: true, groups: threads.map(summarizeThread) })
    return
  }

  if (command === 'doctor') {
    const result = await request('GET', '/doctor')
    print(result.data)
    return
  }

  if (command === 'health') {
    const result = await request('GET', '/health')
    print(result.data)
    return
  }

  if (command === 'update') {
    const result = flag('check') === '1'
      ? await request('POST', '/update/check', {})
      : await request('GET', '/update')
    print(result.data)
    return
  }

  if (command === 'status') {
    const threadId = flag('thread') || boot.data.thread.id
    const result = await request('GET', `/state?thread=${encodeURIComponent(threadId)}`)
    if (!result.data?.ok) {
      print({ ok: false, error: result.data?.error || '线程不存在' }, 1)
      return
    }
    const snap = result.data
    const last = [...(snap.items || [])].reverse().find((item) => item.kind === 'assistant' && item.text)
    print({
      ok: true,
      thread: summarizeThread(snap.thread),
      running: snap.thread?.running || false,
      question: snap.question ? { bot: snap.question.speaker?.name || null, question: snap.question.question } : null,
      stats: snap.stats,
      lastReply: last ? { by: last.speaker?.name || snap.bot?.name, text: String(last.text).slice(0, 400) } : null,
    })
    return
  }

  if (command === 'retry') {
    const assignmentId = flag('assignment')
    if (!assignmentId) {
      print({ ok: false, error: '需要 --assignment <id>' }, 1)
      return
    }
    const result = await request('POST', '/assignment/retry', { assignmentId })
    print({
      ok: Boolean(result.data?.ok),
      status: result.status,
      assignmentId: result.data?.assignmentId,
      error: result.data?.error,
    })
    return
  }

  if (command === 'rename') {
    const threadId = flag('thread')
    const title = flag('title')
    if (!threadId || !title) {
      print({ ok: false, error: '需要 --thread 和 --title' }, 1)
      return
    }
    const result = await request('POST', '/thread/rename', { threadId, title })
    print({ ok: Boolean(result.data?.ok), thread: result.data?.thread ? summarizeThread(result.data.thread) : null })
    return
  }

  if (command === 'send') {
    const threadId = flag('thread') || boot.data.thread.id
    const text = flag('text')
    if (!text) {
      print({ ok: false, error: '需要 --text' }, 1)
      return
    }
    const result = await request('POST', '/send', { threadId, text })
    print({ ok: Boolean(result.data?.ok), status: result.status, ...result.data })
    return
  }

  if (command === 'new') {
    const bot = botByName(flag('bot'))
    const result = await request('POST', '/new', { botId: bot?.id })
    print({ ok: Boolean(result.data?.ok), thread: result.data?.thread ? summarizeThread(result.data.thread) : null })
    return
  }

  if (command === 'stop') {
    const threadId = flag('thread') || boot.data.thread.id
    const result = await request('POST', '/stop', { threadId })
    print({ ok: Boolean(result.data?.ok), ...result.data })
    return
  }

  if (command === 'meeting') {
    const action = argv[1] || 'status'
    if (action === 'config') {
      const patch = {}
      if (flag('enabled') !== '') patch.enabled = flag('enabled') !== '0'
      if (flag('weekdays') !== '') patch.weekdaysOnly = flag('weekdays') !== '0'
      if (flag('only-work') !== '') patch.onlyWhenWork = flag('only-work') !== '0'
      const result = await request('POST', '/meeting/config', patch)
      print({ ok: Boolean(result.data?.ok), ...result.data })
      return
    }
    if (action === 'reset') {
      const result = await request('POST', '/meeting/reset', {})
      print({ ok: Boolean(result.data?.ok), ...result.data })
      return
    }
    if (action === 'run') {
      const result = await request('POST', '/meeting/run', { force: true })
      print({ ok: Boolean(result.data?.ok), ...result.data })
      return
    }
    const status = await request('GET', '/meeting')
    print({
      ok: Boolean(status.data?.ok),
      date: status.data?.date,
      lastDate: status.data?.lastDate,
      running: status.data?.running,
      groupId: status.data?.groupId,
      lastError: status.data?.lastError,
      lastSummary: String(status.data?.lastSummary || '').slice(0, 1_500),
    })
    return
  }

  if (command === 'team') {
    const action = argv[1] || 'list'
    if (action === 'init') {
      print(
        {
          ok: false,
          error: '固定团队模板已移除；请用 UI「添加专家」按需创建，或直接让老大招人。',
        },
        1,
      )
      return
    }
    if (action === 'cleanup') {
      const result = await request('POST', '/team/cleanup', { keepRunning: flag('keep-running') === '1' })
      print({ ok: Boolean(result.data?.ok), ...result.data })
      return
    }
    const query = new URLSearchParams()
    if (flag('limit')) query.set('limit', flag('limit'))
    if (flag('offset')) query.set('offset', flag('offset'))
    if (flag('status')) query.set('status', flag('status'))
    if (flag('member')) query.set('memberId', botByName(flag('member'))?.id || flag('member'))
    const team = await request('GET', `/team${query.toString() ? `?${query}` : ''}`)
    if (!team.data?.ok) {
      print({ ok: false, error: team.data?.error || '团队接口不可用' }, 1)
      return
    }
    print({
      ok: true,
      leadId: team.data.leadId,
      total: team.data.total,
      offset: team.data.offset,
      limit: team.data.limit,
      roster: (team.data.roster || []).map((member) => ({
        id: member.id,
        name: member.name,
        role: member.role,
        tagline: member.tagline,
        running: member.running,
      })),
      assignments:
        action === 'assignments'
          ? (team.data.assignments || []).map((assignment) => ({
              id: assignment.id,
              from: assignment.fromName,
              to: assignment.toName,
              status: assignment.status,
              reported: assignment.reported,
              summary: String(assignment.summary || '').slice(0, 200),
            }))
          : undefined,
    })
    return
  }

  if (command === 'group') {
    const action = argv[1] || 'list'
    if (action === 'create') {
      const names = String(flag('members'))
        .split(/[,，、]/)
        .map((item) => item.trim())
        .filter(Boolean)
      const memberIds = names.map((name) => botByName(name)?.id).filter(Boolean)
      const result = await request('POST', '/channel/create', {
        name: flag('name', '新群聊'),
        memberIds,
      })
      print({
        ok: Boolean(result.data?.ok),
        status: result.status,
        channel: result.data?.channel,
        error: result.data?.error,
      })
      return
    }
    if (action === 'delete') {
      const result = await request('POST', '/channel/delete', { threadId: flag('thread') })
      print({ ok: Boolean(result.data?.ok), status: result.status, error: result.data?.error })
      return
    }
    const result = await request('GET', `/state?thread=${encodeURIComponent(boot.data.thread.id)}`)
    print({
      ok: true,
      groups: (result.data?.threads || []).filter((thread) => thread.kind === 'group').map(summarizeThread),
    })
    return
  }

  if (command === 'memory') {
    const action = argv[1] || 'get'
    const bot = botByName(flag('bot'))
    if (!bot) {
      print({ ok: false, error: 'Bot 不存在' }, 1)
      return
    }
    const suffix = `?botId=${encodeURIComponent(bot.id)}`
    if (action === 'get') {
      const result = await request('GET', `/memory${suffix}`)
      print({ ok: true, bot: bot.name, path: result.data.path, text: result.data.text, history: result.data.history })
      return
    }
    if (action === 'set') {
      const text = flag('text') || (flag('file') ? fs.readFileSync(flag('file'), 'utf8') : '')
      const result = await request('POST', '/memory', { botId: bot.id, text })
      print({ ok: Boolean(result.data?.ok), bot: bot.name, sha: result.data.sha, error: result.data?.error })
      return
    }
    if (action === 'history') {
      const result = await request('GET', `/memory/history${suffix}`)
      print({ ok: true, bot: bot.name, ...result.data })
      return
    }
    if (action === 'diff') {
      const result = await request('GET', `/memory/diff${suffix}&sha=${encodeURIComponent(flag('sha'))}`)
      print({ ok: Boolean(result.data?.ok), ...result.data })
      return
    }
    if (action === 'restore') {
      const result = await request('POST', '/memory/restore', { botId: bot.id, sha: flag('sha') })
      print({ ok: Boolean(result.data?.ok), bot: bot.name, restoredFrom: result.data?.restoredFrom, error: result.data?.error })
      return
    }
    print({ ok: false, error: `未知 memory 动作：${action}` }, 1)
    return
  }

  print({ ok: false, error: `未知命令：${command}` }, 1)
}

main().catch((error) => {
  print({ ok: false, error: error?.message || String(error), api: API }, 1)
})
