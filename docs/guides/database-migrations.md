# Database Migrations Guide

This guide covers best practices for safely adding, modifying, or removing database fields and models in Prisma.

## Overview

Prisma migrations allow you to version-control your database schema changes. Always use migrations in production to ensure safe, reproducible database updates.

## Migration Workflow

### 1. Development Workflow (Recommended)

```bash
# 1. Make changes to prisma/schema.prisma
# 2. Create and apply migration
npm run db:migrate

# This will:
# - Prompt you to name the migration
# - Create a migration file in prisma/migrations/
# - Apply the migration to your database
# - Regenerate Prisma Client
```

### 2. Quick Development (Schema Sync)

For rapid prototyping, you can use `db:push` (doesn't create migration files):

```bash
npm run db:push
```

**⚠️ Warning:** Only use `db:push` in development. Never use it in production or when working with a team.

## Adding Fields to Existing Models

### Safe Addition (Non-Breaking)

**Example:** Adding an optional field

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  // ✅ Safe: New optional field
  bio       String?  // Add this
  createdAt DateTime @default(now())
}
```

**Steps:**
1. Add the field to `schema.prisma`
2. Run `npm run db:migrate`
3. Name the migration (e.g., "add_user_bio")
4. Done! Existing records will have `null` for the new field

### Adding Required Fields (Breaking)

**Example:** Adding a required field

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  // ⚠️ Breaking: New required field
  status    String   // Add this (required)
  createdAt DateTime @default(now())
}
```

**Steps:**
1. **First, add as optional:**
   ```prisma
   status    String?  // Optional first
   ```

2. Run migration: `npm run db:migrate`

3. **Populate existing records** (via script or manually):
   ```typescript
   // scripts/populate-status.ts
   await prisma.user.updateMany({
     where: { status: null },
     data: { status: "active" }
   })
   ```

4. **Then make it required:**
   ```prisma
   status    String   // Now required
   ```

5. Run another migration: `npm run db:migrate`

## Removing Fields

### Safe Removal

**Example:** Removing an unused optional field

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  // ❌ Remove this field
  // oldField String?
  createdAt DateTime @default(now())
}
```

**Steps:**
1. **Verify field is not used** in your codebase:
   ```bash
   # Search for usage
   grep -r "oldField" src/
   ```

2. Remove from `schema.prisma`

3. Run `npm run db:migrate`

4. **⚠️ Data Loss Warning:** All data in this field will be permanently deleted!

### Removing Required Fields

**Steps:**
1. **First, make it optional:**
   ```prisma
   oldField String?  // Make optional
   ```

2. Run migration: `npm run db:migrate`

3. **Remove from code** that uses this field

4. **Then remove from schema:**
   ```prisma
   // oldField removed
   ```

5. Run migration: `npm run db:migrate`

## Adding New Models

**Example:** Adding a new `Comment` model

```prisma
model Comment {
  id        String   @id @default(cuid())
  content   String
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  
  @@index([userId])
}

model User {
  id        String    @id @default(cuid())
  email     String    @unique
  comments  Comment[] // Add relation
  createdAt DateTime  @default(now())
}
```

**Steps:**
1. Add model and relations to `schema.prisma`
2. Run `npm run db:migrate`
3. Name migration (e.g., "add_comment_model")
4. Done! New table will be created

## Removing Models

**⚠️ Destructive Operation - Proceed with Caution**

**Steps:**
1. **Backup data** (if needed):
   ```bash
   # Export data before deletion
   npm run db:studio
   # Or use pg_dump for PostgreSQL
   ```

2. **Remove all relations** to this model first:
   ```prisma
   // Remove relations from other models
   model User {
     // comments  Comment[] // Remove this
   }
   ```

3. **Remove the model** from `schema.prisma`

4. Run `npm run db:migrate`

5. **⚠️ Data Loss Warning:** All data in this model will be permanently deleted!

## Modifying Field Types

### Safe Type Changes

**Example:** Changing `String` to `String?` (making optional)

```prisma
model User {
  // Before: name String
  name String?  // After: make optional
}
```

**Steps:**
1. Update type in `schema.prisma`
2. Run `npm run db:migrate`
3. Done! Existing data remains intact

### Breaking Type Changes

**Example:** Changing `String` to `Int`

```prisma
model User {
  // Before: age String
  age Int  // After: change to Int
}
```

**⚠️ This will fail if existing data can't be converted!**

**Steps:**
1. **Create a migration script** to transform data:
   ```typescript
   // scripts/migrate-age-to-int.ts
   const users = await prisma.user.findMany()
   for (const user of users) {
     const ageInt = parseInt(user.age) || 0
     await prisma.user.update({
       where: { id: user.id },
       data: { age: ageInt }
     })
   }
   ```

2. **Add new field** with new type:
   ```prisma
   ageString String  // Keep old
   age       Int?    // Add new
   ```

3. Run migration: `npm run db:migrate`

4. **Run migration script** to copy/transform data

5. **Remove old field**, make new one required:
   ```prisma
   age Int  // Remove ageString, make age required
   ```

6. Run final migration: `npm run db:migrate`

## Renaming Fields

**⚠️ Prisma treats rename as drop + add (data loss!)**

**Example:** Renaming `firstName` to `first_name`

**Steps:**
1. **Add new field:**
   ```prisma
   firstName  String  // Old
   first_name String? // New
   ```

2. Run migration: `npm run db:migrate`

3. **Migrate data** (script):
   ```typescript
   await prisma.user.updateMany({
     data: { first_name: prisma.raw('"firstName"') }
   })
   ```

4. **Remove old field**, make new required:
   ```prisma
   first_name String  // Remove firstName
   ```

5. Run migration: `npm run db:migrate`

6. **Update code** to use new field name

**Alternative:** Use `@map` to rename in database without code changes:
```prisma
firstName String @map("first_name")  // Code uses firstName, DB uses first_name
```

## Adding/Removing Indexes

### Adding Index

```prisma
model User {
  id    String @id @default(cuid())
  email String @unique
  
  @@index([email])  // Add this
}
```

**Steps:**
1. Add `@@index` to model
2. Run `npm run db:migrate`
3. Done! Index improves query performance

### Removing Index

```prisma
model User {
  id    String @id @default(cuid())
  email String @unique
  
  // @@index([email])  // Remove this
}
```

**Steps:**
1. Remove `@@index` from schema
2. Run `npm run db:migrate`
3. Done! (No data loss)

## Adding/Removing Relations

### Adding Relation

```prisma
model Post {
  id     String @id @default(cuid())
  title  String
  userId String
  user   User   @relation(fields: [userId], references: [id])  // Add this
}

