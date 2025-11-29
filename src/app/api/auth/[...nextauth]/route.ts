import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/api/auth/signin",
  },
  callbacks: {
    async session({ session, user }: { session: any; user: any }) {
      if (session.user && user) {
        session.user.id = user.id
      }
      return session
    },
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // Allow relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allow callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },
  session: {
    strategy: "database" as const,
  },
  debug: process.env.NODE_ENV === "development",
}

const { handlers, auth } = NextAuth(authOptions)

export const { GET, POST } = handlers
export { auth }

// Ensure this route runs in Node.js runtime (required for Prisma)
export const runtime = "nodejs"
