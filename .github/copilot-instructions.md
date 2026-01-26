# Copilot Instructions for The Exit Blueprint

## Project Overview

This is a React-based SaaS application called "The Exit Blueprint" that helps entrepreneurs plan and execute business exits. The application provides various stages of exit planning including Oracle, Architect, Engine, Quant, and Exit stages with features like risk analysis, business plan generation, decision assistance, and investor outreach.

## Tech Stack

- **Frontend Framework**: React 18 with JSX
- **Build Tool**: Vite 6
- **Routing**: React Router v6
- **UI Library**: Radix UI components with shadcn/ui
- **Styling**: Tailwind CSS 3.4 with tailwindcss-animate
- **State Management**: TanStack Query (React Query) v5
- **Form Handling**: React Hook Form with Zod validation
- **Backend Integration**: Supabase (@supabase/supabase-js)
- **Analytics**: Vercel Analytics and Speed Insights
- **Other Key Libraries**: Framer Motion, Recharts, React Markdown, Lucide React icons

## Code Structure

- `/src/pages/` - Main application pages/routes
- `/src/components/` - Reusable React components
- `/src/components/ui/` - shadcn/ui components (do not lint these)
- `/src/lib/` - Utility functions and shared libraries
- `/src/api/` - API integration files (Supabase)
- `/src/hooks/` - Custom React hooks
- `/src/utils/` - Utility functions
- `/functions/` - Serverless functions

## File Organization Guidelines

### Component Structure

- Each component file should export one primary component
- Group related components in subdirectories when appropriate
- Co-locate component-specific utilities in the same directory
- Use index files for cleaner imports from directories

### File Naming

- Components: `ComponentName.jsx` (PascalCase)
- Utilities: `utilityName.js` (camelCase)
- Hooks: `useHookName.js` (camelCase starting with 'use')
- Constants: `CONSTANTS.js` (UPPER_SNAKE_CASE)
- API files: `apiName.js` (camelCase)

### Import Order

1. External dependencies (React, libraries)
2. Internal components
3. Hooks
4. Utilities and helpers
5. Types/constants
6. Styles (if any)

Example:
```javascript
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/lib/AuthContext';
import { formatCurrency } from '@/utils/formatters';
import { API_ENDPOINTS } from '@/utils/constants';
```

## Coding Conventions

### JavaScript/React

- Use modern ES6+ JavaScript syntax
- Use JSX file extension for React components
- Prefer functional components with hooks over class components
- Use arrow functions for component definitions
- No React imports needed in JSX files (React 18+ automatic JSX transform)
- Use destructuring for props when possible

### Naming

- Components: PascalCase (e.g., `UserProfile.jsx`)
- Files: PascalCase for components, camelCase for utilities
- Variables and functions: camelCase
- Constants: UPPER_SNAKE_CASE
- CSS classes: Tailwind utility classes

### React Best Practices

- Always use `useAuth()` hook from `@/lib/AuthContext` for authentication
- Use `@/` path alias for imports from the `src/` directory
- Prefer React Query for data fetching and caching
- Use React Hook Form for complex forms
- Implement proper loading and error states
- Use React Router's navigation hooks for routing

### Styling

- Use Tailwind CSS utility classes for styling
- Follow the established design system with CSS variables (e.g., `hsl(var(--primary))`)
- Use shadcn/ui components from `/src/components/ui/` when available
- Prefer composition over creating new UI components
- Use `cn()` utility from `@/lib/utils` for conditional classes

### State Management

- Use TanStack Query for server state
- Use React hooks (useState, useReducer) for local component state
- Use Context API sparingly for truly global state (auth, theme)

### Forms

- Use React Hook Form for form management
- Use Zod for form validation schemas
- Integrate with `@hookform/resolvers` for validation

## Linting and Code Quality

### ESLint Configuration

- ESLint is configured with `eslint.config.js`
- Only certain directories are linted: `src/components/`, `src/pages/`, `src/Layout.jsx`
- Excluded from linting: `src/lib/`, `src/components/ui/`
- Rules enforced:
  - No unused imports (via `eslint-plugin-unused-imports`)
  - React hooks rules
  - No prop-types required (using TypeScript JSDoc for types)
  - React 18+ (no React in JSX scope needed)

### Running Linting

```bash
npm run lint        # Run linter
npm run lint:fix    # Auto-fix linting issues
```

### Type Checking

- Uses JSDoc comments for type hints
- TypeScript is available for type checking via `jsconfig.json`
- Run: `npm run typecheck`

## Build and Development

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run preview  # Preview production build
```

## Testing

- No test framework is currently configured
- When adding tests, ensure they work with Vite and React

## Environment Variables

- Uses `.env.local` for local development
- Required variables:
  - `VITE_SUPABASE_URL` - Supabase project URL
  - `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- All environment variables must be prefixed with `VITE_` to be accessible

## Key Patterns

### Authentication

```javascript
import { useAuth } from '@/lib/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, navigateToLogin } = useAuth();
  // Use authentication state
}
```

