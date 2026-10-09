import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { displayNameFrom } from '@/services/auth.service.js';
import { registerSchema, USER_NAME_MAX } from '@/validations/auth.schemas.js';

const registration = {
  email: 'new@mindkeep.test',
  password: 'Str0ng-passw0rd!',
  confirmPassword: 'Str0ng-passw0rd!',
  timezone: 'Europe/Helsinki',
  locale: 'en',
};

describe('user display name length', () => {
  test('registration accepts up to the limit and refuses longer names', () => {
    const atLimit = registerSchema.safeParse({ ...registration, name: 'a'.repeat(USER_NAME_MAX) });
    const tooLong = registerSchema.safeParse({ ...registration, name: 'a'.repeat(USER_NAME_MAX + 1) });
    assert.equal(atLimit.success, true);
    assert.equal(tooLong.success, false);
  });

  test('Google / Apple names are capped, never refused', () => {
    const name = displayNameFrom('Maximilian Alexander von Hohenzollern-Sigmaringen der Dritte', 'max@mindkeep.test');
    assert.ok(name.length <= USER_NAME_MAX);
    assert.ok(name.startsWith('Maximilian Alexander'));
  });

  test('falls back to the email local part, also capped', () => {
    assert.equal(displayNameFrom('   ', 'anna@mindkeep.test'), 'anna');
    assert.equal(displayNameFrom(undefined, `${'x'.repeat(60)}@mindkeep.test`).length, USER_NAME_MAX);
  });

  test('collapses inner whitespace and trims the cut edge', () => {
    assert.equal(displayNameFrom('  Anna   Maria  ', 'a@mindkeep.test'), 'Anna Maria');
    const cut = displayNameFrom(`${'a'.repeat(USER_NAME_MAX - 1)} b`, 'a@mindkeep.test');
    assert.equal(cut, 'a'.repeat(USER_NAME_MAX - 1));
  });
});
