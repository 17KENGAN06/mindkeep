#!/usr/bin/env node
/**
 * Production start: run migrations, then boot API.
 * Migration failure is logged but does not block listen —
 * Railway healthcheck needs the HTTP server up.
 */
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env: process.env,
    shell: process.platform === 'win32',
  });
  return result.status ?? 1;
}

const migrateStatus = run('npx', ['prisma', 'migrate', 'deploy']);
if (migrateStatus !== 0) {
  console.error(`[start] prisma migrate deploy exited with code ${migrateStatus}`);
}

const serverStatus = run('node', [require.resolve('../dist/server.js')]);
process.exit(serverStatus);
