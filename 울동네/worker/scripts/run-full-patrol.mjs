import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { build } from 'esbuild';

const workerDir = path.resolve(import.meta.dirname, '..');
const entryPoint = path.join(workerDir, 'src', 'fullPatrol.ts');
const outFile = path.join(os.tmpdir(), `uldongne-full-patrol-${process.pid}.mjs`);

try {
  await build({
    entryPoints: [entryPoint],
    outfile: outFile,
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node22',
    logLevel: 'silent'
  });

  const nodeArgs = ['--insecure-http-parser'];
  if (process.allowedNodeEnvironmentFlags?.has('--use-system-ca')) {
    nodeArgs.push('--use-system-ca');
  }

  execFileSync(process.execPath, [...nodeArgs, outFile, ...process.argv.slice(2)], {
    cwd: workerDir,
    stdio: 'inherit'
  });
} finally {
  if (fs.existsSync(outFile)) {
    fs.unlinkSync(outFile);
  }
}
