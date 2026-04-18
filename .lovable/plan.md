
Plan: harden `fetchRole` in `src/hooks/useAuth.tsx` with robust error handling.

Scope: single function `fetchRole` in `src/hooks/useAuth.tsx` (lines ~88-103). No other code touched.

Changes:
1. Wrap entire body in `try/catch`.
2. Destructure `{ data, error }` from the `user_roles` select.
3. On `error`: `console.error("Error fetching user roles:", error)` + `setRole("user")` + `return`.
4. On valid `data` with length > 0: keep current role-priority mapping (super_admin > admin > user).
5. On empty/missing `data`: `setRole("user")`.
6. `catch (err)`: `console.error("Unexpected error in fetchRole:", err)` + `setRole("user")`.

Resulting shape:

```text
fetchRole(userId)
├── try
│   ├── { data, error } = supabase.from('user_roles').select('role').eq(...)
│   ├── if (error) → console.error + setRole("user") + return
│   ├── if (data && data.length > 0)
│   │     ├── roles = data.map(r => r.role)
│   │     ├── if includes super_admin → setRole("super_admin")
│   │     ├── else if includes admin → setRole("admin")
│   │     └── else → setRole("user")
│   └── else → setRole("user")
└── catch (err) → console.error + setRole("user")
```

After approval I'll apply the edit and show the final diff.
