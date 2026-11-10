# A site with the Device SDK

A plain website that, as an OhrTech web app in mode `sdk`, shows which device it runs on, opens Android's Wi-Fi
screen when the fleet grants Wi-Fi, and takes push messages through the standard Push API. In a browser the same
page runs without those parts.

- `index.html` pins the SDK file with its integrity value. Host the file next to your pages.
- `manifest.webmanifest` declares the most the site may use (`ohrtech_device_sdk`): anything else is refused on the
  device, whatever the fleet grants.
- `app.js` subscribes to push with your server's OhrTech sender key as `applicationServerKey`, and sends the
  subscription to your server.
- `sw.js` shows each push as a notification and opens the order a tap names.

Your server sends to a subscription with the `ohr` CLI or OhrTech.Management:

```sh
ohr push keygen sender.json
ohr push send --sender sender.json --subscription subscription.json --text '{"id": 42, "summary": "2 items"}'
```
