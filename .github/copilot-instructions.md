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

## Common Pitfalls to Avoid

- Don't modify files in `src/components/ui/` - these are managed by shadcn/ui
- Don't modify files in `src/lib/` as they are excluded from linting
- Don't forget to use the `@/` alias for imports
- Don't use `React.` prefix for hooks (imports not needed)
- Don't create new CSS files; use Tailwind utilities
- Always check authentication before accessing protected features
- Don't commit `.env.local` file

## Dependencies

- When adding new dependencies, prefer packages that work well with React 18 and Vite
- Check compatibility with the existing ESM module system
- Use npm for package management (npm install, not yarn or pnpm)

## Documentation

- Keep this file updated as conventions evolve
- Document complex business logic with JSDoc comments
- Use inline comments sparingly; prefer self-documenting code
