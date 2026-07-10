/**
 * Ensures Vite is listening on 127.0.0.1:5173/md/ for Tauri dev.
 * If already up, exits 0. Otherwise starts vite and waits until healthy.
 */
import { spawn } from 'node:child_process'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const DEV_URL = 'http://127.0.0.1:5173/md/'
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const WAIT_MS = 180_000
const POLL_MS = 500

function probe() {
  return new Promise((resolve) => {
    const req = http.get(DEV_URL, (res) => {
      res.resume()
      resolve(res.statusCode === 200)
    })
    req.on('error', () => resolve(false))
    req.setTimeout(2000, () => {
      req.destroy()
      resolve(false)
    })
  })
}

async function waitUntilReady(timeoutMs) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    if (await probe())
      return true
    await new Promise(r => setTimeout(r, POLL_MS))
  }
  return false
}

if (await probe()) {
  console.log(`[desktop-dev] Vite already ready at ${DEV_URL}`)
  process.exit(0)
}

console.log(`[desktop-dev] Starting Vite at ${DEV_URL} ...`)
const child = spawn(
  'pnpm',
  ['--filter', '@md/web', 'exec', 'vite', '--host', '127.0.0.1', '--port', '5173', '--strictPort'],
  {
    cwd: ROOT,
    stdio: 'inherit',
    shell: true,
    detached: true,
  },
)
child.unref()

if (!(await waitUntilReady(WAIT_MS))) {
  console.error(`[desktop-dev] Timed out waiting for ${DEV_URL}`)
  process.exit(1)
}

console.log(`[desktop-dev] Vite is ready`)
process.exit(0)
