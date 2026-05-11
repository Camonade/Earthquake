const path = require('path');
const { escapeCSV } = require('../utils/csv');

const samples = [
  'plain text',
  '含逗号,comma',
  '含换行\nsecond line',
  '含引号"quoted"'
];

console.log('escapeCSV tests:');
for (const s of samples) {
  const escaped = escapeCSV(s);
  console.log('---');
  console.log('input :', JSON.stringify(s));
  console.log('output:', escaped);
}

const combined = '第一行,有逗号\n第二行"有引号"';
console.log('---');
console.log('combined input :', JSON.stringify(combined));
console.log('combined output:', escapeCSV(combined));
console.log('cache path:', path.join(__dirname, '..', 'ai_summary_cache.csv'));
