/**
 * Database Query Script
 * 
 * Usage:
 *   # For local development (uses .env.local)
 *   npx tsx scripts/query-db.ts
 * 
 *   # For production (set DATABASE_URL first)
 *   $env:DATABASE_URL="your-production-url"  # PowerShell
 *   npx tsx scripts/query-db.ts
 * 
 *   # Or use Vercel CLI to pull env vars
 *   vercel env pull .env.production
 *   npx tsx scripts/query-db.ts
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient({
  log: ["error", "warn"],
})

async function main() {
  console.log("🔍 Running database queries...\n")

  // Example 1: Find users by email domain
  console.log("1. Users with emails ending in '@gmail.com':")
  const usersByDomain = await prisma.user.findMany({
    where: {
      email: { endsWith: "@gmail.com" }
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    }
  })
  console.log(`   Found ${usersByDomain.length} users`)
  console.log(usersByDomain)
  console.log()

  // Example 2: Count all users
  console.log("2. Total user count:")
  const userCount = await prisma.user.count()
  console.log(`   Total users: ${userCount}`)
  console.log()

  // Example 3: Count all projects
  console.log("3. Total project count:")
  const projectCount = await prisma.project.count()
  console.log(`   Total projects: ${projectCount}`)
  console.log()

  // Example 4: Recent users
  console.log("4. 10 most recent users:")
  const recentUsers = await prisma.user.findMany({
    take: 10,
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    }
  })
  recentUsers.forEach((user, index) => {
    console.log(`   ${index + 1}. ${user.email} (${user.name || 'No name'}) - Created: ${user.createdAt.toLocaleDateString()}`)
  })
  console.log()

  // Example 5: Users with projects
  console.log("5. Users with project counts:")
  const usersWithProjectCount = await prisma.user.findMany({
    include: {
      _count: {
        select: { projects: true }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 10
  })
  usersWithProjectCount.forEach((user, index) => {
    console.log(`   ${index + 1}. ${user.email}: ${user._count.projects} project(s)`)
  })
  console.log()

  // Example 6: Recent projects with owner info
  console.log("6. 10 most recent projects:")
  const recentProjects = await prisma.project.findMany({
    take: 10,
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      owner: {
        select: {
          email: true,
          name: true
        }
      }
    }
  })
  recentProjects.forEach((project, index) => {
    console.log(`   ${index + 1}. "${project.title}" by ${project.owner.email} - Created: ${project.createdAt.toLocaleDateString()}`)
  })
  console.log()

  // Example 7: Search users by name (case-insensitive)
  console.log("7. Search users by name (example: contains 'John'):")
  const usersByName = await prisma.user.findMany({
    where: {
      name: {
        contains: "John",
        mode: 'insensitive'
      }
    },
    select: {
      id: true,
      email: true,
      name: true,
    }
  })
  console.log(`   Found ${usersByName.length} users`)
  if (usersByName.length > 0) {
    console.log(usersByName)
  }
  console.log()

  // Example 8: Find user by specific email
  // Uncomment and modify to search for a specific user
  /*
  console.log("8. Find specific user:")
  const specificUser = await prisma.user.findUnique({
    where: {
      email: "user@example.com"
    },
    include: {
      projects: true
    }
  })
  if (specificUser) {
    console.log(`   Found user: ${specificUser.email}`)
    console.log(`   Projects: ${specificUser.projects.length}`)
  } else {
    console.log("   User not found")
  }
  console.log()
  */

  console.log("✅ Query complete!")
}

main()
  .catch((error) => {
    console.error("❌ Error running queries:", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

