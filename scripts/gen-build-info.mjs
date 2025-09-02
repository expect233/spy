import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';
import { dirname, join } from 'path';

function getCommit() {
  try {
    if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 7);
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return 'unknown';
  }
}

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)).toString());
const buildInfo = {
  version: pkg.version,
  commit: getCommit(),
  builtAt: Date.now()
};

const outPath = new URL('../public/build.json', import.meta.url);
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(buildInfo, null, 2));
console.log('Generated public/build.json:', buildInfo);


