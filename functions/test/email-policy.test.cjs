const assert = require('node:assert/strict');
const test = require('node:test');

const {newsletterEmailEnabled} = require('../lib/email-policy.js');

test('newsletter delivery requires an exact explicit opt-in', () => {
  assert.equal(newsletterEmailEnabled('true'), true);
  assert.equal(newsletterEmailEnabled(undefined), false);
  assert.equal(newsletterEmailEnabled('false'), false);
  assert.equal(newsletterEmailEnabled('TRUE'), false);
  assert.equal(newsletterEmailEnabled(true), false);
});
