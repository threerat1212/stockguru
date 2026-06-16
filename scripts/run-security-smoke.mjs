#!/usr/bin/env node
// Runs the security smoke suite with NODE_ENV=development so that the
// Next.js dev server (started by playwright's webServer) boots correctly.
//
// Why a wrapper instead of `cross-env`: the CSP in next.config.js only adds
// 'unsafe-eval' to script-src when NODE_ENV === 'development', but the dev
// server's webpack middleware requires eval(). If NODE_ENV is left as the
// shell default (often 'production'), the server fails to boot with
// "Code generation from strings disallowed for this context".
//
// This wrapper sets the env before spawning playwright, so the npm script
// works identically on Windows and Unix without an extra dependency.

import { spawn } from 'node:child_process'

process.env.NODE_ENV = 'development'

const args = [
  'playwright',
  'test',
  '__tests__/e2e/security-smoke.spec.ts',
  '--workers=1',
  ...process.argv.slice(2),
]

const child = spawn('npx', args, {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env, FORCE_COLOR: '1' },
})

child.on('exit', (code) => {
  process.exit(code ?? 1)
})