model User {
  id    String @id @default(cuid())
  email String @unique
  posts Post[]  // Add this
}
```

**Steps:**
1. Add foreign key field (`userId`) and relation
2. Add reverse relation to related model
3. Run `npm run db:migrate`
4. Done!

### Removing Relation

**Steps:**
1. **Remove foreign key field** from child model:
   ```prisma
   model Post {
     // userId String  // Remove this
     // user   User    // Remove this
   }
   ```

2. **Remove reverse relation** from parent:
   ```prisma
   model User {
     // posts Post[]  // Remove this
   }
   ```

3. Run `npm run db:migrate`

4. **⚠️ Data Loss Warning:** Foreign key data will be lost!

## Production Deployment

### Deploying Migrations

```bash
# On production server or CI/CD
npx prisma migrate deploy
```

This applies all pending migrations without prompting.

### Rollback Strategy

Prisma doesn't have built-in rollback. Options:

1. **Create reverse migration:**
   ```bash
   # After problematic migration
   npm run db:migrate
   # Name it: "revert_add_problematic_field"
   # Manually write SQL to undo changes
   ```

2. **Database backup:**
   ```bash
   # Before migration
   pg_dump $DATABASE_URL > backup.sql
   
   # If needed, restore:
   psql $DATABASE_URL < backup.sql
   ```

## Best Practices

### ✅ Do's

- **Always test migrations locally** before production
- **Use migrations** (not `db:push`) for production
- **Review generated SQL** in migration files before applying
- **Backup production database** before major changes
- **Make breaking changes in steps** (optional → required, add → remove)
- **Use descriptive migration names**: `add_user_bio_field`, `remove_deprecated_api_key`

### ❌ Don'ts

- **Don't use `db:push` in production**
- **Don't edit migration files** after they've been applied
- **Don't delete migration files** (they're version history)
- **Don't skip data migration** when changing types
- **Don't remove fields** without checking code usage first

## Troubleshooting

### Migration Fails

```bash
# Reset database (⚠️ DESTRUCTIVE - development only)
npx prisma migrate reset

# This will:
# - Drop database
# - Recreate database
# - Apply all migrations
# - Run seed script (if configured)
```

### Migration Out of Sync

```bash
# Mark migration as applied without running
npx prisma migrate resolve --applied <migration_name>

# Mark migration as rolled back
npx prisma migrate resolve --rolled-back <migration_name>
```

### View Migration Status

```bash
# See which migrations are applied
npx prisma migrate status
```

## Example: Complete Field Addition Workflow

```bash
# 1. Edit schema
# Add: bio String? to User model

# 2. Create migration
npm run db:migrate
# Name: add_user_bio

# 3. Verify migration file
cat prisma/migrations/XXXXXX_add_user_bio/migration.sql

# 4. Test locally
npm run dev
# Verify new field works

# 5. Commit to git
git add prisma/schema.prisma prisma/migrations/
git commit -m "Add bio field to User model"

# 6. Deploy to production
# Migration runs automatically via CI/CD or:
npx prisma migrate deploy
```

## Additional Resources

- [Prisma Migrate Docs](https://www.prisma.io/docs/orm/prisma-migrate)
- [Prisma 7 Upgrade Guide](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7)
- [Database Migration Best Practices](https://www.prisma.io/docs/guides/migrate/production-troubleshooting)

