// Simple password hashing utility
// In a production app, you would use a more secure library like bcrypt

export function hashPassword(password: string): string {
  // This is a very simple hash function for demo purposes only
  // DO NOT use this in production!
  return btoa(password + "_salt_" + password.length)
}

export function verifyPassword(password: string, hashedPassword: string): boolean {
  return hashPassword(password) === hashedPassword
}

// Create a default admin user
export const DEFAULT_ADMIN = {
  username: "admin",
  password: hashPassword("admin123"),
  isAdmin: true,
}

