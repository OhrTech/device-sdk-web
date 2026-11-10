# OhrTech Device SDK for web apps

What a site running as an OhrTech web app can ask the device for: the device, its updates, Wi-Fi, network, kiosk
mode, power, settings, managed configuration, attestation, client certificates, USB devices, diagnostics and TEE keys.
Documentation: <https://docs.ohrtech.net/web-apps/device-sdk/>.
The same site runs in any browser: there, `OhrTech.isDevice()` is false and every call fails with `OhrNotManaged`.

```html
<script src="/js/ohrtech-device-sdk-1.0.0.min.js" integrity="sha384-…" crossorigin="anonymous"></script>
<script>
  if (OhrTech.isDevice()) OhrTech.OhrDevice.info().then((d) => console.log(d.deviceId));
</script>
```

or `npm install @ohrtech/device-sdk-web`:

```ts
import { OhrTech, OhrWifi, OhrNotAllowed } from '@ohrtech/device-sdk-web';
```

## How it works

The file is a facade for an interface version (1). On an OhrTech device, the web app's shell gives it the device's
current implementation of that interface, so a shell update reaches every site with no change to the site, and the
file you pinned with `integrity` never changes. Host the file yourself, or check its published hash: a script from
someone else's server would run with the SDK's powers.

The SDK answers only on the web app's own origins, in its main frame (frames only when the administrator lists their
origin), and only when the web app's mode is `sdk` or `packaged`. The fleet's grants apply to every call. The site can also declare
the most it wants in its web app manifest; anything else is refused, whatever the fleet grants:

```json
"ohrtech_device_sdk": { "device": ["self"], "wifi": ["self"], "config": ["self"] }
```

## Examples

- [`examples/kiosk-site`](examples/kiosk-site): a site that uses the SDK, notifications and push.
- [`examples/packaged`](examples/packaged): build a Signed Web Bundle for a packaged web app.

## Building

`npm install && npm run build && npm test`: `dist/` has the ES module with its types, `ohrtech-device-sdk-<version>.min.js`
(the global `OhrTech`) and its integrity value.
