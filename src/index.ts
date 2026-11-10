/**
 * The OhrTech Device SDK for web apps: what a site running as an OhrTech web app can ask the device for.
 *
 * This file is a facade for interface 1 of the SDK. It never changes for a given version, so a `<script integrity>`
 * hash keeps matching: on an OhrTech device, the web app's shell gives it the device's current implementation of the
 * interface (`window.__ohrtech.bind(1, …)`); anywhere else, every call fails with OhrNotManaged and
 * `OhrTech.isDevice()` is false, so the same site runs in any browser.
 *
 * Each area is an object: OhrDevice, OhrUpdates, OhrWifi, OhrNetwork, OhrKiosk, OhrPower, OhrSettings, OhrConfig,
 * OhrAttestation, OhrCertificates, OhrUsb, OhrDiagnostics, OhrKeys, OhrApp; OhrAccess says what the fleet lets the
 * app do. Every call returns a promise and can fail with an OhrException.
 */

/** The interface this file speaks. */
export const INTERFACE = 1;

// ── Errors ───────────────────────────────────────────────────────────────────────────────────────────────────────

export type OhrExceptionCode =
  | 'NotManaged'
  | 'NotAllowed'
  | 'FleetLocked'
  | 'Unsupported'
  | 'InvalidConfig'
  | 'Refused'
  | 'Failed';

/** Why the device refused or couldn't do what the site asked. Switch on [code]. */
export abstract class OhrException extends Error {
  abstract readonly code: OhrExceptionCode;
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = new.target.name;
  }
}

/** Not an OhrTech web app: an ordinary browser, or a page outside the app's own origins. */
export class OhrNotManaged extends OhrException {
  readonly code = 'NotManaged';
}

/**
 * Not allowed: the fleet doesn't grant [area] to the app, the site's manifest doesn't declare it
 * (`ohrtech_device_sdk`), or the web app runs without the SDK (area "sdk").
 */
export class OhrNotAllowed extends OhrException {
  readonly code = 'NotAllowed';
  constructor(message: string, readonly area: string) {
    super(message);
  }
}

/** The fleet locks the setting or network [key]. */
export class OhrFleetLocked extends OhrException {
  readonly code = 'FleetLocked';
  constructor(message: string, readonly key: string) {
    super(message);
  }
}

/** This device, OS or Agent can't do it. [needsAgent]: the Agent version that can, when the Agent is only too old. */
export class OhrUnsupported extends OhrException {
  readonly code = 'Unsupported';
  constructor(message: string, readonly reason: string, readonly needsAgent: number | null) {
    super(message);
  }
}

/** A value the site passed is invalid: [field], and why. */
export class OhrInvalidConfig extends OhrException {
  readonly code = 'InvalidConfig';
  constructor(message: string, readonly field: string, readonly reason: string) {
    super(message);
  }
}

/** The hub refused a request it checks itself (a certificate: [reason] says why). */
export class OhrRefused extends OhrException {
  readonly code = 'Refused';
  constructor(message: string, readonly reason: string) {
    super(message);
  }
}

/** The device tried and it failed, or its Agent can't be reached. */
export class OhrFailed extends OhrException {
  readonly code = 'Failed';
  constructor(message: string, readonly reason: string) {
    super(message);
  }
}

/** An error the device sent (code, message, details) as the OhrException it stands for. */
function ohrException(code: string, message: string, details: Record<string, unknown> = {}): OhrException {
  const s = (k: string) => (typeof details[k] === 'string' ? (details[k] as string) : message);
  switch (code) {
    case 'NotManaged':
      return new OhrNotManaged(message);
    case 'NotAllowed':
      return new OhrNotAllowed(message, s('area'));
    case 'FleetLocked':
      return new OhrFleetLocked(message, s('key'));
    case 'Unsupported':
      return new OhrUnsupported(message, s('reason'), typeof details.needsAgent === 'number' ? details.needsAgent : null);
    case 'InvalidConfig':
      return new OhrInvalidConfig(message, s('field'), s('reason'));
    case 'Refused':
      return new OhrRefused(message, s('reason'));
    default:
      return new OhrFailed(message, s('reason'));
  }
}

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────

