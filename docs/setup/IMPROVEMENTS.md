# Twiggle Frontend - Suggestions & Improvements

This document contains suggestions and improvements for the main pages and layouts in the Twiggle application.

## Overview

After reviewing all main pages and layouts, here are recommendations organized by area:

---

## 1. Root Layout (`src/app/layout.tsx`)

### Current State
- Basic layout with SessionProvider
- Metadata updated with proper description
- Font configuration (Geist Sans & Mono)

### Suggestions

1. **Add Error Boundary**
   - Implement error boundary for better error handling
   - Show user-friendly error messages instead of blank screens

2. **Add Loading States**
   - Consider adding a global loading indicator for initial page loads
   - Could use Suspense boundaries for better UX

3. **Accessibility**
   - Ensure proper ARIA labels
   - Add skip-to-content link for keyboard navigation

4. **SEO Improvements**
   - Add Open Graph metadata
   - Add Twitter Card metadata
   - Add favicon configuration

---

## 2. Home Page (`src/app/page.tsx`)

### Current State
- Interactive "untangle puzzle" game showcasing features
- Uses React Flow for visualization
- Shows project messages in nodes

### Suggestions

1. **Performance Optimization**
   - Memoize the `generatePuzzle` function to avoid regenerating on every render
   - Consider lazy loading React Flow components
   - Add debouncing for node position updates

2. **User Experience**
   - Add instructions/tooltip explaining the puzzle game
   - Show completion state when puzzle is solved
   - Add "New Puzzle" button to regenerate
   - Consider adding difficulty levels

3. **Code Organization**
   - Extract puzzle logic into a separate hook (`useUntanglePuzzle`)
   - Move `ProjectNode` component to separate file
   - Extract `doLinesIntersect` to utility file

4. **Accessibility**
   - Add keyboard navigation for nodes
   - Add ARIA labels for interactive elements
   - Ensure color contrast meets WCAG standards

5. **Mobile Responsiveness**
   - Test and optimize for touch interactions
   - Adjust node sizes for smaller screens
   - Consider simplified view for mobile

---

## 3. Dashboard Layout (`src/app/dashboard/layout.tsx`)

### Current State
- Simple layout with sidebar and content area
- Uses DashboardSidebar component

### Suggestions

1. **Layout Improvements**
   - Add responsive sidebar (collapsible on mobile)
   - Add breadcrumb navigation
   - Consider adding a header bar with user info

2. **Error Handling**
   - Add error boundary specific to dashboard
   - Handle sidebar loading errors gracefully

3. **Performance**
   - Consider lazy loading sidebar content
   - Add skeleton loaders for initial render

---

## 4. Dashboard Page (`src/app/dashboard/page.tsx`)

### Current State
- Shows user projects in grid/list view
- Filter tabs (recently-viewed, shared-files, shared-projects)
- Dropdown filters (organizations, files, last viewed)
- Create new project button

### Suggestions

1. **Functionality Gaps**
   - Filter tabs don't actually filter (no implementation)
   - Dropdown filters are non-functional
   - "Recently viewed" tracking not implemented
   - "Shared files/projects" not implemented

2. **UI/UX Improvements**
   - Add search functionality for projects
   - Add sorting options (by name, date, etc.)
   - Add pagination or infinite scroll for many projects
   - Show project thumbnails/previews
   - Add empty state illustrations

3. **Performance**
   - Add optimistic updates when creating projects
   - Implement proper loading states (skeleton loaders)
   - Add error retry mechanism with exponential backoff
   - Consider caching projects data

4. **Code Quality**
   - Extract filter logic into custom hook
   - Create separate components for filter tabs and dropdowns
   - Add TypeScript types for filter states
   - Consider using React Query for data fetching

5. **Accessibility**
   - Add keyboard shortcuts (e.g., 'n' for new project)
   - Ensure filter buttons are keyboard accessible
   - Add screen reader announcements for state changes

6. **Features to Implement**
   - Project search/filter
   - Project tags/categories
   - Bulk actions (delete multiple, etc.)
   - Project templates
   - Recent projects tracking

---

## 5. Dashboard New Project Page (`src/app/dashboard/new/page.tsx`)

### Current State
- Simple form to create new project
- Redirects to leaflet page after creation

### Suggestions

1. **Form Enhancements**
   - Add project template selection
   - Add project description field (currently empty string)
   - Add validation feedback (visual indicators)
   - Add character limits with counters

2. **User Experience**
   - Add project preview before creation
   - Show recent project names as suggestions
   - Add keyboard shortcut (Enter to submit, Esc to cancel)
   - Add loading state during creation

3. **Error Handling**
   - Better error messages (network errors, validation errors)
   - Retry mechanism for failed requests
   - Show specific error for duplicate project names

4. **Code Quality**
   - Extract form logic into custom hook
   - Add form validation library (e.g., Zod, Yup)
   - Add proper TypeScript types

---

## 6. Leaflet Layout (`src/app/leaflet/[twigId]/layout.tsx`)

### Current State
- Empty layout (just returns children)

### Suggestions

1. **Consider Removing**
   - If not needed, remove the layout file entirely
   - Next.js will use parent layout automatically

2. **Or Add Functionality**
   - If keeping, add shared state management
   - Add error boundary for leaflet pages
   - Add loading states

---

## 7. Leaflet Page (`src/app/leaflet/[twigId]/page.tsx`)

### Current State
- Shows project name in top nav
- Has sidebar and canvas
- Fetches project data on mount

### Suggestions

