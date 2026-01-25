# Supabase Integration Guide

## Overview

This project uses **Supabase** as its backend database and authentication solution. Supabase is an open-source Firebase alternative that provides a PostgreSQL database with real-time capabilities, authentication, storage, and more.

## Table of Contents

- [Setup](#setup)
- [Environment Variables](#environment-variables)
- [Authentication](#authentication)
- [Database](#database)
- [Storage](#storage)
- [Common Operations](#common-operations)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Setup

### Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier available at https://supabase.com)

### Initial Setup

1. **Create a Supabase Project**
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Click "New Project"
   - Enter your project name and database password
   - Wait for the project to be provisioned

2. **Install Dependencies**
   ```bash
   npm install @supabase/supabase-js
   ```

3. **Configure Environment Variables**
   - Copy `.env.local.example` to `.env.local` (if exists) or create `.env.local`
   - Add your Supabase credentials (see [Environment Variables](#environment-variables))

4. **Verify Connection**
   ```bash
   npm run dev
   ```
   The application should connect to Supabase without errors

## Environment Variables

Supabase credentials must be prefixed with `VITE_` to be accessible in the browser:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anonymous-key
```

### Where to Find These Values

1. Go to your Supabase Dashboard
2. Navigate to **Settings → API**
3. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

### Security Notes

- ⚠️ **Never commit `.env.local` to version control**
- The anonymous key is safe to expose (it's the public API key)
- Use Row Level Security (RLS) policies to protect sensitive data
- Store sensitive operations in serverless functions

## Authentication

### Using the Auth Context

The project uses a custom `AuthContext` for authentication management:

```javascript
import { useAuth } from '@/lib/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, loading, logout } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return <div>Welcome, {user?.email}</div>;
}
```

### Common Authentication Operations

#### Sign Up
```javascript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'securePassword123',
  options: {
    data: {
      first_name: 'John',
      last_name: 'Doe'
    }
  }
});
```

#### Sign In
```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});
```

#### Sign Out
```javascript
const { error } = await supabase.auth.signOut();
```

#### Get Current Session
```javascript
const { data: { session } } = await supabase.auth.getSession();
```

#### OAuth (Google, GitHub, etc.)
```javascript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google' // or 'github', 'github', etc.
});
```

## Database

### Importing the Client

```javascript
import { supabase } from '@/api/supabase';
```

### Basic CRUD Operations

#### Create (Insert)
```javascript
const { data, error } = await supabase
  .from('users')
  .insert([
    { 
      id: '123',
      email: 'user@example.com',
      full_name: 'John Doe'
    }
  ])
  .select();
```

#### Read (Select)
```javascript
// Get all records
const { data, error } = await supabase
  .from('users')
  .select('*');

// Get specific record
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', '123')
  .single();

// Filter with conditions
const { data, error } = await supabase
  .from('users')
  .select('*')
  .gt('age', 18)
  .order('created_at', { ascending: false })
  .limit(10);
```

#### Update
```javascript
const { data, error } = await supabase
  .from('users')
  .update({ full_name: 'Jane Doe' })
  .eq('id', '123')
  .select();
```

#### Delete
```javascript
const { error } = await supabase
  .from('users')
  .delete()
  .eq('id', '123');
```

### Query Operators

- `.eq('column', 'value')` - Equal to
- `.neq('column', 'value')` - Not equal to
- `.gt('column', value)` - Greater than
- `.gte('column', value)` - Greater than or equal
- `.lt('column', value)` - Less than
- `.lte('column', value)` - Less than or equal
- `.like('column', '%pattern%')` - LIKE query
- `.in('column', [value1, value2])` - In list
- `.contains('column', ['value'])` - Contains (for arrays/JSONB)

### Real-Time Subscriptions

```javascript
const subscription = supabase
  .on(
    'postgres_changes',
    {
      event: '*', // 'INSERT', 'UPDATE', 'DELETE'
      schema: 'public',
      table: 'users'
    },
    (payload) => {
      console.log('Change received!', payload);
    }
  )
  .subscribe();

// Clean up subscription
subscription.unsubscribe();
```

## Storage

### Upload File
```javascript
const file = new File(['contents'], 'avatar.jpg');

const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`public/${user.id}/avatar.jpg`, file, {
    cacheControl: '3600',
    upsert: false
  });
```

### Download File
```javascript
const { data, error } = await supabase.storage
  .from('avatars')
  .download(`public/${user.id}/avatar.jpg`);
