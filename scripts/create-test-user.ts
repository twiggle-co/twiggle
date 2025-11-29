import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function createTestUser() {
  try {
    console.log("Creating test user...")

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: "admin@test.com" },
    })

    if (existingUser) {
      console.log("User already exists with email: admin@test.com")
      console.log("User ID:", existingUser.id)
      return existingUser
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        name: "Admin",
        email: "admin@test.com",
        emailVerified: new Date(),
      },
    })

    console.log("✅ Test user created successfully!")
    console.log("User ID:", user.id)
    console.log("Email:", user.email)
    console.log("Name:", user.name)

    return user
  } catch (error) {
    console.error("❌ Error creating test user:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

createTestUser()
  .then(() => {
    console.log("\n✅ Script completed successfully")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error)
    process.exit(1)
  })

