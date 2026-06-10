self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})

self.addEventListener('push', (event) => {
  let payload = { title: 'StockGuru', body: 'มีการแจ้งเตือนใหม่' }

  try {
    payload = event.data ? event.data.json() : payload
  } catch {
    payload = { title: 'StockGuru', body: event.data?.text() ?? 'มีการแจ้งเตือนใหม่' }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'StockGuru', {
      body: payload.body || 'มีการแจ้งเตือนใหม่',
      icon: payload.icon || '/favicon.ico',
      badge: '/favicon.ico',
      data: payload.data || {},
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url || '/'
  event.waitUntil(clients.openWindow(url))
})
