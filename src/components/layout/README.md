# SGA QA System - Layout Components

This directory contains the layout components for the SGA QA System application.

## Components Overview

### 1. AppShell
Main layout wrapper that contains the sidebar, top bar, and content area.

**Features:**
- Responsive layout (mobile drawer, desktop persistent sidebar)
- Integrates with MSAL authentication
- Role-based navigation filtering
- Manages sidebar state and body scroll lock

**Usage:**
```tsx
import { AppShell } from './components/layout';

function App() {
  return (
    <AppShell>
      {/* Your page content */}
    </AppShell>
  );
}
```

### 2. Sidebar
Responsive sidebar navigation component.

**Features:**
- Displays navigation items filtered by user role
- Collapses to drawer on mobile/tablet (< 1024px)
- SGA amber color scheme (#b45309 primary, #d97706 secondary)
- Touch-friendly buttons (44px minimum height)
- Active state highlighting
- Footer with company name and version

**Props:**
- `navigationItems`: Array of navigation items
- `currentPath`: Current active path
- `isOpen`: Sidebar open state (for mobile)
- `onClose`: Callback to close sidebar

### 3. TopBar
Top navigation bar with branding and user menu.

**Features:**
- SGA logo/branding on left
- User menu dropdown with logout
- Notification bell icon with badge count
- Hamburger menu button for mobile
- User avatar with initials
- Responsive (hides user name on mobile)

**Props:**
- `userName`: Display name for logged-in user
- `onMenuClick`: Callback for hamburger menu click
- `onLogout`: Callback for logout action
- `notificationCount`: Number of unread notifications (optional)

### 4. PageContainer
Wrapper component for page content with consistent padding.

**Features:**
- Responsive padding (increases on larger screens)
- Configurable max-width
- Centered content

**Props:**
- `children`: Page content
- `maxWidth`: Maximum width ('sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full')
- `className`: Additional CSS classes (optional)

**Usage:**
```tsx
import { PageContainer } from './components/layout';

function MyPage() {
  return (
    <PageContainer maxWidth="xl">
      {/* Your content */}
    </PageContainer>
  );
}
```

### 5. PageHeader
Page header with title, breadcrumbs, and action buttons.

**Features:**
- Page title with optional description
- Breadcrumb navigation
- Action buttons area (right-aligned)
- Responsive layout (stacks on mobile)

**Props:**
- `title`: Page title
- `breadcrumbs`: Array of breadcrumb items (optional)
- `description`: Page description (optional)
- `actions`: React node for action buttons (optional)

**Usage:**
```tsx
import { PageHeader } from './components/layout';

function MyPage() {
  return (
    <PageHeader
      title="Dashboard"
      description="View your QA statistics"
      breadcrumbs={[
        { label: 'Home', path: '/' },
        { label: 'Dashboard' }
      ]}
      actions={
        <button className="px-4 py-2 bg-sga-700 text-white rounded-lg">
          New Report
        </button>
      }
    />
  );
}
```

## Color Scheme

The layout uses SGA's amber color palette:

- **Primary (sga-700)**: `#b45309` - Main brand color
- **Secondary (sga-600)**: `#d97706` - Hover states
- **Light (sga-50)**: `#fffbeb` - Backgrounds
- **Accent (sga-100)**: `#fef3c7` - Highlights

## Responsive Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1023px
- **Desktop**: ≥ 1024px

The sidebar switches to a drawer mode on mobile/tablet and becomes persistent on desktop.

## Touch-Friendly Design

All interactive elements have a minimum touch target of 44x44px as per accessibility guidelines.

Use the `min-h-touch` and `min-w-touch` Tailwind utilities for touch-friendly buttons.

## Icons

Currently using emoji icons for simplicity. These can be replaced with:
- React Icons (`react-icons`)
- Heroicons (`@heroicons/react`)
- Lucide Icons (`lucide-react`)
- Font Awesome

## Navigation Configuration

Navigation items are defined in `src/config/navigation.ts` and automatically filtered based on user role.

The `getNavigationForRole()` function handles the role-based filtering.

## Authentication Integration

The AppShell component automatically integrates with the MSAL authentication system through the `useAuth` hook.

User information is retrieved from the MSAL account object.

## Future Enhancements

- [ ] Add dark mode support
- [ ] Replace emoji icons with icon library
- [ ] Add keyboard navigation
- [ ] Add search functionality in sidebar
- [ ] Add collapsible sidebar on desktop
- [ ] Add notification dropdown
- [ ] Integrate with React Router for navigation
- [ ] Add user role selection from backend
- [ ] Add loading states
- [ ] Add error boundaries

## File Structure

```
src/components/layout/
├── AppShell.tsx          # Main layout wrapper
├── Sidebar.tsx           # Side navigation
├── TopBar.tsx            # Top navigation bar
├── PageContainer.tsx     # Content wrapper
├── PageHeader.tsx        # Page header with breadcrumbs
├── index.ts              # Barrel exports
└── README.md            # This file
```

## Example: Full Page Layout

```tsx
import { AppShell, PageContainer, PageHeader } from './components/layout';

function MyPage() {
  return (
    <AppShell>
      <PageContainer maxWidth="xl">
        <PageHeader
          title="My Page"
          description="This is a sample page"
          breadcrumbs={[
            { label: 'Home', path: '/' },
            { label: 'My Page' }
          ]}
          actions={
            <button className="px-4 py-2 bg-sga-700 text-white rounded-lg hover:bg-sga-600">
              Create New
            </button>
          }
        />

        {/* Your page content */}
        <div className="bg-white rounded-lg shadow p-6">
          <p>Page content goes here</p>
        </div>
      </PageContainer>
    </AppShell>
  );
}
```
