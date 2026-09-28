import assert from 'node:assert/strict';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, before, describe, test } from 'node:test';
import { BudgetMoneyKind, BudgetOperationType } from '@prisma/client';
import app from '@/app.js';
import { env } from '@/config/env.js';
import { prisma } from '@/config/prisma.js';
import { signAccessToken } from '@/utils/jwt.js';

const TEST_EMAIL_SUFFIX = '@idor.mindkeep.test';
const canRun = Boolean(env.DATABASE_URL && env.JWT_SECRET);

type Json = { error?: { code?: string }; material?: { id?: string; title?: string } };

describe('foreign ids are 404 and do not change the owner row', { skip: !canRun }, () => {
  let server: http.Server;
  let baseUrl = '';
  let ownerId = '';
  let strangerToken = '';
  let ownerToken = '';
  let materialId = '';
  let noteId = '';
  let operationId = '';
  let taskId = '';
  let categoryId = '';

  async function api(
    path: string,
    options: { token: string; method?: string; body?: unknown } = { token: '' },
  ) {
    const response = await fetch(`${baseUrl}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        Authorization: `Bearer ${options.token}`,
        'X-Requested-With': 'learning-reminder',
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
    const json = (await response.json().catch(() => null)) as Json | null;
    return { status: response.status, json };
  }

  before(async () => {
    await prisma.user.deleteMany({ where: { email: { endsWith: TEST_EMAIL_SUFFIX } } });

    const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const [owner, stranger] = await Promise.all([
      prisma.user.create({
        data: { name: 'Owner', email: `owner.${stamp}${TEST_EMAIL_SUFFIX}` },
      }),
      prisma.user.create({
        data: { name: 'Stranger', email: `stranger.${stamp}${TEST_EMAIL_SUFFIX}` },
      }),
    ]);

    ownerId = owner.id;
    ownerToken = signAccessToken({ sub: owner.id, email: owner.email });
    strangerToken = signAccessToken({ sub: stranger.id, email: stranger.email });

    const [material, note, category, task] = await Promise.all([
      prisma.learningMaterial.create({
        data: {
          title: 'owner-secret-material',
          description: '',
          content: 'private notes',
          learnedAt: new Date(),
          userId: owner.id,
        },
      }),
      prisma.note.create({
        data: {
          title: 'owner-secret-note',
          content: 'do not leak',
          userId: owner.id,
        },
      }),
      prisma.budgetCategory.create({
        data: { name: `idor-${stamp}`, userId: owner.id },
      }),
      prisma.dailyTask.create({
        data: {
          title: 'owner-secret-task',
          minutes: 25,
          date: new Date('2026-09-28T12:00:00.000Z'),
          userId: owner.id,
        },
      }),
    ]);

    const operation = await prisma.budgetOperation.create({
      data: {
        date: new Date('2026-09-28T12:00:00.000Z'),
        amount: 42,
        currency: 'EUR',
        type: BudgetOperationType.EXPENSE,
        moneyKind: BudgetMoneyKind.ELECTRONIC,
        comment: 'private spend',
        categoryId: category.id,
        userId: owner.id,
      },
    });

    materialId = material.id;
    noteId = note.id;
    categoryId = category.id;
    operationId = operation.id;
    taskId = task.id;

    server = http.createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', resolve);
    });
    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  after(async () => {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
    await prisma.user.deleteMany({ where: { email: { endsWith: TEST_EMAIL_SUFFIX } } });
    await prisma.$disconnect();
  });

  test('owner can still read their material', async () => {
    const { status, json } = await api(`/api/materials/${materialId}`, { token: ownerToken });
    assert.equal(status, 200);
    assert.equal(json?.material?.title, 'owner-secret-material');
  });

  test('stranger cannot read, edit, or delete a material', async () => {
    const read = await api(`/api/materials/${materialId}`, { token: strangerToken });
    assert.equal(read.status, 404);
    assert.equal(read.json?.error?.code, 'MATERIAL_NOT_FOUND');
    assert.equal(JSON.stringify(read.json).includes('owner-secret-material'), false);

    const edit = await api(`/api/materials/${materialId}`, {
      token: strangerToken,
      method: 'PATCH',
      body: { title: 'hacked' },
    });
    assert.equal(edit.status, 404);

    const remove = await api(`/api/materials/${materialId}`, {
      token: strangerToken,
      method: 'DELETE',
    });
    assert.equal(remove.status, 404);

    const kept = await prisma.learningMaterial.findFirst({
      where: { id: materialId, userId: ownerId },
    });
    assert.equal(kept?.title, 'owner-secret-material');
  });

  test('stranger cannot read, edit, or delete a note', async () => {
    const read = await api(`/api/notes/${noteId}`, { token: strangerToken });
    assert.equal(read.status, 404);
    assert.equal(read.json?.error?.code, 'NOTE_NOT_FOUND');
    assert.equal(JSON.stringify(read.json).includes('do not leak'), false);

    const edit = await api(`/api/notes/${noteId}`, {
      token: strangerToken,
      method: 'PATCH',
      body: { title: 'hacked' },
    });
    assert.equal(edit.status, 404);

    const remove = await api(`/api/notes/${noteId}`, { token: strangerToken, method: 'DELETE' });
    assert.equal(remove.status, 404);

    const kept = await prisma.note.findFirst({ where: { id: noteId, userId: ownerId } });
    assert.equal(kept?.content, 'do not leak');
  });

  test('stranger cannot delete a finance operation or attach the owner category', async () => {
    const remove = await api(`/api/finance/operations/${operationId}`, {
      token: strangerToken,
      method: 'DELETE',
    });
    assert.equal(remove.status, 404);
    assert.equal(remove.json?.error?.code, 'FINANCE_OPERATION_NOT_FOUND');

    const attach = await api('/api/finance/operations', {
      token: strangerToken,
      method: 'POST',
      body: {
        type: 'EXPENSE',
        amount: 9,
        date: '2026-09-28',
        categoryId,
      },
    });
    assert.equal(attach.status, 404);
    assert.equal(attach.json?.error?.code, 'FINANCE_CATEGORY_NOT_FOUND');

    const kept = await prisma.budgetOperation.findFirst({
      where: { id: operationId, userId: ownerId },
    });
    assert.equal(kept?.comment, 'private spend');
  });

  test('stranger cannot edit or delete a daily task', async () => {
    const edit = await api(`/api/tasks/${taskId}`, {
      token: strangerToken,
      method: 'PATCH',
      body: { completed: true },
    });
    assert.equal(edit.status, 404);
    assert.equal(edit.json?.error?.code, 'DAILY_TASK_NOT_FOUND');

    const remove = await api(`/api/tasks/${taskId}`, { token: strangerToken, method: 'DELETE' });
    assert.equal(remove.status, 404);

    const kept = await prisma.dailyTask.findFirst({ where: { id: taskId, userId: ownerId } });
    assert.equal(kept?.completed, false);
    assert.equal(kept?.title, 'owner-secret-task');
  });
});
