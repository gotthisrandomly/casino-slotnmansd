// Minimal Service Worker that does nothing but claim clients
self.addEventListener("install", (event) => {
  // Skip the 'waiting' lifecycle phase, to go directly from 'installed' to 'activated'
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  // Claim any clients immediately
  event.waitUntil(self.clients.claim())
})

// Just pass through all fetch events
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request))
})

// Log successful registration
console.log("v0 Service Worker registered successfully")

