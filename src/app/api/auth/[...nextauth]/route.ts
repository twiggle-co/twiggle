import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        // For test user: admin / 123456
        if (credentials.username === "admin" && credentials.password === "123456") {
          // Find or create the test user
          let user = await prisma.user.findUnique({
            where: { email: "admin@test.com" },
          })

          if (!user) {
            user = await prisma.user.create({
              data: {
                name: "Admin",
                email: "admin@test.com",
                emailVerified: new Date(),
              },
            })
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          }
        }

        return null
      },
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
