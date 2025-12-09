# Code Structure Guide

This guide explains the organization of the `/src` directory to help developers understand the codebase and make changes effectively.

## Overview

The Twiggle Frontend is built with **Next.js 16** using the **App Router**, **TypeScript**, and **React Flow** for the canvas interface. The codebase follows a modular structure with clear separation of concerns.

## Directory Structure

```
src/
├── app/                    # Next.js App Router (pages & API routes)
│   ├── api/                # API route handlers
│   ├── dashboard/          # Dashboard pages
│   ├── leaflet/            # Canvas/Workflow pages
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── components/             # React components
│   ├── auth/               # Authentication components
│   ├── canvas/             # Canvas/Workflow components
│   ├── dashboard/          # Dashboard components
│   ├── navigation/         # Navigation components
│   ├── providers/          # React context providers
│   ├── sidebar/            # Sidebar components
│   └── ui/                 # Reusable UI components
├── lib/                    # Utility functions and helpers
├── types/                  # TypeScript type definitions
└── middleware.ts           # Next.js middleware
```

---

## `/src/app` - Next.js App Router

The `app` directory contains all pages and API routes using Next.js App Router conventions.

### API Routes (`/app/api`)

API routes handle server-side logic and database operations.

#### Authentication (`/app/api/auth/[...nextauth]/route.ts`)
- **Purpose**: NextAuth.js authentication configuration
- **Key Features**:
  - Google OAuth provider setup
  - Prisma adapter for session management
  - Session callbacks for user data
- **When to modify**: Adding new auth providers, changing session logic

#### Files API (`/app/api/files`)
- **`/upload/route.ts`**: Handle file uploads to Google Cloud Storage
- **`/[fileId]/route.ts`**: Get, download, or delete files
- **`/create/route.ts`**: Create new files in GCS
- **Key Features**:
  - File size validation
  - Storage limit checking
  - GCS integration
- **When to modify**: Changing file upload logic, adding file operations

#### Projects API (`/app/api/projects`)
- **`/route.ts`**: List and create projects
- **`/[id]/route.ts`**: Get, update, or delete a project
- **`/[id]/workflow/route.ts`**: Save/load workflow data
- **Key Features**:
  - Project CRUD operations
  - Workflow persistence (JSON storage in GCS)
  - Access control
- **When to modify**: Adding project features, changing workflow storage

#### Storage API (`/app/api/storage/route.ts`)
- **Purpose**: Get user storage usage statistics
- **Returns**: Total storage used, limit, percentage

#### Users API (`/app/api/users/profile-picture/route.ts`)
- **Purpose**: Upload and manage user profile pictures

### Pages (`/app`)

#### Home Page (`/app/page.tsx`)
- Landing page with authentication
- Redirects authenticated users to dashboard

#### Dashboard (`/app/dashboard`)
- **`/page.tsx`**: Project list view
- **`/new/page.tsx`**: Create new project
- **`/layout.tsx`**: Dashboard layout with sidebar and navigation

#### Leaflet/Canvas (`/app/leaflet/[twigId]`)
- **`/page.tsx`**: Main canvas/workflow editor
- **`/layout.tsx`**: Canvas-specific layout
- **Purpose**: Interactive node-based workflow editor

### Layouts

#### Root Layout (`/app/layout.tsx`)
- Wraps entire application
- Includes global styles, fonts, and providers

---

## `/src/components` - React Components

Reusable React components organized by feature area.

### Authentication (`/components/auth`)

- **`LoginButton.tsx`**: Sign-in button component
- **`LoginModal.tsx`**: Authentication modal
- **`UserProfileDropdown.tsx`**: User menu dropdown
- **`UserProfileModal.tsx`**: Profile management modal

**When to modify**: Changing authentication UI, adding user profile features

### Canvas (`/components/canvas`)

The canvas system is the core of Twiggle's workflow editor.

#### Main Components

- **`NodeCanvas.tsx`**: Main canvas component using React Flow
  - Handles node/edge state
  - Drag and drop functionality
  - Keyboard shortcuts
  - Workflow persistence

