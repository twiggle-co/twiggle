import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import type { Session, User } from "next-auth"

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
    async session({ session, user }: { session: Session; user: User }) {
      if (session.user && user && typeof user.id === 'string') {
        session.user.id = user.id
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { profilePictureUrl: true },
        })
        if (dbUser?.profilePictureUrl) {
          (session.user as { id?: string; profilePictureUrl?: string }).profilePictureUrl = dbUser.profilePictureUrl
        }
      }
      return session
    },
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`
      if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },
  session: {
    strategy: "database" as const,
  },
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
}

const { handlers, auth } = NextAuth(authOptions)

export const { GET, POST } = handlers
export { auth }
export const runtime = "nodejs"
