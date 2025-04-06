import { generateMinimalServiceWorker } from "@/lib/service-worker-manager"

// This file will be compiled to /public/sw.js

// Self-executing function to avoid polluting the global scope
;(() => {
  // Use the minimal service worker implementation
  const swScript = generateMinimalServiceWorker()

  // The service worker script is already in the correct context
  // Just make sure it's properly formatted
  self.addEventListener = self.addEventListener || (() => {})
  self.skipWaiting = self.skipWaiting || (() => {})
  self.clients = self.clients || { claim: () => {} }

  // Execute the script
  eval(swScript)
})()

