import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AppError } from '@/utils/AppError.js';
import { requireDeleted, requireOwned } from '@/utils/owned.js';

test('requireOwned throws 404 when the row is missing', () => {
  assert.throws(
    () => requireOwned(null, 'Note not found', 'NOTE_NOT_FOUND'),
    (error: unknown) =>
      error instanceof AppError && error.statusCode === 404 && error.code === 'NOTE_NOT_FOUND',
  );
});

test('requireOwned returns the row when it belongs to the caller', () => {
  const row = { id: 'abc', userId: 'user-1' };
  assert.equal(requireOwned(row, 'Note not found', 'NOTE_NOT_FOUND'), row);
});

test('requireDeleted throws 404 when nothing was deleted', () => {
  assert.throws(
    () => requireDeleted(0, 'Task not found', 'DAILY_TASK_NOT_FOUND'),
    (error: unknown) =>
      error instanceof AppError && error.statusCode === 404 && error.code === 'DAILY_TASK_NOT_FOUND',
  );
});
