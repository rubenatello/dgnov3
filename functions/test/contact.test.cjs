const assert = require('node:assert/strict');
const test = require('node:test');

const {
  ContactValidationError,
  parseContactSubmission,
} = require('../lib/contact.js');

test('contact submissions are normalized and preserve supported topics', () => {
  const result = parseContactSubmission({
    name: '  Reader   Name ',
    email: ' READER@example.com ',
    topic: 'correction',
    sourceUrl: 'https://dgno.us/article/example',
    message: ' This is a source-backed correction request. ',
    company: '',
  });

  assert.equal(result.name, 'Reader Name');
  assert.equal(result.email, 'reader@example.com');
  assert.equal(result.topic, 'correction');
  assert.equal(result.sourceUrl, 'https://dgno.us/article/example');
  assert.equal(result.isHoneypot, false);
});

test('contact validation rejects unsupported or unsafe values', () => {
  const valid = {
    name: 'Reader',
    email: 'reader@example.com',
    topic: 'reporting',
    message: 'A sufficiently detailed newsroom message.',
  };

  assert.throws(
    () => parseContactSubmission({...valid, email: 'not-an-email'}),
    ContactValidationError,
  );
  assert.throws(
    () => parseContactSubmission({...valid, topic: 'advertising'}),
    ContactValidationError,
  );
  assert.throws(
    () => parseContactSubmission({...valid, sourceUrl: 'javascript:alert(1)'}),
    ContactValidationError,
  );
  assert.throws(
    () => parseContactSubmission({...valid, message: 'Too short'}),
    ContactValidationError,
  );
});

test('contact honeypot is detected without changing the public response', () => {
  const result = parseContactSubmission({
    name: 'Automated Visitor',
    email: 'bot@example.com',
    topic: 'general',
    message: 'A sufficiently detailed automated submission.',
    company: 'Spam Incorporated',
  });

  assert.equal(result.isHoneypot, true);
});