/** A listener's subscription: remove() stops it. */
export interface OhrSubscription {
  remove(): void;
}

type ErrorListener = (e: OhrException) => void;

export type OhrConnection = 'NOT_CONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'UNAVAILABLE';

/** Where the page runs. None of it is proof: a server that must know uses attestation. */
export interface OhrEnvironment {
  /** In an OhrTech web app, on one of the app's own origins. */
  onDevice: boolean;
  /** The shell's version, or null. */
  shellVersion: number | null;
  /** The SDK interfaces the shell implements, or []. */
  interfaces: number[];
  /** locked (no SDK), sdk, or packaged; null off the device. */
  mode: 'locked' | 'sdk' | 'packaged' | null;
}

export interface OhrAccessInfo {
  /** The hub's id of this app ("app_…"). */
  app: string;
  packageName: string;
  appVersion: string | null;
  /** What the app may use: "device", "updates", "keys", the reads ("wifi.read", ...), and each area the fleet grants. */
  areas: string[];
  agentVersion: number;
  agentInterface: number;
}

export interface OhrNamed {
  id: string;
  name: string;
}

export interface OhrDeviceInfo {
  deviceId: string | null;
  serial: string | null;
  fleet: OhrNamed | null;
  org: OhrNamed | null;
  osRelease: string;
  osBuild: string;
  securityPatch: string;
  osIncremental: string;
  agentVersion: number;
  online: boolean;
}

export interface OhrUpdate {
  versionCode: number;
  versionName: string | null;
  notes: string | null;
  downloaded: boolean;
}

export interface OhrWifiState {
  enabled: boolean;
  state: string;
  connected: Record<string, unknown> | null;
}

export interface OhrWifiNetwork {
  key: string;
  title: string;
  ssid?: string | null;
  security: string[];
  level: number;
  saved: boolean;
  connected?: string;
  internet?: boolean;
  metered?: boolean;
  fleet: boolean;
  [more: string]: unknown;
}

export type OhrWifiConfig = Record<string, unknown>;

export interface OhrNetworkState {
  active: { transport: string; validated: boolean; captive: boolean; metered: boolean; vpn: boolean } | null;
  mobileData: boolean;
  airplaneMode: boolean;
  dataRoaming: boolean;
  ethernetConnected: boolean;
}

export interface OhrKioskState {
  pinned: boolean;
  mode: string;
  features: number;
  appMayExit: boolean;
}

export interface OhrBattery {
  level: number | null;
  charging: boolean;
  plugged: string | null;
  health: string;
  temperatureC: number;
  screenOn: boolean;
}

export interface OhrRebootSchedule {
  /** HH:mm, the device's time zone. */
  time: string;
  /** 1 (Monday) to 7 (Sunday). */
  days: number[];
  reason: string;
}

export interface OhrSetting {
  key: string;
  value: unknown;
  mode: string;
}

export interface OhrUsbDevice {
  accessory: boolean;
  deviceName: string | null;
  vendorId: number;
  productId: number;
  manufacturer: string | null;
  product: string | null;
  model: string | null;
  version: string | null;
  serial: string | null;
  name: string | null;
  hasPermission: boolean;
}

export type OhrAttestationSuite = 'ec' | 'ec-mldsa65';

export interface OhrAttestationResult {
  suite: OhrAttestationSuite;
  /** The EC certificate chain, leaf first, base64 DER. */
  ec: string[];
  mlDsa65?: string[];
}

export interface OhrCertificate {
  alias: string;
  /** Each path leaf first, base64 DER. */
  paths: string[][];
  imported: boolean;
}

export type OhrKeyAlgorithm = 'ML-KEM-768' | 'ML-KEM-1024' | 'X-Wing' | 'X25519';

export interface OhrKeyInfo {
  alias: string;
  algorithm: OhrKeyAlgorithm;
  createdAtMs: number;
}

