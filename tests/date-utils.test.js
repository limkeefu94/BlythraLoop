const assert = require('assert');
const { getLocalDateString } = require('../utils/date-utils');

const sampleDate = new Date(2024, 0, 5);
assert.strictEqual(getLocalDateString(sampleDate), '2024-01-05');

const paddedDate = new Date(2024, 9, 9);
assert.strictEqual(getLocalDateString(paddedDate), '2024-10-09');

console.log('✅ date utils tests passed');
