// The service worker: push messages become notifications; a tap opens the order.
self.addEventListener('push', (event) => {
  const order = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(`Order ${order.id ?? ''}`, {
      body: order.summary ?? 'A new order',
      tag: `order-${order.id}`,
      data: { url: `/orders/${order.id}` },
      actions: [{ action: 'open', title: 'Open' }],
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url ?? '/'));
});
