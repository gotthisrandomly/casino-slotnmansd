import { execSync } from "child_process"
import { envManager } from "../lib/env-manager"

// This script builds the application with environment variables

// Main function
async function main() {
  console.log("Building application with environment variables...")

  // Ensure environment variables are set up
  console.log("Setting up environment variables...")
  envManager.generateDefaultEnv()

  // Set production environment
  process.env.NODE_ENV = "production"

  // Run the build command
  console.log("Running build command...")
  execSync("next build", { stdio: "inherit" })

  console.log("Build completed successfully!")
}

// Run the script
main().catch((error) => {
  console.error("Error building application:", error)
  process.exit(1)
})