```

### Get Public URL
```javascript
const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl(`public/${user.id}/avatar.jpg`);

console.log(data.publicUrl);
```

### Delete File
```javascript
const { error } = await supabase.storage
  .from('avatars')
  .remove([`public/${user.id}/avatar.jpg`]);
```

## Common Operations

### Using with React Query

```javascript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabase';

// Fetch data
function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;
      return data;
    }
  });
}

// Mutate data
function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newUser) => {
      const { data, error } = await supabase
        .from('users')
        .insert([newUser])
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });
}
```

### Row Level Security (RLS)

Supabase uses RLS policies to protect data:

1. Go to **SQL Editor** in your dashboard
2. Create policies like this:

```sql
-- Allow users to read their own data
CREATE POLICY "Users can read own data"
ON users
FOR SELECT
USING (auth.uid() = id);

-- Allow users to update their own data
CREATE POLICY "Users can update own data"
ON users
FOR UPDATE
USING (auth.uid() = id);
```

### Calling Serverless Functions

```javascript
const { data, error } = await supabase.functions.invoke('function-name', {
  body: {
    key: 'value'
  }
});
```

## Best Practices

### 1. **Always Enable Row Level Security**
   - Protect sensitive data with RLS policies
   - Never rely solely on client-side filtering

### 2. **Use Serverless Functions for Sensitive Operations**
   - Store complex business logic in serverless functions
   - Use service role key only in functions, never expose to client

### 3. **Error Handling**
   ```javascript
   try {
     const { data, error } = await supabase
       .from('users')
       .select('*');
     
     if (error) throw error;
     // Handle data
   } catch (error) {
     console.error('Supabase error:', error.message);
   }
   ```

### 4. **Use Environment Variables**
   - Keep credentials in `.env.local`
   - Use `VITE_` prefix for client-side variables
   - Never hardcode credentials

### 5. **Real-Time Subscriptions**
   - Always unsubscribe when component unmounts
   - Use cleanup functions in `useEffect`

### 6. **Pagination**
   ```javascript
   const { data, error } = await supabase
     .from('posts')
     .select('*')
     .range(0, 9)  // First 10 items
     .order('created_at', { ascending: false });
   ```

### 7. **Use Transactions**
   ```javascript
   const { data, error } = await supabase.rpc('your_function_name', {
     param1: 'value1'
   });
   ```

## Troubleshooting

### Connection Issues

**Problem:** `Error: Failed to fetch`
- ✅ Check `VITE_SUPABASE_URL` format (should be `https://...`)
- ✅ Verify your Supabase project is active
- ✅ Check browser console for CORS errors

**Problem:** `Error: Auth session missing`
- ✅ User might not be authenticated
- ✅ Clear browser localStorage: `localStorage.clear()`
- ✅ Check authentication context initialization

### Database Issues

**Problem:** `Error: relation "table_name" does not exist`
- ✅ Table name is case-sensitive (use lowercase)
- ✅ Verify table exists in Supabase dashboard
- ✅ Check schema is set to `public`

**Problem:** `Error: permission denied`
- ✅ Enable Row Level Security (RLS) policies
- ✅ Check user has appropriate permissions
- ✅ Verify `auth.uid()` matches user ID in RLS policies

### Environment Variables

**Problem:** Variables are `undefined`
- ✅ Variables must start with `VITE_`
- ✅ Restart dev server after adding variables
- ✅ Check `.env.local` is in root directory
- ✅ Never use `process.env` for browser - use `import.meta.env`

**Correct Usage:**
```javascript
const url = import.meta.env.VITE_SUPABASE_URL;
```

### Storage Issues

**Problem:** `Error: The resource you requested could not be found`
- ✅ Bucket must exist (create from Storage tab)
- ✅ File path must match exactly
- ✅ Check bucket is public if file should be accessible

## Resources

- **Supabase Documentation:** https://supabase.com/docs
- **Supabase JavaScript Client:** https://supabase.com/docs/reference/javascript
- **Database Guide:** https://supabase.com/docs/guides/database
- **Authentication:** https://supabase.com/docs/guides/auth
- **Real-Time:** https://supabase.com/docs/guides/realtime
- **Storage:** https://supabase.com/docs/guides/storage

## Support

For issues or questions:
1. Check the [Supabase Documentation](https://supabase.com/docs)
2. Search [Supabase Discord Community](https://discord.supabase.com)
3. Visit [Supabase GitHub Issues](https://github.com/supabase/supabase/issues)