export interface OhrKeyAttestation {
  algorithm: OhrKeyAlgorithm;
  publicKey: string;
  owner: string;
  coseSign1: string;
  diceChain: string;
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────

/** What stays available in kiosk mode (combine with |). NOTIFICATIONS and OVERVIEW need HOME too (Android's rule). */
export const OhrKioskFeature = {
  SYSTEM_INFO: 1,
  NOTIFICATIONS: 2,
  HOME: 4,
  OVERVIEW: 8,
  GLOBAL_ACTIONS: 16,
  KEYGUARD: 32,
  BLOCK_ACTIVITY_START_IN_TASK: 64,
} as const;

export const OhrHpke = {
  KDF_HKDF_SHA256: 1,
  AEAD_AES_128_GCM: 1,
  AEAD_AES_256_GCM: 2,
  AEAD_CHACHA20_POLY1305: 3,
} as const;

/** Wi-Fi configs for OhrWifi.save and connectConfig. */
export const WifiConfig = {
  open: (ssid: string, hidden = false): OhrWifiConfig => ({ ssid, security: 'open', ...(hidden ? { hidden: true } : {}) }),
  owe: (ssid: string, hidden = false): OhrWifiConfig => ({ ssid, security: 'owe', ...(hidden ? { hidden: true } : {}) }),
  psk: (ssid: string, password: string, hidden = false): OhrWifiConfig => ({ ssid, security: 'psk', password, ...(hidden ? { hidden: true } : {}) }),
  sae: (ssid: string, password: string, hidden = false): OhrWifiConfig => ({ ssid, security: 'sae', password, ...(hidden ? { hidden: true } : {}) }),
};

// ── The areas (interface 1) ──────────────────────────────────────────────────────────────────────────────────────

export interface OhrDeviceSdkArea {
  /** Whether the device's OhrTech Agent has the Device SDK. */
  isAvailable(): Promise<boolean>;
  connect(timeoutMs?: number): Promise<void>;
  connection(): Promise<OhrConnection>;
  addConnectionListener(listener: (c: OhrConnection) => void, onError?: ErrorListener): OhrSubscription;
}

export interface OhrAccessArea {
  info(): Promise<OhrAccessInfo>;
  mayUse(area: string): Promise<boolean>;
}

export interface OhrDeviceArea {
  info(): Promise<OhrDeviceInfo>;
}

export interface OhrUpdatesArea {
  /** An update to this web app's shell waiting to install, or null. */
  available(): Promise<OhrUpdate | null>;
  install(options?: { whenIdle?: boolean }): Promise<void>;
  addChangeListener(listener: (u: OhrUpdate) => void, onError?: ErrorListener): OhrSubscription;
}

export interface OhrWifiArea {
  state(): Promise<OhrWifiState>;
  networks(): Promise<OhrWifiNetwork[]>;
  scan(): Promise<void>;
  saved(): Promise<Record<string, unknown>[]>;
  save(config: OhrWifiConfig): Promise<string>;
  connect(keyOrIdentity: string): Promise<void>;
  connectConfig(config: OhrWifiConfig): Promise<string>;
  disconnect(): Promise<void>;
  forget(identity: string): Promise<void>;
  setEnabled(on: boolean): Promise<void>;
  connectQr(text: string): Promise<string>;
  /** Android's Wi-Fi screen over the page, in the app; resolves when it closes, with the network joined or null. */
  showScreen(): Promise<string | null>;
  addStateListener(listener: (s: OhrWifiState) => void, onError?: ErrorListener): OhrSubscription;
  addNetworksListener(listener: (n: OhrWifiNetwork[]) => void, onError?: ErrorListener): OhrSubscription;
}

export interface OhrNetworkArea {
  state(): Promise<OhrNetworkState>;
  setMobileData(on: boolean): Promise<void>;
  setAirplaneMode(on: boolean): Promise<void>;
  setDataRoaming(on: boolean): Promise<void>;
  addChangeListener(listener: (s: OhrNetworkState) => void, onError?: ErrorListener): OhrSubscription;
}

/** Kiosk mode. The web app's shell keeps the kiosk watchdog's heartbeat itself: a page has nothing to beat. */
export interface OhrKioskArea {
  start(features?: number): Promise<void>;
  stop(): Promise<void>;
  state(): Promise<OhrKioskState>;
  requestExit(): Promise<void>;
  addModeListener(listener: (mode: string) => void, onError?: ErrorListener): OhrSubscription;
}

export interface OhrPowerArea {
  battery(): Promise<OhrBattery>;
  reboot(reason: string): Promise<void>;
  scheduleReboot(schedule: OhrRebootSchedule | null): Promise<void>;
  rebootSchedule(): Promise<OhrRebootSchedule | null>;
  setScreenTimeout(seconds: number): Promise<void>;
  setBrightness(percent: number): Promise<void>;
  addBatteryListener(listener: (b: OhrBattery) => void, onError?: ErrorListener): OhrSubscription;
}

export interface OhrSettingsArea {
  keys(): Promise<string[]>;
  get(key: string): Promise<OhrSetting>;
  set(key: string, value: unknown): Promise<void>;
  addChangeListener(listener: (s: OhrSetting) => void, onError?: ErrorListener): OhrSubscription;
}

/** The web app's managed configuration (its shell's own keys among them). */
export interface OhrConfigArea {
  values(): Promise<Record<string, unknown>>;
  string(key: string, fallback?: string | null): Promise<string | null>;
  integer(key: string, fallback?: number): Promise<number>;
  boolean(key: string, fallback?: boolean): Promise<boolean>;
  strings(key: string): Promise<string[]>;
  isSet(key: string): Promise<boolean>;
  addChangeListener(listener: (values: Record<string, unknown>) => void, onError?: ErrorListener): OhrSubscription;
}

export interface OhrUsbArea {
  devices(): Promise<OhrUsbDevice[]>;
  addChangeListener(listener: (c: { attached: boolean; device: OhrUsbDevice }) => void, onError?: ErrorListener): OhrSubscription;
}

export interface OhrDiagnosticsArea {
  event(name: string, data?: Record<string, unknown>): Promise<void>;
  log(priority: number, tag: string, message: string): Promise<void>;
  i(tag: string, message: string): Promise<void>;
  w(tag: string, message: string): Promise<void>;
  e(tag: string, message: string): Promise<void>;
}

export interface OhrAttestationArea {
  attest(challenge: Uint8Array, suite?: OhrAttestationSuite): Promise<OhrAttestationResult>;
  token(audience: string, options?: { ttlSeconds?: number; nonce?: string }): Promise<string>;
  suite(): Promise<OhrAttestationSuite | null>;
}

/**
 * The app's client certificates. The page's own requests (fetch, XHR, navigation) present them already, through the
 * shell, when a server asks; these calls manage them.
 */
export interface OhrCertificatesArea {
  canRequest(): Promise<boolean>;
  request(alias: string, timeoutMs?: number): Promise<OhrCertificate>;
  renewIfDue(alias: string): Promise<OhrCertificate | null>;
  list(): Promise<OhrCertificate[]>;
  addChangeListener(listener: () => void, onError?: ErrorListener): OhrSubscription;
}

export interface OhrKeysArea {
  isAvailable(): Promise<boolean>;
  generate(alias: string, algorithm: OhrKeyAlgorithm): Promise<Uint8Array>;
  list(): Promise<OhrKeyInfo[]>;
  publicKey(alias: string): Promise<Uint8Array | null>;
  delete(alias: string): Promise<void>;
  decapsulate(alias: string, ciphertext: Uint8Array): Promise<Uint8Array>;
  encapsulate(algorithm: OhrKeyAlgorithm, publicKey: Uint8Array): Promise<{ ciphertext: Uint8Array; sharedSecret: Uint8Array }>;
  hpkeOpen(alias: string, enc: Uint8Array, ciphertext: Uint8Array,
           options?: { kdf?: number; aead?: number; info?: Uint8Array; aad?: Uint8Array }): Promise<Uint8Array>;
  attest(alias: string, challenge: Uint8Array): Promise<OhrKeyAttestation>;
}

/** The web app itself. */
export interface OhrAppArea {
  /** Loads the app's start URL again. */
  reload(): Promise<void>;
  /** Clears the app's cookies, storage and cache, then loads the start URL (as the idle reset does). */
  clearData(): Promise<void>;
}

/** What the shell's bind gives: interface 1's areas. */
export interface OhrSdk1 {
  OhrDeviceSdk: OhrDeviceSdkArea;
  OhrAccess: OhrAccessArea;
  OhrDevice: OhrDeviceArea;
  OhrUpdates: OhrUpdatesArea;
  OhrWifi: OhrWifiArea;
  OhrNetwork: OhrNetworkArea;
  OhrKiosk: OhrKioskArea;
  OhrPower: OhrPowerArea;
  OhrSettings: OhrSettingsArea;
  OhrConfig: OhrConfigArea;
  OhrUsb: OhrUsbArea;
  OhrDiagnostics: OhrDiagnosticsArea;
  OhrAttestation: OhrAttestationArea;
  OhrCertificates: OhrCertificatesArea;
  OhrKeys: OhrKeysArea;
  OhrApp: OhrAppArea;
}

/** What the facade hands the shell: its error classes, so `instanceof` works in the site's code. */
export interface OhrBindKit {
  error(code: string, message: string, details?: Record<string, unknown>): OhrException;
}

interface OhrShell {
  environment: OhrEnvironment;
  bind(iface: number, kit: OhrBindKit): OhrSdk1 | null;
}

// ── Binding ──────────────────────────────────────────────────────────────────────────────────────────────────────

function shell(): OhrShell | undefined {
  const g = typeof globalThis !== 'undefined' ? (globalThis as { __ohrtech?: OhrShell }) : undefined;
  const s = g?.__ohrtech;
  return s && typeof s.bind === 'function' ? s : undefined;
}

const OFF_DEVICE: OhrEnvironment = Object.freeze({ onDevice: false, shellVersion: null, interfaces: [], mode: null });

/** True only in an OhrTech web app, on one of the app's own origins. Synchronous, safe anywhere. Not proof. */
export function isDevice(): boolean {
  return shell() !== undefined;
}

/** Where the page runs: the shell's version, the interfaces it implements and the web app's mode. */
export function environment(): OhrEnvironment {
  return shell()?.environment ?? OFF_DEVICE;
}

/** `OhrTech.isDevice()` and `OhrTech.environment()`, for ES module users. */
export const OhrTech = { isDevice, environment, INTERFACE };

/**
 * Every area, failing every call: off the device (OhrNotManaged), or on a web app without the SDK (OhrNotAllowed,
 * area "sdk"). Listeners get the error and a subscription that does nothing.
 */
function unavailable(): OhrSdk1 {
  const error = () =>
    isDevice()
      ? new OhrNotAllowed('This web app runs without the OhrTech Device SDK (its mode is locked).', 'sdk')
      : new OhrNotManaged('Not an OhrTech web app: the OhrTech Device SDK is only there on OhrTech devices.');
  const area = new Proxy({}, {
    get(_t, name) {
      if (typeof name !== 'string') return undefined;
      if (/^add[A-Z].*Listener$/.test(name))
        return (_l: unknown, onError?: ErrorListener) => {
          Promise.resolve().then(() => onError?.(error()));
          return { remove() {} };
        };
      return () => Promise.reject(error());
    },
  });
  return new Proxy({}, { get: () => area }) as OhrSdk1;
}

const kit: OhrBindKit = { error: ohrException };

const sdk: OhrSdk1 = (() => {
  try {
    return shell()?.bind(INTERFACE, kit) ?? unavailable();
  } catch {
    return unavailable();
  }
})();

export const OhrDeviceSdk = sdk.OhrDeviceSdk;
export const OhrAccess = sdk.OhrAccess;
export const OhrDevice = sdk.OhrDevice;
export const OhrUpdates = sdk.OhrUpdates;
export const OhrWifi = sdk.OhrWifi;
export const OhrNetwork = sdk.OhrNetwork;
export const OhrKiosk = sdk.OhrKiosk;
export const OhrPower = sdk.OhrPower;
export const OhrSettings = sdk.OhrSettings;
export const OhrConfig = sdk.OhrConfig;
export const OhrUsb = sdk.OhrUsb;
export const OhrDiagnostics = sdk.OhrDiagnostics;
export const OhrAttestation = sdk.OhrAttestation;
export const OhrCertificates = sdk.OhrCertificates;
export const OhrKeys = sdk.OhrKeys;
export const OhrApp = sdk.OhrApp;
