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
        console.log("[DEBUG] Credentials authorize called with:", {
          username: credentials?.username,
          hasPassword: !!credentials?.password,
        })

        if (!credentials?.username || !credentials?.password) {
          console.log("[DEBUG] Missing credentials")
          return null
        }

        // For test user: admin@test.com / 123456
        // Accept both "admin" and "admin@test.com" as username
        const isAdminUser = 
          (credentials.username === "admin" || credentials.username === "admin@test.com") &&
          credentials.password === "123456"

        console.log("[DEBUG] Is admin user:", isAdminUser)

        if (isAdminUser) {
          try {
            // Find or create the test user
            let user = await prisma.user.findUnique({
              where: { email: "admin@test.com" },
            })

            if (!user) {
              console.log("[DEBUG] Creating new admin user")
              user = await prisma.user.create({
                data: {
                  name: "Admin",
                  email: "admin@test.com",
                  emailVerified: new Date(),
                },
              })
            } else {
              console.log("[DEBUG] Found existing admin user:", user.id)
            }

            const userData = {
              id: user.id,
              email: user.email,
              name: user.name,
            }
            console.log("[DEBUG] Returning user data:", { ...userData, id: userData.id })
            return userData
          } catch (error) {
            console.error("[DEBUG] Error in authorize:", error)
            return null
          }
        }

        console.log("[DEBUG] Invalid credentials")
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
