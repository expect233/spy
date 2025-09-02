// scripts/gen-build-info.mjs
import fs from 'node:fs';
import path from 'node:path';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const info = {
  version: pkg.version ?? 'v0.0.0',
  commit: (process.env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 7) || 'unknown',
  builtAt: Date.now(),
};

fs.mkdirSync('public', { recursive: true });
fs.writeFileSync(path.join('public', 'build.json'), JSON.stringify(info), 'utf8');
console.log('build.json generated:', info);
