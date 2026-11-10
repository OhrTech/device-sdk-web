// The published files outside an OhrTech web app: isDevice() is false, every call fails with OhrNotManaged, and a
// shell's bind is what the facade uses when there is one.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
const script = readFileSync(new URL(`../dist/ohrtech-device-sdk-${version}.min.js`, import.meta.url), 'utf8');

// The plain script, in a bare global (no window.__ohrtech).
const off = new Function('globalThis', `${script}; return OhrTech;`)({});
assert.equal(off.isDevice(), false);
assert.deepEqual(off.environment(), { onDevice: false, shellVersion: null, interfaces: [], mode: null });
await assert.rejects(off.OhrDevice.info(), (e) => e instanceof off.OhrNotManaged && e.code === 'NotManaged');
await new Promise((resolve) => off.OhrWifi.addStateListener(() => {}, (e) => { assert.equal(e.code, 'NotManaged'); resolve(); }));

// With a shell: the facade takes its implementation of interface 1, and its errors are the facade's classes.
const shell = {
  environment: { onDevice: true, shellVersion: 7, interfaces: [1], mode: 'sdk' },
  bind(iface, kit) {
    assert.equal(iface, 1);
    return new Proxy({}, { get: (_, area) => ({ info: () => Promise.reject(kit.error('NotAllowed', 'no', { area: String(area) })) }) });
  },
};
const g = { __ohrtech: shell };
const on = new Function('globalThis', `${script}; return OhrTech;`)(g);
assert.equal(on.isDevice(), true);
assert.equal(on.environment().shellVersion, 7);
await assert.rejects(on.OhrDevice.info(), (e) => e instanceof on.OhrNotAllowed && e.area === 'OhrDevice');

// The ES module exports the same.
const esm = await import('../dist/index.js');
assert.equal(esm.isDevice(), false);
assert.equal(esm.INTERFACE, 1);
console.log('off-device: ok');
