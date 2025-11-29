/**
 * Test script to verify project creation and saving flow
 * Run with: npx dotenv-cli -e .env.local -- tsx scripts/test-project-flow.ts
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function testFlow() {
  try {
    console.log("🧪 Testing project creation flow...\n")

    // 1. Find the test user
    const user = await prisma.user.findUnique({
      where: { email: "admin@test.com" },
    })

    if (!user) {
      console.error("❌ Test user not found. Run create-test-user.ts first.")
      process.exit(1)
    }

    console.log("✅ Test user found:")
    console.log(`   ID: ${user.id}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Name: ${user.name}\n`)

    // 2. Check existing projects
    const existingProjects = await prisma.project.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    })

    console.log(`📁 Found ${existingProjects.length} existing projects:`)
    existingProjects.forEach((project, index) => {
      console.log(`   ${index + 1}. ${project.title} (ID: ${project.id})`)
      console.log(`      Created: ${project.createdAt}`)
      console.log(`      Has workflow URL: ${project.workflowDataUrl ? "Yes" : "No"}\n`)
    })

    console.log("\n✅ Test script completed successfully!")
    console.log("\n📝 Next steps:")
    console.log("   1. Deploy the updated code to Vercel")
    console.log("   2. Navigate to https://www.twiggle.co")
    console.log("   3. Click 'Test Login (Admin)' button")
    console.log("   4. Go to dashboard and create a new project")
    console.log("   5. Check Vercel function logs for any errors")

  } catch (error) {
    console.error("❌ Error:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

testFlow()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script failed:", error)
    process.exit(1)
  })

