/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Disable PWA features in development
  pwa: process.env.NODE_ENV === "production",

  // Disable experimental features that might use Service Workers
  experimental: {
    serviceWorker: false,
  },

  // Custom headers to help with service worker scope issues
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: "/(.*)",
        headers: [
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=3600, must-revalidate",
          },
        ],
      },
      {
        // Specific headers for service worker
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
    ]
  },

  // Configure webpack to handle service worker properly
  webpack: (config, { isServer, dev }) => {
    // Only run this in the browser build
    if (!isServer) {
      // Copy service worker to the public directory
      config.plugins.push(
        new (require("copy-webpack-plugin"))({
          patterns: [
            {
              from: "app/sw.ts",
              to: "../public/sw.js",
              transform(content) {
                // Remove TypeScript types and convert to plain JavaScript
                return content.toString().replace(/: \w+/g, "")
              },
            },
          ],
        }),
      )
    }

    return config
  },
}

module.exports = nextConfig