1. **Error Handling**
   - Better 404 handling (project not found)
   - Handle permission errors (unauthorized access)
   - Show error state in UI instead of console.error

2. **Performance**
   - Add loading skeleton for project name
   - Consider prefetching project data
   - Cache project data to avoid refetching

3. **User Experience**
   - Add "Project not found" page with redirect option
   - Show project loading state
   - Add error retry button

4. **Code Quality**
   - Extract project fetching into custom hook
   - Add proper error types
   - Consider using React Query for data fetching

5. **Features**
   - Add project settings/edit from this page
   - Add share project functionality
   - Add project history/versioning

---

## 8. Project Page (`src/app/project/[id]/page.tsx`)

### Current State
- Edit project title and description
- Save/delete functionality
- Shows creation/update timestamps
- Has TODO comment for project content editor

### Suggestions

1. **Complete the TODO**
   - Implement project content editor
   - Add rich text editor or markdown support
   - Add file attachments
   - Add project notes/comments

2. **Form Improvements**
   - Add auto-save functionality (debounced)
   - Show "unsaved changes" warning on navigation
   - Add form validation
   - Add character limits

3. **User Experience**
   - Add confirmation dialog for delete (already has confirm, but could be better styled)
   - Show success message after save
   - Add undo/redo functionality
   - Add keyboard shortcuts (Ctrl+S to save)

4. **Error Handling**
   - Better error messages
   - Handle concurrent edits (optimistic locking)
   - Show conflict resolution UI

5. **Code Quality**
   - Extract form logic into custom hook
   - Add proper TypeScript types
   - Consider using React Hook Form
   - Extract API calls into service layer

6. **Features to Add**
   - Project versioning/history
   - Project sharing/collaboration
   - Project templates
   - Export project data
   - Project tags/categories

---

## 9. User Page (`src/app/user/page.tsx`)

### Current State
- Shows user profile (name, email, image)
- Login/logout button

### Suggestions

1. **Feature Enhancements**
   - Add user settings (preferences, notifications)
   - Add account management (change email, password if email/password auth added)
   - Add user statistics (projects count, files uploaded, etc.)
   - Add activity history

2. **UI Improvements**
   - Better profile layout
   - Add edit profile functionality
   - Add profile picture upload
   - Show account creation date

3. **Code Quality**
   - Extract profile display into separate component
   - Add loading states
   - Add error handling

---

## 10. General Improvements Across All Pages

### Consistency

1. **Loading States**
   - Standardize loading indicators across all pages
   - Use consistent skeleton loaders
   - Add loading states for all async operations

2. **Error Handling**
   - Implement consistent error boundary pattern
   - Standardize error message display
   - Add error logging/monitoring (e.g., Sentry)

3. **Styling**
   - Ensure consistent color scheme (some pages use `#7BA4F4`, others use `blue-600`)
   - Standardize button styles
   - Consistent spacing and typography

4. **Accessibility**
   - Add proper ARIA labels throughout
   - Ensure keyboard navigation works everywhere
   - Test with screen readers
   - Ensure color contrast meets WCAG AA standards

5. **Performance**
   - Add code splitting for routes
   - Implement proper caching strategies
   - Optimize images (use Next.js Image component)
   - Add performance monitoring

6. **TypeScript**
   - Add stricter TypeScript configuration
   - Ensure all components have proper types
   - Add type guards for API responses

7. **Testing**
   - Add unit tests for components
   - Add integration tests for pages
   - Add E2E tests for critical flows

8. **Documentation**
   - Add JSDoc comments for complex functions
   - Document component props
   - Add architecture decision records (ADRs)

---

## Priority Recommendations

### High Priority
1. ✅ Fix non-functional filter tabs and dropdowns in dashboard
2. ✅ Implement proper error handling across all pages
3. ✅ Add loading states consistently
4. ✅ Complete the TODO in project page (content editor)
5. ✅ Standardize color scheme and styling

### Medium Priority
1. Add search functionality to dashboard
2. Implement project templates
3. Add auto-save to project edit page
4. Add keyboard shortcuts
5. Improve mobile responsiveness

### Low Priority
1. Add project versioning
2. Add collaboration features
3. Add analytics/monitoring
4. Add comprehensive testing
5. Add advanced accessibility features

---

## Code Organization Suggestions

1. **Create Custom Hooks**
   - `useProjects.ts` - Project data fetching and mutations
   - `useProject.ts` - Single project data
   - `useUntanglePuzzle.ts` - Puzzle game logic
   - `useAutoSave.ts` - Auto-save functionality

2. **Create Service Layer**
   - `api/projects.ts` - Project API calls
   - `api/files.ts` - File API calls
   - `api/auth.ts` - Auth utilities

3. **Create Shared Components**
   - `LoadingSpinner.tsx` - Consistent loading indicator
   - `ErrorBoundary.tsx` - Error boundary component
   - `ConfirmDialog.tsx` - Reusable confirmation dialog
   - `EmptyState.tsx` - Empty state component

4. **Create Utility Functions**
   - `utils/validation.ts` - Form validation
   - `utils/formatting.ts` - Date/number formatting
   - `utils/errors.ts` - Error handling utilities

---

## Notes

- All pages use client components ("use client") - consider if any can be server components
- Authentication checks are duplicated across pages - consider middleware or HOC
- API error handling is inconsistent - standardize error responses
- Some pages fetch data in useEffect - consider using React Query or SWR
- Color values are hardcoded - consider using CSS variables or theme configuration

