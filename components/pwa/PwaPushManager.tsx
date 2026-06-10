'use client'

import { useEffect } from 'react'

export default function PwaPushManager() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        if (registration.waiting) {
          registration.waiting?.postMessage({ type: 'SKIP_WAITING' })
        }
      })
      .catch((err) => {
        console.warn('StockGuru service worker registration failed:', err)
      })
  }, [])

  return null
}
