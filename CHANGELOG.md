# Changelog

## 1.0.0 (2026-11-10)

The first release: interface 1 of the Device SDK for OhrTech web apps.

- `OhrTech.isDevice()` and `environment()`: whether the page runs in an OhrTech web app, its shell version, the
  interfaces it implements and the web app's mode.
- The areas, as in the React Native SDK: `OhrDevice`, `OhrUpdates`, `OhrWifi` (and `showScreen()`, Android's Wi-Fi
  screen over the page), `OhrNetwork`, `OhrKiosk`, `OhrPower`, `OhrSettings`, `OhrConfig`, `OhrUsb`,
  `OhrDiagnostics`, `OhrAttestation`, `OhrCertificates`, `OhrKeys`, `OhrAccess`, and `OhrApp` (reload, clear data, and
  a packaged web app's bundle: `bundle()`, `checkForUpdate()`, `applyUpdate()`, `addUpdateListener()`).
- `ohrtech-device-sdk-1.0.0.min.js` (the global `OhrTech`), with its integrity value; the ES module with TypeScript
  types.
