import { strict as assert } from 'node:assert';
import { validateInput } from '../server/campaign.js';

const valid = validateInput({
  brief: 'Launch a new everyday product.',
  audience: 'Busy urban professionals.',
  product: 'A simple, premium product with clear everyday utility.',
  tone: 'Warm and confident',
  channels: ['Instagram', 'Email'],
});

assert.equal(valid.channels.length, 2);
assert.throws(() => validateInput({ brief: 'Only a brief' }), /complete the brief/i);
assert.throws(() => validateInput({ ...valid, channels: [] }), /at least one channel/i);
assert.equal(validateInput({ ...valid, brief: 'x'.repeat(5000) }).brief.length, 2400);

console.log('campaign validation checks passed');
