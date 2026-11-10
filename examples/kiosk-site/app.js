// On an OhrTech device the page uses the Device SDK; anywhere else the same page works without it.
const { OhrTech } = window;

if (OhrTech.isDevice()) {
  const env = OhrTech.environment();
  try {
    const d = await OhrTech.OhrDevice.info();
    document.getElementById('device').textContent = `Device ${d.deviceId} in ${d.fleet?.name ?? 'no fleet'} (shell ${env.shellVersion}, ${env.mode})`;
  } catch (e) {
    // OhrNotAllowed: the web app runs locked (no SDK), the fleet doesn't grant the area, or the manifest doesn't declare it.
    document.getElementById('device').textContent = `On a device, without the SDK here: ${e.code}`;
  }
  const wifi = document.getElementById('wifi');
  if (await OhrTech.OhrAccess.mayUse('wifi')) {
    wifi.hidden = false;
    wifi.onclick = async () => {
      const joined = await OhrTech.OhrWifi.showScreen();
      if (joined) location.reload();
    };
  }
}

// Notifications and push are the standard APIs, on a device as in a browser.
const registration = await navigator.serviceWorker.register('/sw.js');
document.getElementById('notify').onclick = async () => {
  if ((await Notification.requestPermission()) !== 'granted') return;
  // On an OhrTech device, applicationServerKey is your server's OhrTech sender key (Ed25519, from `ohr push keygen`).
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: 'REPLACE-WITH-YOUR-SENDER-KEY',
  });
  await fetch('/api/push-subscriptions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription),
  });
  await registration.showNotification('Notifications are on', { body: 'You will hear about new orders here.', tag: 'welcome' });
};
