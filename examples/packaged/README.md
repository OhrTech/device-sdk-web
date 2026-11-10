# A packaged site

An OhrTech web app in mode `packaged` runs the site's own files from a Signed Web Bundle, served under the site's real
origin; requests for anything not in the bundle (the site's API) go to the network.

1. Make a signing key: `openssl genpkey -algorithm ed25519 -out key.pem`. Keep it secret.
2. Build: `node build.mjs ./site https://kiosk.example.com 1.0.0 key.pem > kiosk-1.0.0.swbn`. It prints the Web
   Bundle ID.
3. Either upload the bundle to OhrTech (`POST /v1/apps/{appId}/web/bundles`, or the portal), which offers it in an
   update manifest of its own, or publish it with an update manifest like `update.json` and set that manifest's URL
   on the web app.

Devices check every bundle's signature against the web app's trusted Web Bundle IDs, and its version against the
update manifest. The page can follow updates with `OhrTech.OhrApp.checkForUpdate()`, `applyUpdate()` and
`addUpdateListener()`.
