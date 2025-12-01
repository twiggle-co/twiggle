export function stripQuotes(value: string | undefined): string | undefined {
  if (!value) return value
  
  let trimmed = value.trim()
  
  while (
    ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
     (trimmed.startsWith("'") && trimmed.endsWith("'"))) &&
    trimmed.length >= 2
  ) {
    trimmed = trimmed.slice(1, -1).trim()
  }
  
  return trimmed
}

export function getEnv(key: string, defaultValue?: string): string {
  const value = stripQuotes(process.env[key])
  return value || defaultValue || ""
}

export function requireEnv(key: string): string {
  const value = getEnv(key)
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

