// Builds a Signed Web Bundle of a site directory for an OhrTech packaged web app, with the standard tools (wbn and
// wbn-sign), under the site's real origin:
//
//   npm install wbn wbn-sign
//   node build.mjs <site directory> <https origin> <version> <signing key .pem> [<second key .pem>] > app.swbn
//
// The site's /.well-known/manifest.webmanifest gets the version. The first key names the Web Bundle ID (printed on
// stderr); a second key signs too (to rotate keys, sign with the old and the new one and trust both IDs). Make a key
// with `openssl genpkey -algorithm ed25519 -out key.pem`.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import * as wbn from 'wbn';
import * as wbnSign from 'wbn-sign';

const [dir, origin, version, ...keyFiles] = process.argv.slice(2);
if (!dir || !origin?.startsWith('https://') || !/^\d+(\.\d+)*$/.test(version ?? '') || keyFiles.length === 0) {
  console.error('usage: node build.mjs <site directory> <https origin> <version> <key.pem> [<key.pem>]');
  process.exit(2);
}
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.webp': 'image/webp', '.jpg': 'image/jpeg' };

const builder = new wbn.BundleBuilder();
function add(file, url) {
  const type = types[path.extname(file)] ?? 'application/octet-stream';
  builder.addExchange(origin + url, 200, { 'Content-Type': type }, fs.readFileSync(file));
}
function walk(d, base) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const f = path.join(d, e.name);
    if (e.isDirectory()) walk(f, `${base}${e.name}/`);
    else if (`${base}${e.name}` !== '/.well-known/manifest.webmanifest') {
      add(f, `${base}${e.name}`);
      if (e.name === 'index.html') add(f, base);
    }
  }
}
walk(dir, '/');

const manifestFile = path.join(dir, '.well-known/manifest.webmanifest');
const manifest = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, 'utf8')) : {};
builder.addExchange(origin + '/.well-known/manifest.webmanifest', 200, { 'Content-Type': 'application/manifest+json' },
  JSON.stringify({ ...manifest, version }));

const keys = keyFiles.map((f) => crypto.createPrivateKey(fs.readFileSync(f)));
const id = new wbnSign.WebBundleId(keys[0]).serialize();
const { signedWebBundle } = await new wbnSign.IntegrityBlockSigner(builder.createBundle(), id,
  keys.map((k) => new wbnSign.NodeCryptoSigningStrategy(k))).sign();
process.stdout.write(signedWebBundle);
console.error(`Web Bundle ID ${id}, version ${version}, ${signedWebBundle.length} bytes`);
