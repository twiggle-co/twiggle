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
      // Add user ID to session
      if (session.user && user) {
        session.user.id = user.id
      }
      return session
    },
  },
  session: {
    strategy: "database" as const,
  },
}

const { handlers, auth } = NextAuth(authOptions)

export const { GET, POST } = handlers
export { auth }

// Ensure this route runs in Node.js runtime (not Edge Runtime)
// This is required because Prisma doesn't work in Edge Runtime
export const runtime = "nodejs"