- **`NodeView.tsx`**: Node rendering and interaction
- **`ResizablePanels.tsx`**: Resizable sidebar panels for node templates

#### Node Components (`/components/canvas/nodes`)

- **`TwiggleNodeCard.tsx`**: Main node card component
  - Renders different node types (FileUpload, FileCreate, FileOutput, Agent)
  - Handles node interactions
  - Manages preview windows

- **`PreviewWindow.tsx`**: Popout window for file previews
- **`nodeTemplates.ts`**: Node type definitions and templates

#### Node Sub-components (`/components/canvas/nodes/components`)

- **`FileUploadNode.tsx`**: File upload node UI
- **`FileCreateNode.tsx`**: File creation node UI
- **`FileOutputNode.tsx`**: File output/preview node
- **`AgentNode.tsx`**: AI agent node UI
- **`FileInfoDisplay.tsx`**: File metadata display
- **`NodeActionButtons.tsx`**: Node action buttons (remove, minimize, etc.)
- **`RemoveConfirmDialog.tsx`**: Confirmation dialog for node removal
- **`ToastMessage.tsx`**: Toast notifications

#### Canvas Hooks (`/components/canvas/hooks`)

Custom hooks for canvas functionality:

- **`useCanvasNodes.ts`**: Node state management
  - Add/remove nodes
  - Node callbacks
  - File change handling

- **`useCanvasEdges.ts`**: Edge/connection management
  - Create/delete edges
  - Edge validation

- **`useCanvasKeyboard.ts`**: Keyboard shortcuts
  - Delete key handling
  - Edge deletion shortcuts

- **`useDraggableWindow.ts`**: Draggable preview window logic
  - Window positioning
  - Resize functionality
  - Maximize/minimize

- **`useFileOperations.ts`**: File operations (upload, create, fetch)
  - GCS integration
  - File state management

- **`useWorkflowPersistence.ts`**: Save/load workflow data
  - Auto-save functionality
  - Workflow loading
  - Unsaved changes tracking

#### Canvas Types (`/components/canvas/types.ts`)

TypeScript definitions for:
- `TwiggleNode`: Node data structure
- `TwiggleNodeData`: Node type-specific data
- `UploadedFileMeta`: File metadata

**When to modify**: Adding new node types, changing canvas behavior, workflow features

### Dashboard (`/components/dashboard`)

- **`ProjectCard.tsx`**: Project card component for project list

### Navigation (`/components/navigation`)

- **`HomeTopNav.tsx`**: Top navigation for home page
- **`LeafletTopNav.tsx`**: Top navigation for canvas page

### Sidebar (`/components/sidebar`)

- **`DashboardSidebar.tsx`**: Sidebar for dashboard
- **`LeafletSidebar.tsx`**: Sidebar for canvas (node templates)

### UI Components (`/components/ui`)

- **`button.tsx`**: Reusable button component
- More UI components can be added here (modals, inputs, etc.)

### Providers (`/components/providers`)

- **`SessionProvider.tsx`**: NextAuth session provider wrapper

---

## `/src/lib` - Utility Functions

Shared utility functions and helpers used throughout the application.

### Core Utilities

- **`prisma.ts`**: Prisma Client setup
  - Database connection
  - Prisma 7 adapter pattern
  - Singleton pattern for development

- **`api-utils.ts`**: API helper functions
  - `requireAuth()`: Authentication middleware
  - `verifyProjectAccess()`: Project access control
  - `checkStorageLimit()`: Storage quota checking
  - `calculateStorageUsage()`: Storage calculation
  - `handleApiError()`: Error handling

- **`gcs.ts`**: Google Cloud Storage utilities
  - Storage instance initialization
  - File upload/download
  - Bucket configuration

- **`file-utils.ts`**: File operation helpers
  - File name generation
  - File type detection
  - GCS file operations

- **`canvasActions.ts`**: Canvas action dispatchers
  - Custom events for canvas operations
  - Node addition events
  - File warning events

