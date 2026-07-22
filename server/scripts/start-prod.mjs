#!/usr/bin/env node
/**
 * Production start: run migrations (with timeout), then boot API.
 * A stuck DB must not block the HTTP server forever (Railway healthcheck).
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const MIGRATE_TIMEOUT_MS = 45_000;

function run(command, args, timeoutMs) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      env: process.env,
      shell: process.platform === 'win32',
    });

    let settled = false;
    const finish = (code) => {
      if (settled) return;
      settled = true;
      resolve(code);
    };

    const timer =
      timeoutMs > 0
        ? setTimeout(() => {
            console.error(`[start] timed out after ${timeoutMs}ms: ${command} ${args.join(' ')}`);
            child.kill('SIGKILL');
            finish(124);
          }, timeoutMs)
        : null;

    child.on('exit', (code, signal) => {
      if (timer) clearTimeout(timer);
      finish(signal ? 1 : (code ?? 1));
    });

    child.on('error', (error) => {
      if (timer) clearTimeout(timer);
      console.error(`[start] failed to spawn ${command}:`, error);
      finish(1);
    });
  });
}

const migrateStatus = await run('npx', ['prisma', 'migrate', 'deploy'], MIGRATE_TIMEOUT_MS);
if (migrateStatus !== 0) {
  console.error(`[start] prisma migrate deploy exited with code ${migrateStatus}`);
}

const serverEntry = require.resolve(path.join(__dirname, '../dist/server.js'));
const serverStatus = await run('node', [serverEntry], 0);
process.exit(serverStatus);
