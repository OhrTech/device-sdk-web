// The SDK's published files, in dist/:
//   index.js, index.d.ts                       the ES module, for bundlers and <script type="module">
//   ohrtech-device-sdk-<version>.min.js        the same for a plain <script>: the global OhrTech
//   ohrtech-device-sdk-<version>.min.js.sri    its integrity value (sha384), for <script integrity>
// A version's files never change once published: on a device, what runs is the shell's implementation of the
// interface, not this file's code.
import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';

const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
rmSync('dist', { recursive: true, force: true });
const common = { entryPoints: ['src/index.ts'], bundle: true, target: 'es2020', legalComments: 'none' };
await build({ ...common, format: 'esm', outfile: 'dist/index.js' });
const script = `ohrtech-device-sdk-${version}.min.js`;
await build({
  ...common,
  format: 'iife',
  globalName: 'OhrTech',
  minify: true,
  outfile: `dist/${script}`,
  banner: { js: `/*! OhrTech Device SDK for web apps ${version} (interface 1). MIT. */` },
});
const sri = 'sha384-' + createHash('sha384').update(readFileSync(`dist/${script}`)).digest('base64');
writeFileSync(`dist/${script}.sri`, sri + '\n');
execFileSync('npx', ['tsc', '--emitDeclarationOnly', '--declaration', '--outDir', 'dist'], { stdio: 'inherit' });
console.log(`${script} ${sri}`);