- **`colors.ts`**: Color palette and utilities
  - Centralized color definitions
  - Color utilities (lighten, darken)
  - Palette management

- **`env.ts`**: Environment variable validation
  - Type-safe env access
  - Required env checking

**When to modify**: Adding shared utilities, changing database access patterns, updating color scheme

---

## `/src/types` - Type Definitions

TypeScript type definitions for the application.

- **`next-auth.d.ts`**: NextAuth type extensions
  - Extends session types
  - Adds custom user properties

**When to modify**: Adding new types, extending existing types, type definitions for new features

---

## `/src/middleware.ts` - Next.js Middleware

- **Purpose**: Route protection and authentication
- **Functionality**: Redirects unauthenticated users, protects routes
- **When to modify**: Changing auth requirements, adding route guards

---

## Key Patterns & Conventions

### Component Organization

1. **Feature-based grouping**: Components are grouped by feature (auth, canvas, dashboard)
2. **Co-location**: Related files are kept together (hooks with components)
3. **Separation of concerns**: UI components separate from business logic

### State Management

- **React hooks**: Custom hooks for complex state logic
- **React Flow state**: Canvas state managed by React Flow hooks
- **Server state**: Prisma for database operations
- **Client state**: React useState/useReducer for UI state

### File Naming

- **Components**: PascalCase (e.g., `NodeCanvas.tsx`)
- **Utilities**: camelCase (e.g., `api-utils.ts`)
- **Types**: camelCase with `.d.ts` extension (e.g., `next-auth.d.ts`)
- **Hooks**: camelCase with `use` prefix (e.g., `useCanvasNodes.ts`)

### Import Patterns

```typescript
// External libraries
import { useState } from "react"
import { PrismaClient } from "@prisma/client"

// Internal utilities (absolute imports)
import { prisma } from "@/lib/prisma"
import { colors } from "@/lib/colors"

// Relative imports (same directory)
import { TwiggleNodeCard } from "./nodes/TwiggleNodeCard"
```

---

## Making Changes

### Adding a New Node Type

1. **Define node template** in `components/canvas/nodeTemplates.ts`
2. **Create node component** in `components/canvas/nodes/components/`
3. **Add to TwiggleNodeCard** switch statement
4. **Update types** in `components/canvas/types.ts`

### Adding a New API Route

1. **Create route file** in `app/api/[route-name]/route.ts`
2. **Use utilities** from `lib/api-utils.ts` for auth/errors
3. **Use Prisma** from `lib/prisma.ts` for database access
4. **Follow Next.js App Router** conventions

### Adding a New Page

1. **Create page file** in `app/[route-name]/page.tsx`
2. **Add layout** if needed in `app/[route-name]/layout.tsx`
3. **Use components** from `components/` directory
4. **Follow existing patterns** for styling and structure

### Modifying Database Schema

1. **Update schema** in `prisma/schema.prisma`
2. **Create migration**: `npm run db:migrate`
3. **Update Prisma Client**: Automatically runs on migration
4. **Update types**: TypeScript types auto-generated

---

## Common Tasks

### Finding Where Code Lives

- **API endpoints**: `src/app/api/`
- **Pages**: `src/app/`
- **Components**: `src/components/`
- **Database queries**: Look for `prisma.` in `src/app/api/` or `src/lib/`
- **Canvas logic**: `src/components/canvas/`
- **File operations**: `src/lib/file-utils.ts` and `src/lib/gcs.ts`

### Debugging Tips

1. **Check browser console** for client-side errors
2. **Check terminal** for server-side errors
3. **Use Prisma Studio**: `npm run db:studio` to inspect database
4. **Check network tab** for API request/response issues
5. **Use React DevTools** for component debugging

---

## Additional Resources

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [React Flow Docs](https://xyflow.com/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [NextAuth.js Docs](https://next-auth.js.org/)

---

## Questions?

If you're unsure where to make a change:
1. Search the codebase for similar functionality
2. Check existing patterns in related files
3. Review this guide for the appropriate directory
4. Ask the team for guidance

