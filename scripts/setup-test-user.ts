import { PrismaClient } from "@prisma/client"
import { randomBytes } from "crypto"

const prisma = new PrismaClient()

async function setupTestUser() {
  try {
    console.log("🔧 Setting up test user with Account and Session...\n")

    // 1. Find or create User
    let user = await prisma.user.findUnique({
      where: { email: "admin@test.com" },
    })

    if (!user) {
      console.log("Creating new user...")
      user = await prisma.user.create({
        data: {
          name: "Admin",
          email: "admin@test.com",
          emailVerified: new Date(),
        },
      })
      console.log("✅ User created:", user.id)
    } else {
      console.log("✅ User already exists:", user.id)
    }

    // 2. Find or create Account (required for NextAuth with credentials)
    let account = await prisma.account.findFirst({
      where: {
        userId: user.id,
        provider: "credentials",
      },
    })

    if (!account) {
      console.log("Creating Account record...")
      account = await prisma.account.create({
        data: {
          userId: user.id,
          type: "credentials",
          provider: "credentials",
          providerAccountId: user.id, // Use user ID as provider account ID
        },
      })
      console.log("✅ Account created:", account.id)
    } else {
      console.log("✅ Account already exists:", account.id)
    }

    // 3. Clean up old sessions and create a new one (optional, for testing)
    const oldSessions = await prisma.session.findMany({
      where: { userId: user.id },
    })

    if (oldSessions.length > 0) {
      console.log(`Cleaning up ${oldSessions.length} old session(s)...`)
      await prisma.session.deleteMany({
        where: { userId: user.id },
      })
    }

    // Create a test session (optional - NextAuth will create one on login)
    const sessionToken = randomBytes(32).toString("base64url")
    const expires = new Date()
    expires.setDate(expires.getDate() + 30) // 30 days

    const session = await prisma.session.create({
      data: {
        sessionToken,
        userId: user.id,
        expires,
      },
    })
    console.log("✅ Test session created:", session.id)
    console.log("   Session token:", sessionToken.substring(0, 20) + "...")

    console.log("\n✅ Setup complete!")
    console.log("\n📋 Summary:")
    console.log(`   User ID: ${user.id}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Account ID: ${account.id}`)
    console.log(`   Session ID: ${session.id}`)
    console.log("\n🔑 Login credentials:")
    console.log("   Email: admin@test.com")
    console.log("   Password: 123456")

  } catch (error) {
    console.error("❌ Error setting up test user:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

setupTestUser()
  .then(() => {
    console.log("\n✅ Script completed successfully")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error)
    process.exit(1)
  })

