import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'
import { execFile, execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const PACKAGE_NAME = '@local/dsh-bot'
const VERSION = '4.13.2'
const API_PREFIX = '/dsh-bot/api'
const STATE_VERSION = 2
const DEFAULT_BOT_ID = 'bot-default'
const MAX_THREADS = 80
const MAX_CHANNELS = 8
const MAX_CHANNEL_MEMBERS = 8
const DISPATCH_LIMIT = 3
const MAX_BOTS = 12
const MAX_ROUTINES = 40
const MAX_RUNS = 300
const MAX_ASSIGNMENTS = 120
const DELEGATE_LIMIT = 3
const MAX_SKILLS = 80
const MAX_SNAPSHOTS = 40
const MAX_AUDITS = 200
const MAX_STATE_BACKUPS = 5
const STATE_BACKUP_MS = 5 * 60 * 1000
const SNAPSHOT_MAX_BYTES = 512 * 1024 * 1024
const STALL_MS = Number(process.env.DSH_BOT_STALL_MS) || 15 * 60 * 1000
const CHECKPOINT_MS = 5 * 60 * 1000
const RUN_MAX_MS = Number(process.env.DSH_BOT_MAX_RUN_MS) || 60 * 60 * 1000
const RUN_MAX_TOOLS = Number(process.env.DSH_BOT_MAX_TOOLS) || 300
const RUN_MAX_TOKENS = Number(process.env.DSH_BOT_MAX_TOKENS) || 400_000
const MAX_LIVE_AGENTS = 6
const OPEN_RETRY_MS = 12_000
const BODY_LIMIT = 2_000_000
const MEMORY_LIMIT = 240_000

export const name = PACKAGE_NAME
export const inject = ['agents', 'webServer']

const now = () => Date.now()
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const messageOf = (error) => (error && typeof error === 'object' && 'message' in error
  ? String(error.message)
  : String(error))

function truncate(value, limit) {
  const text = typeof value === 'string' ? value : value == null ? '' : String(value)
  return text.length > limit ? `${text.slice(0, limit)}…` : text
}

function firstLine(value) {
  const line = String(value || '').split(/\r?\n/).map((item) => item.trim()).find(Boolean)
  return line || ''
}

function toolSignature(name, args) {
  let text = ''
  try {
    text = typeof args === 'string' ? args : JSON.stringify(args)
  } catch {
    text = ''
  }
  return `${name}:${String(text || '').slice(0, 1_200)}`
}

function repeatedCycle(history) {
  for (const size of [2, 3]) {
    if (history.length < size * 2) continue
    const tail = history.slice(-size * 2)
    let same = true
    for (let index = 0; index < size; index += 1) {
      if (tail[index] !== tail[size + index]) {
        same = false
        break
      }
    }
    if (same) return size
  }
  return 0
}

function textOf(content) {
  if (!Array.isArray(content)) return ''
  return content
    .filter((block) => block && block.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text)
    .join('\n')
    .trim()
}

function reasoningOf(content) {
  if (!Array.isArray(content)) return ''
  return content
    .filter((block) => block && block.type === 'reasoning' && typeof block.text === 'string')
    .map((block) => block.text)
    .join('\n')
    .trim()
}

function parseArguments(raw) {
  if (typeof raw !== 'string' || raw.trim() === '') return null
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : { value: parsed }
  } catch {
    return null
  }
}

function prettyModel(model) {
  const table = {
    'deepseek-flash': 'DeepSeek V4.1 Flash',
    'deepseek-pro': 'DeepSeek V4 Pro',
    'deepseek-v4-pro': 'DeepSeek V4 Pro',
    'mimo-v2.6-flash': 'MiMo V2.6 Flash',
    'mimo-v2.6-pro': 'MiMo V2.6 Pro',
    'mimo-v2.6-pro-ultraspeed': 'MiMo V2.6 Pro UltraSpeed',
  }
  return table[model] || model || 'Auto'
}

function newSessionId() {
  return `session-${crypto.randomUUID()}`
}

function newThreadId() {
  return `thread-${crypto.randomUUID()}`
}

function isAbsoluteDirectory(value) {
  return typeof value === 'string' && value.length > 0 && path.isAbsolute(value)
}