### Data Fetching with Supabase

```javascript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabase';

const { data, isLoading, error } = useQuery({
  queryKey: ['businesses'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('business_core')
      .select('*')
      .order('created_date', { ascending: false });
    if (error) throw error;
    return data;
  }
});
```

### Navigation

```javascript
import { useNavigate, Link } from 'react-router-dom';

function MyComponent() {
  const navigate = useNavigate();
  // Use navigate('/path') or <Link to="/path">
}
```

### Error Handling

```javascript
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

// Query with error handling
const { data, isLoading, error } = useQuery({
  queryKey: ['businesses', id],
  queryFn: fetchBusiness,
  onError: (error) => {
    toast.error('Failed to load business data');
    console.error('Business fetch error:', error);
  }
});

// Mutation with error handling
const mutation = useMutation({
  mutationFn: updateBusiness,
  onSuccess: () => {
    toast.success('Business updated successfully');
  },
  onError: (error) => {
    toast.error('Failed to update business');
    console.error('Update error:', error);
  }
});
```

### Loading States

```javascript
function MyComponent() {
  const { data, isLoading, error } = useQuery({...});

  if (isLoading) {
    return <div>Loading...</div>; // Or use a Skeleton component
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return <div>{/* Render data */}</div>;
}
```

## Common Pitfalls to Avoid

- Don't modify files in `src/components/ui/` - these are managed by shadcn/ui
- Don't modify files in `src/lib/` as they are excluded from linting
- Don't forget to use the `@/` alias for imports
- Don't use `React.` prefix for hooks (imports not needed)
- Don't create new CSS files; use Tailwind utilities
- Always check authentication before accessing protected features
- Don't commit `.env.local` file

## Performance Best Practices

- Use React Query's caching to avoid unnecessary API calls
- Implement pagination for large data sets
- Use React.memo() for expensive components that receive the same props
- Lazy load routes and components with React.lazy() and Suspense
- Optimize images: use appropriate formats and sizes
- Debounce search inputs and frequent operations
- Use the `useMemo` and `useCallback` hooks appropriately to prevent unnecessary re-renders

## When to Use Specific Libraries

- **Framer Motion**: Use for complex animations and page transitions
- **Recharts**: Use for data visualization and charts
- **React Markdown**: Use for rendering markdown content (e.g., AI responses)
- **React Hook Form**: Use for all forms with validation
- **Zod**: Use for schema validation in forms and API responses
- **TanStack Query**: Use for all server state management (fetching, caching, updating)
- **Lucide React**: Use for icons throughout the application
- **Sonner**: Use for toast notifications
- **Canvas Confetti**: Use for celebration effects (e.g., successful exits)

## Dependencies

- When adding new dependencies, prefer packages that work well with React 18 and Vite
- Check compatibility with the existing ESM module system
- Use npm for package management (npm install, not yarn or pnpm)

## Accessibility Guidelines

- Use semantic HTML elements (button, nav, main, etc.)
- Ensure all interactive elements are keyboard accessible
- Provide meaningful aria-labels for icons and actions
- Use proper heading hierarchy (h1, h2, h3, etc.)
- Ensure sufficient color contrast for text and UI elements
- Include alt text for images
- Use focus indicators for keyboard navigation
- Radix UI components are already accessible, but ensure proper implementation

## UI/UX Patterns

- Provide immediate feedback for user actions (loading states, success/error messages)
- Use consistent spacing and sizing from Tailwind's design tokens
- Follow the established color scheme using CSS variables
- Implement responsive design: mobile-first approach
- Use skeleton loaders for better perceived performance
- Maintain consistent navigation patterns across pages
- Group related actions and information logically

## Git Workflow

### Branching Strategy

- Main branch: `main` - production-ready code
- Feature branches: Use descriptive names (e.g., `feature/user-authentication`, `fix/navigation-bug`)
- Keep branches focused on a single feature or fix

### Commit Messages

- Use conventional commits format: `type(scope): description`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- Examples:
  - `feat(auth): add social login with Google`
  - `fix(dashboard): correct data loading state`
  - `docs(readme): update installation instructions`

### Pull Requests

- Create focused PRs that address a single concern
- Include a clear description of changes and why they were made
- Reference any related issues
- Ensure all checks pass before requesting review

## Security Best Practices

- Never commit secrets, API keys, or credentials to the repository
- Always use environment variables for sensitive data
- Validate and sanitize user inputs
- Use prepared statements or parameterized queries when working with databases
- Keep dependencies up to date to avoid known vulnerabilities
- Follow the principle of least privilege for authentication and authorization
- Use HTTPS for all external API calls

## Deployment

- Production deployment is handled via Vercel
- Preview deployments are automatically created for PRs
- Environment variables must be configured in Vercel dashboard
- Serverless functions in `/functions/` are deployed as edge functions

## Documentation

- Keep this file updated as conventions evolve
- Document complex business logic with JSDoc comments
- Use inline comments sparingly; prefer self-documenting code
- Update API documentation when endpoints change
