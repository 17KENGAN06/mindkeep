import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { appVersionPolicy, STORE_URLS } from '@/config/appVersion.js';

const unset = { minAndroid: undefined, latestAndroid: undefined, minIos: undefined, latestIos: undefined };

describe('app version policy', () => {
  test('unset config asks for nothing', () => {
    const policy = appVersionPolicy(unset);
    assert.deepEqual(policy.android, { minBuild: null, latestBuild: null, storeUrl: STORE_URLS.android });
    assert.deepEqual(policy.ios, { minBuild: null, latestBuild: null, storeUrl: STORE_URLS.ios });
  });

  test('min and latest are reported per platform', () => {
    const policy = appVersionPolicy({ ...unset, minAndroid: 7, latestAndroid: 9, latestIos: 8 });
    assert.equal(policy.android.minBuild, 7);
    assert.equal(policy.android.latestBuild, 9);
    assert.equal(policy.ios.minBuild, null);
    assert.equal(policy.ios.latestBuild, 8);
  });

  test('latest is never below the required build', () => {
    assert.equal(appVersionPolicy({ ...unset, minAndroid: 9 }).android.latestBuild, 9);
    assert.equal(appVersionPolicy({ ...unset, minAndroid: 9, latestAndroid: 7 }).android.latestBuild, 9);
  });
});