export function apply(ctx) {
  const startedAt = now()
  const home = process.env.DSH_HOME || path.join(os.homedir(), '.dsh')
  const stateDir = path.join(home, 'storages', 'dsh-bot')
  const stateFile = path.join(stateDir, 'state.json')
  const snapshotRoot = path.join(stateDir, 'snapshots')
  const auditFile = path.join(stateDir, 'audit', 'tool-audit.jsonl')
  const memoryFile = path.join(stateDir, 'memory.md')
  const packageDir = path.dirname(fileURLToPath(import.meta.url))
  const computerScript = path.join(packageDir, 'scripts', 'computer.py')
  const appsScript = path.join(packageDir, 'scripts', 'apps.py')
  const proxyScript = path.join(packageDir, 'scripts', 'proxy.py')
  const adminScript = path.join(packageDir, 'scripts', 'admin_exec.py')
  const notifyScript = path.join(packageDir, 'scripts', 'notify_qq.py')
  const qqUiaPy = path.join(packageDir, 'scripts', 'qq_uia.py')
  const browserScript = path.join(packageDir, 'scripts', 'browser.py')
  const edgeScript = path.join(packageDir, 'scripts', 'edge.py')

  try {
    fs.mkdirSync(stateDir, { recursive: true })
  } catch (error) {
    console.error('[dsh-bot] cannot create state directory', error)
  }

  const workspaceFile = path.join(stateDir, 'workspace.txt')
  let resolvedWorkspace = null

  let saveTimer = null
  let state = loadState()
  if (state.meeting?.running) {
    state.meeting.running = false
    state.meeting.lastError = '上次晨会未完成（宿主重启），已释放状态'
  }
  let interruptedAssignments = 0
  for (const assignment of state.assignments) {
    if (assignment.status !== 'running') continue
    assignment.status = 'aborted'
    assignment.endedAt = now()
    assignment.error = '宿主重启，回合已中断；可点重试'
    assignment.reported = true
    interruptedAssignments += 1
  }
  if (interruptedAssignments > 0) saveStateSoon()
  const live = new Map()
  const opening = new Map()
  const failures = new Map()

  let selection = null
  try {
    selection = ctx.get('agentDefaultModel')?.currentSelection?.() ?? null
  } catch {
    selection = null
  }
  if (!selection || !selection.provider || !selection.model) selection = null

  let webOrigin = null
  try {
    webOrigin = ctx.webServer.getOrigin()
  } catch {
    webOrigin = null
  }

  /* ── state ─────────────────────────────────────────────────────────── */

  function latestStateBackup() {
    try {
      const files = fs.readdirSync(stateDir)
        .filter((name) => /^state-backup-\d+\.json$/.test(name))
        .sort()
      return files.length ? path.join(stateDir, files[files.length - 1]) : null
    } catch {
      return null
    }
  }

  function loadState() {
    const fallback = {
      version: STATE_VERSION,
      bots: [makeDefaultBot()],
      threads: [],
      routines: [],
      runs: [],
      assignments: [],
      skills: [],
      snapshots: [],
      audits: [],
      notify: defaultNotify(),
      budget: defaultBudget(),
      meeting: defaultMeeting(),
      activeBotId: DEFAULT_BOT_ID,
      lastThreadId: null,
    }
    try {
      let raw
      try {
        raw = JSON.parse(fs.readFileSync(stateFile, 'utf8'))
      } catch (primaryError) {
        const backup = latestStateBackup()
        if (!backup) throw primaryError
        raw = JSON.parse(fs.readFileSync(backup, 'utf8'))
        console.warn('[dsh-bot] state.json unreadable; restored from', backup)
      }
      if (!raw || typeof raw !== 'object' || !Array.isArray(raw.threads)) return fallback

      const bots = []
      const seen = new Set()
      for (const item of Array.isArray(raw.bots) ? raw.bots : []) {
        const bot = normalizeBot(item)
        if (!bot || seen.has(bot.id)) continue
        seen.add(bot.id)
        bots.push(bot)
        if (bots.length >= MAX_BOTS) break
      }
      if (bots.length === 0) bots.push(makeDefaultBot())
      if (!bots.some((bot) => bot.id === DEFAULT_BOT_ID)) bots.unshift(makeDefaultBot())
      const botIds = new Set(bots.map((bot) => bot.id))
      const fallbackBotId = bots[0].id

      const threads = raw.threads
        .filter((thread) => thread && typeof thread.id === 'string' && typeof thread.sessionId === 'string')
        .slice(0, MAX_THREADS)
        .map((thread) => ({
          id: thread.id,
          sessionId: thread.sessionId,
          botId: botIds.has(thread.botId) ? thread.botId : fallbackBotId,
          title: typeof thread.title === 'string' ? thread.title : '',
          createdAt: Number(thread.createdAt) || now(),
          updatedAt: Number(thread.updatedAt) || now(),
          created: thread.created === true,
          presetId: typeof thread.presetId === 'string' ? thread.presetId : null,
          kind: ['routine', 'group', 'member'].includes(thread.kind) ? thread.kind : 'task',
          channelId: typeof thread.channelId === 'string' ? thread.channelId : null,
          memberIds: Array.isArray(thread.memberIds)
            ? thread.memberIds.filter((id) => botIds.has(id)).slice(0, MAX_CHANNEL_MEMBERS)
            : [],
          leaderId: botIds.has(thread.leaderId) ? thread.leaderId : null,
          emoji: textValue(thread.emoji, 8) || '◈',
          messages: Array.isArray(thread.messages)
            ? thread.messages
                .filter((message) => message && typeof message.text === 'string' && message.text)
                .slice(-200)
                .map((message) => ({
                  id: typeof message.id === 'string' ? message.id : crypto.randomUUID(),
                  time: Number(message.time) || now(),
                  text: message.text.slice(0, 32_000),
                  botId: typeof message.botId === 'string' ? message.botId : null,
                }))
            : [],
          routineId: typeof thread.routineId === 'string' ? thread.routineId : null,
          skillId: typeof thread.skillId === 'string' ? thread.skillId : null,
          assignmentId: typeof thread.assignmentId === 'string' ? thread.assignmentId : null,
          meeting: thread.meeting === true,
          pinned: thread.pinned === true,
          order: Number(thread.order) || 0,
          archived: thread.archived === true,
          pinnedMessage:
            thread.pinnedMessage && typeof thread.pinnedMessage === 'object'
              ? {
                  id: String(thread.pinnedMessage.id || ''),
                  text: textValue(thread.pinnedMessage.text, 600),
                  name: textValue(thread.pinnedMessage.name, 80),
                  role: textValue(thread.pinnedMessage.role, 20),
                  at: Number(thread.pinnedMessage.at) || 0,
                }
              : null,
          pinnedMessages: (Array.isArray(thread.pinnedMessages)
            ? thread.pinnedMessages
            : thread.pinnedMessage
              ? [thread.pinnedMessage]
              : []
          )
            .filter((item) => item && item.id)
            .slice(0, 10)
            .map((item) => ({
              id: String(item.id),
              text: textValue(item.text, 600),
              name: textValue(item.name, 80),
              role: textValue(item.role, 20),
              at: Number(item.at) || 0,
            })),
          modelProvider: typeof thread.modelProvider === 'string' ? thread.modelProvider : null,
          modelName: typeof thread.modelName === 'string' ? thread.modelName : null,
          reasoningEffort: typeof thread.reasoningEffort === 'string' ? thread.reasoningEffort : null,
          error: typeof thread.error === 'string' ? thread.error : null,
          checkpoint: normalizeCheckpoint(thread.checkpoint),
        }))
        .filter((thread) => {
          if (thread.kind === 'group') return thread.memberIds.length > 0 && !thread.channelId
          if (thread.kind === 'member') return Boolean(thread.channelId)
          return !thread.channelId
        })

      const routines = []
      for (const item of Array.isArray(raw.routines) ? raw.routines : []) {
        const routine = normalizeRoutine(item, botIds, new Set(threads.map((thread) => thread.id)))
        if (!routine) continue
        routines.push(routine)
        if (routines.length >= MAX_ROUTINES) break
      }

      const snapshots = (Array.isArray(raw.snapshots) ? raw.snapshots : [])
        .map(normalizeSnapshot)
        .filter(Boolean)
        .slice(0, MAX_SNAPSHOTS)
      const audits = (Array.isArray(raw.audits) ? raw.audits : [])
        .filter((item) => item && typeof item === 'object')
        .slice(0, MAX_AUDITS)

      const runs = []
      for (const item of Array.isArray(raw.runs) ? raw.runs : []) {
        const run = normalizeRun(item, botIds, new Set(threads.map((thread) => thread.id)))
        if (!run) continue
        runs.push(run)
        if (runs.length >= MAX_RUNS) break
      }
      runs.sort((a, b) => b.startedAt - a.startedAt)

      const assignments = []
      for (const item of Array.isArray(raw.assignments) ? raw.assignments : []) {
        if (!item || typeof item !== 'object' || typeof item.id !== 'string') continue
        const fromBotId = botIds.has(item.fromBotId) ? item.fromBotId : null
        const toBotId = botIds.has(item.toBotId) ? item.toBotId : null
        if (!fromBotId || !toBotId) continue
        assignments.push({
          id: item.id,
          fromBotId,
          fromThreadId: typeof item.fromThreadId === 'string' ? item.fromThreadId : null,
          toBotId,
          toThreadId: typeof item.toThreadId === 'string' ? item.toThreadId : null,
          prompt: textValue(item.prompt, 8_000),
          status: ['running', 'success', 'failed', 'aborted'].includes(item.status) ? item.status : 'failed',
          createdAt: Number(item.createdAt) || now(),
          endedAt: Number(item.endedAt) || 0,
          summary: textValue(item.summary, 4_000),
          error: textValue(item.error, 1_000),
          steps: Number(item.steps) || 0,
          durationMs: Number(item.durationMs) || 0,
          tokens: Number(item.tokens) || 0,
          reported: item.reported === true,
        })
        if (assignments.length >= MAX_ASSIGNMENTS) break
      }
      assignments.sort((a, b) => b.createdAt - a.createdAt)

      const skills = []
      for (const item of Array.isArray(raw.skills) ? raw.skills : []) {
        const skill = normalizeSkill(item, botIds, new Set(threads.map((thread) => thread.id)))
        if (!skill) continue
        skills.push(skill)
        if (skills.length >= MAX_SKILLS) break
      }
      skills.sort((a, b) => b.updatedAt - a.updatedAt)

      return {
        version: STATE_VERSION,
        bots,
        threads,
        routines,
        runs,
        assignments,
        skills,
        snapshots,
        audits,
        notify: normalizeNotify(raw.notify),
        budget: normalizeBudget(raw.budget),
        meeting: normalizeMeeting(raw.meeting),
        activeBotId: botIds.has(raw.activeBotId) ? raw.activeBotId : fallbackBotId,
        lastThreadId: typeof raw.lastThreadId === 'string' ? raw.lastThreadId : null,
      }
    } catch {
      return fallback
    }
  }

  function textValue(value, limit) {
    return typeof value === 'string' ? value.trim().slice(0, limit) : ''
  }

  function makeDefaultBot() {
    return {
      id: DEFAULT_BOT_ID,
      name: '老大',
      emoji: '👑',
      tagline: '只跟你对话 · 判断与派活',
      persona: '',
      presetId: null,
      provider: null,
      model: null,
      reasoningEffort: null,
      workspace: null,
      role: 'lead',
      privilege: 'standard',
      autonomy: 'interactive',
      createdAt: startedAt,
      updatedAt: startedAt,
    }
  }

  function normalizeBot(raw) {
    if (!raw || typeof raw !== 'object') return null
    const requested = textValue(raw.id, 80)
    const id = requested && /^[a-zA-Z0-9_-]{3,80}$/.test(requested) ? requested : `bot-${crypto.randomUUID()}`
    return {
      id,
      name: textValue(raw.name, 32) || 'Bot',
      emoji: textValue(raw.emoji, 8) || '◉',
      tagline: textValue(raw.tagline, 80),
      persona: textValue(raw.persona, 8_000),
      presetId: textValue(raw.presetId, 80) || null,
      provider: textValue(raw.provider, 120) || null,
      model: textValue(raw.model, 120) || null,
      reasoningEffort: textValue(raw.reasoningEffort, 40) || null,
      workspace: isAbsoluteDirectory(raw.workspace) ? raw.workspace : null,
      role: raw.role === 'lead' ? 'lead' : 'member',
      privilege: raw.privilege === 'admin' ? 'admin' : 'standard',
      autonomy: raw.autonomy === 'unattended' ? 'unattended' : 'interactive',
      createdAt: Number(raw.createdAt) || startedAt,
      updatedAt: Number(raw.updatedAt) || startedAt,
    }
  }

  function normalizeRoutine(raw, botIds, threadIds) {
    if (!raw || typeof raw !== 'object') return null
    const title = textValue(raw.title, 80)
    const prompt = textValue(raw.prompt, 16_000)
    const schedule = raw.schedule
    if (!title || !prompt || !schedule || typeof schedule !== 'object') return null
    const kind = ['daily', 'weekly', 'every', 'cron'].includes(schedule.kind) ? schedule.kind : null
    if (!kind) return null
    const botId = botIds.has(raw.botId) ? raw.botId : DEFAULT_BOT_ID
    return {
      id: textValue(raw.id, 80) || `routine-${crypto.randomUUID()}`,
      botId,
      threadId: threadIds.has(raw.threadId) ? raw.threadId : null,
      title,
      prompt,
      schedule: { ...schedule, kind },
      scheduleId: textValue(raw.scheduleId, 120) || null,
      enabled: raw.enabled !== false,
      createdAt: Number(raw.createdAt) || now(),
      updatedAt: Number(raw.updatedAt) || now(),
      lastRunAt: Number(raw.lastRunAt) || 0,
    }
  }

  function normalizeCheckpoint(raw) {
    if (!raw || typeof raw !== 'object') return null
    const prompt = textValue(raw.prompt, 8_000)
    if (!prompt) return null
    return {
      runId: textValue(raw.runId, 100) || null,
      at: Number(raw.at) || now(),
      prompt,
      lastAssistant: textValue(raw.lastAssistant, 4_000),
      lastTool: textValue(raw.lastTool, 400),
      error: textValue(raw.error, 1_000),
    }
  }

  function defaultBudget() {
    return { maxMs: RUN_MAX_MS, maxTools: RUN_MAX_TOOLS, maxTokens: RUN_MAX_TOKENS }
  }

  function normalizeBudget(raw) {
    const base = defaultBudget()
    if (!raw || typeof raw !== 'object') return base
    const clamp = (value, min, max, fallback) => {
      const number = Number(value)
      return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback
    }
    return {
      maxMs: clamp(raw.maxMs, 60_000, 24 * 60 * 60 * 1000, base.maxMs),
      maxTools: Math.round(clamp(raw.maxTools, 1, 10_000, base.maxTools)),
      maxTokens: Math.round(clamp(raw.maxTokens, 1_000, 50_000_000, base.maxTokens)),
    }
  }

  function defaultMeeting() {
    return {
      lastDate: '',
      running: false,
      startedAt: 0,
      lastAttemptAt: 0,
      lastError: '',
      groupId: null,
      lastSummary: '',
      history: [],
      enabled: true,
      weekdaysOnly: false,
      onlyWhenWork: false,
    }
  }

  function normalizeMeeting(raw) {
    const base = defaultMeeting()
    if (!raw || typeof raw !== 'object') return base
    const startedAt = Number(raw.startedAt) || 0
    const stale = raw.running === true && startedAt > 0 && now() - startedAt > 30 * 60 * 1000
    const lastDate = textValue(raw.lastDate, 20)
    const lastSummary = textValue(raw.lastSummary, 8_000)
    const history = (Array.isArray(raw.history) ? raw.history : [])
      .filter((item) => item && textValue(item.date, 20) && textValue(item.summary, 8_000))
      .slice(0, 30)
      .map((item) => ({
        date: textValue(item.date, 20),
        summary: textValue(item.summary, 8_000),
        at: Number(item.at) || 0,
      }))
    if (history.length === 0 && lastDate && lastSummary) {
      history.unshift({ date: lastDate, summary: lastSummary, at: Number(raw.lastAttemptAt) || 0 })
    }
    return {
      lastDate,
      running: raw.running === true && !stale,
      startedAt,
      lastAttemptAt: Number(raw.lastAttemptAt) || 0,
      lastError: textValue(raw.lastError, 1_000),
      groupId: textValue(raw.groupId, 100) || null,
      lastSummary,
      history,
      enabled: raw.enabled !== false,
      weekdaysOnly: raw.weekdaysOnly === true,
      onlyWhenWork: raw.onlyWhenWork === true,
    }
  }

  function publicMeeting() {
    const history = Array.isArray(state.meeting.history) ? state.meeting.history : []
    return {
      enabled: state.meeting.enabled !== false,
      weekdaysOnly: state.meeting.weekdaysOnly === true,
      onlyWhenWork: state.meeting.onlyWhenWork === true,
      running: state.meeting.running === true,
      lastDate: state.meeting.lastDate,
      lastAttemptAt: state.meeting.lastAttemptAt,
      lastError: state.meeting.lastError,
      groupId: state.meeting.groupId,
      lastSummary: truncate(state.meeting.lastSummary, 4_000),
      history: history.slice(0, 10).map((item) => ({
        date: item.date,
        at: item.at || 0,
        summary: truncate(item.summary, 2_000),
      })),
      date: meetingDateKey(),
    }
  }

  function defaultNotify() {
    return {
      enabled: false,
      method: 'smtp',
      email: '',
      authCode: '',
      to: '',
      contact: '文件传输助手',
      remoteControl: false,
      successMode: 'all',
      quietStart: '',
      quietEnd: '',
      minIntervalSec: 10,
      lastSentAt: 0,
      lastError: '',
    }
  }

  function normalizeNotify(raw) {
    const base = defaultNotify()
    if (!raw || typeof raw !== 'object') return base
    return {
      enabled: raw.enabled === true,
      method: raw.method === 'desktop' ? 'desktop' : 'smtp',
      email: textValue(raw.email, 200),
      authCode: textValue(raw.authCode, 200),
      to: textValue(raw.to, 200),
      contact: textValue(raw.contact, 100) || base.contact,
      remoteControl: raw.remoteControl === true,
      successMode: raw.successMode === 'failures' ? 'failures' : 'all',
      quietStart: /^\d{2}:\d{2}$/.test(String(raw.quietStart || '')) ? raw.quietStart : '',
      quietEnd: /^\d{2}:\d{2}$/.test(String(raw.quietEnd || '')) ? raw.quietEnd : '',
      minIntervalSec: Math.max(5, Math.min(300, Number(raw.minIntervalSec) || 10)),
      lastSentAt: Number(raw.lastSentAt) || 0,
      lastError: textValue(raw.lastError, 500),
    }
  }

  function normalizeSnapshot(raw) {
    if (!raw || typeof raw !== 'object') return null
    const id = textValue(raw.id, 100)
    if (!id) return null
    return {
      id,
      at: Number(raw.at) || now(),
      threadId: textValue(raw.threadId, 100),
      botId: textValue(raw.botId, 100),
      kind: textValue(raw.kind, 60) || 'tool',
      reason: textValue(raw.reason, 300),
      entries: Array.isArray(raw.entries)
        ? raw.entries
            .filter((item) => item && typeof item === 'object')
            .slice(0, 40)
            .map((item) => ({
              original: textValue(item.original, 1_000),
              backup: textValue(item.backup, 1_000),
              type: textValue(item.type, 20),
              bytes: Number(item.bytes) || 0,
              skipped: textValue(item.skipped, 200),
            }))
        : [],
      bytes: Number(raw.bytes) || 0,
      status: textValue(raw.status, 40) || 'partial',
      restoredAt: Number(raw.restoredAt) || 0,
    }
  }

  function normalizeRun(raw, botIds, threadIds) {
    if (!raw || typeof raw !== 'object') return null
    const threadId = textValue(raw.threadId, 100)
    if (!threadIds.has(threadId)) return null
    const status = ['running', 'success', 'failed', 'aborted'].includes(raw.status) ? raw.status : 'failed'
    return {
      id: textValue(raw.id, 100) || `run-${crypto.randomUUID()}`,
      threadId,
      botId: botIds.has(raw.botId) ? raw.botId : DEFAULT_BOT_ID,
      prompt: textValue(raw.prompt, 8_000),
      startedAt: Number(raw.startedAt) || now(),
      endedAt: Number(raw.endedAt) || 0,
      status,
      reason: textValue(raw.reason, 120),
      steps: Number(raw.steps) || 0,
      toolCalls: Number(raw.toolCalls) || 0,
      errors: Number(raw.errors) || 0,
      summary: textValue(raw.summary, 4_000),
      evidence: Array.isArray(raw.evidence)
        ? raw.evidence
            .filter((item) => item && typeof item === 'object')
            .slice(0, 20)
            .map((item) => ({
              name: textValue(item.name, 80),
              output: textValue(item.output, 1_200),
            }))
        : [],
      verification: normalizeVerification(raw.verification),
      tools: Array.isArray(raw.tools)
        ? raw.tools
            .filter((item) => item && typeof item === 'object')
            .slice(0, 30)
            .map((item) => ({
              name: textValue(item.name, 80),
              args: textValue(item.args, 400),
            }))
        : [],
    }
  }

  function normalizeVerification(raw) {
    if (!raw || typeof raw !== 'object') return null
    const status = ['passed', 'needs_review', 'failed'].includes(raw.status) ? raw.status : 'needs_review'
    return {
      status,
      method: textValue(raw.method, 40) || 'rules',
      note: textValue(raw.note, 1_000),
      at: Number(raw.at) || now(),
      checks: Array.isArray(raw.checks)
        ? raw.checks
            .filter((item) => item && typeof item === 'object')
            .slice(0, 20)
            .map((item) => ({
              name: textValue(item.name, 80),
              ok: item.ok === true,
              detail: textValue(item.detail, 300),
            }))
        : [],
    }
  }

  function normalizeSkill(raw, botIds, threadIds) {
    if (!raw || typeof raw !== 'object') return null
    const title = textValue(raw.title, 120)
    const prompt = textValue(raw.prompt, 16_000)
    if (!title || !prompt) return null
    return {
      id: textValue(raw.id, 100) || `skill-${crypto.randomUUID()}`,
      botId: botIds.has(raw.botId) ? raw.botId : DEFAULT_BOT_ID,
      title,
      prompt,
      steps: Array.isArray(raw.steps)
        ? raw.steps.filter((step) => typeof step === 'string').slice(0, 24).map((step) => step.slice(0, 400))
        : [],
      workflow: Array.isArray(raw.workflow)
        ? raw.workflow
            .filter((step) => step && typeof step === 'object')
            .slice(0, 24)
            .map((step) => ({
              tool: textValue(step.tool, 80),
              args: textValue(step.args, 1_000),
            }))
        : [],
      params: Array.isArray(raw.params)
        ? raw.params
            .filter((param) => param && typeof param === 'object')
            .slice(0, 8)
            .map((param) => ({
              name: textValue(param.name, 40),
              example: textValue(param.example, 300),
            }))
        : [],
      createdAt: Number(raw.createdAt) || now(),
      updatedAt: Number(raw.updatedAt) || now(),
      uses: Number(raw.uses) || 0,
      successes: Number(raw.successes) || 0,
      failures: Number(raw.failures) || 0,
      lastUsedAt: Number(raw.lastUsedAt) || 0,
      sourceThreadId: threadIds.has(raw.sourceThreadId) ? raw.sourceThreadId : null,
      auto: raw.auto === true,
    }
  }

  function botById(id) {
    return state.bots.find((bot) => bot.id === id) || state.bots[0]
  }

  function activeBot() {
    return botById(state.activeBotId)
  }

  function publicBot(bot) {
    return {
      id: bot.id,
      name: bot.name,
      emoji: bot.emoji,
      tagline: bot.tagline,
      persona: bot.persona,
      presetId: bot.presetId,
      provider: bot.provider,
      model: bot.model,
      modelLabel: prettyModel(bot.model),
      reasoningEffort: bot.reasoningEffort,
      workspace: botWorkspace(bot),
      workspaceOverride: bot.workspace || '',
      role: bot.role === 'lead' ? 'lead' : 'member',
      privilege: bot.privilege || 'standard',
      autonomy: bot.autonomy || 'interactive',
      memoryPath: botMemoryFile(bot),
      createdAt: bot.createdAt,
      updatedAt: bot.updatedAt,
    }
  }

  function removeTree(target) {
    if (!target) return false
    try {
      fs.rmSync(target, { recursive: true, force: true, maxRetries: 3, retryDelay: 80 })
      return true
    } catch {
      /* Git objects are read-only on Windows; clear the flag and retry. */
    }
    try {
      const walk = (current) => {
        const info = fs.lstatSync(current)
        if (info.isDirectory()) {
          for (const entry of fs.readdirSync(current)) walk(path.join(current, entry))
        } else {
          try {
            fs.chmodSync(current, 0o666)
          } catch {
            /* best effort */
          }
        }
      }
      walk(target)
      fs.rmSync(target, { recursive: true, force: true })
      return true
    } catch {
      return false
    }
  }

  function memoryRepoDir(bot) {
    return path.join(stateDir, 'memory', bot?.id || DEFAULT_BOT_ID)
  }

  function legacyMemoryFile(bot) {
    if (!bot || bot.id === DEFAULT_BOT_ID) return memoryFile
    return path.join(stateDir, 'bots', bot.id, 'memory.md')
  }

  function botMemoryFile(bot) {
    return path.join(memoryRepoDir(bot), 'memory.md')
  }

  function botWorkspace(bot) {
    const value = bot?.workspace
    if (isAbsoluteDirectory(value)) {
      try {
        fs.mkdirSync(value, { recursive: true })
        return value
      } catch {
        /* fall through to the shared workspace */
      }
    }
    return getWorkspace()
  }

  let lastStateBackupAt = 0

  function backupStateIfNeeded() {
    if (!fs.existsSync(stateFile)) return
    if (now() - lastStateBackupAt < STATE_BACKUP_MS) return
    lastStateBackupAt = now()
    try {
      fs.mkdirSync(stateDir, { recursive: true })
      const backup = path.join(stateDir, `state-backup-${lastStateBackupAt}.json`)
      fs.copyFileSync(stateFile, backup)
      const backups = fs.readdirSync(stateDir)
        .filter((name) => /^state-backup-\d+\.json$/.test(name))
        .sort()
      while (backups.length > MAX_STATE_BACKUPS) {
        fs.rmSync(path.join(stateDir, backups.shift()), { force: true })
      }
    } catch (error) {
      console.error('[dsh-bot] cannot back up state', messageOf(error))
    }
  }

  function saveStateNow() {
    try {
      backupStateIfNeeded()
      const tmp = `${stateFile}.tmp`
      fs.writeFileSync(tmp, JSON.stringify(state, null, 2), 'utf8')
      fs.renameSync(tmp, stateFile)
    } catch (error) {
      console.error('[dsh-bot] cannot save state', error)
    }
  }

  function writeRuntimeInfo() {
    try {
      const origin = webOrigin || 'http://127.0.0.1:60183'
      fs.writeFileSync(
        path.join(stateDir, 'runtime.json'),
        JSON.stringify({ apiBase: `${origin}${API_PREFIX}`, updatedAt: now() }, null, 2),
        'utf8',
      )
    } catch (error) {
      console.error('[dsh-bot] cannot write runtime info', messageOf(error))
    }
  }

  function saveStateSoon() {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      saveTimer = null
      saveStateNow()
    }, 350)
  }

  function createThreadRecord(title = '', botId = activeBot()?.id || DEFAULT_BOT_ID, kind = 'task', routineId = null, options = {}) {
    const stamp = now()
    const thread = {
      id: newThreadId(),
      sessionId: newSessionId(),
      botId: botById(botId).id,
      title,
      createdAt: stamp,
      updatedAt: stamp,
      created: false,
      presetId: null,
      kind: kind === 'routine' ? 'routine' : 'task',
      channelId: null,
      memberIds: [],
      leaderId: null,
      emoji: '◈',
      messages: [],
      assignmentId: null,
      pinned: false,
      order: 0,
      archived: false,
      pinnedMessage: null,
      pinnedMessages: [],
      modelProvider: null,
      modelName: null,
      reasoningEffort: null,
      routineId,
      skillId: null,
      error: null,
      checkpoint: null,
      ...options,
    }
    state.threads.unshift(thread)
    pruneThreads()
    if (options.setActive !== false) state.lastThreadId = thread.id
    saveStateSoon()
    return thread
  }

  function pruneThreads() {
    if (state.threads.length <= MAX_THREADS) return
    for (let index = state.threads.length - 1; index >= 0 && state.threads.length > MAX_THREADS; index -= 1) {
      if (state.threads[index].kind === 'group') continue
      state.threads.splice(index, 1)
    }
  }

  function publicRun(run) {
    return {
      id: run.id,
      threadId: run.threadId,
      botId: run.botId,
      prompt: run.prompt,
      startedAt: run.startedAt,
      endedAt: run.endedAt,
      status: run.status,
      reason: run.reason,
      steps: run.steps,
      toolCalls: run.toolCalls,
      errors: run.errors,
      summary: run.summary,
      verification: run.verification,
      evidenceCount: (run.evidence || []).length,
      inputTokens: run.inputTokens || 0,
      outputTokens: run.outputTokens || 0,
      budgetExceeded: Boolean(run.budgetExceeded),
      budgetReason: run.budgetReason || '',
    }
  }

  function publicSkill(skill) {
    return {
      id: skill.id,
      botId: skill.botId,
      title: skill.title,
      prompt: skill.prompt,
      steps: skill.steps,
      workflow: skill.workflow,
      params: skill.params,
      createdAt: skill.createdAt,
      updatedAt: skill.updatedAt,
      uses: skill.uses,
      successes: skill.successes || 0,
      failures: skill.failures || 0,
      lastUsedAt: skill.lastUsedAt,
      sourceThreadId: skill.sourceThreadId,
      auto: skill.auto,
    }
  }

  function skillsForBot(botId) {
    return state.skills
      .filter((skill) => skill.botId === botId)
      .sort((a, b) => b.updatedAt - a.updatedAt)
  }

  function qualityForBot(botId) {
    const threadIds = new Set(state.threads.map((thread) => thread.id))
    const runs = state.runs.filter((run) => run.botId === botId && threadIds.has(run.threadId))
    const finished = runs.filter((run) => run.status !== 'running')
    const success = finished.filter((run) => run.status === 'success').length
    const failed = finished.length - success
    const verified = finished.filter((run) => run.verification?.status === 'passed').length
    const needsReview = finished.filter((run) => run.verification?.status === 'needs_review').length
    return {
      total: finished.length,
      success,
      failed,
      verified,
      needsReview,
      rate: finished.length === 0 ? null : Math.round((success / finished.length) * 100),
      verifiedRate: finished.length === 0 ? null : Math.round((verified / finished.length) * 100),
      recent: runs.slice(0, 16).map(publicRun),
    }
  }

  function auditArgsSummary(name, args) {
    if (!args || typeof args !== 'object') return ''
    if (name === 'write' || name === 'edit') {
      return JSON.stringify({
        file_path: args.file_path,
        content_bytes: typeof args.content === 'string' ? Buffer.byteLength(args.content) : undefined,
        old_bytes: typeof args.old_string === 'string' ? Buffer.byteLength(args.old_string) : undefined,
      })
    }
    if (name === 'pwsh') {
      return JSON.stringify({ description: args.description, command: truncate(args.command, 3_000), workdir: args.workdir })
    }
    if (name === 'run_code') {
      return JSON.stringify({ description: args.description, code: truncate(args.code, 3_000) })
    }
    return truncate(JSON.stringify(args), 2_000)
  }

  function commandTextFor(name, args) {
    if (!args || typeof args !== 'object') return ''
    if (name === 'pwsh') return String(args.command || '')
    if (name === 'run_code') return String(args.code || '')
    return ''
  }

  function collectTargets(name, args, cwd) {
    const targets = []
    const add = (value) => {
      const text = String(value || '').trim().replace(/^["']|["']$/g, '')
      if (!text || /^https?:\/\//i.test(text) || /^HK(LM|CU|CR|U):/i.test(text)) return
      const target = path.isAbsolute(text) ? text : path.resolve(cwd, text)
      if (target.startsWith(snapshotRoot)) return
      if (!targets.includes(target)) targets.push(target)
    }
    if (args && typeof args === 'object') {
      for (const key of ['file_path', 'path', 'target', 'destination', 'source']) {
        if (typeof args[key] === 'string') add(args[key])
      }
    }
    const text = commandTextFor(name, args)
    if (!text) return targets
    for (const match of text.matchAll(/["']([A-Za-z]:\\[^"']+)["']/g)) add(match[1])
    for (const match of text.matchAll(/(?:^|\s)([A-Za-z]:\\[^\s"'|<>]+)/g)) add(match[1])
    for (const match of text.matchAll(/(?:Remove-Item|Clear-Content|Set-Content|Out-File|Move-Item|del|erase|rmdir|rd)\s+(?:-[A-Za-z]+\s+)*["']?([A-Za-z]:\\[^\s"';|]+)/gi)) add(match[1])
    return targets
  }

  function measurePath(target, limit) {
    let total = 0
    let count = 0
    const walk = (current) => {
      const info = fs.lstatSync(current)
      total += info.size
      count += 1
      if (total > limit || count > 50_000) throw new Error('SNAPSHOT_TOO_LARGE')
      if (info.isDirectory()) {
        for (const entry of fs.readdirSync(current)) walk(path.join(current, entry))
      }
    }
    walk(target)
    return { total, count }
  }

  function collectSystemTargets(text) {
    const items = []
    const seen = new Set()
    const add = (item) => {
      const key = `${item.type}:${String(item.value).toLowerCase()}`
      if (seen.has(key)) return
      seen.add(key)
      items.push(item)
    }
    for (const match of text.matchAll(/\breg(?:\.exe)?\s+(?:delete|add)\s+["']?((?:HKLM|HKCU|HKCR|HKU|HKCC)(?:\\[^\s"']+)*)/gi)) {
      add({ type: 'registry', value: match[1].replace(/["']$/, '') })
    }
    for (const match of text.matchAll(/\bsc(?:\.exe)?\s+(?:delete|config|start|stop)\s+["']?([A-Za-z0-9_.-]+)/gi)) {
      add({ type: 'service', value: match[1] })
    }
    for (const match of text.matchAll(/\b(?:Stop-Service|Set-Service)\s+(?:-Name\s+)?["']?([A-Za-z0-9_.-]+)/gi)) {
      add({ type: 'service', value: match[1] })
    }
    if (/\b(?:Remove-NetFirewallRule|Set-NetFirewallRule|New-NetFirewallRule|netsh\s+advfirewall\s+(?:firewall\s+(?:add|delete|set)|import))/i.test(text)) {
      add({ type: 'firewall', value: 'Windows Firewall' })
    }
    return items
  }

  function captureCommand(file, args, timeout = 20_000) {
    try {
      const stdout = execFileSync(file, args, { timeout, windowsHide: true, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
      return { ok: true, stdout: String(stdout || '') }
    } catch (error) {
      return { ok: false, error: messageOf(error), stdout: String(error?.stdout || '') }
    }
  }

  function adminCapture(command, timeout = 60_000) {
    const python = process.env.DSH_PYTHON || 'python'
    const result = captureCommand(python, [adminScript, '--command', command, '--timeout', String(Math.max(20, Math.ceil(timeout / 1000)))], timeout + 5_000)
    try {
      const data = JSON.parse(String(result.stdout || '').trim().split(/\r?\n/).filter(Boolean).pop())
      if (data.exitCode === 0) return { ok: true, stdout: data.output || '' }
      return { ok: false, error: data.stderr || data.error || `elevated exit ${data.exitCode}` }
    } catch {
      return { ok: false, error: result.error || 'admin helper failed' }
    }
  }

  function snapshotSystemEntries(dataDir, systemTargets) {
    const entries = []
    const safe = (value) => String(value || 'item').replace(/[^A-Za-z0-9._-]+/g, '_').slice(0, 80)
    for (const target of systemTargets) {
      const index = entries.length + 1
      if (target.type === 'registry') {
        const key = target.value
        const backup = path.join(dataDir, `${index}-registry-${safe(key)}.reg`)
        const query = captureCommand('reg.exe', ['query', key])
        if (!query.ok) {
          entries.push({ original: key, backup: '', type: 'registry', existed: false, bytes: 0, skipped: 'key not found; restore will delete it' })
          continue
        }
        let exported = captureCommand('reg.exe', ['export', key, backup, '/y'])
        if (!exported.ok && /^HKLM|^HKCR|^HKU/i.test(key)) {
          exported = adminCapture(`reg export ${JSON.stringify(key)} ${JSON.stringify(backup)} /y`, 30_000)
        }
        if (!exported.ok) {
          try { fs.rmSync(backup, { force: true }) } catch { /* ignore */ }
          entries.push({ original: key, backup: '', type: 'registry', existed: true, bytes: 0, skipped: `export failed: ${exported.error}` })
          continue
        }
        const bytes = fs.existsSync(backup) ? fs.statSync(backup).size : 0
        entries.push({ original: key, backup, type: 'registry', existed: true, bytes, skipped: '' })
        continue
      }
      if (target.type === 'firewall') {
        const backup = path.join(dataDir, `${index}-firewall.wfw`)
        let exported = captureCommand('netsh.exe', ['advfirewall', 'export', backup], 30_000)
        if (!exported.ok) exported = adminCapture(`netsh advfirewall export ${JSON.stringify(backup)}`, 45_000)
        if (!exported.ok || !fs.existsSync(backup)) {
          try { fs.rmSync(backup, { force: true }) } catch { /* ignore */ }
          entries.push({ original: 'Windows Firewall', backup: '', type: 'firewall', bytes: 0, skipped: `export failed: ${exported.error || 'no file'}` })
          continue
        }
        entries.push({ original: 'Windows Firewall', backup, type: 'firewall', bytes: fs.statSync(backup).size, skipped: '' })
        continue
      }
      if (target.type === 'service') {
        const name = target.value
        const qc = captureCommand('sc.exe', ['qc', name])
        if (!qc.ok) {
          entries.push({ original: name, backup: '', type: 'service', existed: false, bytes: 0, skipped: 'service not found' })
          continue
        }
        const query = captureCommand('sc.exe', ['query', name])
        const backup = path.join(dataDir, `${index}-service-${safe(name)}.txt`)
        const payload = `QUERY\n${query.stdout || ''}\nQC\n${qc.stdout || ''}`
        fs.writeFileSync(backup, payload, 'utf8')
        entries.push({
          original: name,
          backup,
          type: 'service',
          existed: true,
          bytes: Buffer.byteLength(payload),
          running: /RUNNING/i.test(query.stdout || ''),
          skipped: '',
        })
      }
    }
    return entries
  }

  function serviceRun(args, timeout = 30_000) {
    let result = captureCommand('sc.exe', args, timeout)
    if (result.ok) return result
    return adminCapture(`sc.exe ${args.map((item) => JSON.stringify(item)).join(' ')}`, timeout)
  }

  function restoreService(entry) {
    const raw = entry.backup && fs.existsSync(entry.backup) ? fs.readFileSync(entry.backup, 'utf8') : ''
    const qc = raw.split('\nQC\n').slice(-1)[0] || raw
    const start = (qc.match(/START_TYPE\s*:\s*\d+\s+(\w+)/i) || [])[1] || ''
    const binary = (qc.match(/BINARY_PATH_NAME\s*:\s*(.+)/i) || [])[1]?.trim() || ''
    const display = (qc.match(/DISPLAY_NAME\s*:\s*(.+)/i) || [])[1]?.trim() || entry.original
    const startMap = { AUTO_START: 'auto', DEMAND_START: 'demand', DISABLED: 'disabled', BOOT_START: 'auto', SYSTEM_START: 'auto' }
    const startType = startMap[start.toUpperCase()] || 'demand'
    const exists = captureCommand('sc.exe', ['query', entry.original]).ok
    if (!exists) {
      const created = serviceRun(['create', entry.original, `binPath=${binary || 'C:\\Windows\\System32\\cmd.exe'}`, `start=${startType}`, `DisplayName=${display}`])
      if (!created.ok) throw new Error(created.error || 'sc create failed')
    } else {
      const configured = serviceRun(['config', entry.original, `start=${startType}`, `binPath=${binary || 'C:\\Windows\\System32\\cmd.exe'}`])
      if (!configured.ok) throw new Error(configured.error || 'sc config failed')
    }
    if (entry.running) serviceRun(['start', entry.original], 30_000)
  }

  function createSnapshot(rec, targets, reason, systemTargets = []) {
    const unique = []
    for (const target of targets) {
      const normalized = path.resolve(target)
      if (unique.some((item) => normalized === item || normalized.startsWith(`${item}${path.sep}`))) continue
      unique.push(normalized)
    }
    const systemKeys = systemTargets.map((item) => `${item.type}:${item.value}`)
    if (unique.length === 0 && systemKeys.length === 0) return null
    // Do not create a new copy for the same target within 30 seconds.
    const recent = systemKeys.length === 0
      ? state.snapshots.find(
          (snapshot) => snapshot.threadId === rec.thread.id && now() - snapshot.at < 30_000 &&
            snapshot.entries.some((entry) => unique.includes(entry.original)),
        )
      : null
    if (recent) return recent
    const id = `snap-${now()}-${crypto.randomUUID().slice(0, 8)}`
    const dir = path.join(snapshotRoot, id)
    const dataDir = path.join(dir, 'data')
    const entries = []
    let bytes = 0
    try {
      fs.mkdirSync(dataDir, { recursive: true })
      for (const target of unique) {
        let info
        try {
          info = fs.statSync(target)
        } catch {
          continue
        }
        const index = entries.length + 1
        const backup = path.join(dataDir, `${index}-${path.basename(target) || 'item'}`)
        if (info.isFile()) {
          if (info.size > SNAPSHOT_MAX_BYTES) {
            entries.push({ original: target, backup: '', type: 'file', bytes: info.size, skipped: 'file too large' })
            continue
          }
          try {
            fs.copyFileSync(target, backup)
            entries.push({ original: target, backup, type: 'file', bytes: info.size, skipped: '' })
            bytes += info.size
          } catch (error) {
            entries.push({ original: target, backup: '', type: 'file', bytes: info.size, skipped: messageOf(error) })
          }
          continue
        }
        if (info.isDirectory()) {
          try {
            const measured = measurePath(target, SNAPSHOT_MAX_BYTES)
            fs.cpSync(target, backup, { recursive: true, force: true })
            entries.push({ original: target, backup, type: 'dir', bytes: measured.total, skipped: '' })
            bytes += measured.total
          } catch (error) {
            entries.push({ original: target, backup: '', type: 'dir', bytes: info.size, skipped: messageOf(error) })
          }
        }
      }
      for (const entry of snapshotSystemEntries(dataDir, systemTargets)) {
        entries.push(entry)
        bytes += Number(entry.bytes) || 0
      }
    } catch (error) {
      entries.push({ original: unique.join('; '), backup: '', type: 'error', bytes: 0, skipped: messageOf(error) })
    }
    if (entries.length === 0) {
      fs.rmSync(dir, { recursive: true, force: true })
      return null
    }
    const snapshot = {
      id,
      at: now(),
      threadId: rec.thread.id,
      botId: rec.thread.botId,
      kind: 'tool',
      reason: textValue(reason, 300),
      entries,
      bytes,
      kind: systemKeys.length ? 'system' : 'tool',
      status: entries.some((entry) => entry.skipped) ? 'partial' : 'complete',
      restoredAt: 0,
    }
    try {
      fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(snapshot, null, 2), 'utf8')
    } catch {
      /* manifest is optional; state is authoritative */
    }
    state.snapshots.unshift(snapshot)
    while (state.snapshots.length > MAX_SNAPSHOTS) {
      const old = state.snapshots.pop()
      try {
        fs.rmSync(path.join(snapshotRoot, old.id), { recursive: true, force: true })
      } catch {
        /* best effort */
      }
    }
    saveStateSoon()
    return snapshot
  }

  function restoreSnapshot(id) {
    const snapshot = state.snapshots.find((item) => item.id === id)
    if (!snapshot) throw new Error('快照不存在')
    const errors = []
    let restored = 0
    for (const entry of snapshot.entries) {
      try {
        if (entry.type === 'registry') {
          if (entry.existed === false) {
            let deleted = captureCommand('reg.exe', ['delete', entry.original, '/f'])
            if (!deleted.ok) deleted = adminCapture(`reg delete ${JSON.stringify(entry.original)} /f`, 30_000)
            restored += 1
            continue
          }
          if (!entry.backup || !fs.existsSync(entry.backup)) throw new Error('注册表备份不存在')
          let deleted = captureCommand('reg.exe', ['delete', entry.original, '/f'])
          if (!deleted.ok) deleted = adminCapture(`reg delete ${JSON.stringify(entry.original)} /f`, 30_000)
          let imported = captureCommand('reg.exe', ['import', entry.backup])
          if (!imported.ok) imported = adminCapture(`reg import ${JSON.stringify(entry.backup)}`, 45_000)
          if (!imported.ok) throw new Error(imported.error || 'reg import failed')
          restored += 1
          continue
        }
        if (entry.type === 'firewall') {
          if (!entry.backup || !fs.existsSync(entry.backup)) throw new Error('防火墙备份不存在')
          let imported = captureCommand('netsh.exe', ['advfirewall', 'import', entry.backup], 30_000)
          if (!imported.ok) imported = adminCapture(`netsh advfirewall import ${JSON.stringify(entry.backup)}`, 45_000)
          if (!imported.ok) throw new Error(imported.error || 'netsh import failed')
          restored += 1
          continue
        }
        if (entry.type === 'service') {
          if (entry.existed === false) continue
          restoreService(entry)
          restored += 1
          continue
        }
        if (!entry.backup || entry.skipped) continue
        if (!fs.existsSync(entry.backup)) throw new Error('备份文件不存在')
        fs.mkdirSync(path.dirname(entry.original), { recursive: true })
        fs.rmSync(entry.original, { recursive: true, force: true })
        fs.cpSync(entry.backup, entry.original, { recursive: true, force: true })
        restored += 1
      } catch (error) {
        errors.push(`${entry.original}: ${messageOf(error)}`)
      }
    }
    snapshot.restoredAt = now()
    appendAudit({
      phase: 'restore',
      threadId: snapshot.threadId,
      botId: snapshot.botId,
      tool: 'snapshot',
      risk: true,
      action: 'restore',
      args: snapshot.reason,
      snapshotId: snapshot.id,
      ok: errors.length === 0,
      result: errors.length ? errors.join('; ') : `restored ${restored} path(s)`,
    }, true)
    saveStateNow()
    return { ok: errors.length === 0, restored, errors, snapshot }
  }

  function appendAudit(entry, persistState = true) {
    const record = {
      id: `audit-${now()}-${crypto.randomUUID().slice(0, 8)}`,
      time: now(),
      ...entry,
    }
    try {
      fs.mkdirSync(path.dirname(auditFile), { recursive: true })
      fs.appendFileSync(auditFile, `${JSON.stringify(record)}\n`, 'utf8')
    } catch {
      /* audit file is best effort */
    }
    if (persistState) {
      state.audits.unshift(record)
      if (state.audits.length > MAX_AUDITS) state.audits.length = MAX_AUDITS
      saveStateSoon()
    }
    return record
  }

  const remoteState = { lastMessage: '', lastAt: 0, busy: false }
  let notifyInFlight = false

  function decodeProcessOutput(value) {
    const raw = Buffer.isBuffer(value) ? value : Buffer.from(String(value || ''), 'utf8')
    if (raw.length >= 2 && ((raw[0] === 0xff && raw[1] === 0xfe) || (raw[1] === 0x00 && raw[3] === 0x00))) {
      return raw.toString('utf16le').replace(/^\uFEFF/, '')
    }
    return raw.toString('utf8').replace(/^\uFEFF/, '')
  }

  function execJson(file, args, timeout = 30) {
    return new Promise((resolve) => {
      execFile(file, args, { timeout, windowsHide: true, encoding: 'buffer' }, (error, stdout, stderr) => {
        const text = decodeProcessOutput(stdout).trim()
        let data = null
        try {
          data = JSON.parse(text.split(/\r?\n/).filter(Boolean).pop())
        } catch {
          data = null
        }
        resolve({ error, stdout: text, stderr: decodeProcessOutput(stderr), data })
      })
    })
  }

  async function readQQChat() {
    const notify = state.notify
    if (!notify.remoteControl || notify.method !== 'desktop' || !notify.contact) {
      return { ok: false, error: 'remote control disabled or contact missing' }
    }
    const result = await execJson(
      process.env.DSH_PYTHON || 'python',
      [qqUiaPy, '--contact', notify.contact, '--tail', '20'],
      40,
    )
    if (!result.data?.b64) {
      return {
        ok: false,
        error: 'UIA helper failed',
        detail: [result.error ? messageOf(result.error) : '', result.stderr || '', result.stdout || ''].filter(Boolean).join(' | ').slice(-500),
      }
    }
    try {
      return JSON.parse(Buffer.from(result.data.b64, 'base64').toString('utf8'))
    } catch {
      return { ok: false, error: 'bad UIA payload' }
    }
  }

  function remoteThread() {
    for (const rec of live.values()) {
      if (rec.agent.status === 'running') return rec.thread
    }
    return threadById(state.lastThreadId) || firstThreadForBot(activeBot().id) || state.threads[0] || null
  }

  function remoteStatus(thread) {
    const rec = live.get(thread.id)
    const running = Boolean(rec && rec.agent.status === 'running')
    const run = rec?.run || state.runs.find((item) => item.threadId === thread.id)
    return [
      `任务：${thread.title || '未命名'}`,
      `状态：${running ? '运行中' : '空闲'}`,
      `Bot：${botById(thread.botId).name}`,
      `最后：${truncate(rec?.lastAssistantText || run?.summary || '无', 300)}`,
      `时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })}`,
    ].join('\n')
  }

  async function remoteCommand(text) {
    const raw = String(text || '').trim()
    const match = raw.match(/^(?:dsh\s*)?[\/／]\s*(status|stop|continue|retry|状态|停止|继续|重试)\b/i) ||
      raw.match(/^(?:dsh\s*)?[\/／]\s*(状态|停止|继续|重试)/)
    if (!match) return false
    const action = match[1].toLowerCase()
    const thread = remoteThread()
    if (!thread) {
      sendQQNotification('DSH 远程控制', '当前没有可控制的任务。')
      return true
    }
    const rec = live.get(thread.id)
    if (action === 'status' || action === '状态') {
      sendQQNotification('DSH 远程状态', remoteStatus(thread))
      return true
    }
    if (action === 'stop' || action === '停止') {
      if (rec) {
        try {
          rec.agent.cancel({ kind: 'user' })
          rec.running = false
          if (rec.run) closeRun(rec, 'aborted', now(), 'QQ /stop')
        } catch {
          /* agent may already be stopping */
        }
      }
      sendQQNotification('DSH 远程控制', `已停止：${thread.title || thread.id}`)
      return true
    }
    if (action === 'continue' || action === '继续') {
      const liveRec = await ensureAgent(thread)
      const text = thread.checkpoint
        ? `从断点继续（QQ 远程指令）：\n${thread.checkpoint.prompt}\n最后动作：${thread.checkpoint.lastTool || ''}\n错误：${thread.checkpoint.error || ''}\n请继续完成，不要从头重做。`
        : '继续上一个任务。先检查当前状态，不要从头重做；完成后给结果。'
      thread.checkpoint = null
      const message = { id: crypto.randomUUID(), role: 'user', content: [{ type: 'text', text }], source: { kind: 'user' } }
      if (liveRec.agent.status === 'running') liveRec.agent.steer(message)
      else liveRec.agent.followup(message)
      sendQQNotification('DSH 远程控制', `已继续：${thread.title || thread.id}`)
      return true
    }
    if (action === 'retry' || action === '重试') {
      const run = state.runs.find((item) => item.threadId === thread.id)
      if (!run?.prompt) {
        sendQQNotification('DSH 远程控制', '没有可重试的任务。')
        return true
      }
      const liveRec = await ensureAgent(thread)
      thread.checkpoint = null
      const message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: [{ type: 'text', text: `重新执行以下任务（QQ 远程指令）：\n${run.prompt}` }],
        source: { kind: 'user' },
      }
      if (liveRec.agent.status === 'running') liveRec.agent.steer(message)
      else liveRec.agent.followup(message)
      sendQQNotification('DSH 远程控制', `已重试：${thread.title || thread.id}`)
      return true
    }
    return false
  }

  async function checkRemoteControl() {
    const notify = state.notify
    if (!notify.enabled || !notify.remoteControl || notify.method !== 'desktop' || remoteState.busy) return
    remoteState.busy = true
    try {
      const chat = await readQQChat()
      if (!chat?.ok || chat.title !== notify.contact || !Array.isArray(chat.messages)) return
      const content = [...chat.messages].reverse().find((item) => item && !/^\d{1,2}:\d{2}$/.test(item))
      if (!content) return
      if (content === remoteState.lastMessage && now() - remoteState.lastAt < 60_000) return
      if (!/^(?:dsh\s*)?[\/／]\s*(status|stop|continue|retry|状态|停止|继续|重试)/i.test(content)) return
      remoteState.lastMessage = content
      remoteState.lastAt = now()
      await remoteCommand(content)
    } finally {
      remoteState.busy = false
    }
  }

  function publicNotify() {
    const notify = state.notify
    return {
      enabled: notify.enabled,
      method: notify.method,
      email: notify.email,
      to: notify.to,
      contact: notify.contact,
      remoteControl: notify.remoteControl,
      successMode: notify.successMode,
      quietStart: notify.quietStart,
      quietEnd: notify.quietEnd,
      minIntervalSec: notify.minIntervalSec,
      authCodeSet: Boolean(notify.authCode),
      lastSentAt: notify.lastSentAt,
      lastError: notify.lastError,
    }
  }

  function updateNotify(body) {
    const current = state.notify
    const next = normalizeNotify({ ...current, ...(body || {}) })
    if (body && !Object.prototype.hasOwnProperty.call(body, 'authCode')) next.authCode = current.authCode
    state.notify = next
    saveStateNow()
    return publicNotify()
  }

  function updateBudget(body) {
    state.budget = normalizeBudget({ ...(state.budget || defaultBudget()), ...(body || {}) })
    saveStateNow()
    return state.budget
  }

  function qqArgs(notify, subject, message) {
    const args = [
      notifyScript,
      '--method', notify.method,
      '--subject', subject,
      '--message', truncate(message, 4_000),
      '--contact', notify.contact || '文件传输助手',
    ]
    if (notify.method === 'smtp') {
      args.push('--email', notify.email || '', '--auth', notify.authCode || '', '--to', notify.to || '')
    }
    return args
  }

  function sendQQNotification(subject, message) {
    const notify = state.notify
    if (!notify.enabled) return
    if (notifyInFlight) return
    if (Date.now() - (notify.lastSentAt || 0) < (notify.minIntervalSec || 10) * 1000) return
    if (notify.method === 'smtp' && (!notify.email || !notify.authCode || !notify.to)) {
      notify.lastError = 'QQ 邮箱未配置完整（email/authCode/to）'
      saveStateSoon()
      return
    }
    const python = process.env.DSH_PYTHON || 'python'
    notifyInFlight = true
    execFile(python, qqArgs(notify, subject, message), { timeout: 45_000, windowsHide: true }, (error, stdout, stderr) => {
      notifyInFlight = false
      try {
        const lines = String(stdout || '').trim().split(/\r?\n/)
        const data = JSON.parse(lines[lines.length - 1])
        if (data.ok) {
          state.notify.lastSentAt = Date.now()
          state.notify.lastError = ''
        } else {
          state.notify.lastError = textValue(data.error || stderr, 500)
        }
      } catch {
        state.notify.lastError = textValue((stderr || '').trim() || (error ? messageOf(error) : '通知失败'), 500)
      }
      saveStateSoon()
    })
  }

  function testQQNotification() {
    const notify = state.notify
    if (notify.method === 'smtp' && (!notify.email || !notify.authCode || !notify.to)) {
      return Promise.resolve({ ok: false, error: 'QQ 邮箱未配置完整（email/authCode/to）' })
    }
    const python = process.env.DSH_PYTHON || 'python'
    return new Promise((resolve) => {
      execFile(python, qqArgs(notify, 'DSH 通知测试', '这是一条 DSH Bot QQ 通知测试。'), { timeout: 45_000, windowsHide: true }, (error, stdout, stderr) => {
        try {
          const lines = String(stdout || '').trim().split(/\r?\n/)
          resolve(JSON.parse(lines[lines.length - 1]))
        } catch {
          resolve({ ok: false, error: textValue((stderr || '').trim() || (error ? messageOf(error) : '测试失败'), 500) })
        }
      })
    })
  }

  function inQuietHours(notify) {
    if (!notify.quietStart || !notify.quietEnd) return false
    const [startH, startM] = notify.quietStart.split(':').map(Number)
    const [endH, endM] = notify.quietEnd.split(':').map(Number)
    const start = startH * 60 + startM
    const end = endH * 60 + endM
    const current = new Date()
    const minute = current.getHours() * 60 + current.getMinutes()
    return start <= end ? minute >= start && minute < end : minute >= start || minute < end
  }

  function notifyTask(rec, run, status) {
    if (!state.notify.enabled || !run) return
    const channel = rec.thread.channelId
      ? state.threads.find((thread) => thread.id === rec.thread.channelId)
      : null
    if (channel?.meeting) return
    if (status === 'success' && state.notify.successMode === 'failures') return
    if (status === 'success' && inQuietHours(state.notify)) return
    const bot = botById(rec.thread.botId)
    const line = status === 'success' ? '完成' : status === 'aborted' ? '中断' : status === 'blocked' ? '卡住' : '失败'
    const text = [
      `Bot：${bot.name}`,
      `任务：${truncate(run.prompt, 260)}`,
      `状态：${line}`,
      `结果：${truncate(run.summary || run.reason || '无最终回复', 700)}`,
      `工具：${run.toolCalls || 0} 次，错误：${run.errors || 0}`,
      `时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })}`,
    ].join('\n')
    sendQQNotification(`DSH ${line} · ${truncate(run.prompt, 40)}`, text)
  }

  function inspectToolExecution(rec, execution) {
    const name = String(execution?.name || 'tool')
    const args = execution?.arguments && typeof execution.arguments === 'object' ? execution.arguments : {}
    const cwd = botWorkspace(botById(rec.thread.botId))
    const text = commandTextFor(name, args)
    const systemTargets = collectSystemTargets(text)
    const destructive = /(\bRemove-Item\b|\bClear-Content\b|\bSet-Content\b|\bOut-File\b|\bMove-Item\b|\bdel\b|\berase\b|\brmdir\b|\brd\b|\breg\s+delete\b|\breg\s+add\b|\bRemove-NetFirewallRule\b|\bSet-NetFirewallRule\b|\bNew-NetFirewallRule\b|\bStop-Service\b|\bSet-Service\b|\bsc\s+(?:delete|config|start|stop)\b|\bformat\b|\bdiskpart\b|\bClear-Disk\b|\bInitialize-Disk\b)/i.test(text) || systemTargets.length > 0
    const fileWrite = name === 'write' || name === 'edit'
    const blocked =
      /\bformat\s+[A-Za-z]:/i.test(text) ||
      /\bdiskpart\b/i.test(text) ||
      /\bclear-disk\b/i.test(text) ||
      /\binitialize-disk\b/i.test(text) ||
      /\b(?:rd|rmdir)\s+\/s\s+\/q\s+[A-Za-z]:\\?\s*$/i.test(text)
    const risk = destructive || fileWrite
    const targets = risk ? collectTargets(name, args, cwd) : []
    if (blocked) {
      appendAudit({
        phase: 'call', threadId: rec.thread.id, botId: rec.thread.botId, tool: name,
        risk: true, action: 'blocked', args: auditArgsSummary(name, args), ok: false,
        result: 'blocked by destructive-operation gate', snapshotId: null,
      })
      return '安全闸门：这是磁盘/分区级破坏性操作，已拒绝。不要格式化磁盘、初始化磁盘或跑 diskpart；如果任务需要清理空间，改用删除具体缓存/回收站文件。'
    }
    let snapshot = null
    if (risk && (targets.length > 0 || systemTargets.length > 0)) {
      snapshot = createSnapshot(rec, targets, `${name}: ${auditArgsSummary(name, args).slice(0, 180)}`, systemTargets)
    }
    appendAudit({
      phase: 'call',
      threadId: rec.thread.id,
      botId: rec.thread.botId,
      tool: name,
      risk,
      action: risk ? 'snapshot' : 'call',
      args: auditArgsSummary(name, args),
      snapshotId: snapshot?.id || null,
      ok: true,
      result: snapshot ? `snapshot ${snapshot.status}` : '',
    })
    return undefined
  }

  function appendToolResultAudit(rec, event, item, result, failed) {
    appendAudit({
      phase: 'result',
      threadId: rec.thread.id,
      botId: rec.thread.botId,
      tool: item?.name || 'tool',
      risk: Boolean(item && (item.name === 'write' || item.name === 'edit' || /Remove-Item|format|diskpart/i.test(item.argsRaw || ''))),
      action: 'result',
      args: '',
      snapshotId: null,
      ok: !failed,
      result: truncate(result, 1_200),
    }, false)
  }

  function startRun(rec, prompt, time) {
    if (!rec) return null
    /* One user request is one run. DSH may fold turn/start and user/message in
       either order; never close a still-running run just because a second
       lifecycle event arrived. */
    if (rec.run && rec.run.status === 'running') return rec.run
    const text = textValue(prompt, 8_000)
    if (!text) return null
    const run = {
      id: `run-${crypto.randomUUID()}`,
      threadId: rec.thread.id,
      botId: rec.thread.botId,
      prompt: text,
      startedAt: time,
      endedAt: 0,
      status: 'running',
      reason: '',
      steps: 0,
      toolCalls: 0,
      errors: 0,
      summary: '',
      evidence: [],
      verification: null,
      tools: [],
      inputTokens: 0,
      outputTokens: 0,
      budget: { ...(state.budget || defaultBudget()) },
      budgetWarned: false,
      budgetExceeded: false,
      budgetReason: '',
    }
    rec.run = run
    rec.lastAssistantText = ''
    rec.lastTool = ''
    rec.thread.checkpoint = null
    state.runs.unshift(run)
    if (state.runs.length > MAX_RUNS) state.runs.length = MAX_RUNS
    saveStateSoon()
    return run
  }

  function acceptanceChecks(prompt, run) {
    const checks = []
    const haystack = `${run.summary || ''}\n${(run.evidence || []).map((item) => item.output).join('\n')}`
    for (const line of String(prompt || '').split(/\r?\n/)) {
      const index = line.search(/验收\s*[：:]/)
      if (index < 0) continue
      const rule = line.slice(index).replace(/^验收\s*[：:]\s*/, '').trim()
      if (!rule) continue
      let match = rule.match(/包含\s*["“']?([^"”'\n]+)["”']?/)
      if (match) {
        const expected = match[1].trim()
        checks.push({ name: '包含期望内容', ok: haystack.includes(expected), detail: expected })
        continue
      }
      match = rule.match(/不存在\s*["“']?([^"”'\n]+)["”']?/)
      if (match) {
        const target = match[1].trim()
        let ok = false
        try {
          ok = !fs.existsSync(target)
        } catch {
          ok = false
        }
        checks.push({ name: '文件不存在', ok, detail: target })
        continue
      }
      match = rule.match(/文件\s*["“']?([^"”'\n]+)["”']?/)
      if (match) {
        const target = match[1].trim()
        let ok = false
        try {
          ok = fs.existsSync(target)
        } catch {
          ok = false
        }
        checks.push({ name: '文件存在', ok, detail: target })
        continue
      }
      if (/退出码\s*0/.test(rule)) {
        checks.push({ name: '工具退出码 0', ok: (run.errors || 0) === 0, detail: `${run.errors || 0} errors` })
      }
    }
    return checks
  }

  function verifyRun(run) {
    const baseChecks = []
    baseChecks.push({ name: '本轮正常结束', ok: run.status === 'success', detail: run.reason || '' })
    const summary = String(run.summary || '').trim()
    baseChecks.push({ name: '有最终回复', ok: summary.length >= 8, detail: `${summary.length} chars` })
    baseChecks.push({ name: '无工具错误', ok: (run.errors || 0) === 0, detail: `${run.errors || 0} errors` })
    const contradiction =
      /(失败|无法完成|无法继续|出错|错误|failed|cannot|error)/i.test(summary) &&
      !/(已修复|已解决|已处理|fixed|resolved|success)/i.test(summary)
    baseChecks.push({ name: '最终回复无失败声明', ok: !contradiction, detail: contradiction ? 'summary reports failure' : '' })
    if (run.toolCalls > 0) {
      baseChecks.push({ name: '有工具证据', ok: (run.evidence || []).length > 0, detail: `${(run.evidence || []).length} results` })
    }
    const explicit = acceptanceChecks(run.prompt, run)
    const checks = [...baseChecks, ...explicit]
    const baseOk = baseChecks.every((check) => check.ok)
    let status = 'needs_review'
    if (run.status !== 'success' || summary.length < 8) status = 'failed'
    else if (explicit.length > 0 && explicit.every((check) => check.ok) && baseOk) status = 'passed'
    else if (explicit.some((check) => !check.ok) || (run.errors || 0) > 0) status = 'failed'
    else if (!baseOk) status = 'needs_review'
    return {
      status,
      method: 'rules',
      at: now(),
      note: explicit.length
        ? `${explicit.filter((check) => check.ok).length}/${explicit.length} 条显式验收通过`
        : '没有写显式验收条件；只确认了正常结束、无错误和有回复，语义正确性需要人工确认',
      checks,
    }
  }

  async function semanticVerify(run, thread) {
    const bot = botById(thread.botId)
    const presets = ctx.get('agentPresets')
    if (!presets?.resolve || !presets?.mount) return null
    let preset
    try {
      preset = await presets.resolve('minimal')
    } catch {
      try {
        preset = await presets.resolve(undefined)
      } catch {
        return null
      }
    }
    const sessionId = `verify-${crypto.randomUUID()}`
    const prompt = [
      '你是独立验收员。你只判断下面这个任务是否真的完成，不要重做任务，不要调用任何工具。',
      '验收标准：目标是否完成、最终回复是否有证据支持、是否和工具结果矛盾、是否遗漏关键步骤。',
      '只输出一个 JSON 对象，不要 Markdown：',
      '{"status":"passed|failed|needs_review","reason":"一句话理由"}',
      '',
      `任务目标：\n${truncate(run.prompt, 6000)}`,
      `最终回复：\n${truncate(run.summary, 4000)}`,
      `工具证据：\n${(run.evidence || []).slice(-10).map((item, index) => `${index + 1}. ${item.name}: ${truncate(item.output, 800)}`).join('\n') || '（无）'}`,
      `规则验收：${run.verification?.note || ''}`,
      `工具调用数：${run.toolCalls || 0}；错误数：${run.errors || 0}`,
    ].join('\n')
    let handle
    try {
      handle = await ctx.agents.create({
        sessionId,
        meta: { cwd: botWorkspace(bot) },
        ...(agentOptions(thread) ? { agentOptions: agentOptions(thread) } : {}),
        setup: async (agentCtx) => {
          try {
            await presets.mount(agentCtx, preset.id)
          } catch {
            /* bare verifier still works */
          }
          const systemPrompt = agentCtx.get('systemPrompt')
          if (systemPrompt) {
            systemPrompt.section({
              name: 'dsh-bot/verifier',
              order: 160,
              text: '你是独立验收员。只判断任务是否真的完成；不调用工具，不重做，只输出 JSON。',
              interpolate: false,
            })
          }
          const tools = agentCtx.get('tools')
          if (tools?.guard) {
            tools.guard(() => '验收阶段不允许调用工具；只根据给出的证据输出 JSON 判断。')
          }
        },
      })
      const message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: [{ type: 'text', text: prompt }],
        source: { kind: 'user' },
      }
      if (handle.agent.status === 'running') handle.agent.steer(message)
      else handle.agent.followup(message)
      const deadline = now() + 45_000
      let lastText = ''
      while (now() < deadline) {
        await delay(300)
        try {
          const events = handle.agent.session.snapshotEvents(0)
          for (const event of events) {
            if (event.type !== 'assistant/message') continue
            const text = textOf(event.data?.message?.content)
            if (text) lastText = text
          }
        } catch {
          /* keep polling */
        }
        if (handle.agent.status !== 'running' && lastText) break
      }
      const match = lastText.match(/\{[\s\S]*\}/)
      if (!match) return null
      const parsed = JSON.parse(match[0])
      const status = ['passed', 'failed', 'needs_review'].includes(parsed.status) ? parsed.status : 'needs_review'
      return {
        status,
        method: 'model',
        at: now(),
        note: textValue(parsed.reason, 1_000) || '模型验收',
        checks: run.verification?.checks || [],
      }
    } catch {
      return null
    } finally {
      try {
        await handle?.dispose?.()
      } catch {
        /* verifier is disposable */
      }
    }
  }

  function scheduleSemanticVerify(rec, run) {
    const bot = botById(rec.thread.botId)
    if (!run || run.status !== 'success' || run.verification?.status !== 'needs_review') return
    if (run.toolCalls < 1 || !run.summary) return
    run.verification = { ...(run.verification || {}), note: `${run.verification?.note || ''}（模型验收中）` }
    saveStateSoon()
    semanticVerify(run, rec.thread).then((result) => {
      if (!result) {
        run.verification = { ...(run.verification || {}), note: '模型验收不可用，待人工' }
        saveStateSoon()
        return
      }
      run.verification = result
      if (result.status === 'passed') {
        autoSkillFromRun(run)
      }
      saveStateSoon()
    }).catch(() => undefined)
  }

  function extractSkillParams(prompt, tools) {
    const text = `${prompt || ''}\n${(tools || []).map((tool) => tool.args).join('\n')}`
    const values = []
    for (const match of text.matchAll(/[A-Za-z]:\\[^\s"'<>|，。；;]+/g)) values.push(match[0])
    for (const match of text.matchAll(/https?:\/\/[^\s"'<>]+/g)) values.push(match[0])
    const seen = new Set()
    const params = []
    for (const value of values) {
      const cleaned = value.replace(/[),.;]+$/, '')
      if (cleaned.length < 4 || cleaned.length > 240 || seen.has(cleaned)) continue
      seen.add(cleaned)
      params.push({ name: `p${params.length + 1}`, example: cleaned })
      if (params.length >= 6) break
    }
    return params
  }

  function wantsConfirmation(text) {
    const value = String(text || '').trim()
    if (!value) return false
    if (/(已完成|搞定了|完成了|done|finished)/i.test(value) && !/(是否|要不要|需要你|请你|确认)/.test(value)) return false
    return (
      /(需要你|请你|是否要|要不要|是否继续|要我继续|等待你|请确认|确认一下|你希望|需要我|let me know|would you like|do you want|please confirm|should i)/i.test(value) ||
      /[?？]\s*$/.test(value)
    )
  }

  function checkRunBudget(rec) {
    const run = rec?.run
    if (!run || run.budgetExceeded) return
    const limits = run.budget || { maxMs: RUN_MAX_MS, maxTools: RUN_MAX_TOOLS, maxTokens: RUN_MAX_TOKENS }
    const elapsed = now() - (run.startedAt || now())
    const tokens = (run.inputTokens || 0) + (run.outputTokens || 0)
    const ratios = [
      { name: '时间', value: elapsed, max: limits.maxMs, text: `${Math.round(elapsed / 60_000)} 分钟` },
      { name: '工具', value: run.toolCalls || 0, max: limits.maxTools, text: `${run.toolCalls || 0} 次` },
      { name: 'token', value: tokens, max: limits.maxTokens, text: `${tokens}` },
    ]
    const worst = ratios.reduce((best, item) => (item.value / item.max > best.value / best.max ? item : best), ratios[0])
    const ratio = worst.value / worst.max
    if (ratio >= 0.8 && !run.budgetWarned) {
      run.budgetWarned = true
      pushNotice(rec, `预算预警：${worst.name} ${worst.text} / ${worst.max}，接近上限`, 'warn', rec.transcript.lastSeq || 0, now())
    }
    if (ratio < 1) return
    run.budgetExceeded = true
    run.budgetReason = `${worst.name}超限：${worst.text} / ${worst.max}`
    pushNotice(rec, `预算硬停止：${run.budgetReason}，本轮将写入 checkpoint 后停止`, 'error', rec.transcript.lastSeq || 0, now())
    setTimeout(() => {
      if (rec.run !== run) return
      try {
        rec.agent.cancel({ kind: 'budget' })
      } catch {
        /* agent may be between steps */
      }
      closeRun(rec, 'budget', now(), run.budgetReason)
    }, 0)
  }

  function checkWatchdogs() {
    for (const rec of live.values()) {
      if (rec.agent.status !== 'running') continue
      checkRunBudget(rec)
      const stamp = now()
      const idle = stamp - (rec.lastActivityAt || stamp)
      if (idle > STALL_MS && stamp - (rec.stallNotifiedAt || 0) > STALL_MS) {
        rec.stallNotifiedAt = stamp
        const text = `【看门狗】已经 ${Math.round(idle / 60_000)} 分钟没有新动作。检查后台 job/卡住的命令；能换路就换路；不要停在等待。`
        pushNotice(rec, `看门狗：${Math.round(idle / 60_000)} 分钟没有新动作，已提醒换路`, 'warn', rec.transcript.lastSeq || 0, stamp)
        try {
          rec.agent.steer({
            id: crypto.randomUUID(),
            role: 'user',
            content: [{ type: 'text', text }],
            source: { kind: 'user' },
          })
        } catch {
          /* agent may be between steps */
        }
        // Keep watchdog steering and the in-app warning, but do not send QQ
        // here: QQ is reserved for final completion / interruption notices.

      }
      if (rec.run && stamp - (rec.checkpointAt || 0) > CHECKPOINT_MS) {
        rec.checkpointAt = stamp
        rec.thread.checkpoint = {
          runId: rec.run.id,
          at: stamp,
          prompt: rec.run.prompt,
          lastAssistant: rec.lastAssistantText || '',
          lastTool: rec.lastTool || '',
          error: '运行中自动检查点',
        }
        saveStateSoon()
      }
    }

    /* Assignments that never produced a turn/end would otherwise stay
       "running" forever after a crash or a lost session. */
    const cutoff = now() - 2 * 60 * 60 * 1000
    let timedOut = false
    for (const assignment of state.assignments) {
      if (assignment.status !== 'running' || assignment.createdAt > cutoff) continue
      assignment.status = 'failed'
      assignment.endedAt = now()
      assignment.summary = assignment.summary || '超时未收到回执'
      assignment.error = assignment.error || 'assignment timeout'
      assignment.reported = false
      timedOut = true
      void (async () => {
        try {
          const parent = threadById(assignment.fromThreadId)
          if (!parent) return
          const to = state.bots.find((bot) => bot.id === assignment.toBotId)
          const rec = await ensureAgent(parent)
          const text = [
            `【任务回执】${to?.name || '队员'} · 超时`,
            `任务：${truncate(assignment.prompt, 1_200)}`,
            '结果：（超过 2 小时没有回执，已标记失败）',
            '请向用户汇报，并决定是否重派。',
          ].join('\n')
          const message = {
            id: crypto.randomUUID(),
            role: 'user',
            content: [{ type: 'text', text }],
            source: { kind: 'user' },
          }
          if (rec.agent.status === 'running') rec.agent.steer(message)
          else rec.agent.followup(message)
          assignment.reported = true
          saveStateSoon()
        } catch {
          /* report delivery is best-effort */
        }
      })()
    }
    if (timedOut) saveStateNow()
  }

  function maybeAutoContinue(rec, run) {
    if (!rec || !run || run.status !== 'success') return false
    const bot = botById(rec.thread.botId)
    if (bot.autonomy !== 'unattended') return false
    if (rec.autoContinueCount >= 8 || rec.autoContinueScheduled) return false
    if (!wantsConfirmation(run.summary)) return false
    rec.autoContinueScheduled = true
    rec.autoContinueCount += 1
    const message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: [{
        type: 'text',
        text: '【自主模式】不要停下来问我。按你认为最优、最可逆的方式继续执行；信息不足就选最合理假设并继续；完成后给结果、假设和阻塞点。',
      }],
      source: { kind: 'user' },
    }
    setTimeout(() => {
      try {
        if (rec.run || rec.pendingQuestion) return
        rec.agent.followup(message)
        pushNotice(rec, '无人值守：已自动继续，不再等待确认', 'muted', rec.transcript.lastSeq || 0, now())
      } catch {
        /* the next user message can resume manually */
      } finally {
        rec.autoContinueScheduled = false
      }
    }, 250)
    return true
  }

  function closeRun(rec, reason, time, error) {
    if (!rec?.run) return null
    const run = rec.run
    run.endedAt = time || now()
    run.reason = textValue(reason, 120) || 'completed'
    run.status = run.reason === 'completed' ? 'success' : run.reason === 'aborted' || run.reason === 'interrupted'
      ? 'aborted'
      : 'failed'
    run.summary = textValue(rec.lastAssistantText || run.summary, 4_000)
    run.verification = verifyRun(run)
    rec.run = null
    if (run.status !== 'success') {
      rec.thread.checkpoint = {
        runId: run.id,
        at: run.endedAt,
        prompt: run.prompt,
        lastAssistant: run.summary,
        lastTool: rec.lastTool || '',
        error: textValue(error || rec.lastError?.message || run.reason, 1_000),
      }
    } else {
      rec.thread.checkpoint = null
      if (run.toolCalls >= 1 && run.summary && run.verification?.status === 'passed') autoSkillFromRun(run)
    }
    if (rec.thread.skillId) {
      const skill = state.skills.find((item) => item.id === rec.thread.skillId)
      if (skill) {
        if (run.status === 'success') skill.successes = (skill.successes || 0) + 1
        else skill.failures = (skill.failures || 0) + 1
        skill.updatedAt = now()
      }
    }
    let autoContinuing = false
    if (run.status === 'success') {
      autoContinuing = maybeAutoContinue(rec, run)
      scheduleSemanticVerify(rec, run)
    }
    if (!autoContinuing && (run.status === 'success' || run.status === 'failed' || run.status === 'aborted')) {
      notifyTask(rec, run, run.status)
    }
    if (rec.thread.assignmentId) {
      try {
        deliverAssignmentReport(rec, run, run.status)
      } catch (error) {
        console.error('[dsh-bot] assignment report failed', messageOf(error))
      }
    }
    saveStateSoon()
    return run
  }

  function skillKey(prompt) {
    return String(prompt || '').toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 600)
  }

  function autoSkillFromRun(run) {
    if (!run || run.status !== 'success' || run.toolCalls < 1 || run.verification?.status !== 'passed') return null
    const prompt = textValue(run.prompt, 8_000)
    if (!prompt || prompt.length < 8) return null
    const key = skillKey(prompt)
    const existing = state.skills.find((skill) => skill.botId === run.botId && skillKey(skill.prompt) === key)
    if (existing) return existing
    const title = firstLine(prompt).slice(0, 60) || '任务技能'
    const steps = (run.tools || [])
      .slice(0, 16)
      .map((tool) => `${tool.name}${tool.args ? `: ${truncate(tool.args, 220)}` : ''}`)
    const skill = {
      id: `skill-${crypto.randomUUID()}`,
      botId: run.botId,
      title,
      prompt,
      steps,
      workflow: (run.tools || []).map((tool) => ({ tool: tool.name, args: tool.args })),
      params: extractSkillParams(run.prompt, run.tools),
      createdAt: now(),
      updatedAt: now(),
      uses: 0,
      successes: 0,
      failures: 0,
      lastUsedAt: 0,
      sourceThreadId: run.threadId,
      auto: true,
    }
    state.skills.unshift(skill)
    if (state.skills.length > MAX_SKILLS) state.skills.length = MAX_SKILLS
    saveStateSoon()
    return skill
  }

  function captureSkillForThread(threadId, runId) {
    const thread = threadById(threadId)
    if (!thread) throw new Error('任务不存在')
    let run = runId ? state.runs.find((item) => item.id === runId && item.threadId === thread.id) : null
    if (!run) run = state.runs.find((item) => item.threadId === thread.id && item.status === 'success')
    if (!run) {
      const error = new Error('这个任务还没有成功记录，不能存为技能')
      error.statusCode = 400
      throw error
    }
    const key = skillKey(run.prompt)
    let skill = state.skills.find((item) => item.botId === run.botId && skillKey(item.prompt) === key)
    if (!skill) {
      skill = {
        id: `skill-${crypto.randomUUID()}`,
        botId: run.botId,
        title: firstLine(run.prompt).slice(0, 60) || '任务技能',
        prompt: run.prompt,
        steps: [],
        workflow: [],
        params: [],
        createdAt: now(),
        updatedAt: now(),
        uses: 0,
        successes: 0,
        failures: 0,
        lastUsedAt: 0,
        sourceThreadId: run.threadId,
        auto: false,
      }
      state.skills.unshift(skill)
      if (state.skills.length > MAX_SKILLS) state.skills.length = MAX_SKILLS
    }
    skill.steps = (run.tools || [])
      .slice(0, 16)
      .map((tool) => `${tool.name}${tool.args ? `: ${truncate(tool.args, 220)}` : ''}`)
    skill.workflow = (run.tools || []).slice(0, 24).map((tool) => ({ tool: tool.name, args: tool.args }))
    skill.params = extractSkillParams(run.prompt, run.tools)
    skill.updatedAt = now()
    skill.auto = false
    saveStateNow()
    return skill
  }

  async function runSkillRecord(skill) {
    if (!skill) {
      const error = new Error('技能不存在')
      error.statusCode = 404
      throw error
    }
    state.activeBotId = skill.botId
    const thread = createThreadRecord(`技能 · ${skill.title}`.slice(0, 32), skill.botId)
    thread.skillId = skill.id
    const steps = (skill.workflow?.length ? skill.workflow.map((step) => `${step.tool}: ${step.args}`) : skill.steps)
    const workflowText = steps.length
      ? `\n上次成功工作流（仅参考，环境不同就调整）：\n${steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}`
      : ''
    const paramsText = skill.params?.length
      ? `\n参数（示例值，环境不同请替换）：\n${skill.params.map((param) => `- ${param.name}: ${param.example}`).join('\n')}`
      : ''
    const text = `使用已保存技能「${skill.title}」执行：\n${skill.prompt}${paramsText}${workflowText}\n\n先确认当前环境，再执行；完成后给出验收结果。`
    const rec = await ensureAgent(thread)
    const message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: [{ type: 'text', text }],
      source: { kind: 'user' },
    }
    if (rec.agent.status === 'running') rec.agent.steer(message)
    else rec.agent.followup(message)
    skill.uses += 1
    skill.lastUsedAt = now()
    saveStateSoon()
    return thread
  }

  function applyBotPatch(bot, body) {
    if (!body || typeof body !== 'object') return
    if ('name' in body) {
      const value = textValue(body.name, 32)
      if (!value) throw new Error('Bot 名称不能为空')
      bot.name = value
    }
    if ('emoji' in body) bot.emoji = textValue(body.emoji, 8) || '◉'
    if ('tagline' in body) bot.tagline = textValue(body.tagline, 80)
    if ('persona' in body) bot.persona = textValue(body.persona, 8_000)
    if ('presetId' in body) bot.presetId = textValue(body.presetId, 80) || null
    if ('provider' in body) {
      bot.provider = textValue(body.provider, 120) || null
      if (!('model' in body)) bot.model = null
    }
    if ('model' in body) bot.model = textValue(body.model, 120) || null
    if ('reasoningEffort' in body) bot.reasoningEffort = textValue(body.reasoningEffort, 40) || null
    if ('role' in body) bot.role = body.role === 'lead' ? 'lead' : 'member'
    if ('privilege' in body) bot.privilege = body.privilege === 'admin' ? 'admin' : 'standard'
    if ('autonomy' in body) bot.autonomy = body.autonomy === 'unattended' ? 'unattended' : 'interactive'
    if ('workspace' in body) {
      const value = textValue(body.workspace, 320)
      if (!value) {
        bot.workspace = null
      } else {
        if (!path.isAbsolute(value)) throw new Error('工作目录必须是绝对路径')
        fs.mkdirSync(value, { recursive: true })
        bot.workspace = value
      }
    }
    if (!bot.provider) bot.model = null
    bot.updatedAt = now()
  }

  function createBotRecord(body) {
    if (state.bots.length >= MAX_BOTS) throw new Error(`最多 ${MAX_BOTS} 个 Bot`)
    const bot = {
      id: `bot-${crypto.randomUUID()}`,
      name: 'Bot',
      emoji: '◉',
      tagline: '',
      persona: '',
      presetId: null,
      provider: null,
      model: null,
      reasoningEffort: null,
      workspace: null,
      role: 'member',
      privilege: 'standard',
      autonomy: 'interactive',
      createdAt: now(),
      updatedAt: now(),
    }
    applyBotPatch(bot, body)
    state.bots.push(bot)
    state.activeBotId = bot.id
    saveStateSoon()
    return bot
  }

  /* ── daily stand-up meeting ────────────────────────────────────────── */

  function meetingDateKey() {
    return new Date().toLocaleDateString('sv-SE')
  }

  function ensureMeetingGroup() {
    const bots = state.bots.slice(0, MAX_CHANNEL_MEMBERS)
    const memberIds = bots.map((bot) => bot.id)
    const lead = bots.find((bot) => bot.role === 'lead') || bots[0]
    let group = state.threads.find((thread) => thread.kind === 'group' && thread.meeting === true)
    if (!group) {
      const stamp = now()
      group = {
        id: newThreadId(),
        sessionId: '',
        botId: lead.id,
        title: '晨会 · 全员',
        createdAt: stamp,
        updatedAt: stamp,
        created: true,
        presetId: null,
        kind: 'group',
        channelId: null,
        memberIds,
        leaderId: lead.id,
        emoji: '☀️',
        messages: [],
        meeting: true,
        routineId: null,
        skillId: null,
        error: null,
        checkpoint: null,
      }
      state.threads.unshift(group)
      for (const botId of memberIds) memberThreadFor(group, botId)
    } else {
      for (const botId of memberIds) {
        if ((group.memberIds || []).includes(botId)) continue
        group.memberIds.push(botId)
        memberThreadFor(group, botId)
      }
      group.memberIds = group.memberIds.slice(0, MAX_CHANNEL_MEMBERS)
      group.leaderId = lead.id
      group.botId = lead.id
      group.archived = false
      group.updatedAt = now()
    }
    state.meeting.groupId = group.id
    saveStateSoon()
    return group
  }

  function isMeetingThreadId(threadId) {
    const thread = threadId ? state.threads.find((item) => item.id === threadId) : null
    if (!thread?.channelId) return false
    const group = state.threads.find((item) => item.id === thread.channelId)
    return group?.meeting === true
  }

  function hasRecentWork(since) {
    const run = state.runs.some(
      (item) => item.startedAt >= since && item.status !== 'running' && !isMeetingThreadId(item.threadId),
    )
    if (run) return true
    return state.assignments.some(
      (item) => item.createdAt >= since && item.status !== 'running' && !isMeetingThreadId(item.toThreadId),
    )
  }

  function meetingDigest(bot, since) {
    const runs = state.runs
      .filter(
        (run) =>
          run.botId === bot.id &&
          run.startedAt >= since &&
          run.status !== 'running' &&
          !isMeetingThreadId(run.threadId),
      )
      .slice(0, 6)
    const assigned = state.assignments
      .filter(
        (assignment) =>
          assignment.toBotId === bot.id &&
          assignment.createdAt >= since &&
          !isMeetingThreadId(assignment.toThreadId),
      )
      .slice(0, 4)
    const lines = []
    for (const run of runs) {
      const time = new Date(run.startedAt).toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' })
      lines.push(
        `- ${time} ${truncate(run.prompt, 120)} → ${run.status === 'success' ? '完成' : run.status}${run.summary ? `：${truncate(run.summary, 220)}` : ''}`,
      )
    }
    for (const assignment of assigned) {
      if (runs.some((run) => run.prompt === assignment.prompt)) continue
      lines.push(`- 派活：${truncate(assignment.prompt, 120)} → ${assignment.status}`)
    }
    return lines.slice(0, 8).join('\n')
  }

  async function waitForTurnStart(threadId, timeoutMs = 30_000) {
    const deadline = now() + timeoutMs
    while (now() < deadline) {
      const rec = live.get(threadId)
      if (rec && (rec.run?.status === 'running' || rec.agent.status === 'running')) return true
      await delay(500)
    }
    return false
  }

  async function waitForThreadIdle(threadId, timeoutMs = 240_000) {
    const deadline = now() + timeoutMs
    await delay(900)
    while (now() < deadline) {
      const rec = live.get(threadId)
      if (!rec) return false
      if ((!rec.run || rec.run.status !== 'running') && rec.agent.status !== 'running') return true
      await delay(1_200)
    }
    return false
  }

  async function runMorningMeeting(force = false) {
    const date = meetingDateKey()
    if (state.meeting.running) return { ok: false, error: '晨会已经在进行中' }
    if (!force && state.meeting.lastDate === date) return { ok: false, error: '今天已经开过晨会' }
    const lead = state.bots.find((bot) => bot.role === 'lead')
    if (!lead || state.bots.length < 2) return { ok: false, error: '还没有可开会的团队' }
    state.meeting.running = true
    state.meeting.startedAt = now()
    state.meeting.lastAttemptAt = now()
    state.meeting.lastError = ''
    clearMeetingRetry()
    saveStateNow()
    let group = null
    try {
      group = ensureMeetingGroup()
      const since = now() - 36 * 60 * 60 * 1000
      appendGroupMessage(group, {
        text: `【晨会】${date} · 全员同步。各自用 3 条以内总结最近 36 小时做了什么、结果/证据、没完成的下一步；老大最后出纪要。`,
      })
      const summaries = []
      for (const bot of groupMembers(group)) {
        if (bot.role === 'lead') continue
        const child = memberThreadFor(group, bot.id)
        const rec = await ensureAgent(child)
        const digest = meetingDigest(bot, since)
        const prompt = [
          `【晨会 · ${date}】`,
          `你是 ${bot.name}。用 3 条以内总结你最近 36 小时的工作：做了什么 / 结果或证据 / 没完成或下一步。`,
          '',
          '你最近的任务记录：',
          digest || '（没有记录）',
          '',
          '规则：只写你确认做过的；没有记录就写“最近没有任务”，再写 1 条你负责领域的待办。不要调用工具，不要替别人总结。',
        ].join('\n')
        const message = {
          id: crypto.randomUUID(),
          role: 'user',
          content: [{ type: 'text', text: prompt }],
          source: { kind: 'user' },
        }
        if (rec.agent.status === 'running') rec.agent.steer(message)
        else rec.agent.followup(message)
        const sentAt = now()
        rec.lastAssistantText = ''
        await waitForTurnStart(child.id)
        const idle = await waitForThreadIdle(child.id)
        const raw = textValue(rec.lastAssistantText, 4_000)
        const reply = raw || (idle ? '（本次没有回复）' : '（超时，没有回复）')
        const alreadyLogged = (group.messages || []).some(
          (entry) => entry.botId === bot.id && entry.time >= sentAt - 1_500,
        )
        if (!raw && !alreadyLogged) appendGroupMessage(group, { text: reply, botId: bot.id })
        summaries.push(`${bot.name}：\n${reply}`)
      }
      const bossChild = memberThreadFor(group, lead.id)
      const bossRec = await ensureAgent(bossChild)
      const prompt = [
        `【晨会纪要 · ${date}】`,
        `你是 ${lead.name}。以下是成员刚才的晨会发言：`,
        '',
        summaries.join('\n\n') || '（成员都没有发言）',
        '',
        '请输出 5 条以内的晨会纪要：1) 昨天各自做了什么；2) 风险/阻塞；3) 今天优先级；4) 需要用户拍板的事。',
        '不要编造；没有就写“无”。不要调用工具。',
      ].join('\n')
      const message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: [{ type: 'text', text: prompt }],
        source: { kind: 'user' },
      }
      if (bossRec.agent.status === 'running') bossRec.agent.steer(message)
      else bossRec.agent.followup(message)
      const bossSentAt = now()
      bossRec.lastAssistantText = ''
      await waitForTurnStart(bossChild.id)
      await waitForThreadIdle(bossChild.id)
      const rawMinutes = textValue(bossRec.lastAssistantText, 8_000)
      const minutes = rawMinutes || '（老大本次没有回复）'
      const bossLogged = (group.messages || []).some(
        (entry) => entry.botId === lead.id && entry.time >= bossSentAt - 1_500,
      )
      if (!rawMinutes && !bossLogged) appendGroupMessage(group, { text: minutes, botId: lead.id })
      state.meeting.lastDate = date
      state.meeting.lastSummary = minutes
      state.meeting.lastError = ''
      state.meeting.groupId = group.id
      const historyDate = date || meetingDateKey()
      state.meeting.history = Array.isArray(state.meeting.history) ? state.meeting.history : []
      const existingIndex = state.meeting.history.findIndex((item) => item.date === historyDate)
      if (existingIndex >= 0) state.meeting.history.splice(existingIndex, 1)
      state.meeting.history.unshift({ date: historyDate, summary: minutes, at: now() })
      if (state.meeting.history.length > 30) state.meeting.history.length = 30
      saveStateNow()
      return { ok: true, date, groupId: group.id }
    } catch (error) {
      state.meeting.lastError = messageOf(error)
      saveStateNow()
      scheduleMeetingRetry()
      return { ok: false, error: state.meeting.lastError }
    } finally {
      state.meeting.running = false
      saveStateNow()
    }
  }

  let meetingScheduled = false
  let meetingRetryTimer = null

  function clearMeetingRetry() {
    if (meetingRetryTimer) {
      clearTimeout(meetingRetryTimer)
      meetingRetryTimer = null
    }
  }

  function scheduleMeetingRetry(delayMs = 30 * 60 * 1000) {
    if (meetingRetryTimer) return
    meetingRetryTimer = setTimeout(() => {
      meetingRetryTimer = null
      maybeRunMeeting('retry')
    }, delayMs)
    if (typeof meetingRetryTimer.unref === 'function') meetingRetryTimer.unref()
  }

  function maybeRunMeeting(source = 'startup') {
    if (state.meeting.enabled === false) {
      clearMeetingRetry()
      return
    }
    if (meetingScheduled || state.meeting.running) return
    if (state.meeting.weekdaysOnly) {
      const day = new Date().getDay()
      if (day === 0 || day === 6) return
    }
    if (state.meeting.onlyWhenWork && !hasRecentWork(now() - 36 * 60 * 60 * 1000)) {
      state.meeting.lastAttemptAt = now()
      state.meeting.lastSummary = '最近 36 小时没有需要同步的工作，晨会暂缓；30 分钟后再次检查。'
      saveStateNow()
      scheduleMeetingRetry()
      return
    }
    if (!state.bots.some((bot) => bot.role === 'lead')) return
    if (state.bots.length < 2) return
    if (!selection && !state.bots.some((bot) => bot.provider && bot.model)) return
    if (state.meeting.lastDate === meetingDateKey()) return
    if (state.meeting.lastAttemptAt && now() - state.meeting.lastAttemptAt < 30 * 60 * 1000) return
    meetingScheduled = true
    const timer = setTimeout(() => {
      meetingScheduled = false
      void runMorningMeeting(false)
    }, source === 'open' ? 2_000 : 12_000)
    if (typeof timer.unref === 'function') timer.unref()
  }

  async function removeBot(bot) {
    if (!bot || bot.id === DEFAULT_BOT_ID) {
      const error = new Error('默认 Bot 不能删除')
      error.statusCode = 400
      throw error
    }
    if (bot.role === 'lead' && !state.bots.some((item) => item.id !== bot.id && item.role === 'lead')) {
      const error = new Error('这是团队里唯一的老大，先把另一个 Bot 设为「老大」再删')
      error.statusCode = 400
      throw error
    }
    if (state.bots.length <= 1) {
      const error = new Error('至少保留一个 Bot')
      error.statusCode = 400
      throw error
    }
    for (const group of state.threads.filter(
      (item) => item.kind === 'group' && (item.memberIds || []).includes(bot.id),
    )) {
      const next = (group.memberIds || []).filter((id) => id !== bot.id)
      if (next.length >= 2) {
        updateGroupRecord(group, { memberIds: next })
      } else {
        await deleteGroupRecord(group)
      }
    }
    for (const routine of state.routines.filter((item) => item.botId === bot.id)) {
      await deleteRoutineRecord(routine, { keepThread: false })
    }
    for (const thread of state.threads.filter((item) => item.botId === bot.id)) {
      await disposeRec(thread.id)
    }
    state.threads = state.threads.filter((item) => item.botId !== bot.id)
    state.bots = state.bots.filter((item) => item.id !== bot.id)
    state.assignments = state.assignments.filter(
      (assignment) => assignment.fromBotId !== bot.id && assignment.toBotId !== bot.id,
    )
    state.activeBotId = DEFAULT_BOT_ID
    try {
      removeTree(path.join(stateDir, 'bots', bot.id))
    } catch {
      /* memory cleanup is best-effort */
    }
    try {
      removeTree(memoryRepoDir(bot))
      memoryRepoState.delete(memoryRepoDir(bot))
    } catch {
      /* memory repo cleanup is best-effort */
    }
    saveStateNow()
    const fallback =
      [...state.threads]
        .filter((thread) => thread.botId === DEFAULT_BOT_ID)
        .sort((left, right) => right.updatedAt - left.updatedAt)[0] || null
    return fallback || createThreadRecord('', DEFAULT_BOT_ID)
  }

  function firstThreadForBot(botId) {
    return (
      [...state.threads]
        .filter((thread) => {
          if (thread.kind === 'member') return false
          if (thread.archived) return false
          if (thread.kind === 'group') return (thread.memberIds || []).includes(botId)
          return thread.botId === botId
        })
        .sort((left, right) => right.updatedAt - left.updatedAt)[0] || null
    )
  }

  async function openBot(botId) {
    const bot = state.bots.find((item) => item.id === botId)
    if (!bot) {
      const error = new Error('Bot 不存在')
      error.statusCode = 404
      throw error
    }
    state.activeBotId = bot.id
    let thread = firstThreadForBot(bot.id)
    if (!thread) thread = createThreadRecord('', bot.id)
    saveStateSoon()
    return await openThread(thread)
  }

  let catalogCache = null
  let catalogAt = 0
  async function botCatalog(force = false) {
    if (!force && catalogCache && now() - catalogAt < 300_000) return catalogCache
    const presets = []
    try {
      const list = await ctx.get('agentPresets')?.list?.()
      for (const preset of Array.isArray(list) ? list : []) {
        if (!preset?.id) continue
        presets.push({
          id: preset.id,
          name: preset.name || preset.id,
          description: preset.description || '',
          broken: preset.broken || null,
        })
      }
    } catch {
      /* presets are optional */
    }
    const providers = []
    try {
      const llm = ctx.get('llm')
      const list = llm?.listProviders?.() || []
      for (const provider of list) {
        if (!provider?.id) continue
        let models = []
        try {
          const discovered = await llm.listModels(provider.id)
          models = (Array.isArray(discovered) ? discovered : []).map((model) => ({
            id: model.id,
            name: model.name || model.id,
            description: model.description || '',
          }))
        } catch {
          models = []
        }
        providers.push({ id: provider.id, name: provider.name || provider.id, models })
      }
    } catch {
      /* model discovery is optional */
    }
    catalogCache = {
      presets,
      providers,
      default: selection
        ? { provider: selection.provider, model: selection.model, reasoningEffort: selection.reasoningEffort || null }
        : null,
      ts: now(),
    }
    catalogAt = now()
    return catalogCache
  }

  function threadById(id) {
    return state.threads.find((thread) => thread.id === id)
  }

  function requireThread(id) {
    const thread = threadById(id)
    if (!thread) {
      const error = new Error('任务不存在')
      error.statusCode = 404
      throw error
    }
    return thread
  }

  /* ── group channels ────────────────────────────────────────────────── */

  function isGroup(thread) {
    return Boolean(thread && thread.kind === 'group')
  }

  function groupMembers(group) {
    return (group?.memberIds || [])
      .map((id) => state.bots.find((bot) => bot.id === id))
      .filter(Boolean)
  }

  function memberThreadsOf(group) {
    return state.threads.filter((thread) => thread.channelId === group.id)
  }

  function memberThreadFor(group, botId, create = true) {
    const found = state.threads.find((thread) => thread.channelId === group.id && thread.botId === botId)
    if (found) return found
    if (!create) return null
    const bot = state.bots.find((item) => item.id === botId)
    if (!bot) return null
    return createThreadRecord(`${group.title || '群聊'} · ${bot.name}`, botId, 'member', null, {
      channelId: group.id,
      kind: 'member',
      setActive: false,
    })
  }

  function groupMemberView(group) {
    const children = memberThreadsOf(group)
    return groupMembers(group).map((bot) => {
      const child = children.find((thread) => thread.botId === bot.id)
      const rec = child ? live.get(child.id) : null
      const persistingRun = state.runs.some((run) => run.botId === bot.id && run.status === 'running')
      const persistingAssignment = state.assignments.some(
        (assignment) => assignment.toBotId === bot.id && assignment.status === 'running',
      )
      return {
        id: bot.id,
        name: bot.name,
        emoji: bot.emoji,
        tagline: bot.tagline,
        model: bot.model || selection?.model || null,
        modelLabel: prettyModel(bot.model || selection?.model),
        running: (rec ? rec.agent.status === 'running' : false) || persistingRun || persistingAssignment,
        live: Boolean(rec),
        error: child?.error || null,
        privilege: bot.privilege || 'standard',
        autonomy: bot.autonomy || 'interactive',
      }
    })
  }

  function publicChannel(group) {
    return {
      id: group.id,
      threadId: group.id,
      name: group.title || '群聊',
      emoji: group.emoji || '◈',
      leaderId: group.leaderId || (group.memberIds || [])[0] || null,
      memberIds: [...(group.memberIds || [])],
      members: groupMemberView(group),
      meeting: group.meeting === true,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    }
  }

  function publicGroupMessage(message, group) {
    const bot = message.botId ? state.bots.find((item) => item.id === message.botId) : null
    let quote = null
    if (message.replyTo && group) {
      const referenced = (Array.isArray(group.messages) ? group.messages : []).find(
        (item) => item.id === message.replyTo,
      )
      if (referenced) {
        const referencedBot = referenced.botId
          ? state.bots.find((item) => item.id === referenced.botId)
          : null
        quote = {
          id: referenced.id,
          text: truncate(referenced.text, 160),
          name: referencedBot?.name || '',
        }
      }
    }
    if (bot) {
      return {
        kind: 'assistant',
        id: message.id,
        seq: `group-${message.id}`,
        time: message.time,
        text: truncate(message.text, 32_000),
        botId: bot.id,
        speaker: { id: bot.id, name: bot.name, emoji: bot.emoji },
        quote,
      }
    }
    return {
      kind: 'user',
      id: message.id,
      seq: `group-${message.id}`,
      time: message.time,
      text: truncate(message.text, 32_000),
      botId: null,
      quote,
    }
  }

  function nextGroupStamp(group) {
    const list = Array.isArray(group.messages) ? group.messages : []
    const last = list.length ? Number(list[list.length - 1].time) || 0 : 0
    return Math.max(now(), last + 1)
  }

  function latestGroupPrompt(group, time) {
    const messages = Array.isArray(group.messages) ? group.messages : []
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const message = messages[index]
      if (!message.botId && Number(message.time) <= Number(time)) return message
    }
    return null
  }

  function appendGroupMessage(group, { text, botId = null, time = now(), preserveTime = false, replyTo = null }) {
    const value = textValue(text, 32_000)
    if (!value) return null
    group.messages = Array.isArray(group.messages) ? group.messages : []
    const stamp = preserveTime ? Number(time) || now() : Math.max(Number(time) || now(), nextGroupStamp(group))
    const message = {
      id: crypto.randomUUID(),
      time: stamp,
      text: value,
      botId: botId || null,
      replyTo: replyTo || null,
    }
    group.messages.push(message)
    if (group.messages.length > 300) group.messages.splice(0, group.messages.length - 300)
    group.updatedAt = stamp
    saveStateSoon()
    return message
  }

  function createGroupRecord(body) {
    const name = textValue(body?.name, 32) || '新群聊'
    const emoji = textValue(body?.emoji, 8) || '◈'
    const memberIds = []
    for (const id of Array.isArray(body?.memberIds) ? body.memberIds : []) {
      const value = String(id || '')
      if (!state.bots.some((bot) => bot.id === value) || memberIds.includes(value)) continue
      memberIds.push(value)
      if (memberIds.length >= MAX_CHANNEL_MEMBERS) break
    }
    if (memberIds.length < 2) {
      const error = new Error('群聊至少需要 2 位成员')
      error.statusCode = 400
      throw error
    }
    if (state.threads.filter((thread) => thread.kind === 'group').length >= MAX_CHANNELS) {
      const error = new Error(`最多 ${MAX_CHANNELS} 个群聊`)
      error.statusCode = 400
      throw error
    }
    const stamp = now()
    const group = {
      id: newThreadId(),
      sessionId: '',
      botId: memberIds[0],
      title: name,
      createdAt: stamp,
      updatedAt: stamp,
      created: true,
      presetId: null,
      kind: 'group',
      channelId: null,
      memberIds,
      leaderId: memberIds[0],
      emoji,
      messages: [],
      routineId: null,
      skillId: null,
      error: null,
      checkpoint: null,
    }
    state.threads.unshift(group)
    for (const botId of memberIds) memberThreadFor(group, botId)
    state.lastThreadId = group.id
    saveStateSoon()
    return group
  }

  async function deleteGroupRecord(group) {
    for (const child of memberThreadsOf(group)) {
      await disposeRec(child.id)
      state.runs = state.runs.filter((run) => run.threadId !== child.id)
      state.threads = state.threads.filter((thread) => thread.id !== child.id)
    }
    state.threads = state.threads.filter((thread) => thread.id !== group.id)
    if (state.lastThreadId === group.id) {
      const next = [...state.threads]
        .filter((thread) => thread.kind !== 'member')
        .sort((left, right) => right.updatedAt - left.updatedAt)[0]
      state.lastThreadId = next?.id || null
    }
    saveStateNow()
  }

  function updateGroupRecord(group, body) {
    if (typeof body?.name === 'string') {
      const name = textValue(body.name, 32)
      if (name) group.title = name
    }
    if (typeof body?.emoji === 'string') group.emoji = textValue(body.emoji, 8) || group.emoji
    if (Array.isArray(body?.memberIds)) {
      const next = []
      for (const id of body.memberIds) {
        const value = String(id || '')
        if (!state.bots.some((bot) => bot.id === value) || next.includes(value)) continue
        next.push(value)
        if (next.length >= MAX_CHANNEL_MEMBERS) break
      }
      if (next.length < 2) {
        const error = new Error('群聊至少需要 2 位成员')
        error.statusCode = 400
        throw error
      }
      const removed = (group.memberIds || []).filter((id) => !next.includes(id))
      const added = next.filter((id) => !(group.memberIds || []).includes(id))
      for (const id of added) memberThreadFor(group, id)
      for (const id of removed) {
        const child = state.threads.find((thread) => thread.channelId === group.id && thread.botId === id)
        if (!child) continue
        disposeRec(child.id)
        state.runs = state.runs.filter((run) => run.threadId !== child.id)
        state.threads = state.threads.filter((thread) => thread.id !== child.id)
      }
      group.memberIds = next
      if (!next.includes(group.leaderId)) group.leaderId = next[0]
      group.botId = group.leaderId || next[0]
    }
    group.updatedAt = now()
    saveStateSoon()
    return group
  }

  function groupTargets(group, text) {
    const members = groupMembers(group)
    const lower = String(text || '').toLowerCase()
    if (/@(all|everyone|全体|所有人|全员)/i.test(lower)) return members
    const picked = members.filter((bot) =>
      [bot.name, bot.id]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase())
        .some((name) => lower.includes(`@${name}`)),
    )
    return picked.length > 0 ? picked : members
  }

  function groupPreamble(group, text, targeted, relay = false) {
    const names = groupMembers(group).map((item) => item.name).join('、')
    const lines = [
      `你正在群聊「${group.title || '未命名群聊'}」中回复。群里还有：${names}。`,
      relay
        ? '用户在群里发了消息，没有点名。由你先判断：能直接答就答，要动手就派给对口成员，然后向用户汇报。'
        : targeted
          ? '用户这条消息点名了你（可能还点名了别人），只处理与你相关、你负责的部分。'
          : '用户这条消息发给了群里所有人，只处理与你相关、你负责的部分，不要替别人做。',
      '你的回复会以你自己的身份显示在群里。需要别人帮忙时，可以用 bot_dispatch 把子任务派给群里的成员。',
    ]
    return `${lines.join('\n')}\n\n用户消息：\n${text}`
  }

  async function sendToGroup(group, text, replyTo = '') {
    const members = groupMembers(group)
    let targets = groupTargets(group, text)
    let relay = false
    if (group.meeting && !/@\S+/.test(text)) {
      /* Ordinary messages in the stand-up channel go to the lead only; the
         lead delegates. Without this every member would run on every message. */
      const lead = members.find((bot) => bot.role === 'lead')
      if (lead) {
        targets = [lead]
        relay = true
      }
    }
    const quoted = replyTo
      ? (Array.isArray(group.messages) ? group.messages : []).find((item) => item.id === String(replyTo))
      : null
    const quotedBot = quoted?.botId ? members.find((bot) => bot.id === quoted.botId) : null
    if (quotedBot && !/@\S+/.test(text)) {
      targets = [quotedBot]
      relay = false
    }
    if (targets.length === 0) {
      const error = new Error('这个群还没有成员')
      error.statusCode = 409
      throw error
    }
    const stamp = nextGroupStamp(group)
    const message = { id: crypto.randomUUID(), time: stamp, text, botId: null, replyTo: quoted?.id || null }
    group.messages = Array.isArray(group.messages) ? group.messages : []
    group.messages.push(message)
    if (group.messages.length > 300) group.messages.splice(0, group.messages.length - 300)
    if (!group.title || group.title === '新群聊') group.title = text.replace(/\s+/g, ' ').slice(0, 28)
    group.updatedAt = stamp
    const targeted = targets.length < members.length
    const results = []
    for (const bot of targets) {
      try {
        const child = memberThreadFor(group, bot.id)
        if (!child) throw new Error('成员线程不可用')
        const rec = await ensureAgent(child)
        const running = rec.agent.status === 'running'
        const quotePrefix = quoted
          ? `【引用${quotedBot ? ` @${quotedBot.name}` : ''}的消息】\n${truncate(quoted.text, 800)}\n\n`
          : ''
        const payload = {
          id: crypto.randomUUID(),
          role: 'user',
          content: [{ type: 'text', text: groupPreamble(group, `${quotePrefix}${text}`, targeted, relay) }],
          source: { kind: 'user' },
        }
        if (running) rec.agent.steer(payload)
        else rec.agent.followup(payload)
        rec.pendingQuestion = null
        rec.autoContinueCount = 0
        rec.autoContinueScheduled = false
        rec.dispatchCount = 0
        rec.lastUsed = stamp
        child.title = `${group.title || '群聊'} · ${bot.name}`
        child.updatedAt = stamp
        child.checkpoint = null
        results.push({ botId: bot.id, name: bot.name, ok: true, mode: running ? 'steer' : 'followup' })
      } catch (error) {
        results.push({ botId: bot.id, name: bot.name, ok: false, error: messageOf(error) })
      }
    }
    saveStateSoon()
    return { ok: true, channel: publicChannel(group), message: publicGroupMessage(message, group), results }
  }

  /* ── team assignments (lead bot dispatches to specialists) ─────────── */

  function publicAssignment(assignment) {
    const from = state.bots.find((bot) => bot.id === assignment.fromBotId)
    const to = state.bots.find((bot) => bot.id === assignment.toBotId)
    return {
      id: assignment.id,
      fromBotId: assignment.fromBotId,
      fromName: from?.name || '',
      toBotId: assignment.toBotId,
      toName: to?.name || '',
      toEmoji: to?.emoji || '◉',
      fromThreadId: assignment.fromThreadId,
      toThreadId: assignment.toThreadId,
      prompt: truncate(assignment.prompt, 4_000),
      status: assignment.status,
      createdAt: assignment.createdAt,
      endedAt: assignment.endedAt,
      summary: truncate(assignment.summary, 4_000),
      error: truncate(assignment.error, 1_000),
      steps: Number(assignment.steps) || 0,
      durationMs: Number(assignment.durationMs) || 0,
      tokens: Number(assignment.tokens) || 0,
      retryOf: assignment.retryOf || null,
      retryCount: Number(assignment.retryCount) || 0,
      reported: assignment.reported,
    }
  }

  function teamRoster(excludeId) {
    return state.bots
      .filter((bot) => bot.id !== excludeId)
      .map((bot) => ({
        id: bot.id,
        name: bot.name,
        emoji: bot.emoji,
        tagline: bot.tagline,
        workspace: botWorkspace(bot),
        model: bot.model || selection?.model || null,
        modelLabel: prettyModel(bot.model || selection?.model),
        role: bot.role === 'lead' ? 'lead' : 'member',
        autonomy: bot.autonomy || 'interactive',
        live: [...live.values()].some((rec) => rec.thread.botId === bot.id),
        running: [...live.values()].some(
          (rec) => rec.thread.botId === bot.id && rec.agent.status === 'running',
        ),
      }))
  }

  function teamRosterText(bot) {
    const others = teamRoster(bot.id)
    if (others.length === 0) return ''
    return [
      '',
      '## 团队成员',
      ...others.map(
        (member) =>
          `- ${member.name}（${member.role === 'lead' ? '老大' : '队员'}）${member.tagline ? `：${member.tagline}` : ''}｜工作目录：${member.workspace}${member.running ? '｜正在忙' : ''}`,
      ),
    ].join('\n')
  }

  function createAssignmentRecord(fromBot, fromThread, targetBot, task, options = {}) {
    const stamp = now()
    const thread = createThreadRecord('', targetBot.id, 'task', null, { setActive: false })
    thread.title = `派活 · ${targetBot.name}：${task.replace(/\s+/g, ' ').slice(0, 24)}`
    if (options.effort) thread.reasoningEffort = options.effort
    if (options.model) {
      const provider = targetBot.provider || selection?.provider || fromBot.provider || null
      if (provider) {
        thread.modelProvider = provider
        thread.modelName = options.model
      }
    }
    const assignment = {
      id: `asg-${crypto.randomUUID()}`,
      fromBotId: fromBot.id,
      fromThreadId: fromThread.id,
      toBotId: targetBot.id,
      toThreadId: thread.id,
      prompt: task,
      status: 'running',
      createdAt: stamp,
      endedAt: 0,
      summary: '',
      error: '',
      reported: false,
      steps: 0,
      durationMs: 0,
      tokens: 0,
    }
    thread.assignmentId = assignment.id
    state.assignments.unshift(assignment)
    if (state.assignments.length > MAX_ASSIGNMENTS) state.assignments.length = MAX_ASSIGNMENTS
    saveStateSoon()
    return { assignment, thread }
  }

  function parseAssignmentReport(text) {
    const raw = String(text || '')
    const header = /^【任务回执】([^·\n]+)·\s*([^\n]+)/.exec(raw)
    const task = /任务：([^\n]*)/.exec(raw)
    const result = /结果：([\s\S]*?)(?:\n错误：|$)/.exec(raw)
    return {
      bot: header ? header[1].trim() : '',
      status: header ? header[2].trim() : '',
      title: task ? task[1].trim() : '',
      summary: result ? result[1].trim() : '',
    }
  }

  function deliverAssignmentReport(rec, run, status) {
    const assignment = state.assignments.find(
      (item) => item.toThreadId === rec.thread.id && item.status === 'running',
    )
    if (!assignment) return
    const to = state.bots.find((bot) => bot.id === assignment.toBotId)
    assignment.status = status === 'success' ? 'success' : status === 'aborted' ? 'aborted' : 'failed'
    assignment.endedAt = run.endedAt || now()
    assignment.summary = textValue(run.summary, 4_000) || textValue(rec.lastAssistantText, 4_000)
    assignment.error = textValue(rec.lastError?.message || run.reason, 1_000)
    assignment.steps = Number(run.toolCalls) || 0
    assignment.durationMs = Math.max(0, (run.endedAt || now()) - (assignment.createdAt || run.startedAt))
    assignment.tokens = (Number(run.inputTokens) || 0) + (Number(run.outputTokens) || 0)
    assignment.reported = false
    saveStateNow()
    const label = assignment.status === 'success' ? '已完成' : assignment.status === 'aborted' ? '已中断' : '失败'
    const report = [
      `【任务回执】${to?.name || '队员'} · ${label}`,
      `任务：${truncate(assignment.prompt, 1_200)}`,
      assignment.steps || assignment.durationMs
        ? `统计：${assignment.steps || 0} 步 · ${Math.max(1, Math.round((assignment.durationMs || 0) / 1000))} 秒 · ${assignment.tokens || 0} tokens`
        : '',
      `结果：${assignment.summary || '（没有最终回复）'}`,
      assignment.status !== 'success' ? `错误：${assignment.error || '未知原因'}` : '',
      '请向用户汇报结果与证据；需要继续时再派活。不要原样转发这条回执。',
    ]
      .filter(Boolean)
      .join('\n')
    void (async () => {
      try {
        const parent = threadById(assignment.fromThreadId)
        if (!parent) {
          assignment.reported = true
          saveStateSoon()
          return
        }
        const parentRec = await ensureAgent(parent)
        const dispatchItem = parentRec.transcript.items.find(
          (item) => item.kind === 'assignment' && item.assignmentId === assignment.id,
        )
        if (dispatchItem) {
          dispatchItem.status = assignment.status
          dispatchItem.summary = assignment.summary
        }
        const message = {
          id: crypto.randomUUID(),
          role: 'user',
          content: [{ type: 'text', text: report }],
          source: { kind: 'user' },
        }
        if (parentRec.agent.status === 'running') parentRec.agent.steer(message)
        else parentRec.agent.followup(message)
        parent.updatedAt = now()
        assignment.reported = true
        parentRec.lastUsed = now()
        saveStateSoon()
      } catch (error) {
        assignment.error = messageOf(error)
        saveStateSoon()
      }
    })()
  }

  /* ── routines ──────────────────────────────────────────────────────── */

  const DEFAULT_TIME_ZONE = 'Asia/Shanghai'

  function routineById(id) {
    return state.routines.find((routine) => routine.id === id) || null
  }

  function normalizeClock(value) {
    const text = textValue(value, 8)
    const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(text)
    if (!match) throw new Error('时间格式应为 HH:MM 或 HH:MM:SS')
    const hour = Number(match[1])
    const minute = Number(match[2])
    const second = Number(match[3] || 0)
    if (hour > 23 || minute > 59 || second > 59) throw new Error('时间超出范围')
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`
  }

  function validateSchedule(raw) {
    if (!raw || typeof raw !== 'object') throw new Error('缺少运行计划')
    const kind = String(raw.kind || '')
    if (kind === 'daily') {
      const time = normalizeClock(raw.time)
      return { kind, time, time_zone: textValue(raw.time_zone || raw.timeZone, 64) || DEFAULT_TIME_ZONE }
    }
    if (kind === 'weekly') {
      const time = normalizeClock(raw.time)
      const weekdays = Array.from(
        new Set(
          (Array.isArray(raw.weekdays) ? raw.weekdays : [])
            .map((day) => Number(day))
            .filter((day) => Number.isInteger(day) && day >= 1 && day <= 7),
        ),
      ).sort((a, b) => a - b)
      if (weekdays.length === 0) throw new Error('每周模式至少选一天')
      return {
        kind,
        time,
        weekdays,
        time_zone: textValue(raw.time_zone || raw.timeZone, 64) || DEFAULT_TIME_ZONE,
      }
    }
    if (kind === 'every') {
      const seconds = Number(raw.seconds ?? raw.every_seconds ?? raw.everySeconds)
      if (!Number.isFinite(seconds) || seconds < 60 || seconds > 31_536_000) {
        throw new Error('间隔模式需要 60 秒以上的间隔')
      }
      return { kind, seconds: Math.round(seconds) }
    }
    if (kind === 'cron') {
      const expression = textValue(raw.expression, 120)
      if (!expression) throw new Error('Cron 模式需要表达式')
      return {
        kind,
        expression,
        time_zone: textValue(raw.time_zone || raw.timeZone, 64) || DEFAULT_TIME_ZONE,
      }
    }
    throw new Error('未知的运行计划')
  }

  function compactSchedule(schedule) {
    if (!schedule) return null
    return { ...schedule }
  }

  function scheduleRequest(routine) {
    const request = {
      title: `例行 · ${routine.title}`.slice(0, 120),
      prompt: routine.prompt,
    }
    const schedule = routine.schedule
    if (schedule.kind === 'daily') request.daily = { time: schedule.time, time_zone: schedule.time_zone || DEFAULT_TIME_ZONE }
    else if (schedule.kind === 'weekly') {
      request.weekly = {
        time: schedule.time,
        time_zone: schedule.time_zone || DEFAULT_TIME_ZONE,
        weekdays: schedule.weekdays,
      }
    } else if (schedule.kind === 'every') request.every_seconds = schedule.seconds
    else if (schedule.kind === 'cron') {
      request.cron = { expression: schedule.expression, time_zone: schedule.time_zone || DEFAULT_TIME_ZONE }
    }
    return request
  }

  function scheduleOf() {
    const service = ctx.get('schedule')
    if (!service?.create || !service?.delete) {
      const error = new Error('DSH 调度服务不可用')
      error.statusCode = 503
      throw error
    }
    return service
  }

  function routineThread(routine) {
    let thread = threadById(routine.threadId)
    if (!thread) {
      thread = createThreadRecord(`例行 · ${routine.title}`.slice(0, 32), routine.botId, 'routine', routine.id)
      routine.threadId = thread.id
      thread.routineId = routine.id
    }
    return thread
  }

  async function createRoutine(body) {
    if (state.routines.length >= MAX_ROUTINES) throw new Error(`最多 ${MAX_ROUTINES} 个例程`)
    const bot = state.bots.find((item) => item.id === (body.botId || state.activeBotId)) || activeBot()
    const title = textValue(body.title, 80)
    const prompt = textValue(body.prompt, 16_000)
    if (!title) throw new Error('例程标题不能为空')
    if (!prompt) throw new Error('例程内容不能为空')
    const schedule = validateSchedule(body.schedule)
    const thread = createThreadRecord(`例行 · ${title}`.slice(0, 32), bot.id, 'routine')
    const routine = {
      id: `routine-${crypto.randomUUID()}`,
      botId: bot.id,
      threadId: thread.id,
      title,
      prompt,
      schedule,
      scheduleId: null,
      enabled: true,
      createdAt: now(),
      updatedAt: now(),
      lastRunAt: 0,
    }
    thread.routineId = routine.id
    state.routines.push(routine)
    try {
      await ensureAgent(thread)
      const record = await scheduleOf().create(thread.sessionId, scheduleRequest(routine))
      routine.scheduleId = record.id
      saveStateNow()
      return routine
    } catch (error) {
      state.routines = state.routines.filter((item) => item.id !== routine.id)
      await disposeRec(thread.id)
      state.threads = state.threads.filter((item) => item.id !== thread.id)
      saveStateNow()
      throw error
    }
  }

  async function updateRoutine(body) {
    const routine = routineById(String(body.id || ''))
    if (!routine) {
      const error = new Error('例程不存在')
      error.statusCode = 404
      throw error
    }
    const title = textValue(body.title ?? routine.title, 80)
    const prompt = textValue(body.prompt ?? routine.prompt, 16_000)
    if (!title) throw new Error('例程标题不能为空')
    if (!prompt) throw new Error('例程内容不能为空')
    const schedule = body.schedule ? validateSchedule(body.schedule) : routine.schedule
    const enabled = typeof body.enabled === 'boolean' ? body.enabled : routine.enabled
    const thread = routineThread(routine)
    const service = scheduleOf()
    const oldScheduleId = routine.scheduleId
    const old = { title: routine.title, prompt: routine.prompt, schedule: routine.schedule, enabled: routine.enabled }
    routine.title = title
    routine.prompt = prompt
    routine.schedule = schedule
    routine.updatedAt = now()
    try {
      if (enabled) {
        await ensureAgent(thread)
        const record = await service.create(thread.sessionId, scheduleRequest(routine))
        routine.scheduleId = record.id
      } else {
        routine.scheduleId = null
      }
      if (oldScheduleId) {
        try {
          await service.delete({ sessionId: thread.sessionId, id: oldScheduleId })
        } catch {
          /* the old schedule may already have fired */
        }
      }
      routine.enabled = enabled
      saveStateNow()
      return routine
    } catch (error) {
      routine.title = old.title
      routine.prompt = old.prompt
      routine.schedule = old.schedule
      routine.enabled = old.enabled
      throw error
    }
  }

  async function deleteRoutineRecord(routine, options = {}) {
    const keepThread = options.keepThread !== false
    const thread = threadById(routine.threadId)
    if (routine.scheduleId && thread) {
      try {
        await scheduleOf().delete({ sessionId: thread.sessionId, id: routine.scheduleId })
      } catch {
        /* already gone */
      }
    }
    state.routines = state.routines.filter((item) => item.id !== routine.id)
    if (keepThread && thread) {
      thread.kind = 'task'
      thread.routineId = null
    } else if (thread) {
      await disposeRec(thread.id)
      state.threads = state.threads.filter((item) => item.id !== thread.id)
    }
    saveStateNow()
  }

  async function runRoutine(routine) {
    const thread = routineThread(routine)
    const rec = await ensureAgent(thread)
    const text = `⏰ 例程「${routine.title}」开始执行：\n${routine.prompt}`
    const message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: [{ type: 'text', text }],
      source: { kind: 'user' },
    }
    if (rec.agent.status === 'running') rec.agent.steer(message)
    else rec.agent.followup(message)
    routine.lastRunAt = now()
    thread.updatedAt = now()
    rec.lastUsed = now()
    saveStateSoon()
    return { threadId: thread.id, text }
  }

  async function reconcileRoutines() {
    const service = ctx.get('schedule')
    if (!service?.list || !service?.create) return
    for (const routine of [...state.routines]) {
      if (!routine.enabled) continue
      const thread = routineThread(routine)
      let current = null
      try {
        const records = await service.list({ sessionId: thread.sessionId })
        current = (Array.isArray(records) ? records : []).find((record) => record.id === routine.scheduleId) || null
      } catch {
        current = null
      }
      if (current) continue
      try {
        await ensureAgent(thread)
        const record = await service.create(thread.sessionId, scheduleRequest(routine))
        routine.scheduleId = record.id
      } catch (error) {
        console.error('[dsh-bot] routine reconcile failed', routine.title, messageOf(error))
      }
    }
    saveStateSoon()
  }

  /* ── agent lifecycle ───────────────────────────────────────────────── */

  function isDirectory(value) {
    try {
      return fs.statSync(value).isDirectory()
    } catch {
      return false
    }
  }

  function isInternalDirectory(value) {
    const profiles = path.join(home, 'profiles')
    const left = path.resolve(value).toLowerCase()
    const right = path.resolve(profiles).toLowerCase()
    return left === right || left.startsWith(`${right}${path.sep}`)
  }

  function readWorkspaceFile() {
    try {
      const value = fs.readFileSync(workspaceFile, 'utf8').trim().split(/\r?\n/)[0].trim()
      if (isAbsoluteDirectory(value) && isDirectory(value)) return value
    } catch {
      /* the override file is optional */
    }
    return null
  }

  function resolveWorkspace(pluginCtx) {
    const configured = process.env.DSH_BOT_WORKSPACE
    if (isAbsoluteDirectory(configured) && isDirectory(configured)) return configured

    const saved = readWorkspaceFile()
    if (saved) return saved

    try {
      const workspaces = pluginCtx.get('workspaceRegistry')?.list?.() || []
      const stamp = (item) => {
        const value = new Date(item?.updatedAt ?? 0).getTime()
        return Number.isFinite(value) ? value : 0
      }
      const recent = workspaces
        .filter((item) => isAbsoluteDirectory(item?.path) && isDirectory(item.path))
        .sort((left, right) => stamp(right) - stamp(left))
      if (recent[0]) return recent[0].path
    } catch {
      /* the registry is optional */
    }

    try {
      const directory = pluginCtx.get('workingDirectory')?.defaultDirectory
      if (isAbsoluteDirectory(directory) && isDirectory(directory) && !isInternalDirectory(directory)) {
        return directory
      }
    } catch {
      /* service is optional */
    }

    return path.join(os.homedir(), 'DSH-Bot')
  }

  function getWorkspace() {
    if (resolvedWorkspace) return resolvedWorkspace
    const value = resolveWorkspace(ctx)
    resolvedWorkspace = value
    try {
      fs.mkdirSync(value, { recursive: true })
    } catch {
      /* an existing workspace is enough; creation failure surfaces on the first tool call */
    }
    return value
  }

  let gitReady = null
  const memoryRepoState = new Map()

  function gitUsable() {
    if (gitReady !== null) return gitReady
    try {
      execFileSync('git', ['--version'], { stdio: 'ignore', timeout: 8000, windowsHide: true })
      gitReady = true
    } catch {
      gitReady = false
    }
    return gitReady
  }

  function runGit(cwd, args) {
    return execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      timeout: 20000,
      windowsHide: true,
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
    })
  }

  function ensureMemoryRepo(bot) {
    const dir = memoryRepoDir(bot)
    const file = path.join(dir, 'memory.md')
    fs.mkdirSync(dir, { recursive: true })
    if (!fs.existsSync(file)) {
      try {
        const legacy = legacyMemoryFile(bot)
        if (legacy !== file && fs.existsSync(legacy)) fs.copyFileSync(legacy, file)
      } catch {
        /* migration is best-effort */
      }
    }
    const cached = memoryRepoState.get(dir)
    if (cached) return cached
    const result = { dir, file, available: false, error: '' }
    if (!gitUsable()) {
      result.error = 'GIT_NOT_FOUND'
      memoryRepoState.set(dir, result)
      return result
    }
    try {
      if (!fs.existsSync(path.join(dir, '.git'))) runGit(dir, ['init', '-q'])
      runGit(dir, ['config', 'user.name', 'DSH Bot'])
      runGit(dir, ['config', 'user.email', 'dsh-bot@localhost'])
      result.available = true
    } catch (error) {
      result.error = messageOf(error)
    }
    memoryRepoState.set(dir, result)
    return result
  }

  function memoryCommit(bot, message) {
    const info = ensureMemoryRepo(bot)
    if (!info.available) return null
    try {
      runGit(info.dir, ['add', 'memory.md'])
      if (!runGit(info.dir, ['status', '--porcelain', '--', 'memory.md']).trim()) return null
      runGit(info.dir, ['commit', '-q', '-m', message])
      return runGit(info.dir, ['rev-parse', '--short', 'HEAD']).trim()
    } catch (error) {
      console.error('[dsh-bot] memory commit failed', messageOf(error))
      return null
    }
  }

  function saveMemoryText(bot, text) {
    const info = ensureMemoryRepo(bot)
    fs.mkdirSync(info.dir, { recursive: true })
    fs.writeFileSync(info.file, text, 'utf8')
    const stamp = new Date().toLocaleString('sv-SE', { hour12: false }).slice(0, 16)
    const sha = memoryCommit(bot, `memory: update ${stamp}`)
    return { ...info, sha }
  }

  function memoryHistory(bot) {
    const info = ensureMemoryRepo(bot)
    const base = {
      available: info.available,
      dir: info.dir,
      file: info.file,
      error: info.error,
      commits: [],
      dirty: false,
    }
    if (!info.available) return base
    try {
      let hasHead = true
      try {
        runGit(info.dir, ['rev-parse', '--verify', 'HEAD'])
      } catch {
        hasHead = false
      }
      if (hasHead) {
        const log = runGit(info.dir, ['log', '--pretty=format:%h%x09%at%x09%s', '-n', '40']).trim()
        base.commits = log
          ? log.split('\n').map((line) => {
              const [sha, at, ...rest] = line.split('\t')
              return { sha, at: Number(at) * 1000, subject: rest.join('\t') }
            })
          : []
      }
      base.dirty = Boolean(runGit(info.dir, ['status', '--porcelain', '--', 'memory.md']).trim())
      return base
    } catch (error) {
      base.error = messageOf(error)
      return base
    }
  }

  function memoryDiff(bot, sha) {
    const info = ensureMemoryRepo(bot)
    if (!info.available) throw new Error('这个 Bot 的记忆还没有 Git 历史')
    const safe = String(sha || '')
    if (!/^[0-9a-f]{4,40}$/.test(safe)) throw new Error('无效的版本号')
    const text = runGit(info.dir, [
      'show',
      '--no-color',
      '--format=commit %h%n%ad%n%s',
      '--date=iso',
      safe,
      '--',
      'memory.md',
    ])
    return { sha: safe, diff: truncate(text, 60_000) }
  }

  function memoryRestore(bot, sha) {
    const info = ensureMemoryRepo(bot)
    if (!info.available) throw new Error('这个 Bot 的记忆还没有 Git 历史')
    const safe = String(sha || '')
    if (!/^[0-9a-f]{4,40}$/.test(safe)) throw new Error('无效的版本号')
    const text = runGit(info.dir, ['show', `${safe}:memory.md`])
    fs.writeFileSync(info.file, text, 'utf8')
    memoryCommit(bot, `memory: restore ${safe}`)
    return { text, restoredFrom: safe }
  }

  function readMemory(bot) {
    try {
      ensureMemoryRepo(bot)
      return fs.readFileSync(botMemoryFile(bot), 'utf8')
    } catch {
      return ''
    }
  }

  function personaText(bot) {
    const workspace = botWorkspace(bot)
    const adminMode = bot.privilege === 'admin'
    const autonomyMode = bot.autonomy === 'unattended'
    const own = bot.persona ? `\n## 这个 Bot 的额外设定\n${bot.persona}\n` : ''
    return [
      `你是 ${bot.name}，一个跑在用户本地 Windows 电脑上的 AI 同事。你的工作不是陪聊，而是把任务做完。`,
      '',
      '## 说话方式',
      '- 中文为主，短句，冷静，偶尔一点冷幽默。不客套，不自我吹捧，不说“作为一个 AI”。',
      '- 先动手，后汇报。能自己验证的，不要问用户。',
      '- 汇报只讲：做了什么、结果、证据、下一步。不要贴大段过程。',
      '- 需求模糊时，选最合理的解释并明说假设，然后继续；不要用问题把球踢回去。',
      '- 失败就直说，给出错误证据和替代路径。',
      '- 不编造命令输出、文件内容或测试结果。所有结论尽量有本机证据。',
      '',
      '## 工作方式',
      '- 你拥有整台本地电脑：PowerShell、文件系统、网络、后台任务、子代理、工作流、技能。',
      '- 复杂任务先拆解，能并行就并行；长任务用 goal / 后台 job 持续推进，不要停在中间等指令。',
      '- 每个任务只做一轮完整思考：先定计划，再连续执行；不要在每个小步骤重复长篇自我分析。中间只在方向变化时用一句话说明。',
      '- 改代码或文件前先读；改完要验证。交付要落到真实文件或可复现的结果。',
      `- 默认工作目录：${workspace}。用户指定其他路径时以用户为准。`,
      adminMode
        ? '- 完全权限模式：文件沙箱已关闭，系统设置、安装、注册表、服务、防火墙等管理员操作直接做，不要先问权限；只有删除数据、付款、对外发送消息等不可逆操作才用 bot_ask 确认。'
        : '- 需要用户决策、付款、对外发消息、删除工作区外文件、修改系统设置等不可逆操作时，先用 bot_ask 问一次；其余直接做。',
      '- 需要用户拍板时用 bot_ask；它会结束本轮，用户回答后自动继续。不要调用 ask_user_question / exit_plan_mode（Bot 页面禁用了这两个阻塞工具）。',
      `- 长期记忆文件：${botMemoryFile(bot)}。当用户给出长期偏好、项目背景、重要决定时，用 write/edit 更新它；不要覆盖无关内容。每次任务开始可先读它。`,
      '- 你能通过终端、文件和网络操作这台电脑，也能操作图形界面：先截图看坐标，再用点击/输入/按键/激活窗口。',
      `- GUI 控制脚本：${computerScript}。常用：python "${computerScript}" screenshot <png>（默认全部显示器，可加 primary/monitor:N），再用 read_image 查看；python "${computerScript}" windows / screen / activate <标题> / click <x> <y> / type "文字" / key ctrl+s。坐标是虚拟桌面物理像素。`,
      `- 默认浏览器 Edge：python "${edgeScript}" open <url> / navigate <url> / status；只有 Grok/Copilot 隔离才用 Firefox。`,
      `- 打开应用先找桌面版：python "${appsScript}" find <名字>；有就 python "${appsScript}" launch <名字>。只有没有桌面版时才用浏览器（默认 Edge）。不要用浏览器打开已有桌面版的豆包、ChatGPT、Claude 等。`,
      `- 使用国外 AI（ChatGPT / Claude / Copilot / Gemini / Grok）前，先 python "${proxyScript}" ensure；必须看到 verified=true、purity.clean=true、chineseCountry=false、chineseOrg=false，且 country/loc 不是 CN/HK/MO/TW、三次出口稳定、directIp 为空或不同。ensure 会在异常时自动启动 Clash、写系统代理、切换非 CN 节点并重验；仍失败就停，不得用浏览器/直连/computer.py 绕过。verified=false 或 apps.py 返回 PROXY_NOT_VERIFIED 时立即停，把错误原样告诉用户。apps.py 返回 CONTAINMENT_NOT_INSTALLED / CONTAINMENT_BROKEN / CONTAINMENT_UNSUPPORTED 时同样立即停，让用户双击桌面「DSH 国外AI硬隔离」并点 UAC。用户已明确没有住宅 IP，接受低风险商业 IP：purity.residential=false/server=true 不应阻止，也不要反复提醒或为此主动切节点；只要 clean=true 且上述国家/org/黑名单/稳定性都过关就放行。国内 AI（豆包 / Kimi / WorkBuddy / 天禧AI / DeepSeek）不强制开代理。`,
      '- 需要结构化选择或确认时，调用 bot_ask（question/options/detail）；它会结束本轮，用户回答后自动继续。不要用 ask_user_question。',
      '- 一套操作可能复用时，完成后把步骤写进长期记忆，标题用「流程：…」；下次先读记忆，按流程执行。长期记忆就是例程库。',
      adminMode
        ? `## 完全权限 + 管理员\n- 当前 Bot 已开启完全权限：DSH 文件沙箱关闭，不再受工作区限制，不要再说“没有权限/被沙箱拦住”。\n- 这条覆盖前面“修改系统设置先问一次”的保守说明：系统设置、安装、注册表、服务、防火墙、驱动等管理员操作直接做；只有删除数据、付款、对外发送消息等不可逆操作才用 bot_ask 确认。\n- 需要管理员权限时，用：python "${adminScript}" --command "<PowerShell 命令>"。它会通过 UAC 提权执行并返回 stdout/stderr/exitCode；UAC 在本机可能静默通过。\n- 普通命令仍优先直接跑；只有确实需要管理员时才提权，避免每条命令都弹一个高权限进程。\n- 提权命令也会写审计日志；不要把密码/token 放进 command。`
        : '',
      autonomyMode
        ? `## 无人值守模式（最高优先级）\n- 用户可能不在电脑前，无法回答问题。不要调用 bot_ask、ask_user_question、exit_plan_mode，也不要用“需要你确认/请问/是否要/要不要/等你回复”这类问句结束任务。\n- 这条覆盖前面所有“先问用户”的说明。信息不足时按你认为最优、最可逆的假设继续，并在最终报告里列出假设。\n- 遇到删除数据、付款、对外发送消息等不可逆操作：优先选可逆替代方案、跳过并记录原因，或按最小影响方式执行；不要停下来等用户。\n- 长任务用 goal / 后台 job / 子代理持续推进；不要在中途停住。完成或确实无法继续时，给出结果、证据、阻塞点和下一步建议。`
        : '',
      own,
    ].join('\n')
  }

  function runtimeText(bot, thread) {
    const memory = truncate(readMemory(bot).trim(), 12_000)
    const skills = skillsForBot(bot.id).slice(0, 6)
    const group = thread && thread.kind === 'member' ? state.threads.find((item) => item.id === thread.channelId) : null
    const teamBlock =
      bot.role === 'lead'
        ? [
            '',
            '## 你是团队老大（调度者）',
            '- 用户只对你说话。先判断：闲聊、判断、汇总、需要你拍板的事自己答；需要动手或需要专业领域的活，派给对应成员。',
            '- 用户点名了某位成员（例如“让磁盘清理……”）就必须派给该成员，不能因为你觉得简单就自己做；只有该成员不可用、或任务与它完全无关时才自己兜底，并在回复里说明原因。',
            '- 你自己动手只允许两类：读取/汇总已有结果；一句话能回答的判断。任何要执行命令、扫描磁盘、改文件、建目录的活，都派给专家。',
            '- 派活用 `bot_delegate(bot, task)`。task 要写全：目标、范围、验收标准、禁止事项、需要交付什么；不要只说一句“帮我看看”。',
            '- 现有成员都做不了时，先用 `bot_hire(name, persona, tagline, effort, model)` 招一个对口专家，再派活；告诉用户你新增了什么角色。不要招万能助手，名字要具体（例如“报税”“软件盘点”）。一次请求最多招 2 个。',
            '- 成本控制：`bot_delegate` 带 `effort` 参数。简单读取/单条命令用 `low`；多步脚本用 `high`；复杂分析或排障用 `max`；只有真正困难、值得升级的活才在派活时指定更强的模型。默认让队员用较低 effort。',
            '- 一次用户请求最多派 3 次活；不要重复派同一件事，也不要自己再去做专家的活。',
            '- 派完立刻告诉用户「已派给 X，完成后我汇总」，本轮可以结束；不要停在等待上。',
            '- 成员的结果会以【任务回执】自动回到这个对话。收到后向用户汇报：做了什么、结果、证据、下一步；不要把回执原文贴出来。',
            '- 成员在回执里提出假设或阻塞时，你负责向用户说明，或按最合理假设继续派下一轮；连续派两轮还不行就停下来汇报。',
            teamRosterText(bot),
          ].join('\n')
        : state.bots.some((item) => item.role === 'lead')
          ? [
              '',
              '## 团队协作',
              `- 你是团队里的 ${bot.name}。当消息以【老大派活】开头时，说明任务来自老大 Bot：按任务执行，直接把结果、证据、假设写在回复里；回执会自动回到老大，不需要你转达。`,
              '- 用户也可能直接找你，正常回答即可；信息不足时按最合理、最可恢复的假设继续，并在结果里列出假设。',
            ].join('\n')
          : ''
    const groupBlock = group
      ? [
          '',
          '## 群聊上下文',
          `- 你正在群聊「${group.title || '未命名群聊'}」里工作，成员：${groupMembers(group).map((item) => item.name).join('、')}。`,
          '- 用户的消息可能是发给全群的，也可能是 @ 点名的。只做你负责的部分，不要替其他成员执行他们的任务。',
          '- 需要别的成员帮忙时，用 bot_dispatch 派活（bot 用成员名字，task 写清要什么）；对方会在群里直接回复，你不需要等待。',
          `- 同一个用户请求里你最多派 ${DISPATCH_LIMIT} 次活；不要派回给刚派活给你的成员，也不要重复派同一件事。`,
        ].join('\n')
      : ''
    return [
      '## 本地运行环境（实时）',
      `- 当前 Bot：${bot.name}${bot.tagline ? `（${bot.tagline}）` : ''}`,
      `- 当前时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })}`,
      `- 主机：${os.hostname()}  用户：${os.userInfo().username}`,
      `- 系统：${os.type()} ${os.release()} (${os.arch()})`,
      `- 工作目录：${botWorkspace(bot)}`,
      `- 记忆文件：${botMemoryFile(bot)}`,
      `- GUI 控制脚本：${computerScript}`,
      `- 桌面应用启动：${appsScript}`,
      `- 默认浏览器：Microsoft Edge；打开网页用 python "${edgeScript}" open <url>，已有页面用 navigate/activate。只有 Grok/Copilot 隔离才用 Firefox。`,
      `- Firefox 隔离控制（仅 Grok/Copilot）：${browserScript}（Marionette；start/text/open/click/type/screenshot/quit；Grok 用 --profile grok，Copilot 用 --profile automation --direct-profile，不要用旧 copilot profile；外网依赖 Clash 7890）`,
      `- 多显示器：python "${computerScript}" screen 查看布局；screenshot 默认截取全部显示器，可加 primary 或 monitor:N。坐标使用虚拟桌面坐标。`,
      '',
      '## 浏览器任务（默认底层，不走视觉）',
      `- 默认用 Edge + UI Automation：python "${edgeScript}" read 读取页面全文和控件；click/type/select 直接操作控件。`,
      `- 所有网页内容（文章、搜索、文档、作业、表单）都先 read；只要 read.textLength > 0，就不要截图。`,
      `- 只打开一次：python "${edgeScript}" open <url>；之后用 read/click/type/select；不要每一步重新 open，也不要反复开新窗口。`,
      `- 长页面用 python "${edgeScript}" scroll down 分页读取，再 read；不要截图滚动。`,
      '- 表单/作业：一次 read 拿到 text + controls；按控件 name 填写/选择，再 click 提交；提交后再 read 一次确认结果。',
      '- 只有 read.textLength = 0，或页面明确是 canvas、PDF、图片题、验证码时，才 screenshot + read_image；截图不是默认路径。',
      '- 禁止“先截图看看再说”；能 read 就不截图，能 click/type 就不模拟鼠标坐标。',
      `- Clash / 系统代理：${proxyScript}`,
      `- 权限模式：${bot.privilege === 'admin' ? '完全权限 + 管理员' : '标准（文件沙箱）'}`,
      `- 任务模式：${bot.autonomy === 'unattended' ? '无人值守（不打断用户）' : '交互（必要时可拍板）'}`,
      bot.privilege === 'admin'
        ? `- 管理员执行：python "${adminScript}" --command "<PowerShell>"\n- 完全权限：系统设置/管理员操作直接做，不再先问权限；只有删除数据/付款/对外发送等不可逆操作才确认。`
        : '',
      bot.autonomy === 'unattended'
        ? '- 无人值守：不要调用 bot_ask，不要用问句结束；按最优可逆假设继续，最终报告列出假设。'
        : '',
      groupBlock,
      teamBlock,
      '',
      skills.length
        ? `## 可复用技能\n${skills.map((skill) => `- ${skill.title}：${truncate(firstLine(skill.prompt), 160)}`).join('\n')}`
        : '',
      '',
      '## 长期记忆',
      memory || '（暂无。用户分享稳定偏好或项目背景时，写入记忆文件。）',
    ].join('\n')
  }

  async function resolvePreset(thread) {
    const presets = ctx.get('agentPresets')
    if (!presets) return null
    const bot = botById(thread.botId)
    try {
      const preset = await presets.resolve(thread.presetId || bot.presetId || undefined)
      thread.presetId = preset.id
      return { service: presets, id: preset.id }
    } catch (error) {
      console.error('[dsh-bot] preset resolution failed', error)
      return null
    }
  }

  function setupAgent(agentCtx, thread) {
    const bot = botById(thread.botId)
    const systemPrompt = agentCtx.get('systemPrompt')
    if (systemPrompt) {
      try {
        agentCtx.systemPrompt.section({
          name: 'dsh-bot/identity',
          order: 140,
          text: personaText(bot),
          interpolate: false,
        })
      } catch (error) {
        console.error('[dsh-bot] persona section failed', error)
      }
      try {
        agentCtx.systemPrompt.context({
          name: 'dsh-bot/runtime',
          order: 140,
          text: () => runtimeText(bot, thread),
          interpolate: false,
        })
      } catch (error) {
        console.error('[dsh-bot] runtime context failed', error)
      }
    }
  }

  function composeSetup(preset, thread) {
    return async (agentCtx) => {
      if (preset) {
        try {
          await preset.service.mount(agentCtx, preset.id)
        } catch (error) {
          console.error('[dsh-bot] preset mount failed', error)
        }
      }
      setupAgent(agentCtx, thread)
    }
  }

  function agentOptions(thread) {
    const bot = thread ? botById(thread.botId) : activeBot()
    const override =
      thread && thread.modelProvider && thread.modelName
        ? {
            provider: thread.modelProvider,
            model: thread.modelName,
            reasoningEffort: thread.reasoningEffort || bot?.reasoningEffort || undefined,
          }
        : null
    const chosen =
      override ||
      (bot && bot.provider && bot.model
        ? { provider: bot.provider, model: bot.model, reasoningEffort: bot.reasoningEffort || undefined }
        : selection)
    if (!chosen) return undefined
    const options = { provider: chosen.provider, model: chosen.model }
    if (chosen.reasoningEffort) options.reasoningEffort = chosen.reasoningEffort
    return options
  }

  let modelProbe = null

  async function ensureDefaultModel() {
    if (modelProbe) return modelProbe
    modelProbe = (async () => {
      try {
        const current = ctx.get('agentDefaultModel')?.currentSelection?.()
        if (current?.provider && current?.model) selection = current
      } catch {
        /* keep the startup selection */
      }
      let provider = selection?.provider || null
      let model = selection?.model || null
      let effort = selection?.reasoningEffort || null
      if (!provider || !model) {
        try {
          const llm = ctx.get('llm')
          const providers = llm?.listProviders?.() || []
          const preferred = providers.find((item) => item.id === 'deepseek-official') || providers[0]
          if (preferred?.id) {
            const listed = await llm.listModels(preferred.id)
            const models = Array.isArray(listed) ? listed : []
            if (models.length > 0) {
              provider = preferred.id
              model = models[0].id
              effort = null
            }
          }
        } catch {
          /* no provider configured yet */
        }
      }
      if (!provider || !model) return false
      let changed = false
      for (const bot of state.bots) {
        if (bot.provider && bot.model) continue
        bot.provider = provider
        bot.model = model
        if (effort) bot.reasoningEffort = effort
        bot.updatedAt = now()
        changed = true
      }
      if (changed) saveStateNow()
      return true
    })()
    const ready = await Promise.race([
      modelProbe.catch(() => false),
      delay(6_000).then(() => false),
    ])
    if (!ready) modelProbe = null
    return ready
  }

  async function createAgentFor(thread, preset) {
    const bot = botById(thread.botId)
    const base = {
      sessionId: thread.sessionId,
      meta: {
        cwd: botWorkspace(bot),
        ...(preset ? { agentPreset: preset.id } : {}),
      },
      setup: composeSetup(preset, thread),
    }
    const options = agentOptions(thread)
    try {
      return await ctx.agents.create(options ? { ...base, agentOptions: options } : base)
    } catch (error) {
      if (!options) throw error
      try {
        return await ctx.agents.create(base)
      } catch {
        throw error
      }
    }
  }

  function applyAgentPrivilege(agent, thread) {
    const bot = botById(thread.botId)
    if (bot.privilege !== 'admin') return { ok: true, mode: 'standard' }
    const presets = ctx.get('permissionPresets')
    if (!presets?.set) return { ok: false, mode: 'admin', error: 'PERMISSION_SERVICE_UNAVAILABLE' }
    try {
      presets.set(agent.session, 'danger-full-access')
      return { ok: true, mode: 'admin' }
    } catch (error) {
      return { ok: false, mode: 'admin', error: messageOf(error) }
    }
  }

  function applyLivePrivilege(bot) {
    const presets = ctx.get('permissionPresets')
    if (!presets?.set) return { ok: false, error: 'PERMISSION_SERVICE_UNAVAILABLE' }
    const defaultPreset = presets.catalog?.()?.defaultPreset || 'workspace-write'
    const result = { ok: true, updated: 0 }
    for (const rec of live.values()) {
      if (rec.thread.botId !== bot.id) continue
      try {
        presets.set(rec.agent.session, bot.privilege === 'admin' ? 'danger-full-access' : defaultPreset)
        rec.privilegeError = null
        result.updated += 1
      } catch (error) {
        rec.privilegeError = messageOf(error)
        result.ok = false
        result.error = rec.privilegeError
      }
    }
    return result
  }

  async function openAgent(thread) {
    const preset = await resolvePreset(thread)
    const setup = composeSetup(preset, thread)
    let handle
    if (thread.created) {
      try {
        handle = await ctx.agents.resume({
          resumeSessionId: thread.sessionId,
          setup,
          ...(agentOptions(thread) ? { agentOptions: agentOptions(thread) } : {}),
        })
      } catch (error) {
        const failure = new Error(`无法恢复这个任务会话：${messageOf(error)}`)
        failure.code = 'BOT_RESUME_FAILED'
        throw failure
      }
    } else {
      try {
        handle = await createAgentFor(thread, preset)
      } catch (error) {
        /* A previous instance may already have persisted this id. */
        try {
          handle = await ctx.agents.resume({
            resumeSessionId: thread.sessionId,
            setup,
            ...(agentOptions(thread) ? { agentOptions: agentOptions(thread) } : {}),
          })
        } catch {
          throw error
        }
      }
      thread.created = true
    }

    const privilege = applyAgentPrivilege(handle.agent, thread)
    const rec = {
      thread,
      handle,
      agent: handle.agent,
      privilegeError: privilege.ok ? null : privilege.error,
      transcript: {
        items: [],
        activities: new Map(),
        notices: new Set(),
        lastSeq: 0,
        stats: {
          turns: 0,
          toolCalls: 0,
          inputTokens: 0,
          outputTokens: 0,
          reasoningTokens: 0,
          firstAt: 0,
          lastAt: 0,
          lastTurnStartedAt: 0,
          lastTurnEndedAt: 0,
          lastTurnReason: null,
        },
        model: (botById(thread.botId).model || selection?.model) || null,
        contextWindow: null,
      },
      stream: {
        attemptId: null,
        text: '',
        reasoning: '',
        toolName: '',
        active: false,
        startedAt: 0,
        updatedAt: 0,
        endedAt: 0,
      },
      running: false,
      lastError: null,
      pendingQuestion: null,
      run: null,
      lastAssistantText: '',
      lastTool: '',
      replaying: false,
      loopSeen: new Map(),
      loopHistory: [],
      callKeys: new Map(),
      failedCounts: new Map(),
      outputHistory: [],
      loopDetected: false,
      loopNoticed: false,
      loopDenials: 0,
      autoContinueCount: 0,
      autoContinueScheduled: false,
      dispatchCount: 0,
      delegateCount: 0,
      delegateDepth: 0,
      hireCount: 0,
      lastActivityAt: now(),
      stallNotifiedAt: 0,
      checkpointAt: 0,
      lastUsed: now(),
      openedAt: now(),
    }
    live.set(thread.id, rec)
    thread.error = null
    try {
      const tools = rec.agent.ctx?.tools
      if (tools?.guard) {
        tools.guard((execution) => {
          const safety = inspectToolExecution(rec, execution)
          if (safety) return safety
          const unattended = botById(rec.thread.botId).autonomy === 'unattended'
          if (unattended && ['bot_ask', 'ask_user_question', 'exit_plan_mode'].includes(execution?.name)) {
            return '当前是无人值守模式：用户不在电脑前，不能问。按你认为最优、最可逆的方案继续；把假设写进最终报告，不要停下来等答复。'
          }
          if (execution?.name === 'ask_user_question') {
            return 'DSH Bot 不使用阻塞式问答工具。请改用 bot_ask，或在回复中用文字提问并结束本轮。'
          }
          if (execution?.name === 'exit_plan_mode') {
            return 'DSH Bot 不使用计划审批工具。请直接说明计划，或改用 bot_ask。'
          }
          if (rec.loopDetected) {
            rec.loopDetected = false
            rec.loopDenials += 1
            return '最近几轮工具输出在重复同一组结果，继续同样的动作不会有新证据。换工具、换参数，或先停下来总结。'
          }
          if (execution?.arguments !== undefined) {
            const key = toolSignature(execution.name, execution.arguments)
            const count = rec.loopSeen.get(key) || 0
            if (count >= 2) {
              rec.loopDenials += 1
              return '同一个工具和同样的参数已经重复两次，结果不会变。换一种方法、换参数，或先检查上一步的错误再继续。'
            }
            if ((rec.failedCounts.get(key) || 0) >= 2) {
              rec.loopDenials += 1
              return '这个工具调用已经连续失败两次，再重复不会有新证据。先读错误、换参数或换工具。'
            }
            const proposed = [...rec.loopHistory, key].slice(-12)
            const cycle = repeatedCycle(proposed)
            if (cycle > 0) {
              const cycleTail = proposed.slice(-cycle * 2)
              if (cycleTail.includes(key)) {
                rec.loopDenials += 1
                return `检测到 ${cycle} 步工具循环：${cycleTail.map((item) => item.split(':')[0]).join(' → ')}。停下来换路，不要重复同一组动作。`
              }
            }
            rec.loopSeen.set(key, count + 1)
            rec.loopHistory.push(key)
            if (rec.loopHistory.length > 12) rec.loopHistory.shift()
          }
          return undefined
        })
      }
      if (tools?.register) {
        tools.register({
          name: 'bot_ask',
          description:
            'Ask the user a structured decision and end the current turn. Use this instead of ask_user_question. Provide a short question, optional options, and optional detail. The user answer arrives as the next user message.',
          parameters: {
            type: 'object',
            properties: {
              question: { type: 'string', description: 'The question to ask.' },
              options: {
                type: 'array',
                description: 'Optional 1-8 short choices.',
                items: { type: 'string' },
              },
              detail: { type: 'string', description: 'Optional context, diff, or plan excerpt.' },
              header: { type: 'string', description: 'Optional short heading.' },
            },
            required: ['question'],
            additionalProperties: false,
          },
          output: {
            schema: {
              type: 'object',
              properties: {
                status: { type: 'string' },
                question: { type: 'string' },
              },
              required: ['status', 'question'],
            },
            render: (args) => [{ type: 'text', text: `已把问题发给用户，本轮结束：${String(args?.question || '')}` }],
          },
          execute: async (args, exec) => {
            if (botById(rec.thread.botId).autonomy === 'unattended') {
              throw new Error('当前是无人值守模式：用户不在电脑前，不要问。按最优、最可逆的方案继续，并在最终报告里列出假设。')
            }
            const question = String(args?.question || '').trim()
            if (!question) throw new Error('bot_ask requires a question')
            const rawOptions = Array.isArray(args?.options) ? args.options : []
            const options = rawOptions
              .map((option) => (typeof option === 'string' ? option : option?.label))
              .filter((label) => typeof label === 'string' && label.trim())
              .map((label) => label.trim())
              .slice(0, 8)
            const detail = args?.detail ? String(args.detail).slice(0, 16_000) : ''
            const header = args?.header ? String(args.header).slice(0, 120) : ''
            rec.pendingQuestion = {
              id: crypto.randomUUID(),
              createdAt: now(),
              header,
              question,
              detail,
              options,
              questions: [
                {
                  id: 'q1',
                  header: header || undefined,
                  question,
                  detail: detail || undefined,
                  options: options.map((label) => ({ label })),
                },
              ],
            }
            try {
              exec?.concludeTurn?.()
            } catch {
              /* the turn may already be ending */
            }
            return { status: 'waiting_for_user', question }
          },
        })
        tools.register({
          name: 'bot_dispatch',
          description:
            'Hand a concrete subtask to another bot in the same group chat. The target bot runs in its own DSH session and replies in the group. Returns immediately; do not wait for its answer.',
          parameters: {
            type: 'object',
            properties: {
              bot: { type: 'string', description: 'Member name or id in this group chat.' },
              task: { type: 'string', description: 'What the other bot should do, with enough context to start.' },
            },
            required: ['bot', 'task'],
            additionalProperties: false,
          },
          output: {
            schema: {
              type: 'object',
              properties: {
                status: { type: 'string' },
                bot: { type: 'string' },
                threadId: { type: 'string' },
              },
              required: ['status', 'bot'],
            },
            render: (args) => [
              { type: 'text', text: `已把子任务派给 ${String(args?.bot || '成员')}，对方会在群里回复。` },
            ],
          },
          execute: async (args) => {
            const group = state.threads.find((item) => item.id === rec.thread.channelId)
            if (!group || group.kind !== 'group') throw new Error('bot_dispatch 只能在群聊里使用')
            const name = String(args?.bot || '').trim()
            const task = String(args?.task || '').trim()
            if (!name || !task) throw new Error('bot_dispatch 需要 bot 和 task')
            const target = groupMembers(group).find(
              (item) =>
                item.id === name ||
                item.name.toLowerCase() === name.toLowerCase() ||
                name.toLowerCase().includes(item.name.toLowerCase()),
            )
            if (!target) throw new Error(`群里没有成员「${name}」`)
            if (target.id === rec.thread.botId) throw new Error('不要给自己派活')
            if ((rec.dispatchCount || 0) >= DISPATCH_LIMIT) {
              throw new Error(`同一个用户请求里最多派 ${DISPATCH_LIMIT} 次活，剩下的自己做或直接在群里说明。`)
            }
            const child = memberThreadFor(group, target.id)
            if (!child) throw new Error('目标成员的会话不可用')
            let targetRec
            try {
              targetRec = await ensureAgent(child)
            } catch (error) {
              const stale = state.assignments.find(
                (item) => item.toThreadId === child.id && item.status === 'running',
              )
              if (stale) {
                stale.status = 'failed'
                stale.endedAt = now()
                stale.error = messageOf(error)
                stale.reported = true
              }
              saveStateNow()
              throw new Error(`目标成员会话打不开：${messageOf(error)}`)
            }
            const fromBot = botById(rec.thread.botId)
            const from = fromBot.name
            let assignment = null
            if (fromBot.role === 'lead') {
              /* The lead dispatching from a group still needs a receipt. Create
                 the same assignment record bot_delegate uses, bound to the
                 existing member thread, so turn/end reports back to the lead. */
              assignment = {
                id: `asg-${crypto.randomUUID()}`,
                fromBotId: fromBot.id,
                fromThreadId: rec.thread.id,
                toBotId: target.id,
                toThreadId: child.id,
                prompt: task,
                status: 'running',
                createdAt: now(),
                endedAt: 0,
                summary: '',
                error: '',
                reported: false,
                steps: 0,
                durationMs: 0,
                tokens: 0,
              }
              state.assignments.unshift(assignment)
              if (state.assignments.length > MAX_ASSIGNMENTS) state.assignments.length = MAX_ASSIGNMENTS
              child.assignmentId = assignment.id
              rec.transcript.items.push({
                kind: 'assignment',
                seq: `dispatch-${assignment.id}`,
                time: now(),
                assignmentId: assignment.id,
                action: 'dispatch',
                status: 'running',
                toName: target.name,
                toEmoji: target.emoji,
                title: task,
                summary: '',
                text: '',
              })
            }
            rec.dispatchCount = (rec.dispatchCount || 0) + 1
            const running = targetRec.agent.status === 'running'
            const text = [
              `【群聊派活】来自 @${from}：`,
              task,
              '',
              `这是群聊「${group.title || '群聊'}」里的分工。按你的职责独立完成，直接把结果发在群里；不需要回传给 ${from}，也不要再派回给他。`,
            ].join('\n')
            const payload = {
              id: crypto.randomUUID(),
              role: 'user',
              content: [{ type: 'text', text }],
              source: { kind: 'user' },
            }
            if (running) targetRec.agent.steer(payload)
            else targetRec.agent.followup(payload)
            targetRec.dispatchCount = 0
            child.updatedAt = now()
            group.updatedAt = now()
            saveStateSoon()
            return {
              status: 'dispatched',
              bot: target.name,
              threadId: child.id,
              assignmentId: assignment?.id || null,
            }
          },
        })
        if (botById(rec.thread.botId).role === 'lead') {
          tools.register({
            name: 'bot_delegate',
            description:
              'Delegate a subtask to a teammate bot. The teammate runs in its own session and its final result comes back automatically as a 【任务回执】 message in this conversation. Returns immediately: tell the user who got the task, then end the turn.',
            parameters: {
              type: 'object',
              properties: {
                bot: { type: 'string', description: 'Teammate name or id.' },
                task: {
                  type: 'string',
                  description: 'Complete brief: goal, scope, acceptance, and what must not be touched.',
                },
                effort: {
                  type: 'string',
                  enum: ['low', 'high', 'max'],
                  description: 'Reasoning effort for this assignment only. Simple reads: low; multi-step work: high; hard analysis: max.',
                },
                model: {
                  type: 'string',
                  description: 'Optional model id from the teammate provider. Omit to keep the teammate default.',
                },
              },
              required: ['bot', 'task'],
              additionalProperties: false,
            },
            output: {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string' },
                  bot: { type: 'string' },
                  assignmentId: { type: 'string' },
                },
                required: ['status', 'bot'],
              },
              render: (args) => [
                { type: 'text', text: `已派给 ${String(args?.bot || '成员')}，完成后回执会自动回来。` },
              ],
            },
            execute: async (args) => {
              const from = botById(rec.thread.botId)
              if (from.role !== 'lead') throw new Error('只有老大 Bot 可以派活')
              const name = String(args?.bot || '').trim()
              const task = String(args?.task || '').trim()
              if (!name || !task) throw new Error('bot_delegate 需要 bot 和 task')
              const target = state.bots.find(
                (bot) =>
                  bot.id !== from.id &&
                  (bot.id === name ||
                    bot.name.toLowerCase() === name.toLowerCase() ||
                    name.toLowerCase().includes(bot.name.toLowerCase())),
              )
              if (!target) throw new Error(`团队里没有成员「${name}」`)
              if ((rec.delegateDepth || 0) >= 2) {
                throw new Error('已经连续派了两轮，先汇总结果给用户，不要继续套娃派活。')
              }
              if ((rec.delegateCount || 0) >= DELEGATE_LIMIT) {
                throw new Error(`同一次请求最多派 ${DELEGATE_LIMIT} 次活`)
              }
              const { assignment, thread } = createAssignmentRecord(from, rec.thread, target, task, {
                effort: ['low', 'high', 'max'].includes(args?.effort) ? args.effort : '',
                model: textValue(args?.model, 120),
              })
              let targetRec
              try {
                targetRec = await ensureAgent(thread)
              } catch (error) {
                assignment.status = 'failed'
                assignment.endedAt = now()
                assignment.error = messageOf(error)
                assignment.reported = true
                saveStateNow()
                throw new Error(`派活失败：${messageOf(error)}`)
              }
              const running = targetRec.agent.status === 'running'
              const text = [
                `【老大派活】来自 ${from.name}：`,
                task,
                '',
                `这是团队分工，你只负责自己这部分。完成后直接给出结果、证据和假设；回执会自动回到 ${from.name}，不需要你转达，也不要再找别人派活。`,
              ].join('\n')
              const message = {
                id: crypto.randomUUID(),
                role: 'user',
                content: [{ type: 'text', text }],
                source: { kind: 'user' },
              }
              if (running) targetRec.agent.steer(message)
              else targetRec.agent.followup(message)
              rec.delegateCount = (rec.delegateCount || 0) + 1
              rec.delegateDepth = (rec.delegateDepth || 0) + 1
              rec.transcript.items.push({
                kind: 'assignment',
                seq: `dispatch-${assignment.id}`,
                time: now(),
                assignmentId: assignment.id,
                status: 'running',
                toName: target.name,
                toEmoji: target.emoji,
                title: task,
                summary: '',
                text: '',
              })
              thread.updatedAt = now()
              rec.thread.updatedAt = now()
              saveStateSoon()
              return { status: 'accepted', bot: target.name, assignmentId: assignment.id, threadId: thread.id }
            },
          })
          tools.register({
            name: 'bot_hire',
            description:
              'Hire a new specialist bot when no existing teammate fits the task. Creates a bot with its own workspace, memory and model, then you can delegate to it. Use a specific role name, not a general assistant.',
            parameters: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Short specific role name, e.g. 报税 or 软件盘点.' },
                emoji: { type: 'string', description: 'One emoji avatar.' },
                tagline: { type: 'string', description: 'One-line role summary.' },
                persona: {
                  type: 'string',
                  description: 'Full system prompt: responsibilities, rules, boundaries, output format.',
                },
                effort: { type: 'string', enum: ['low', 'high', 'max'] },
                model: { type: 'string', description: 'Optional model id from the same provider as the Boss.' },
              },
              required: ['name', 'persona'],
              additionalProperties: false,
            },
            output: {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string' },
                  bot: { type: 'string' },
                  botId: { type: 'string' },
                },
                required: ['status', 'bot'],
              },
              render: (args) => [{ type: 'text', text: `已新招成员：${String(args?.name || '')}` }],
            },
            execute: async (args) => {
              const from = botById(rec.thread.botId)
              if (from.role !== 'lead') throw new Error('只有老大可以招人')
              if ((rec.hireCount || 0) >= 2) throw new Error('一次用户请求最多新招 2 个成员')
              if (state.bots.length >= MAX_BOTS) throw new Error(`最多 ${MAX_BOTS} 个 Bot，先删掉不用的`)
              const name = textValue(args?.name, 32)
              const persona = textValue(args?.persona, 8_000)
              if (!name || !persona) throw new Error('bot_hire 需要 name 和 persona')
              if (state.bots.some((bot) => bot.name === name)) {
                throw new Error(`已经有叫「${name}」的成员，直接派活即可`)
              }
              const slug = name.replace(/[\\/:*?"<>|\s]+/g, '-').slice(0, 40) || 'member'
              const workspace = path.join(getWorkspace(), 'team', slug)
              const provider = from.provider || selection?.provider || null
              const requestedModel = textValue(args?.model, 120)
              const fallbackModel =
                provider === 'deepseek-official'
                  ? 'deepseek-flash'
                  : selection?.model || from.model || null
              const bot = createBotRecord({
                name,
                emoji: textValue(args?.emoji, 8) || '🤖',
                tagline: textValue(args?.tagline, 80) || '团队新成员',
                persona,
                role: 'member',
                privilege: 'standard',
                autonomy: 'unattended',
                workspace,
                provider,
                model: requestedModel || fallbackModel,
                reasoningEffort: ['low', 'high', 'max'].includes(args?.effort)
                  ? args.effort
                  : provider === 'deepseek-official'
                    ? 'low'
                    : null,
              })
              bot.role = 'member'
              state.activeBotId = from.id
              saveMemoryText(
                bot,
                `# ${name} · 长期记忆\n\n## 角色\n- ${bot.tagline}\n- ${firstLine(persona)}\n\n## 工作区\n- ${workspace}\n`,
              )
              rec.hireCount = (rec.hireCount || 0) + 1
              rec.transcript.items.push({
                kind: 'assignment',
                seq: `hire-${bot.id}`,
                time: now(),
                assignmentId: null,
                action: 'hire',
                status: 'success',
                toName: bot.name,
                toEmoji: bot.emoji,
                title: `新成员入职：${bot.tagline}`,
                summary: '',
                text: '',
              })
              saveStateNow()
              return { status: 'hired', bot: bot.name, botId: bot.id }
            },
          })
        }
      }
      rec.replaying = true
      try {
        foldNew(rec)
      } finally {
        rec.replaying = false
      }
    } catch (error) {
      rec.lastError = { message: messageOf(error), time: now() }
    }
    pruneLive(thread.id)
    saveStateSoon()
    return rec
  }

  function ensureAgent(thread) {
    const existing = live.get(thread.id)
    if (existing) {
      existing.lastUsed = now()
      return Promise.resolve(existing)
    }
    const inFlight = opening.get(thread.id)
    if (inFlight) return inFlight
    const failure = failures.get(thread.id)
    if (failure && now() - failure.at < OPEN_RETRY_MS) return Promise.reject(failure.error)

    const pending = openAgent(thread)
      .then((rec) => {
        failures.delete(thread.id)
        return rec
      })
      .catch((error) => {
        failures.set(thread.id, { at: now(), error })
        thread.error = messageOf(error)
        saveStateSoon()
        throw error
      })
      .finally(() => {
        opening.delete(thread.id)
      })
    opening.set(thread.id, pending)
    return pending
  }

  function disposeRec(threadId) {
    const rec = live.get(threadId)
    if (!rec) return Promise.resolve()
    try {
      closeRun(rec, 'interrupted', now(), '会话关闭')
    } catch {
      /* run bookkeeping is best-effort */
    }
    live.delete(threadId)
    try {
      return Promise.resolve(rec.handle.dispose()).catch(() => undefined)
    } catch {
      return Promise.resolve()
    }
  }

  function pruneLive(keepThreadId) {
    if (live.size <= MAX_LIVE_AGENTS) return
    const candidates = [...live.values()]
      .filter((rec) => rec.thread.id !== keepThreadId && rec.agent.status !== 'running')
      .sort((a, b) => a.lastUsed - b.lastUsed)
    while (live.size > MAX_LIVE_AGENTS && candidates.length > 0) {
      const rec = candidates.shift()
      disposeRec(rec.thread.id)
    }
  }

  /* ── session folding ───────────────────────────────────────────────── */

  function isInternalUserText(text) {
    /* DSH contributes model-facing context as user-role messages: the runtime
       snapshot, the workspace instructions reminder, and per-turn clocks. They
       belong to the model, not to the conversation the user sees. */
    return (
      text.startsWith('Current runtime context. This snapshot supersedes earlier runtime-context snapshots.') ||
      text.startsWith('<system-reminder>') ||
      text.startsWith('Time sampled while preparing turn') ||
      text.startsWith('Elapsed since the preceding')
    )
  }

  function ensureStats(rec) {
    return rec.transcript.stats
  }

  function pushNotice(rec, text, tone, seq, time) {
    const key = `${seq}:${tone}:${text}`
    if (rec.transcript.notices.has(key)) return
    rec.transcript.notices.add(key)
    rec.transcript.items.push({
      kind: 'notice',
      seq,
      time,
      tone,
      text,
    })
  }

  function foldNew(rec) {
    const session = rec.agent.session
    if (!session) return
    const to = session.seq
    if (to <= rec.transcript.lastSeq) return
    const events = session.snapshotEvents(rec.transcript.lastSeq, to)
    for (const event of events) foldEvent(rec, event)
    rec.transcript.lastSeq = to
    if (rec.transcript.items.length > 900) {
      rec.transcript.items.splice(0, rec.transcript.items.length - 900)
    }
  }

  function foldEvent(rec, event) {
    const transcript = rec.transcript
    const stats = ensureStats(rec)
    const time = Number(event.time) || now()
    const seq = Number(event.seq)
    const replaying = rec.replaying === true
    if (!transcript.items.length && !stats.firstAt) stats.firstAt = time
    stats.lastAt = time
    rec.lastActivityAt = time
    rec.thread.updatedAt = time

    switch (event.type) {
      case 'user/message': {
        const text = textOf(event.data?.content)
        if (!text || isInternalUserText(text)) break
        if (text.startsWith('[SCHEDULE REMINDER]')) {
          pushNotice(rec, '例程已触发', 'info', seq, time)
          break
        }
        if (/^background job /i.test(text)) {
          /* DSH wakes the session when a background job settles. That is not a
             new user turn: keep the current run open and just surface a notice. */
          pushNotice(rec, truncate(text.replace(/\s+/g, ' '), 260), 'info', seq, time)
          if (!replaying && !rec.run) startRun(rec, text, time)
          break
        }
        const isReport = text.startsWith('【任务回执】')
        if (isReport) {
          const parsed = parseAssignmentReport(text)
          transcript.items.push({
            kind: 'assignment',
            seq,
            time,
            status: parsed.status.includes('已完成')
              ? 'success'
              : parsed.status.includes('中断')
                ? 'aborted'
                : 'failed',
            toName: parsed.bot,
            title: parsed.title,
            summary: parsed.summary,
            text: truncate(text, 8_000),
          })
        } else {
          transcript.items.push({ kind: 'user', seq, time, text })
        }
        if (!replaying) {
          rec.loopSeen.clear()
          rec.loopHistory.length = 0
          rec.failedCounts.clear()
          rec.callKeys.clear()
          rec.outputHistory.length = 0
          rec.loopDetected = false
          rec.loopNoticed = false
          rec.loopDenials = 0
          rec.dispatchCount = 0
          if (!isReport) {
            rec.delegateCount = 0
            rec.delegateDepth = 0
            rec.hireCount = 0
          }
          if (rec.run && rec.run.status === 'running') {
            if (!rec.run.prompt || rec.run.prompt === rec.thread.title) {
              rec.run.prompt = textValue(text, 8_000) || rec.run.prompt
            }
          } else {
            startRun(rec, text, time)
          }
        }
        break
      }
      case 'assistant/message': {
        const message = event.data?.message
        const text = textOf(message?.content)
        const reasoning = reasoningOf(message?.content)
        if (text || reasoning) {
          transcript.items.push({
            kind: 'assistant',
            seq,
            time,
            text,
            reasoning,
            model: message?.source?.model || transcript.model,
          })
        }
        if (event.data?.usage) {
          stats.inputTokens += Number(event.data.usage.inputTokens) || 0
          stats.outputTokens += Number(event.data.usage.outputTokens) || 0
          stats.reasoningTokens += Number(event.data.usage.reasoningTokens) || 0
          if (!replaying && rec.run) {
            rec.run.inputTokens = (rec.run.inputTokens || 0) + (Number(event.data.usage.inputTokens) || 0)
            rec.run.outputTokens = (rec.run.outputTokens || 0) + (Number(event.data.usage.outputTokens) || 0)
            rec.run.reasoningTokens = (rec.run.reasoningTokens || 0) + (Number(event.data.usage.reasoningTokens) || 0)
            checkRunBudget(rec)
          }
        }
        if (text && !replaying) {
          rec.lastAssistantText = text
          if (rec.run) rec.run.summary = textValue(text, 4_000)
        }
        rec.stream.text = ''
        rec.stream.reasoning = ''
        rec.stream.toolName = ''
        rec.stream.active = false
        break
      }
      case 'tool/call': {
        const callId = String(event.data?.callId || `call-${seq}`)
        const item = {
          kind: 'activity',
          seq,
          time,
          callId,
          name: String(event.data?.name || 'tool'),
          argsRaw: truncate(event.data?.arguments || '', 4_000),
          args: parseArguments(event.data?.arguments),
          status: 'running',
          startedAt: time,
          endedAt: 0,
          durationMs: 0,
          result: '',
          error: null,
        }
        transcript.activities.set(callId, item)
        transcript.items.push(item)
        stats.toolCalls += 1
        if (!replaying) {
          rec.callKeys.set(callId, toolSignature(item.name, item.argsRaw))
          rec.lastTool = `${item.name}${item.argsRaw ? `: ${truncate(item.argsRaw, 300)}` : ''}`
        }
        if (!replaying && rec.run) {
          rec.run.steps += 1
          rec.run.toolCalls += 1
          if (rec.run.tools.length < 30) {
            rec.run.tools.push({ name: item.name, args: truncate(item.argsRaw, 300) })
          }
          checkRunBudget(rec)
        }
        break
      }
      case 'tool/result': {
        const callId = String(event.data?.message?.toolCallId || '')
        const item = transcript.activities.get(callId)
        const result = textOf(event.data?.message?.content)
        if (!replaying && result) {
          const normalized = result.trim().replace(/\s+/g, ' ').slice(0, 400)
          if (normalized) {
            rec.outputHistory.push(normalized)
            if (rec.outputHistory.length > 8) rec.outputHistory.shift()
            if (repeatedCycle(rec.outputHistory) > 0) {
              rec.loopDetected = true
              if (!rec.loopNoticed) {
                rec.loopNoticed = true
                pushNotice(rec, '检测到重复输出循环，下一次工具调用会被要求换路', 'warn', seq, time)
              }
            }
          }
        }
        const failed = Boolean(event.data?.error) || event.data?.message?.isError === true
        if (!replaying) appendToolResultAudit(rec, event, item, result, failed)
        if (failed && !replaying) {
          if (rec.run) rec.run.errors += 1
          const key = rec.callKeys.get(callId)
          if (key) rec.failedCounts.set(key, (rec.failedCounts.get(key) || 0) + 1)
        }
        if (item) {
          item.status = failed ? 'error' : 'done'
          item.endedAt = time
          item.durationMs = Math.max(0, time - item.startedAt)
          item.result = truncate(result, 8_000)
          if (!replaying && rec.run && result) {
            rec.run.evidence.push({ name: item.name, output: truncate(result, 1_200) })
            if (rec.run.evidence.length > 20) rec.run.evidence.shift()
          }
          item.error = event.data?.error
            ? {
                name: event.data.error.name || 'Error',
                code: event.data.error.code || '',
                reason: event.data.error.reason || '',
              }
            : null
        } else if (result) {
          transcript.items.push({
            kind: 'notice',
            seq,
            time,
            tone: failed ? 'error' : 'muted',
            text: truncate(result, 1_200),
          })
        }
        break
      }
      case 'turn/start': {
        stats.turns += 1
        stats.lastTurnStartedAt = time
        // 新的一轮开始时必须清掉上一轮的结束时间，否则 state 里会出现
        // lastTurnEndedAt < lastTurnStartedAt 的倒挂（用时会被算成 0 或负数）。
        stats.lastTurnEndedAt = 0
        stats.lastTurnReason = null
        rec.running = true
        rec.lastError = null
        if (!replaying) {
          rec.loopSeen.clear()
          rec.loopHistory.length = 0
          rec.failedCounts.clear()
          rec.callKeys.clear()
          rec.outputHistory.length = 0
          rec.loopDetected = false
          rec.loopNoticed = false
          rec.loopDenials = 0
          if (!rec.run) startRun(rec, rec.thread.title || '自动任务', time)
        }
        break
      }
      case 'turn/end': {
        const reason = event.data?.reason || { kind: 'completed' }
        stats.lastTurnEndedAt = time
        stats.lastTurnReason = reason.kind || 'completed'
        rec.running = false
        for (const item of transcript.activities.values()) {
          if (item.status === 'running') {
            item.status = 'stopped'
            item.endedAt = time
            item.durationMs = Math.max(0, time - item.startedAt)
          }
        }
        if (reason.kind === 'aborted') {
          pushNotice(rec, '已停止', 'muted', seq, time)
        } else if (reason.kind === 'error') {
          const message = messageOf(reason.error?.message || reason.error || '这一轮出错了')
          rec.lastError = { message, time }
          pushNotice(rec, `出错了：${message}`, 'error', seq, time)
        } else if (reason.kind === 'max-tokens') {
          pushNotice(rec, '达到单轮输出上限，已中断', 'warn', seq, time)
        }
        if (!replaying) {
          closeRun(rec, reason.kind || 'completed', time, rec.lastError?.message)
          const channel = rec.thread.channelId
            ? state.threads.find((item) => item.id === rec.thread.channelId)
            : null
          if (channel && rec.thread.kind === 'member') {
            const reply = textValue(rec.lastAssistantText, 8_000)
            const prompt = latestGroupPrompt(channel, time)
            const replyTo = prompt && time - Number(prompt.time) < 30 * 60 * 1000 ? prompt.id : null
            if (reply) {
              appendGroupMessage(channel, { text: reply, botId: rec.thread.botId, time, replyTo })
            } else if (!rec.pendingQuestion && reason.kind !== 'completed') {
              const label = reason.kind === 'aborted' ? '被中断' : '失败'
              const detail = rec.lastError?.message || messageOf(reason.error?.message || reason.error || '')
              appendGroupMessage(channel, {
                text: `（本轮${label}${detail ? `：${truncate(detail, 300)}` : ''}）`,
                botId: rec.thread.botId,
                time,
                replyTo,
              })
            }
          }
        } else if (rec.thread.assignmentId) {
          const assignment = state.assignments.find(
            (item) => item.toThreadId === rec.thread.id && item.status === 'running',
          )
          if (assignment) {
            assignment.status = reason.kind === 'completed' ? 'success' : 'failed'
            assignment.endedAt = time
            assignment.summary = textValue(rec.lastAssistantText, 4_000)
            assignment.error =
              reason.kind === 'completed'
                ? ''
                : messageOf(reason.error?.message || reason.kind || 'interrupted')
            assignment.reported = true
          }
        }
        saveStateSoon()
        break
      }
      case 'request/header': {
        const config = event.data?.header?.config
        if (config?.model) transcript.model = config.model
        break
      }
      case 'request/context': {
        if (event.data?.model) transcript.model = event.data.model
        if (Number(event.data?.contextWindow) > 0) transcript.contextWindow = Number(event.data.contextWindow)
        break
      }
      case 'llm/retry': {
        const retry = Number(event.data?.retry) || 0
        if (retry >= 2 && (!rec.lastRetryNoticeAt || now() - rec.lastRetryNoticeAt > 8_000)) {
          rec.lastRetryNoticeAt = now()
          pushNotice(rec, `模型连接失败，正在第 ${retry} 次重试…`, 'warn', seq, time)
        }
        if (event.data?.failure?.message) {
          rec.transcript.lastFailure = {
            message: String(event.data.failure.message),
            time,
            code: String(event.data.failure.code || ''),
          }
        }
        break
      }
      default:
        break
    }
  }

  /* ── live events ───────────────────────────────────────────────────── */

  function recForAgent(agent) {
    if (!agent) return null
    for (const rec of live.values()) {
      if (rec.agent === agent || rec.agent.id === agent.id) return rec
    }
    return null
  }

  function payloadOf(args) {
    for (const arg of args) {
      if (arg && typeof arg === 'object' && 'agent' in arg) return arg
    }
    /* Scoped emit may surface the carrier as the first argument and the
       event payload as the second. Normalize that shape here. */
    if (args[0] && typeof args[0] === 'object' && 'id' in args[0] && args[1] && typeof args[1] === 'object') {
      return { agent: args[0], ...args[1] }
    }
    return null
  }

  function applyStreamFrame(rec, frame) {
    if (!frame || !frame.type) return
    const stream = rec.stream
    if (frame.type === 'start') {
      stream.attemptId = frame.attemptId || null
      stream.text = ''
      stream.reasoning = ''
      stream.toolName = ''
      stream.active = true
      stream.startedAt = now()
      stream.updatedAt = now()
      stream.endedAt = 0
      return
    }
    if (frame.type === 'chunk') {
      const chunk = frame.chunk
      if (!chunk) return
      if (chunk.type === 'text-delta' && chunk.text) stream.text += chunk.text
      else if (chunk.type === 'reasoning-delta' && chunk.text) stream.reasoning += chunk.text
      else if (chunk.type === 'tool-call-delta' && chunk.name) stream.toolName = chunk.name
      else if (chunk.type === 'finish') stream.active = false
      stream.updatedAt = now()
      return
    }
    if (frame.type === 'end') {
      stream.active = false
      stream.updatedAt = now()
      stream.endedAt = now()
      if (frame.outcome?.kind === 'abandoned') {
        stream.text = ''
        stream.reasoning = ''
        stream.toolName = ''
      }
    }
  }

  const offs = []
  offs.push(ctx.on('agent/assistant-stream', (...args) => {
    const payload = payloadOf(args)
    if (!payload) return
    const rec = recForAgent(payload.agent)
    if (rec) applyStreamFrame(rec, payload.frame)
  }))
  offs.push(ctx.on('agent/status', (...args) => {
    const payload = payloadOf(args)
    if (!payload) return
    const rec = recForAgent(payload.agent)
    if (rec) {
      rec.running = payload.status === 'running'
      rec.lastUsed = now()
    }
  }))
  offs.push(ctx.on('agent/error', (...args) => {
    const payload = payloadOf(args)
    if (!payload) return
    const rec = recForAgent(payload.agent)
    if (rec) rec.lastError = { message: messageOf(payload.error), time: now() }
  }))
  offs.push(ctx.on('agent/disposed', (...args) => {
    const payload = payloadOf(args)
    if (!payload) return
    const rec = recForAgent(payload.agent)
    if (rec) live.delete(rec.thread.id)
  }))
  ctx.effect(() => {
    return () => {
      for (const off of offs) {
        try {
          off()
        } catch {
          /* already disposed */
        }
      }
      if (saveTimer) clearTimeout(saveTimer)
      for (const threadId of [...live.keys()]) disposeRec(threadId)
      saveStateNow()
    }
  })

  /* Session events are pulled from the durable log; without a ticker a run
     only advances when the UI happens to poll that thread. Background bots
     (team members, routines) need their turn/end folded so runs close and
     assignment reports are delivered. */
  const foldTimer = setInterval(() => {
    for (const rec of live.values()) {
      try {
        foldNew(rec)
      } catch (error) {
        rec.lastError = { message: messageOf(error), time: now() }
      }
    }
  }, 1500)
  if (typeof foldTimer.unref === 'function') foldTimer.unref()
  ctx.effect(() => () => clearInterval(foldTimer))

  /* ── snapshots ─────────────────────────────────────────────────────── */

  function threadInfo(thread, rec) {
    const running = rec ? rec.agent.status === 'running' : false
    const base = {
      id: thread.id,
      sessionId: thread.sessionId,
      botId: thread.botId,
      title: thread.title || '',
      kind: thread.kind || 'task',
      routineId: thread.routineId || null,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
      pinned: thread.pinned === true,
      order: Number(thread.order) || 0,
      archived: thread.archived === true,
      pinnedMessage: thread.pinnedMessage || null,
      pinnedMessages: Array.isArray(thread.pinnedMessages)
        ? thread.pinnedMessages
        : thread.pinnedMessage
          ? [thread.pinnedMessage]
          : [],
      running,
      live: Boolean(rec),
      created: thread.created,
      error: thread.error || (rec?.lastError?.message ?? null),
      model: rec?.transcript.model || botById(thread.botId).model || selection?.model || null,
    }
    if (isGroup(thread)) {
      const members = groupMemberView(thread)
      const leader = state.bots.find((bot) => bot.id === (thread.leaderId || (thread.memberIds || [])[0])) || state.bots[0]
      return {
        ...base,
        sessionId: '',
        botId: leader.id,
        running: state.meeting.running === true || members.some((member) => member.running),
        live: members.some((member) => member.live),
        error: null,
        kind: 'group',
        emoji: thread.emoji || '◈',
        leaderId: leader.id,
        memberIds: [...(thread.memberIds || [])],
        members,
        model: leader.model || selection?.model || null,
        messageCount: Array.isArray(thread.messages) ? thread.messages.length : 0,
      }
    }
    return base
  }

  function threadList(botId) {
    return [...state.threads]
      .filter((thread) => {
        if (thread.kind === 'member') return false
        if (thread.kind === 'group') return !botId || (thread.memberIds || []).includes(botId)
        return !botId || thread.botId === botId
      })
      .sort((a, b) => {
        const archive = Number(a.archived === true) - Number(b.archived === true)
        if (archive !== 0) return archive
        const pin = Number(b.pinned === true) - Number(a.pinned === true)
        if (pin !== 0) return pin
        if (a.pinned === true && b.pinned === true) return (Number(a.order) || 0) - (Number(b.order) || 0)
        return b.updatedAt - a.updatedAt
      })
      .map((thread) => threadInfo(thread, live.get(thread.id)))
  }

  function routineList(botId) {
    return state.routines
      .filter((routine) => !botId || routine.botId === botId)
      .map((routine) => ({ ...routine }))
  }

  function publicItem(item) {
    if (item.kind === 'assignment') {
      return {
        kind: 'assignment',
        seq: item.seq,
        time: item.time,
        assignmentId: item.assignmentId || null,
        action: item.action || null,
        status: item.status || 'running',
        toName: item.toName || '',
        toEmoji: item.toEmoji || '◉',
        title: truncate(item.title, 4_000),
        summary: truncate(item.summary, 4_000),
        text: truncate(item.text, 8_000),
      }
    }
    if (item.kind === 'activity') {
      return {
        kind: 'activity',
        seq: item.seq,
        time: item.time,
        callId: item.callId,
        name: item.name,
        args: item.args,
        argsRaw: truncate(item.argsRaw, 2_000),
        status: item.status,
        startedAt: item.startedAt,
        endedAt: item.endedAt,
        durationMs: item.durationMs,
        result: truncate(item.result, 6_000),
        error: item.error,
      }
    }
    if (item.kind === 'assistant') {
      return {
        kind: 'assistant',
        seq: item.seq,
        time: item.time,
        text: truncate(item.text, 32_000),
        reasoning: truncate(item.reasoning, 16_000),
        model: item.model,
      }
    }
    if (item.kind === 'notice') {
      return {
        kind: 'notice',
        seq: item.seq,
        time: item.time,
        tone: item.tone,
        text: truncate(item.text, 2_000),
      }
    }
    return {
      kind: 'user',
      seq: item.seq,
      time: item.time,
      text: truncate(item.text, 32_000),
    }
  }

  function publicStream(rec) {
    if (!rec) return null
    const stream = rec.stream
    if (!stream.text && !stream.reasoning) return null
    const fresh = stream.active || now() - stream.updatedAt < 5_000
    if (!fresh) return null
    return {
      text: truncate(stream.text, 32_000),
      reasoning: truncate(stream.reasoning, 16_000),
      toolName: stream.toolName || null,
      active: stream.active,
      startedAt: stream.startedAt,
      updatedAt: stream.updatedAt,
    }
  }

  function publicQuestion(pending) {
    return {
      id: pending.id,
      createdAt: pending.createdAt,
      header: pending.header,
      question: pending.question,
      detail: pending.detail,
      options: pending.options,
      questions: pending.questions,
    }
  }

  function teamOf(rec) {
    if (!rec) return []
    try {
      const agents = ctx.get('agents')
      if (!agents?.list) return []
      return agents
        .list()
        .filter((agent) => agent !== rec.agent && agents.isOwnedBy?.(agent.id, rec.agent))
        .map((agent) => ({
          id: agent.id,
          status: agent.status || 'unknown',
        }))
    } catch {
      return []
    }
  }

  function botInfo(bot) {
    return {
      id: bot.id,
      name: bot.name,
      fullName: bot.id === DEFAULT_BOT_ID ? 'DSH Bot' : bot.name,
      tagline: bot.tagline,
      emoji: bot.emoji,
      version: VERSION,
      provider: bot.provider || selection?.provider || null,
      model: bot.model || selection?.model || null,
      modelLabel: prettyModel(bot.model || selection?.model),
      presetId: bot.presetId,
      reasoningEffort: bot.reasoningEffort,
      role: bot.role === 'lead' ? 'lead' : 'member',
      privilege: bot.privilege || 'standard',
      autonomy: bot.autonomy || 'interactive',
      workspace: botWorkspace(bot),
      memoryPath: botMemoryFile(bot),
      host: os.hostname(),
      user: os.userInfo().username,
      platform: `${os.type()} ${os.release()}`,
      isDefault: bot.id === DEFAULT_BOT_ID,
      startedAt,
    }
  }

  function groupSnapshot(group) {
    const children = memberThreadsOf(group)
    const items = []
    const streams = []
    const questions = []
    const totals = {
      turns: 0,
      toolCalls: 0,
      inputTokens: 0,
      outputTokens: 0,
      reasoningTokens: 0,
      firstAt: 0,
      lastAt: 0,
      lastTurnStartedAt: 0,
      lastTurnEndedAt: 0,
      lastTurnReason: null,
      pending: 0,
    }
    for (const message of Array.isArray(group.messages) ? group.messages.slice(-120) : []) {
      items.push(publicGroupMessage(message, group))
    }
    const groupMessages = Array.isArray(group.messages) ? group.messages : []
    const channelHistory = {
      total: groupMessages.length,
      shown: Math.min(120, groupMessages.length),
      oldestTime: groupMessages.length > 0 ? Number(groupMessages[Math.max(0, groupMessages.length - 120)].time) || 0 : 0,
      hasMore: groupMessages.length > 120,
    }
    const persistentReplies = (group.messages || []).some((message) => message.botId)
    for (const child of children) {
      const rec = live.get(child.id)
      if (!rec) continue
      try {
        foldNew(rec)
      } catch (error) {
        rec.lastError = { message: messageOf(error), time: now() }
      }
      const bot = botById(child.botId)
      const speaker = { id: bot.id, name: bot.name, emoji: bot.emoji }
      const stats = rec.transcript.stats
      for (const key of ['turns', 'toolCalls', 'inputTokens', 'outputTokens', 'reasoningTokens']) {
        totals[key] += Number(stats[key]) || 0
      }
      totals.firstAt = totals.firstAt ? Math.min(totals.firstAt, stats.firstAt || totals.firstAt) : stats.firstAt
      totals.lastAt = Math.max(totals.lastAt, stats.lastAt || 0)
      totals.lastTurnStartedAt = Math.max(totals.lastTurnStartedAt, stats.lastTurnStartedAt || 0)
      totals.lastTurnEndedAt = Math.max(totals.lastTurnEndedAt, stats.lastTurnEndedAt || 0)
      totals.lastTurnReason = stats.lastTurnReason || totals.lastTurnReason
      totals.pending += (rec.agent?.inbox?.nextTurn?.length || 0) + (rec.agent?.inbox?.nextStep?.length || 0)
      for (const item of rec.transcript.items) {
        if (item.kind === 'user') continue
        if (persistentReplies && item.kind === 'assistant') continue
        const view = publicItem(item)
        view.botId = bot.id
        view.speaker = speaker
        view.id = `${bot.id}:${item.seq}`
        items.push(view)
      }
      const stream = publicStream(rec)
      if (stream) streams.push({ ...stream, botId: bot.id, speaker })
      if (rec.pendingQuestion) {
        questions.push({ ...publicQuestion(rec.pendingQuestion), botId: bot.id, speaker })
      }
    }
    items.sort(
      (left, right) =>
        (left.time || 0) - (right.time || 0) || String(left.id || '').localeCompare(String(right.id || '')),
    )
    streams.sort((left, right) => (right.updatedAt || 0) - (left.updatedAt || 0))
    const leader = state.bots.find((bot) => bot.id === (group.leaderId || (group.memberIds || [])[0])) || state.bots[0]
    return {
      ok: true,
      bot: botInfo(leader),
      bots: state.bots.map(publicBot),
      activeBotId: leader.id,
      privilege: leader.privilege || 'standard',
      privilegeError: null,
      autonomy: leader.autonomy || 'interactive',
      notify: publicNotify(),
      meeting: publicMeeting(),
      budget: state.budget,
      safety: {
        snapshots: state.snapshots.slice(0, 8),
        audits: state.audits.slice(0, 8),
        snapshotCount: state.snapshots.length,
        auditCount: state.audits.length,
      },
      thread: {
        ...threadInfo(group, null),
        running: state.meeting.running === true || groupMemberView(group).some((member) => member.running),
      },
      channel: publicChannel(group),
      channelHistory,
      channels: state.threads.filter((thread) => thread.kind === 'group').map(publicChannel),
      threads: threadList(leader.id),
      routines: routineList(leader.id),
      activeThreadId: group.id,
      modelReady: Boolean(agentOptions(group)),
      assignments: state.assignments
        .filter(
          (assignment) =>
            assignment.fromThreadId === group.id ||
            assignment.toThreadId === group.id ||
            children.some(
              (child) => child.id === assignment.fromThreadId || child.id === assignment.toThreadId,
            ),
        )
        .slice(0, 12)
        .map(publicAssignment),
      items: items.slice(-280),
      stream: streams[0] || null,
      streams,
      question: questions[0] || null,
      questions,
      checkpoint: null,
      quality: qualityForGroup(group),
      skills: skillsForBot(leader.id).slice(0, 40).map(publicSkill),
      roster: teamRoster(null),
      team: [],
      stats: {
        ...totals,
        elapsedMs: Math.max(0, (totals.lastAt || now()) - (totals.firstAt || group.createdAt)),
      },
      ts: now(),
    }
  }

  function qualityForGroup(group) {
    const threadIds = new Set(memberThreadsOf(group).map((thread) => thread.id))
    const runs = state.runs.filter((run) => threadIds.has(run.threadId))
    const finished = runs.filter((run) => run.status !== 'running')
    const success = finished.filter((run) => run.status === 'success').length
    const verified = finished.filter((run) => run.verification?.status === 'passed').length
    return {
      total: finished.length,
      success,
      failed: finished.length - success,
      verified,
      needsReview: finished.filter((run) => run.verification?.status === 'needs_review').length,
      rate: finished.length === 0 ? null : Math.round((success / finished.length) * 100),
      verifiedRate: finished.length === 0 ? null : Math.round((verified / finished.length) * 100),
      recent: runs.slice(0, 16).map(publicRun),
    }
  }

  function snapshot(thread) {
    if (isGroup(thread)) return groupSnapshot(thread)
    const rec = live.get(thread.id)
    if (rec) {
      try {
        foldNew(rec)
      } catch (error) {
        rec.lastError = { message: messageOf(error), time: now() }
      }
    }
    const bot = botById(thread.botId)
    const running = rec ? rec.agent.status === 'running' : false
    const stats = rec ? rec.transcript.stats : null
    const items = rec ? rec.transcript.items.slice(-280).map(publicItem) : []
    return {
      ok: true,
      bot: botInfo(bot),
      bots: state.bots.map(publicBot),
      activeBotId: bot.id,
      privilege: bot.privilege || 'standard',
      privilegeError: rec?.privilegeError || null,
      autonomy: bot.autonomy || 'interactive',
      notify: publicNotify(),
      meeting: publicMeeting(),
      budget: state.budget,
      safety: {
        snapshots: state.snapshots.slice(0, 8),
        audits: state.audits.slice(0, 8),
        snapshotCount: state.snapshots.length,
        auditCount: state.audits.length,
      },
      thread: threadInfo(thread, rec),
      modelReady: Boolean(agentOptions(thread)),
      threads: threadList(bot.id),
      routines: routineList(bot.id),
      activeThreadId: thread.id,
      assignments: state.assignments
        .filter((assignment) => assignment.fromThreadId === thread.id || assignment.toThreadId === thread.id)
        .slice(0, 12)
        .map(publicAssignment),
      roster: teamRoster(null),
      items,
      stream: publicStream(rec),
      question: rec?.pendingQuestion ? publicQuestion(rec.pendingQuestion) : null,
      checkpoint: thread.checkpoint || null,
      quality: qualityForBot(bot.id),
      skills: skillsForBot(bot.id).slice(0, 40).map(publicSkill),
      team: teamOf(rec),
      stats: stats
        ? {
            ...stats,
            elapsedMs: Math.max(0, (stats.lastAt || now()) - (stats.firstAt || thread.createdAt)),
            pending:
              (rec?.agent?.inbox?.nextTurn?.length || 0) + (rec?.agent?.inbox?.nextStep?.length || 0),
          }
        : null,
      ts: now(),
    }
  }

  async function openGroupMembers(group) {
    const members = memberThreadsOf(group).filter((child) => child.created || live.has(child.id))
    const limit = group.meeting ? 2 : members.length
    for (const child of members.slice(0, limit)) {
      if (live.has(child.id)) continue
      try {
        await ensureAgent(child)
        child.error = null
      } catch (error) {
        child.error = messageOf(error)
      }
    }
    saveStateSoon()
  }

  async function openThread(thread) {
    state.lastThreadId = thread.id
    saveStateSoon()
    if (isGroup(thread)) {
      await openGroupMembers(thread)
      return groupSnapshot(thread)
    }
    try {
      await ensureAgent(thread)
      thread.error = null
    } catch (error) {
      thread.error = messageOf(error)
      saveStateSoon()
    }
    return snapshot(thread)
  }

  /* ── routes ────────────────────────────────────────────────────────── */

  function isLocal(req) {
    const address = req.socket?.remoteAddress || ''
    return address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1'
  }

  function sameOrigin(req) {
    const site = req.headers['sec-fetch-site']
    if (site === 'cross-site') return false
    const origin = req.headers.origin
    if (origin && webOrigin && origin !== webOrigin) return false
    if (origin && !webOrigin) return false
    return true
  }

  function json(res, status, value) {
    if (res.headersSent) return
    const body = Buffer.from(JSON.stringify(value), 'utf8')
    res.writeHead(status, {
      'content-type': 'application/json; charset=utf-8',
      'content-length': body.length,
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    })
    res.end(body)
  }

  async function readBody(req, limit = BODY_LIMIT) {
    return await new Promise((resolve, reject) => {
      let size = 0
      const chunks = []
      req.on('data', (chunk) => {
        size += chunk.length
        if (size > limit) {
          reject(new Error('请求体过大'))
          req.destroy()
          return
        }
        chunks.push(chunk)
      })
      req.on('end', () => {
        if (size === 0) {
          resolve({})
          return
        }
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
        } catch {
          reject(new Error('请求体不是合法 JSON'))
        }
      })
      req.on('error', reject)
    })
  }

  async function handle(req, res) {
    try {
      if (!isLocal(req)) {
        json(res, 403, { ok: false, error: 'DSH Bot 只接受本机请求' })
        return
      }
      const url = new URL(req.url || '/', 'http://127.0.0.1')
      if (!url.pathname.startsWith(API_PREFIX)) {
        json(res, 404, { ok: false, error: 'Not found' })
        return
      }
      const sub = url.pathname.slice(API_PREFIX.length) || '/'

      if (req.method === 'GET' && sub === '/screenshot') {
        if (!sameOrigin(req)) {
          json(res, 403, { ok: false, error: '跨站请求被拒绝' })
          return
        }
        const shot = await captureForResponse()
        if (!shot || !shot.buf) {
          json(res, 404, { ok: false, error: shot?.error || '屏幕预览不可用' })
          return
        }
        res.writeHead(200, {
          'content-type': 'image/jpeg',
          'content-length': shot.buf.length,
          'cache-control': 'no-store',
          'x-content-type-options': 'nosniff',
        })
        res.end(shot.buf)
        return
      }

      if (!sameOrigin(req)) {
        json(res, 403, { ok: false, error: '跨站请求被拒绝' })
        return
      }

      if (req.method === 'GET' && sub === '/bootstrap') {
        const bot = activeBot()
        let thread = threadById(state.lastThreadId)
        const belongs =
          thread &&
          thread.archived !== true &&
          (thread.kind === 'group'
            ? (thread.memberIds || []).includes(bot.id)
            : thread.kind !== 'member' && thread.botId === bot.id)
        if (!belongs) thread = firstThreadForBot(bot.id)
        if (!thread) thread = createThreadRecord('', bot.id)
        state.activeBotId = bot.id
        await ensureDefaultModel()
        maybeRunMeeting('open')
        return json(res, 200, await openThread(thread))
      }

      if (req.method === 'GET' && sub === '/catalog') {
        return json(res, 200, { ok: true, ...(await botCatalog(url.searchParams.get('refresh') === '1')) })
      }

      if (req.method === 'GET' && sub === '/doctor') {
        const checks = []
        let stateWritable = false
        try {
          fs.accessSync(stateDir, fs.constants.W_OK)
          stateWritable = true
        } catch {
          stateWritable = false
        }
        checks.push({
          id: 'state',
          label: '状态目录可写',
          ok: stateWritable,
          detail: stateDir,
          fix: '检查 DSH_HOME/storages/dsh-bot 的权限',
        })
        const python = process.env.DSH_PYTHON || 'python'
        let pythonDetail = ''
        let pythonOk = false
        try {
          pythonDetail = String(execFileSync(python, ['--version'], {
            timeout: 3_000,
            windowsHide: true,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe'],
          })).trim()
          pythonOk = true
        } catch (error) {
          pythonDetail = messageOf(error)
        }
        checks.push({
          id: 'python',
          label: 'Python 可用',
          ok: pythonOk,
          detail: pythonDetail || python,
          fix: '安装 Python 3，或设置 DSH_PYTHON 指向 python.exe',
        })
        const edgeCandidates = [
          process.env.ProgramFiles && path.join(process.env.ProgramFiles, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
          process.env['ProgramFiles(x86)'] &&
            path.join(process.env['ProgramFiles(x86)'], 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
          process.env.LOCALAPPDATA &&
            path.join(process.env.LOCALAPPDATA, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
        ].filter(Boolean)
        const edgePath = edgeCandidates.find((candidate) => fs.existsSync(candidate)) || null
        checks.push({
          id: 'edge',
          label: 'Edge 可用',
          ok: Boolean(edgePath),
          detail: edgePath || '未找到 msedge.exe',
          fix: '安装 Microsoft Edge，或确认 Edge 安装路径',
        })
        checks.push({
          id: 'model',
          label: '模型已连接',
          ok: Boolean(agentOptions()),
          detail: `${activeBot().provider || selection?.provider || '无'} / ${activeBot().model || selection?.model || '无'}`,
          fix: '在 DSH 设置里接入 API 并选择默认模型，然后点“重新检测”',
        })
        let disk = null
        try {
          const stat = fs.statfsSync(stateDir)
          const free = Number(stat.bfree) * Number(stat.bsize)
          const total = Number(stat.blocks) * Number(stat.bsize)
          disk = { free, total, percent: total ? Math.round((free / total) * 100) : null }
        } catch {
          disk = null
        }
        checks.push({
          id: 'disk',
          label: '磁盘空间',
          ok: !disk || disk.percent === null || disk.percent > 5,
          detail: disk ? `${disk.percent}% 可用` : '无法读取',
          fix: '清理 C 盘或把工作区移到空间更大的磁盘',
        })
        checks.push({
          id: 'runtime',
          label: '运行时 API',
          ok: Boolean(webOrigin),
          detail: webOrigin || '未获取到 DSH web origin',
          fix: '重启 DSH 或重新加载插件',
        })
        return json(res, 200, {
          ok: checks.every((check) => check.ok),
          version: VERSION,
          checks,
          lastError: state.runs.find((run) => run.status === 'failed' || run.status === 'aborted')?.error || null,
        })
      }

      if (req.method === 'GET' && sub === '/health') {
        let stateBytes = 0
        try {
          stateBytes = fs.statSync(stateFile).size
        } catch {
          stateBytes = 0
        }
        const lastFailed = state.runs.find((run) => run.status === 'failed' || run.status === 'aborted')
        return json(res, 200, {
          ok: true,
          version: VERSION,
          uptimeSec: Math.round(process.uptime()),
          stateBytes,
          bots: state.bots.length,
          threads: state.threads.length,
          runs: state.runs.length,
          assignments: state.assignments.length,
          liveAgents: live.size,
          modelReady: Boolean(agentOptions()),
          provider: activeBot().provider || selection?.provider || null,
          model: activeBot().model || selection?.model || null,
          lastError: lastFailed ? { at: lastFailed.endedAt || 0, error: truncate(lastFailed.error || '', 500) } : null,
        })
      }

      if (req.method === 'POST' && sub === '/model/refresh') {
        modelProbe = null
        const ready = await ensureDefaultModel()
        return json(res, 200, {
          ok: true,
          modelReady: ready,
          model: activeBot().model || selection?.model || null,
          provider: activeBot().provider || selection?.provider || null,
        })
      }

      if (req.method === 'GET' && sub === '/state') {
        const threadId = url.searchParams.get('thread') || state.lastThreadId
        const thread = threadId ? threadById(threadId) : null
        if (!thread) {
          json(res, 404, { ok: false, error: '任务不存在' })
          return
        }
        if (isGroup(thread)) {
          return json(res, 200, groupSnapshot(thread))
        }
        if (!live.has(thread.id)) {
          try {
            await ensureAgent(thread)
            thread.error = null
          } catch (error) {
            thread.error = messageOf(error)
          }
        }
        return json(res, 200, snapshot(thread))
      }

      if (req.method === 'POST' && req.headers['x-dsh-bot-client'] !== '1') {
        json(res, 403, { ok: false, error: '缺少客户端标记' })
        return
      }

      if (req.method === 'POST' && sub === '/bot/create') {
        const body = await readBody(req)
        const bot = createBotRecord(body)
        const thread = createThreadRecord('', bot.id)
        saveStateNow()
        return json(res, 200, await openThread(thread))
      }

      if (req.method === 'POST' && sub === '/bot/select') {
        const body = await readBody(req)
        return json(res, 200, await openBot(String(body.botId || '')))
      }

      if (req.method === 'POST' && sub === '/bot/update') {
        const body = await readBody(req)
        const bot = state.bots.find((item) => item.id === body.botId)
        if (!bot) {
          json(res, 404, { ok: false, error: 'Bot 不存在' })
          return
        }
        const previousRole = bot.role
        applyBotPatch(bot, body)
        const privilege = 'privilege' in body ? applyLivePrivilege(bot) : null
        if ('role' in body && bot.role !== previousRole) {
          /* Bot tools are bound when the agent opens; reopen so a new lead
             actually gets bot_delegate and a demoted bot loses it. */
          for (const rec of [...live.values()]) {
            if (rec.thread.botId === bot.id) await disposeRec(rec.thread.id)
          }
        }
        saveStateNow()
        const thread = firstThreadForBot(bot.id)
        json(res, 200, {
          ok: true,
          bot: publicBot(bot),
          privilege,
          thread: thread ? threadInfo(thread, live.get(thread.id)) : null,
        })
        return
      }

      if (req.method === 'POST' && sub === '/bot/delete') {
        const body = await readBody(req)
        const bot = state.bots.find((item) => item.id === body.botId)
        if (!bot) {
          json(res, 404, { ok: false, error: 'Bot 不存在' })
          return
        }
        const thread = await removeBot(bot)
        return json(res, 200, await openThread(thread))
      }

      if (req.method === 'POST' && sub === '/assignment/retry') {
        const body = await readBody(req)
        const old = state.assignments.find((item) => item.id === String(body.assignmentId || ''))
        if (!old) {
          json(res, 404, { ok: false, error: '派活记录不存在' })
          return
        }
        if (old.status === 'running') {
          json(res, 409, { ok: false, error: '这条派活还在执行中' })
          return
        }
        if (old.status === 'success') {
          json(res, 409, { ok: false, error: '这条派活已经成功，不需要重试' })
          return
        }
        const fromBot = state.bots.find((bot) => bot.id === old.fromBotId)
        const toBot = state.bots.find((bot) => bot.id === old.toBotId)
        const fromThread = threadById(old.fromThreadId)
        const toThread = threadById(old.toThreadId)
        if (!fromBot || !toBot || !toThread) {
          json(res, 400, { ok: false, error: '原派活涉及的 Bot 或会话已删除' })
          return
        }
        if (!fromThread || fromThread.archived === true) {
          json(res, 400, { ok: false, error: '原发起会话已删除或归档，无法接收回执' })
          return
        }
        if (state.assignments.some((item) => item.toThreadId === toThread.id && item.status === 'running')) {
          json(res, 409, { ok: false, error: '这个成员还在执行上一个任务' })
          return
        }
        const retryCount = (Number(old.retryCount) || 0) + 1
        if (retryCount > 3) {
          json(res, 409, { ok: false, error: '同一个任务最多重试 3 次，请让老大重新拆任务' })
          return
        }
        const assignment = {
          id: `asg-${crypto.randomUUID()}`,
          fromBotId: fromBot.id,
          fromThreadId: fromThread.id,
          toBotId: toBot.id,
          toThreadId: toThread.id,
          prompt: old.prompt,
          status: 'running',
          createdAt: now(),
          endedAt: 0,
          summary: '',
          error: '',
          reported: false,
          steps: 0,
          durationMs: 0,
          tokens: 0,
          retryOf: old.retryOf || old.id,
          retryCount,
        }
        state.assignments.unshift(assignment)
        if (state.assignments.length > MAX_ASSIGNMENTS) state.assignments.length = MAX_ASSIGNMENTS
        toThread.assignmentId = assignment.id
        fromThread.transcript.items.push({
          kind: 'assignment',
          seq: `retry-${assignment.id}`,
          time: now(),
          assignmentId: assignment.id,
          action: 'dispatch',
          status: 'running',
          toName: toBot.name,
          toEmoji: toBot.emoji,
          title: old.prompt,
          summary: '',
          text: '',
        })
        const rec = await ensureAgent(toThread)
        const text = [
          `【重派任务】来自 ${fromBot.name}：`,
          old.prompt,
          '',
          '这是对上次未完成任务的重新执行。按原范围完成，结果会自动回执，不需要转达。',
        ].join('\n')
        const message = {
          id: crypto.randomUUID(),
          role: 'user',
          content: [{ type: 'text', text }],
          source: { kind: 'user' },
        }
        if (rec.agent.status === 'running') rec.agent.steer(message)
        else rec.agent.followup(message)
        toThread.updatedAt = now()
        fromThread.updatedAt = now()
        saveStateNow()
        return json(res, 200, { ok: true, assignmentId: assignment.id, threadId: toThread.id })
      }

      if (req.method === 'POST' && sub === '/channel/create') {
        const body = await readBody(req)
        const group = createGroupRecord(body)
        return json(res, 200, await openThread(group))
      }

      if (req.method === 'POST' && sub === '/channel/update') {
        const body = await readBody(req)
        const group = requireThread(String(body.threadId || ''))
        if (!isGroup(group)) {
          json(res, 400, { ok: false, error: '这个任务不是群聊' })
          return
        }
        updateGroupRecord(group, body)
        return json(res, 200, await openThread(group))
      }

      if (req.method === 'POST' && sub === '/channel/delete') {
        const body = await readBody(req)
        const group = requireThread(String(body.threadId || ''))
        if (!isGroup(group)) {
          json(res, 400, { ok: false, error: '这个任务不是群聊' })
          return
        }
        await deleteGroupRecord(group)
        let next = state.lastThreadId ? threadById(state.lastThreadId) : null
        if (!next) next = createThreadRecord('', activeBot().id)
        return json(res, 200, await openThread(next))
      }

      if (req.method === 'POST' && sub === '/team/bootstrap') {
        return json(res, 410, {
          ok: false,
          error: '固定团队模板已移除。请用“添加专家”按需创建，或直接让老大招人。',
        })
      }

      if (req.method === 'GET' && sub === '/meeting') {
        return json(res, 200, { ok: true, ...publicMeeting() })
      }

      if (req.method === 'GET' && sub === '/meeting/export') {
        const history = Array.isArray(state.meeting.history) ? state.meeting.history : []
        const lines = ['# 晨会纪要', '']
        if (history.length === 0) lines.push('（暂无纪要）', '')
        for (const entry of history) {
          lines.push(`## ${entry.date}`, '', String(entry.summary || '').trim(), '')
        }
        return json(res, 200, {
          ok: true,
          filename: `dsh-meeting-minutes-${meetingDateKey()}.md`,
          markdown: lines.join('\n'),
        })
      }

      if (req.method === 'POST' && sub === '/meeting/config') {
        const body = await readBody(req)
        if (typeof body.enabled === 'boolean') state.meeting.enabled = body.enabled
        if (typeof body.weekdaysOnly === 'boolean') state.meeting.weekdaysOnly = body.weekdaysOnly
        if (typeof body.onlyWhenWork === 'boolean') state.meeting.onlyWhenWork = body.onlyWhenWork
        saveStateNow()
        return json(res, 200, { ok: true, ...publicMeeting() })
      }

      if (req.method === 'POST' && sub === '/meeting/run') {
        const body = await readBody(req)
        if (state.meeting.running) {
          json(res, 409, { ok: false, error: '晨会已经在进行中' })
          return
        }
        const force = body.force !== false
        void runMorningMeeting(force)
        return json(res, 200, { ok: true, started: true, force })
      }

      if (req.method === 'POST' && sub === '/meeting/reset') {
        const group = state.threads.find((thread) => thread.kind === 'group' && thread.meeting === true)
        if (group) await deleteGroupRecord(group)
        state.meeting = defaultMeeting()
        saveStateNow()
        return json(res, 200, { ok: true })
      }

      if (req.method === 'GET' && sub === '/team') {
        const bot = botById(url.searchParams.get('botId') || state.activeBotId)
        const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 20))
        const offset = Math.max(0, Number(url.searchParams.get('offset')) || 0)
        const status = String(url.searchParams.get('status') || '')
        const memberId = String(url.searchParams.get('memberId') || '')
        let list = [...state.assignments]
        if (['running', 'success', 'failed', 'aborted'].includes(status)) {
          list = list.filter((assignment) => assignment.status === status)
        }
        if (memberId) {
          list = list.filter(
            (assignment) => assignment.fromBotId === memberId || assignment.toBotId === memberId,
          )
        }
        return json(res, 200, {
          ok: true,
          leadId: state.bots.find((item) => item.role === 'lead')?.id || null,
          roster: teamRoster(null),
          total: list.length,
          offset,
          limit,
          assignments: list.slice(offset, offset + limit).map(publicAssignment),
        })
      }

      if (req.method === 'POST' && sub === '/team/cleanup') {
        const body = await readBody(req)
        const keepRunning = body.keepRunning !== false
        const removedThreads = []
        const keep = []
        for (const assignment of state.assignments) {
          if (keepRunning && assignment.status === 'running') {
            keep.push(assignment)
            continue
          }
          const thread = threadById(assignment.toThreadId)
          if (thread && (thread.assignmentId === assignment.id || assignment.toThreadId === thread.id)) {
            await disposeRec(thread.id)
            state.runs = state.runs.filter((run) => run.threadId !== thread.id)
            state.threads = state.threads.filter((item) => item.id !== thread.id)
            removedThreads.push(thread.id)
          }
        }
        const before = state.assignments.length
        state.assignments = keep
        state.lastThreadId = activeBot() ? firstThreadForBot(activeBot().id)?.id || state.lastThreadId : state.lastThreadId
        saveStateNow()
        return json(res, 200, {
          ok: true,
          removedAssignments: before - keep.length,
          removedThreads: removedThreads.length,
          keptRunning: keep.length,
        })
      }

      if (req.method === 'GET' && sub === '/export') {
        const thread = requireThread(String(url.searchParams.get('threadId') || ''))
        const lines = []
        let count = 0
        if (thread.kind === 'group') {
          const title = thread.title || '群聊'
          lines.push(`# ${title}`, '')
          lines.push(`- 导出时间：${new Date().toLocaleString('zh-CN', { hour12: false })}`)
          lines.push(`- 消息数：${Array.isArray(thread.messages) ? thread.messages.length : 0}`, '')
          for (const message of Array.isArray(thread.messages) ? thread.messages : []) {
            const bot = message.botId ? state.bots.find((item) => item.id === message.botId) : null
            const name = bot?.name || '用户'
            const time = new Date(Number(message.time) || now()).toLocaleString('zh-CN', { hour12: false })
            lines.push(`## ${name} · ${time}`, '', String(message.text || '').trim(), '')
            count += 1
            if (lines.join('\n').length > 200_000) break
          }
        } else {
          const bot = state.bots.find((item) => item.id === thread.botId)
          lines.push(`# ${thread.title || '会话'}`, '')
          lines.push(`- Bot：${bot?.name || '未知'}`)
          lines.push(`- 导出时间：${new Date().toLocaleString('zh-CN', { hour12: false })}`, '')
          for (const item of thread.transcript?.items || []) {
            if (item.kind !== 'user' && item.kind !== 'assistant') continue
            if (!String(item.text || '').trim()) continue
            const time = new Date(Number(item.time) || now()).toLocaleString('zh-CN', { hour12: false })
            lines.push(`## ${item.kind === 'user' ? '用户' : bot?.name || '助手'} · ${time}`, '', String(item.text).trim(), '')
            count += 1
            if (lines.join('\n').length > 200_000) break
          }
        }
        const safe = String(thread.title || 'thread')
          .replace(/[\\/:*?"<>|]/g, '_')
          .slice(0, 40)
        const date = meetingDateKey()
        return json(res, 200, {
          ok: true,
          filename: `dsh-${safe || 'thread'}-${date}.md`,
          count,
          markdown: `${lines.join('\n')}\n`,
        })
      }

      if (req.method === 'GET' && sub === '/pins') {
        const pins = []
        for (const thread of state.threads) {
          if (thread.kind === 'member' || thread.archived === true) continue
          const list = Array.isArray(thread.pinnedMessages)
            ? thread.pinnedMessages
            : thread.pinnedMessage
              ? [thread.pinnedMessage]
              : []
          for (const pin of list) {
            if (!pin?.id || !pin.text) continue
            pins.push({
              id: String(pin.id),
              text: truncate(pin.text, 300),
              name: textValue(pin.name, 80),
              role: textValue(pin.role, 20),
              at: Number(pin.at) || 0,
              threadId: thread.id,
              threadTitle: thread.title || (thread.kind === 'group' ? '群聊' : '未命名会话'),
              threadKind: thread.kind === 'group' ? 'group' : 'task',
            })
          }
        }
        pins.sort((left, right) => (right.at || 0) - (left.at || 0))
        return json(res, 200, { ok: true, total: pins.length, pins: pins.slice(0, 100) })
      }

      if (req.method === 'GET' && sub === '/search') {
        const threadIdParam = String(url.searchParams.get('threadId') || '')
        const scopeAll = !threadIdParam || url.searchParams.get('scope') === 'all'
        const query = String(url.searchParams.get('q') || '').trim()
        const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit')) || 30))
        if (!query) {
          return json(res, 200, { ok: true, q: '', scope: scopeAll ? 'all' : 'thread', results: [], total: 0 })
        }
        const lower = query.toLowerCase()
        const targets = scopeAll
          ? state.threads.filter((thread) => thread.kind !== 'member' && thread.archived !== true)
          : [requireThread(threadIdParam)]
        const matches = []
        for (const thread of targets) {
          const title = thread.title || (thread.kind === 'group' ? '群聊' : '未命名会话')
          if (thread.kind === 'group') {
            for (const message of Array.isArray(thread.messages) ? thread.messages : []) {
              if (!String(message.text || '').toLowerCase().includes(lower)) continue
              matches.push({
                ...publicGroupMessage(message, thread),
                threadId: thread.id,
                threadTitle: title,
                threadKind: 'group',
              })
            }
          } else {
            const bot = state.bots.find((item) => item.id === thread.botId)
            for (const item of thread.transcript?.items || []) {
              if (item.kind !== 'user' && item.kind !== 'assistant') continue
              if (!String(item.text || '').toLowerCase().includes(lower)) continue
              matches.push({
                ...publicItem(item),
                speaker: bot ? { id: bot.id, name: bot.name, emoji: bot.emoji } : null,
                threadId: thread.id,
                threadTitle: title,
                threadKind: 'task',
              })
            }
          }
        }
        matches.sort((left, right) => (right.time || 0) - (left.time || 0))
        return json(res, 200, {
          ok: true,
          q: query,
          scope: scopeAll ? 'all' : 'thread',
          total: matches.length,
          results: matches.slice(0, limit),
        })
      }

      if (req.method === 'GET' && sub === '/channel/messages') {
        const thread = requireThread(String(url.searchParams.get('threadId') || ''))
        if (thread.kind !== 'group') {
          json(res, 400, { ok: false, error: '这个任务不是群聊' })
          return
        }
        const before = Number(url.searchParams.get('before')) || 0
        const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 40))
        const all = (Array.isArray(thread.messages) ? thread.messages : [])
          .filter((message) => !before || Number(message.time) < before)
          .sort((left, right) => (Number(left.time) || 0) - (Number(right.time) || 0))
        const page = all.slice(-limit)
        return json(res, 200, {
          ok: true,
          messages: page.map((message) => publicGroupMessage(message, thread)),
          hasMore: all.length > page.length,
          nextBefore: page.length > 0 ? Number(page[0].time) || 0 : 0,
        })
      }

      if (req.method === 'POST' && sub === '/channel/backfill') {
        const body = await readBody(req)
        const group = requireThread(String(body.threadId || ''))
        if (!isGroup(group)) {
          json(res, 400, { ok: false, error: '这个任务不是群聊' })
          return
        }
        const added = []
        for (const item of Array.isArray(body.messages) ? body.messages : []) {
          const bot = state.bots.find((entry) => entry.id === String(item?.botId || ''))
          if (!bot) continue
          const message = appendGroupMessage(group, {
            text: String(item?.text || ''),
            botId: bot.id,
            time: Number(item?.time) || now(),
            preserveTime: true,
          })
          if (message) added.push(message.id)
        }
        saveStateNow()
        return json(res, 200, { ok: true, added })
      }

      if (req.method === 'POST' && sub === '/routine/create') {
        const body = await readBody(req)
        const routine = await createRoutine(body)
        return json(res, 200, { ok: true, routine, threadId: routine.threadId })
      }

      if (req.method === 'POST' && sub === '/routine/update') {
        const body = await readBody(req)
        const routine = await updateRoutine(body)
        return json(res, 200, { ok: true, routine })
      }

      if (req.method === 'POST' && sub === '/routine/delete') {
        const body = await readBody(req)
        const routine = routineById(String(body.id || ''))
        if (!routine) {
          json(res, 404, { ok: false, error: '例程不存在' })
          return
        }
        await deleteRoutineRecord(routine, { keepThread: body.keepThread !== false })
        return json(res, 200, { ok: true })
      }

      if (req.method === 'POST' && sub === '/routine/run') {
        const body = await readBody(req)
        const routine = routineById(String(body.id || ''))
        if (!routine) {
          json(res, 404, { ok: false, error: '例程不存在' })
          return
        }
        const result = await runRoutine(routine)
        return json(res, 200, { ok: true, ...result })
      }

      if (req.method === 'POST' && sub === '/message/pin') {
        const body = await readBody(req)
        const thread = requireThread(String(body.threadId || ''))
        const action = String(body.action || '')
        if (!Array.isArray(thread.pinnedMessages)) {
          thread.pinnedMessages = thread.pinnedMessage ? [thread.pinnedMessage] : []
        }
        if (action === 'clear' || (!body.messageId && !action)) {
          thread.pinnedMessages = []
          thread.pinnedMessage = null
          saveStateNow()
          return json(res, 200, {
            ok: true,
            pinnedMessages: [],
            pinnedMessage: null,
            thread: threadInfo(thread, live.get(thread.id)),
          })
        }
        const messageId = String(body.messageId)
        if (action === 'remove') {
          thread.pinnedMessages = thread.pinnedMessages.filter((item) => item.id !== messageId)
          thread.pinnedMessage = thread.pinnedMessages[0] || null
          saveStateNow()
          return json(res, 200, {
            ok: true,
            pinnedMessages: thread.pinnedMessages,
            pinnedMessage: thread.pinnedMessage,
            thread: threadInfo(thread, live.get(thread.id)),
          })
        }
        let text = textValue(body.text, 2_000)
        let name = textValue(body.name, 80)
        let role = textValue(body.role, 20)
        if (thread.kind === 'group') {
          const message = (Array.isArray(thread.messages) ? thread.messages : []).find(
            (item) => item.id === messageId,
          )
          if (message) {
            text = message.text
            const bot = message.botId ? state.bots.find((item) => item.id === message.botId) : null
            name = bot?.name || ''
            role = bot ? 'assistant' : 'user'
          }
        } else {
          const item = (thread.transcript?.items || []).find(
            (entry) => entry.id === messageId || entry.seq === messageId,
          )
          if (item) {
            text = item.text || text
            role = item.kind || role
          }
        }
        if (!text) {
          json(res, 400, { ok: false, error: '找不到这条消息' })
          return
        }
        const pinned = {
          id: messageId,
          text: truncate(text, 600),
          name,
          role,
          at: Number(body.time) || now(),
        }
        thread.pinnedMessages = [pinned, ...thread.pinnedMessages.filter((item) => item.id !== messageId)].slice(0, 10)
        thread.pinnedMessage = thread.pinnedMessages[0] || null
        saveStateNow()
        return json(res, 200, {
          ok: true,
          pinnedMessages: thread.pinnedMessages,
          pinnedMessage: thread.pinnedMessage,
          thread: threadInfo(thread, live.get(thread.id)),
        })
      }

      if (req.method === 'POST' && sub === '/thread/pin') {
        const body = await readBody(req)
        const thread = requireThread(String(body.threadId || ''))
        thread.pinned = body.pinned !== false
        if (thread.pinned) {
          if (!thread.order) {
            const maxOrder = Math.max(
              0,
              ...state.threads
                .filter((item) => item.pinned === true && item.id !== thread.id)
                .map((item) => Number(item.order) || 0),
            )
            thread.order = maxOrder + 1
          }
        } else {
          thread.order = 0
        }
        thread.updatedAt = now()
        saveStateNow()
        return json(res, 200, { ok: true, thread: threadInfo(thread, live.get(thread.id)) })
      }

      if (req.method === 'POST' && sub === '/thread/reorder') {
        const body = await readBody(req)
        const ids = Array.isArray(body.threadIds) ? body.threadIds : []
        let order = 0
        for (const id of ids) {
          const thread = threadById(String(id))
          if (!thread || thread.kind === 'member') continue
          thread.pinned = true
          thread.order = order
          order += 1
        }
        saveStateNow()
        return json(res, 200, { ok: true, threads: threadList(activeBot().id) })
      }

      if (req.method === 'POST' && sub === '/thread/archive') {
        const body = await readBody(req)
        const thread = requireThread(String(body.threadId || ''))
        thread.archived = body.archived !== false
        thread.updatedAt = now()
        if (thread.archived && state.lastThreadId === thread.id) {
          const next = [...state.threads]
            .filter((item) => item.kind !== 'member' && item.archived !== true && item.id !== thread.id)
            .sort((a, b) => b.updatedAt - a.updatedAt)[0]
          state.lastThreadId = next?.id || null
        }
        saveStateNow()
        return json(res, 200, { ok: true, thread: threadInfo(thread, live.get(thread.id)) })
      }

      if (req.method === 'POST' && sub === '/thread/rename') {
        const body = await readBody(req)
        const thread = requireThread(String(body.threadId || ''))
        const title = textValue(body.title, 80)
        if (title) thread.title = title
        thread.updatedAt = now()
        saveStateNow()
        return json(res, 200, { ok: true, thread: threadInfo(thread, live.get(thread.id)) })
      }

      if (req.method === 'POST' && sub === '/open') {
        const body = await readBody(req)
        const thread = requireThread(body.threadId)
        state.activeBotId = thread.botId
        return json(res, 200, await openThread(thread))
      }

      if (req.method === 'POST' && sub === '/new') {
        const body = await readBody(req)
        const bot = body.botId ? state.bots.find((item) => item.id === body.botId) : activeBot()
        if (!bot) {
          json(res, 404, { ok: false, error: 'Bot 不存在' })
          return
        }
        state.activeBotId = bot.id
        const thread = createThreadRecord('', bot.id)
        saveStateSoon()
        return json(res, 200, await openThread(thread))
      }

      if (req.method === 'POST' && sub === '/send') {
        const body = await readBody(req)
        const thread = requireThread(body.threadId)
        const text = String(body.text || '').trim()
        if (!text) {
          json(res, 400, { ok: false, error: '消息不能为空' })
          return
        }
        if (text.length > 24_000) {
          json(res, 400, { ok: false, error: '消息太长' })
          return
        }
        await ensureDefaultModel()
        if (!agentOptions(thread)) {
          json(res, 409, {
            ok: false,
            error: '当前 DSH 还没有可用模型。请先在 DSH 设置里接入 API 并选择默认模型，再发任务。',
          })
          return
        }
        if (isGroup(thread)) {
          try {
            const result = await sendToGroup(thread, text, body.replyTo)
            json(res, 200, result)
          } catch (error) {
            json(res, error?.statusCode || 500, { ok: false, error: messageOf(error) })
          }
          return
        }
        let rec
        try {
          rec = await ensureAgent(thread)
        } catch (error) {
          json(res, 502, {
            ok: false,
            error: `模型连接失败：${messageOf(error)}。请检查 DSH 的模型 / API 配置。`,
          })
          return
        }
        const running = rec.agent.status === 'running'
        rec.pendingQuestion = null
        rec.autoContinueCount = 0
        rec.autoContinueScheduled = false
        thread.checkpoint = null
        const message = {
          id: crypto.randomUUID(),
          role: 'user',
          content: [{ type: 'text', text }],
          source: { kind: 'user' },
        }
        if (running) rec.agent.steer(message)
        else rec.agent.followup(message)
        if (!thread.title) thread.title = text.replace(/\s+/g, ' ').slice(0, 28)
        thread.updatedAt = now()
        thread.error = null
        rec.lastUsed = now()
        saveStateSoon()
        json(res, 200, {
          ok: true,
          mode: running ? 'steer' : 'followup',
          threadId: thread.id,
        })
        return
      }

      if (req.method === 'POST' && sub === '/select') {
        const body = await readBody(req)
        const thread = requireThread(body.threadId)
        state.lastThreadId = thread.id
        state.activeBotId = thread.botId
        saveStateSoon()
        json(res, 200, { ok: true, thread: threadInfo(thread, live.get(thread.id)) })
        return
      }

      if (req.method === 'POST' && sub === '/resume') {
        const body = await readBody(req)
        const thread = requireThread(body.threadId)
        const checkpoint = thread.checkpoint
        if (!checkpoint) {
          json(res, 409, { ok: false, error: '这个任务没有可恢复的检查点' })
          return
        }
        const rec = await ensureAgent(thread)
        rec.autoContinueCount = 0
        rec.autoContinueScheduled = false
        const text = [
          `上次任务在「${truncate(checkpoint.prompt, 300)}」中断。`,
          checkpoint.lastAssistant ? `中断前最后回复：${truncate(checkpoint.lastAssistant, 800)}` : '',
          checkpoint.lastTool ? `中断前最后动作：${truncate(checkpoint.lastTool, 500)}` : '',
          checkpoint.error ? `错误：${truncate(checkpoint.error, 800)}` : '',
          '请从断点继续，不要从头重新分析；先检查当前状态和已完成部分，再继续完成剩余工作，最后给出验收结果。',
        ].filter(Boolean).join('\n')
        thread.checkpoint = null
        const message = {
          id: crypto.randomUUID(),
          role: 'user',
          content: [{ type: 'text', text }],
          source: { kind: 'user' },
        }
        if (rec.agent.status === 'running') rec.agent.steer(message)
        else rec.agent.followup(message)
        thread.updatedAt = now()
        saveStateSoon()
        json(res, 200, { ok: true, text })
        return
      }

      if (req.method === 'POST' && sub === '/retry') {
        const body = await readBody(req)
        const thread = requireThread(body.threadId)
        const run = state.runs.find((item) => item.threadId === thread.id)
        if (!run?.prompt) {
          json(res, 409, { ok: false, error: '没有可重试的任务' })
          return
        }
        const rec = await ensureAgent(thread)
        rec.autoContinueCount = 0
        rec.autoContinueScheduled = false
        const text = `重新执行以下任务。先检查上一次的失败原因，不要重复同样的错误：\n${run.prompt}`
        thread.checkpoint = null
        const message = {
          id: crypto.randomUUID(),
          role: 'user',
          content: [{ type: 'text', text }],
          source: { kind: 'user' },
        }
        if (rec.agent.status === 'running') rec.agent.steer(message)
        else rec.agent.followup(message)
        thread.updatedAt = now()
        saveStateSoon()
        json(res, 200, { ok: true, text })
        return
      }

      if (req.method === 'POST' && sub === '/skill/capture') {
        const body = await readBody(req)
        const skill = captureSkillForThread(String(body.threadId || ''), body.runId ? String(body.runId) : undefined)
        json(res, 200, { ok: true, skill: publicSkill(skill), skills: skillsForBot(skill.botId).map(publicSkill) })
        return
      }

      if (req.method === 'POST' && sub === '/skill/run') {
        const body = await readBody(req)
        const skill = state.skills.find((item) => item.id === String(body.id || ''))
        const thread = await runSkillRecord(skill)
        json(res, 200, {
          ok: true,
          threadId: thread.id,
          botId: skill.botId,
          thread: threadInfo(thread, live.get(thread.id)),
          skills: skillsForBot(skill.botId).map(publicSkill),
        })
        return
      }

      if (req.method === 'POST' && sub === '/snapshot/restore') {
        const body = await readBody(req)
        try {
          const result = restoreSnapshot(String(body.id || ''))
          json(res, 200, { ok: true, ...result, safety: { snapshots: state.snapshots.slice(0, 8) } })
        } catch (error) {
          json(res, 400, { ok: false, error: messageOf(error) })
        }
        return
      }

      if (req.method === 'POST' && sub === '/run/verify') {
        const body = await readBody(req)
        const run = state.runs.find((item) => item.id === String(body.runId || ''))
        if (!run) {
          json(res, 404, { ok: false, error: '任务记录不存在' })
          return
        }
        const status = ['passed', 'needs_review', 'failed'].includes(body.status) ? body.status : 'needs_review'
        run.verification = {
          status,
          method: 'human',
          note: textValue(body.note, 1_000) || '人工验收',
          at: now(),
          checks: run.verification?.checks || [],
        }
        saveStateNow()
        json(res, 200, { ok: true, run: publicRun(run), quality: qualityForBot(run.botId) })
        return
      }

      if (req.method === 'POST' && sub === '/skill/delete') {
        const body = await readBody(req)
        const id = String(body.id || '')
        state.skills = state.skills.filter((skill) => skill.id !== id)
        saveStateNow()
        json(res, 200, { ok: true, skills: skillsForBot(activeBot().id).map(publicSkill) })
        return
      }

      if (req.method === 'POST' && sub === '/stop') {
        const body = await readBody(req)
        const thread = requireThread(body.threadId)
        if (isGroup(thread)) {
          const stopped = []
          for (const child of memberThreadsOf(thread)) {
            const rec = live.get(child.id)
            if (!rec) continue
            try {
              rec.agent.cancel({ kind: 'user' })
              rec.running = false
              if (rec.run) closeRun(rec, 'aborted', now(), '用户停止')
              stopped.push(child.botId)
            } catch {
              /* keep stopping the rest */
            }
          }
          json(res, 200, { ok: true, stopped })
          return
        }
        const rec = live.get(thread.id)
        if (rec) {
          try {
            rec.agent.cancel({ kind: 'user' })
            rec.running = false
            if (rec.run) closeRun(rec, 'aborted', now(), '用户停止')
          } catch (error) {
            json(res, 500, { ok: false, error: messageOf(error) })
            return
          }
        }
        json(res, 200, { ok: true })
        return
      }

      if (req.method === 'POST' && sub === '/delete') {
        const body = await readBody(req)
        const thread = requireThread(body.threadId)
        if (isGroup(thread)) {
          await deleteGroupRecord(thread)
          const next = state.lastThreadId ? threadById(state.lastThreadId) : null
          json(res, 200, {
            ok: true,
            threads: threadList(botById(next?.botId || activeBot().id).id),
            activeThreadId: state.lastThreadId,
            botId: activeBot().id,
          })
          return
        }
        if (thread.routineId) {
          const routine = routineById(thread.routineId)
          if (routine) {
            await deleteRoutineRecord(routine, { keepThread: false })
          }
        }
        await disposeRec(thread.id)
        state.threads = state.threads.filter((item) => item.id !== thread.id)
        state.runs = state.runs.filter((run) => run.threadId !== thread.id)
        const next = firstThreadForBot(thread.botId)
        if (state.lastThreadId === thread.id) state.lastThreadId = next?.id || null
        saveStateNow()
        json(res, 200, {
          ok: true,
          threads: threadList(thread.botId),
          activeThreadId: state.lastThreadId,
          botId: thread.botId,
        })
        return
      }

      if (req.method === 'POST' && sub === '/reset') {
        const body = await readBody(req)
        const thread = requireThread(body.threadId)
        if (isGroup(thread)) {
          for (const child of memberThreadsOf(thread)) {
            await disposeRec(child.id)
            child.sessionId = newSessionId()
            child.created = false
            child.error = null
            child.checkpoint = null
          }
          thread.messages = []
          thread.updatedAt = now()
          saveStateNow()
          return json(res, 200, await openThread(thread))
        }
        await disposeRec(thread.id)
        thread.sessionId = newSessionId()
        thread.created = false
        thread.error = null
        thread.title = thread.title || ''
        thread.updatedAt = now()
        saveStateNow()
        return json(res, 200, await openThread(thread))
      }

      if (req.method === 'GET' && sub === '/notify') {
        json(res, 200, { ok: true, config: state.notify })
        return
      }

      if (req.method === 'POST' && sub === '/notify') {
        const body = await readBody(req)
        const config = updateNotify(body)
        json(res, 200, { ok: true, config })
        return
      }

      if (req.method === 'GET' && sub === '/budget') {
        json(res, 200, { ok: true, budget: state.budget })
        return
      }

      if (req.method === 'POST' && sub === '/budget') {
        const body = await readBody(req)
        json(res, 200, { ok: true, budget: updateBudget(body) })
        return
      }

      if (req.method === 'GET' && sub === '/notify/remote-test') {
        const chat = await readQQChat()
        json(res, 200, {
          ok: Boolean(chat?.ok),
          title: chat?.title || null,
          count: chat?.messages?.length || 0,
          last: chat?.messages?.slice(-1)[0] || null,
          error: chat?.error || null,
          detail: chat?.detail || null,
        })
        return
      }

      if (req.method === 'POST' && sub === '/notify/test') {
        const body = await readBody(req)
        if (body && Object.keys(body).length > 0) updateNotify(body)
        const result = await testQQNotification()
        if (result.ok) {
          state.notify.lastSentAt = now()
          state.notify.lastError = ''
        } else {
          state.notify.lastError = textValue(result.error, 500)
        }
        saveStateNow()
        json(res, result.ok ? 200 : 400, result)
        return
      }

      if (req.method === 'GET' && sub === '/memory') {
        const bot = botById(url.searchParams.get('botId') || state.activeBotId)
        json(res, 200, {
          ok: true,
          text: readMemory(bot),
          path: botMemoryFile(bot),
          botId: bot.id,
          history: memoryHistory(bot),
        })
        return
      }

      if (req.method === 'GET' && sub === '/memory/history') {
        const bot = botById(url.searchParams.get('botId') || state.activeBotId)
        json(res, 200, { ok: true, botId: bot.id, ...memoryHistory(bot) })
        return
      }

      if (req.method === 'GET' && sub === '/memory/diff') {
        const bot = botById(url.searchParams.get('botId') || state.activeBotId)
        try {
          json(res, 200, { ok: true, botId: bot.id, ...memoryDiff(bot, url.searchParams.get('sha')) })
        } catch (error) {
          json(res, 400, { ok: false, error: messageOf(error) })
        }
        return
      }

      if (req.method === 'POST' && sub === '/memory/restore') {
        const body = await readBody(req)
        const bot = botById(body.botId || state.activeBotId)
        try {
          const result = memoryRestore(bot, body.sha)
          json(res, 200, { ok: true, botId: bot.id, ...result, path: botMemoryFile(bot), history: memoryHistory(bot) })
        } catch (error) {
          json(res, 400, { ok: false, error: messageOf(error) })
        }
        return
      }

      if (req.method === 'POST' && sub === '/memory') {
        const body = await readBody(req)
        const bot = botById(body.botId || state.activeBotId)
        const text = typeof body.text === 'string' ? body.text : ''
        if (text.length > MEMORY_LIMIT) {
          json(res, 400, { ok: false, error: '记忆文件过大' })
          return
        }
        const saved = saveMemoryText(bot, text)
        json(res, 200, {
          ok: true,
          text,
          path: saved.file,
          botId: bot.id,
          sha: saved.sha,
          history: memoryHistory(bot),
        })
        return
      }

      if (req.method === 'POST' && sub === '/upload') {
        const body = await readBody(req, 32_000_000)
        const rawName = String(body.name || 'file').split(/[\\/]/).pop() || 'file'
        const encoded = String(body.data || '').replace(/^data:[^;]+;base64,/, '')
        let buffer
        try {
          buffer = Buffer.from(encoded, 'base64')
        } catch {
          json(res, 400, { ok: false, error: '附件编码无效' })
          return
        }
        if (buffer.length === 0 || buffer.length > 20 * 1024 * 1024) {
          json(res, 400, { ok: false, error: '附件必须小于 20MB' })
          return
        }
        const safeName = rawName.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').slice(0, 120) || 'file'
        const uploadDir = path.join(stateDir, 'uploads')
        fs.mkdirSync(uploadDir, { recursive: true })
        const target = path.join(uploadDir, `${Date.now()}-${safeName}`)
        fs.writeFileSync(target, buffer)
        json(res, 200, { ok: true, path: target, name: safeName, bytes: buffer.length })
        return
      }

      if (req.method === 'POST' && sub === '/answer') {
        const body = await readBody(req)
        const thread = requireThread(body.threadId)
        let rec = live.get(thread.id)
        let targetThread = thread
        if (isGroup(thread)) {
          const children = memberThreadsOf(thread)
          const byBot = children.find((child) => child.botId === String(body.botId || ''))
          const byQuestion = children.find((child) => live.get(child.id)?.pendingQuestion?.id === body.questionId)
          const child = byQuestion || byBot || null
          rec = child ? live.get(child.id) : null
          targetThread = child || thread
        }
        const pending = rec?.pendingQuestion
        if (!pending || pending.id !== body.questionId) {
          json(res, 409, { ok: false, error: '这个问题已经结束' })
          return
        }
        const supplied = Array.isArray(body.answers) ? body.answers[0] : null
        const selected = Array.isArray(supplied?.selected) ? supplied.selected.filter(Boolean).slice(0, 4) : []
        const custom = typeof supplied?.custom === 'string' ? supplied.custom.trim().slice(0, 4_000) : ''
        const parts = []
        if (selected.length > 0) parts.push(selected.join('、'))
        if (custom && !selected.includes(custom)) parts.push(`补充：${custom}`)
        const answerText = parts.join('；') || '（跳过）'
        rec.pendingQuestion = null
        const message = {
          id: crypto.randomUUID(),
          role: 'user',
          content: [
            {
              type: 'text',
              text: `关于「${pending.question}」，我的回答：${answerText}`,
            },
          ],
          source: { kind: 'user' },
        }
        try {
          rec.agent.followup(message)
        } catch (error) {
          rec.pendingQuestion = pending
          json(res, 500, { ok: false, error: messageOf(error) })
          return
        }
        thread.updatedAt = now()
        targetThread.updatedAt = thread.updatedAt
        saveStateSoon()
        json(res, 200, { ok: true, text: message.content[0].text, botId: targetThread.botId })
        return
      }

      if (req.method === 'GET' && sub === '/computer') {
        const bot = botById(url.searchParams.get('botId') || state.activeBotId)
        json(res, 200, { ok: true, ...(await computerInfo(bot)) })
        return
      }

      json(res, 404, { ok: false, error: '接口不存在' })
    } catch (error) {
      json(res, error?.statusCode || 500, { ok: false, error: messageOf(error) })
    }
  }

  for (const bot of state.bots) {
    try {
      ensureMemoryRepo(bot)
    } catch {
      /* memory history is optional */
    }
  }
  try {
    const memoryRoot = path.join(stateDir, 'memory')
    for (const name of fs.readdirSync(memoryRoot)) {
      if (state.bots.some((bot) => bot.id === name)) continue
      removeTree(path.join(memoryRoot, name))
    }
  } catch {
    /* stale memory cleanup is best-effort */
  }

  const routeDisposer = ctx.webServer.register({
    kind: 'prefix',
    path: API_PREFIX,
    handler: handle,
  })
  ctx.effect(() => routeDisposer)

  /* First DSH open of the day triggers the stand-up meeting. */
  const meetingStartupTimer = setTimeout(() => maybeRunMeeting('startup'), 12_000)
  if (typeof meetingStartupTimer.unref === 'function') meetingStartupTimer.unref()
  ctx.effect(() => () => {
    clearTimeout(meetingStartupTimer)
    clearMeetingRetry()
  })

  /* ── local computer ────────────────────────────────────────────────── */

  let cpuPercent = 0
  let previousCpu = os.cpus()
  function sampleCpu() {
    try {
      const current = os.cpus()
      let idle = 0
      let total = 0
      for (let index = 0; index < current.length; index += 1) {
        const next = current[index]?.times
        const prev = previousCpu[index]?.times
        if (!next || !prev) continue
        idle += next.idle - prev.idle
        total +=
          next.user - prev.user +
          next.nice - prev.nice +
          next.sys - prev.sys +
          next.idle - prev.idle +
          next.irq - prev.irq
      }
      if (total > 0) cpuPercent = Math.max(0, Math.min(100, Math.round((1 - idle / total) * 100)))
      previousCpu = current
    } catch {
      /* CPU counters are best-effort */
    }
  }
  const cpuTimer = setInterval(sampleCpu, 2_500)
  cpuTimer.unref?.()

  let appsCache = { at: 0, items: [], loading: false }
  function refreshApps() {
    if (appsCache.loading) return
    appsCache.loading = true
    const script = [
      "$ErrorActionPreference='SilentlyContinue'",
      '[Console]::OutputEncoding=[System.Text.Encoding]::UTF8',
      'Get-Process | Where-Object { $_.MainWindowTitle -and $_.MainWindowTitle.Trim().Length -gt 0 } | Sort-Object CPU -Descending | Select-Object -First 12 @{n=\'name\';e={$_.ProcessName}},@{n=\'title\';e={$_.MainWindowTitle}},@{n=\'pid\';e={$_.Id}},@{n=\'cpu\';e={[math]::Round($_.CPU,1)}} | ConvertTo-Json -Compress',
    ].join('; ')
    const executable = process.env.SystemRoot
      ? path.join(process.env.SystemRoot, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe')
      : 'powershell.exe'
    execFile(
      executable,
      ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', script],
      { timeout: 6_000, windowsHide: true, maxBuffer: 4_000_000 },
      (error, stdout) => {
        appsCache.loading = false
        appsCache.at = now()
        if (error) {
          appsCache.items = []
          return
        }
        try {
          const parsed = JSON.parse(String(stdout || '[]'))
          const list = Array.isArray(parsed) ? parsed : [parsed]
          appsCache.items = list
            .filter((item) => item && item.title)
            .map((item) => ({
              name: String(item.name || ''),
              title: truncate(String(item.title || ''), 120),
              pid: Number(item.pid) || 0,
              cpu: Number(item.cpu) || 0,
            }))
        } catch {
          appsCache.items = []
        }
      },
    )
  }

  let diskCache = { at: 0, items: [] }
  async function disks() {
    if (now() - diskCache.at < 45_000) return diskCache.items
    const items = []
    for (const letter of ['C', 'D', 'E', 'F', 'G', 'H']) {
      const root = `${letter}:\\`
      try {
        if (!fs.existsSync(root)) continue
        const stat = await fs.promises.statfs(root)
        const total = Number(stat.blocks) * Number(stat.bsize)
        const free = Number(stat.bavail) * Number(stat.bsize)
        if (!Number.isFinite(total) || total <= 0) continue
        items.push({
          name: letter,
          total,
          free,
          used: Math.max(0, total - free),
          percent: Math.round(((total - free) / total) * 100),
        })
      } catch {
        /* skip unavailable drives */
      }
    }
    diskCache = { at: now(), items }
    return items
  }

  let electronPromise = null
  function loadElectron() {
    if (electronPromise) return electronPromise
    electronPromise = (async () => {
      const candidates = []
      try {
        candidates.push(await import('electron'))
      } catch {
        /* not the main process, or electron is not importable */
      }
      try {
        const require = createRequire(import.meta.url)
        candidates.push(require('electron'))
      } catch {
        /* same */
      }
      for (const candidate of candidates) {
        const capturer = candidate?.desktopCapturer || candidate?.default?.desktopCapturer
        if (capturer) return { desktopCapturer: capturer }
      }
      return null
    })()
    return electronPromise
  }

  let pythonCaptureBrokenUntil = 0
  let pythonExecutableCache = null
  function pythonCandidates() {
    if (pythonExecutableCache) return [pythonExecutableCache]
    const candidates = []
    if (process.env.DSH_BOT_PYTHON) candidates.push(process.env.DSH_BOT_PYTHON)
    if (process.env.DSH_HOME) {
      candidates.push(
        path.join(
          process.env.DSH_HOME,
          'dsh-runtimes',
          'dsh-primary-runtime',
          'dependencies',
          'python',
          'python.exe',
        ),
      )
    }
    candidates.push('python', 'python3')
    return candidates
  }

  function captureWithPython() {
    if (now() < pythonCaptureBrokenUntil) return Promise.resolve(null)
    const out = path.join(stateDir, `screen-${process.pid}-${now()}.jpg`)
    const script = [
      'from PIL import ImageGrab',
      'im = ImageGrab.grab(all_screens=True)',
      'im.thumbnail((1280, 800))',
      `im.convert("RGB").save(${JSON.stringify(out)}, "JPEG", quality=72, optimize=True)`,
      'print(im.size[0], im.size[1])',
    ].join('\n')
    const attempt = (candidate) =>
      new Promise((resolve) => {
        execFile(
          candidate,
          ['-c', script],
          { timeout: 4_500, windowsHide: true, maxBuffer: 1_000_000 },
          (error, stdout) => {
            if (error) {
              resolve(null)
              return
            }
            try {
              const buf = fs.readFileSync(out)
              try {
                fs.unlinkSync(out)
              } catch {
                /* the image is disposable */
              }
              if (!buf || buf.length < 100) {
                resolve(null)
                return
              }
              const [width, height] = String(stdout || '').trim().split(/\s+/).map(Number)
              resolve({
                at: now(),
                buf,
                width: width || 0,
                height: height || 0,
                sourceName: 'Desktop',
                error: null,
              })
            } catch {
              resolve(null)
            }
          },
        )
      })
    return (async () => {
      for (const candidate of pythonCandidates()) {
        if (candidate === 'python' || candidate === 'python3' || fs.existsSync(candidate)) {
          const shot = await attempt(candidate)
          if (shot) {
            pythonExecutableCache = candidate
            return shot
          }
        }
      }
      pythonCaptureBrokenUntil = now() + 15_000
      return null
    })()
  }

  async function captureForResponse() {
    const shot = await Promise.race([captureWithPython(), delay(5_000).then(() => null)])
    if (shot) {
      screenCache = shot
      return shot
    }
    const fallback = await Promise.race([captureScreen(), delay(2_500).then(() => null)])
    if (fallback?.buf) {
      screenCache = fallback
      return fallback
    }
    if (screenCache.buf && now() - screenCache.at < 120_000) return screenCache
    return null
  }

  let screenCache = { at: 0, buf: null, width: 0, height: 0, sourceName: '', error: null }
  let screenInFlight = null
  function captureScreen() {
    if (screenInFlight) return screenInFlight
    if (screenCache.buf && now() - screenCache.at < 1_500) return Promise.resolve(screenCache)
    if (screenCache.error && now() - screenCache.at < 20_000) return Promise.resolve(screenCache)
    screenInFlight = (async () => {
      const pythonShot = await captureWithPython()
      if (pythonShot) {
        screenCache = pythonShot
        return screenCache
      }
      try {
        const electron = await loadElectron()
        if (!electron) {
          screenCache = { at: now(), buf: null, width: 0, height: 0, sourceName: '', error: 'Python / Electron 屏幕抓取均不可用' }
          return screenCache
        }
        const result = electron.desktopCapturer.getSources({
          types: ['screen'],
          thumbnailSize: { width: 1_280, height: 720 },
          fetchWindowIcons: false,
        })
        const sources = result && typeof result.then === 'function' ? await result : await new Promise((resolve, reject) => {
          electron.desktopCapturer.getSources(
            { types: ['screen'], thumbnailSize: { width: 1_280, height: 720 }, fetchWindowIcons: false },
            (error, value) => (error ? reject(error) : resolve(value)),
          )
        })
        const source = Array.isArray(sources) ? sources[0] : null
        const image = source?.thumbnail
        if (!image || image.isEmpty()) {
          screenCache = { at: now(), buf: null, width: 0, height: 0, sourceName: '', error: '没有可用的屏幕源' }
          return screenCache
        }
        const size = image.getSize()
        const jpeg = image.toJPEG(72)
        screenCache = {
          at: now(),
          buf: jpeg,
          width: size.width,
          height: size.height,
          sourceName: source.name || 'Screen 1',
          error: null,
        }
      } catch (error) {
        screenCache = {
          at: now(),
          buf: null,
          width: 0,
          height: 0,
          sourceName: '',
          error: messageOf(error),
        }
      } finally {
        screenInFlight = null
      }
      return screenCache
    })()
    return screenInFlight
  }

  async function computerInfo(bot = activeBot()) {
    const memoryPath = botMemoryFile(bot)
    if (now() - appsCache.at > 20_000) refreshApps()
    const total = os.totalmem()
    const free = os.freemem()
    const memoryPercent = total > 0 ? Math.round(((total - free) / total) * 100) : 0
    const diskItems = await disks()
    let screen = {
      available: Boolean(screenCache.buf),
      capturedAt: screenCache.at,
      width: screenCache.width,
      height: screenCache.height,
      sourceName: screenCache.sourceName,
      error: screenCache.error,
    }
    if (!screen.available && (!screen.error || now() - screen.capturedAt > 20_000)) {
      const captured = await Promise.race([captureForResponse(), delay(1_800).then(() => null)])
      if (captured) {
        screen = {
          available: Boolean(captured.buf),
          capturedAt: captured.at,
          width: captured.width,
          height: captured.height,
          sourceName: captured.sourceName,
          error: captured.error,
        }
      }
    }
    let activity = null
    for (const rec of live.values()) {
      if (rec.agent.status !== 'running') continue
      const running = [...rec.transcript.activities.values()].filter((item) => item.status === 'running')
      const latest = running[running.length - 1]
      if (latest) {
        activity = {
          tool: latest.name,
          startedAt: latest.startedAt,
          threadId: rec.thread.id,
        }
        break
      }
    }
    const cpus = os.cpus()
    return {
      ts: now(),
      host: os.hostname(),
      user: os.userInfo().username,
      platform: `${os.type()} ${os.release()}`,
      arch: os.arch(),
      cpu: {
        model: cpus[0]?.model?.trim() || 'CPU',
        cores: cpus.length,
        percent: cpuPercent,
      },
      memory: {
        total,
        free,
        used: total - free,
        percent: memoryPercent,
      },
      uptime: os.uptime(),
      disks: diskItems,
      apps: appsCache.items,
      workspace: botWorkspace(bot),
      memoryPath,
      screen,
      activity,
      model: prettyModel(bot.model || selection?.model),
      threadCount: state.threads.filter((thread) => thread.botId === bot.id).length,
      liveAgents: [...live.values()].filter((rec) => rec.thread.botId === bot.id).length,
    }
  }

  /* ── boot ──────────────────────────────────────────────────────────── */

  if (!state.bots.length) state.bots.push(makeDefaultBot())
  if (!state.bots.some((bot) => bot.id === state.activeBotId)) state.activeBotId = state.bots[0].id
  if (!state.threads.length) {
    createThreadRecord('', activeBot().id)
  } else if (!state.lastThreadId || !threadById(state.lastThreadId)) {
    state.lastThreadId = firstThreadForBot(activeBot().id)?.id || state.threads[0]?.id || null
  }
  saveStateNow()
  writeRuntimeInfo()
  setTimeout(() => {
    ensureDefaultModel().catch(() => undefined)
  }, 1_200)
  ctx.effect(() => {
    const timer = setTimeout(() => {
      reconcileRoutines().catch((error) => {
        console.error('[dsh-bot] routine reconcile failed', messageOf(error))
      })
    }, 1_500)
    return () => clearTimeout(timer)
  })
  ctx.effect(() => {
    const timer = setInterval(checkWatchdogs, 30_000)
    return () => clearInterval(timer)
  })
  // Remote command polling runs in scripts/qq_remote.py outside Electron:
  // UIAutomation from an Electron child process hangs on this host.


  console.info(`[dsh-bot] ready · ${state.threads.length} task(s) · ${state.bots.length} bot(s)`)
}
