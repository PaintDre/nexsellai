

# Plan: User Roles & Permissions System + Admin/Super Admin Panels

## Overview
Implement a role-based permission system using a separate `user_roles` table (per security best practices), keeping the existing `plan` on `profiles` for usage limits. Create admin and super admin dashboards with backend-enforced access control.

## 1. Database Changes (Migration)

### Create role enum and user_roles table
```sql
CREATE TYPE public.app_role AS ENUM ('user', 'admin', 'super_admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
```

### Security definer function to check roles (avoids RLS recursion)
```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
```

### RLS policies on user_roles
- Users can read their own roles
- Admins/super_admins can read all roles
- Only super_admins can insert/update/delete roles

### Auto-assign 'user' role on signup (trigger)
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();
```

### RLS policies for admin access to profiles table
- Add policy: admins/super_admins can SELECT all profiles
- Add policy: admins/super_admins can UPDATE plan on profiles

### Create system_config table (for super_admin)
```sql
CREATE TABLE public.system_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);
-- RLS: only super_admin can read/write
```

## 2. Backend: Edge Function for Admin Operations

Create `supabase/functions/admin-api/index.ts` for server-side permission checks:
- `GET /users` — list users (admin+)
- `PATCH /users/:id/plan` — change plan (admin+)
- `PATCH /users/:id/role` — change role (super_admin only)
- `PATCH /users/:id/deactivate` — deactivate account (admin+)
- `GET /stats` — platform statistics (admin+)
- `GET /config` — system config (super_admin)
- `PUT /config` — update config (super_admin)

All endpoints verify the caller's role server-side using `has_role()`.

## 3. Frontend: Auth Hook Updates

### Update `useAuth.tsx`
- Fetch user role from `user_roles` table after login
- Expose `role` in AuthContext
- Add helper: `isAdmin()`, `isSuperAdmin()`

## 4. Frontend: Route Protection

### Create `AdminRoute` component
- Wraps admin pages, checks role is `admin` or `super_admin`
- Redirects to `/dashboard` if unauthorized

### Create `SuperAdminRoute` component
- Wraps super admin pages, checks role is `super_admin`

### New routes in `App.tsx`
```
/admin          → AdminDashboard (admin+)
/admin/users    → AdminUsers (admin+)
/admin/config   → SuperAdminConfig (super_admin only)
```

## 5. Frontend: Admin Dashboard Page

### `src/pages/AdminDashboard.tsx`
- Stats cards: total users, total landings, users by plan
- Recent activity table
- Quick links to user management

### `src/pages/AdminUsers.tsx`
- Table of all users (name, email, plan, role, landings_used, created_at)
- Actions: change plan (dropdown), deactivate (button)
- Super admin sees: change role dropdown

## 6. Frontend: Super Admin Config Page

### `src/pages/SuperAdminConfig.tsx`
- Edit AI system prompt (textarea)
- Adjust plan limits (free/starter/pro landing counts)
- View API usage stats
- System logs viewer

## 7. Sidebar Updates

### `AppSidebar.tsx`
- Show "Admin" nav item only if role is admin or super_admin
- Show "Configuración del sistema" only if super_admin

## Files to Create
- `src/pages/AdminDashboard.tsx`
- `src/pages/AdminUsers.tsx`
- `src/pages/SuperAdminConfig.tsx`
- `src/components/AdminRoute.tsx`
- `supabase/functions/admin-api/index.ts`

## Files to Modify
- `src/hooks/useAuth.tsx` — add role fetching
- `src/App.tsx` — add admin routes
- `src/components/AppSidebar.tsx` — conditional admin nav items
- `src/components/ProtectedRoute.tsx` — no changes needed (existing works)

## Security Summary
- Roles stored in separate `user_roles` table (not on profiles)
- `has_role()` security definer function prevents RLS recursion
- All admin operations verified server-side via edge function
- Frontend checks are UX-only; real enforcement is backend RLS + edge function auth

