const CACHE_NAME = "gard018-shell-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);

self.addEventListener("fetch", (event) => {
  if (
    event.request.method !== "GET" ||
    new URL(event.request.url).origin !== self.location.origin
  )
    return;

  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request).then((cached) => cached || caches.match("/")),
    ),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "clear-cache") event.waitUntil(caches.delete(CACHE_NAME));
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data?.text() };
  }

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(payload.title || "GARD 018", {
        body: payload.body || "Imate novo obaveštenje.",
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        tag: payload.tag || "gard018-notification",
        data: { url: payload.url || "/" },
      }),
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => client.postMessage({ type: "gard018-push-received" }));
      }),
    ]),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    }),
  );
});
