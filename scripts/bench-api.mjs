import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const home = process.env.DSH_HOME || path.join(os.homedir(), '.dsh')
const runtimePath =
  process.env.DSH_BOT_RUNTIME || path.join(home, 'storages', 'dsh-bot', 'runtime.json')
const runtime = JSON.parse(fs.readFileSync(runtimePath, 'utf8'))
const paths = ['/state', '/bootstrap', '/health', '/team', '/memory?botId=bot-default', '/notify']
const samples = Number(process.env.DSH_BOT_BENCH_SAMPLES || 8)

for (const path of paths) {
  const times = []
  let bytes = 0
  for (let index = 0; index < samples; index += 1) {
    const started = performance.now()
    const response = await fetch(runtime.apiBase + path)
    const text = await response.text()
    times.push(performance.now() - started)
    bytes = Buffer.byteLength(text)
  }
  times.sort((left, right) => left - right)
  const p50 = times[Math.floor(times.length / 2)]
  const max = times[times.length - 1]
  console.log(`${path}\tp50=${Math.round(p50)}ms\tmax=${Math.round(max)}ms\tbytes=${bytes}`)
}
