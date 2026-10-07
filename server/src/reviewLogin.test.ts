import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { reviewLoginCodeFor, reviewLoginConfigProblem } from '@/config/reviewLogin.js';

const base = { email: 'review@mindkeep.test', code: '246810', adminEmails: ['owner@mindkeep.test'] };

describe('store review login', () => {
  test('only the configured email gets the fixed code', () => {
    assert.equal(reviewLoginCodeFor('review@mindkeep.test', base), '246810');
    assert.equal(reviewLoginCodeFor('  Review@MindKeep.test ', base), '246810');
    assert.equal(reviewLoginCodeFor('someone@mindkeep.test', base), null);
  });

  test('unset or half-set config is off', () => {
    assert.equal(reviewLoginCodeFor('review@mindkeep.test', { ...base, email: undefined, code: undefined }), null);
    assert.equal(reviewLoginConfigProblem({ ...base, email: undefined, code: undefined }), null);
    assert.equal(reviewLoginCodeFor('review@mindkeep.test', { ...base, code: undefined }), null);
    assert.notEqual(reviewLoginConfigProblem({ ...base, code: undefined }), null);
  });

  test('a code that is not exactly 6 digits is refused', () => {
    for (const code of ['12345', '1234567', 'abcdef', '12 456']) {
      assert.equal(reviewLoginCodeFor('review@mindkeep.test', { ...base, code }), null);
      assert.notEqual(reviewLoginConfigProblem({ ...base, code }), null);
    }
  });

  test('an admin email can never use the fixed code', () => {
    const config = { ...base, email: 'owner@mindkeep.test' };
    assert.equal(reviewLoginCodeFor('owner@mindkeep.test', config), null);
    assert.notEqual(reviewLoginConfigProblem(config), null);
  });
});
