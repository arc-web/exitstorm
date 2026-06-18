import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const source = path.join(root, 'src');
const required = ['index.html'];
let failed = false;

for (const rel of required) {
  const file = path.join(source, rel);
  if (!fs.existsSync(file)) {
    console.error(`Missing required page: ${rel}`);
    failed = true;
    continue;
  }
  const html = fs.readFileSync(file, 'utf8');
  if (!/<title[\s>]/i.test(html)) {
    console.error(`Missing <title>: ${rel}`);
    failed = true;
  }
}

const config = JSON.parse(fs.readFileSync(path.join(root, 'site.config.json'), 'utf8'));
for (const key of ['site', 'domain', 'bucket', 'source', 'github', 'deploy']) {
  if (!config[key]) {
    console.error(`site.config.json missing ${key}`);
    failed = true;
  }
}

if (config.source !== 'src') {
  console.error('site.config.json source must be src');
  failed = true;
}

if (failed) process.exit(1);
console.log('Exitstorm site checks passed');
