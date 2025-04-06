"use client"

import { useEffect, useState } from "react"
import {
  isServiceWorkerSupported,
  registerServiceWorker,
  unregisterAllServiceWorkers,
  isServiceWorkerActive,
} from "@/lib/service-worker-manager"
import { toast } from "@/components/ui/use-toast"

export function ServiceWorkerInit() {
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const initServiceWorker = async () => {
      // Check if service workers are supported
      if (!isServiceWorkerSupported()) {
        console.log("Service workers are not supported in this browser")
        return
      }

      try {
        // First, unregister any existing service workers to avoid scope conflicts
        await unregisterAllServiceWorkers()

        // Register our service worker with root scope
        const registration = await registerServiceWorker("/sw.js", "/")

        if (registration) {
          setIsInitialized(true)

          // Check if service worker is active
          const isActive = await isServiceWorkerActive()

          if (isActive) {
            console.log("Service worker is active and controlling the page")
          } else {
            console.log("Service worker is registered but not yet active")
          }
        }
      } catch (error) {
        console.error("Failed to initialize service worker:", error)

        // Show error toast only in production
        if (process.env.NODE_ENV === "production") {
          toast({
            title: "Offline Mode Unavailable",
            description: "The app will still work, but offline functionality may be limited.",
            variant: "destructive",
          })
        }
      }
    }

    // Initialize service worker
    initServiceWorker()

    // Cleanup on unmount
    return () => {
      // Nothing to clean up
    }
  }, [])

  // This component doesn't render anything
  return null
}

