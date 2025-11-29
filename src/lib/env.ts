/**
 * Environment variable utilities
 * Handles parsing and validation of environment variables
 */

/**
 * Strip surrounding quotes from environment variable values
 * Handles cases where platforms wrap values in quotes
 */
export function stripQuotes(value: string | undefined): string | undefined {
  if (!value) return value
  
  let trimmed = value.trim()
  
  // Remove surrounding quotes (handle multiple layers)
  while (
    ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
     (trimmed.startsWith("'") && trimmed.endsWith("'"))) &&
    trimmed.length >= 2
  ) {
    trimmed = trimmed.slice(1, -1).trim()
  }
  
  return trimmed
}

/**
 * Get environment variable with optional default
 */
export function getEnv(key: string, defaultValue?: string): string {
  const value = stripQuotes(process.env[key])
  return value || defaultValue || ""
}

/**
 * Require environment variable (throws if missing)
 */
export function requireEnv(key: string): string {
  const value = getEnv(key)
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

