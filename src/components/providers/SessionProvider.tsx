"use client"

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"

/**
 * Session provider wrapper
 * Provides NextAuth session context to the app
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>
}
