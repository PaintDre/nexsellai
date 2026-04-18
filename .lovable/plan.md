
Plan: harden `fetchProfile` in `src/hooks/useAuth.tsx` with robust error handling.

Changes (single file: `src/hooks/useAuth.tsx`, function `fetchProfile` only):

1. Wrap entire body in `try/catch`.
2. Destructure `{ data, error }` from the profile select.
3. Early-exit on `error` → log + `setProfile(null)` + `return`.
4. Early-exit on missing `data` → warn + `setProfile(null)` + `return`.
5. Keep plan-expiration downgrade logic, but capture `{ error: updateError }` from the `update` and log it if present (still proceed to set local state to free).
6. On valid profile (no expiration path): `setProfile(data)` + `setLanguageFromProfile((data as any).language)`.
7. `catch (err)` → log + `setProfile(null)`.

No other functions, types, or files touched. No behavioral changes beyond error resilience.

Resulting function shape:

```text
fetchProfile(userId)
├── try
│   ├── { data, error } = supabase.from('profiles').select...single()
│   ├── if (error) → console.error + setProfile(null) + return
│   ├── if (!data) → console.warn + setProfile(null) + return
│   ├── if (plan !== 'free' && plan_expires_at < now)
│   │     ├── { error: updateError } = supabase.update({ plan: 'free', ... })
│   │     ├── if (updateError) → console.error
│   │     ├── setProfile({ ...data, plan: 'free', plan_expires_at: null })
│   │     └── return
│   ├── setProfile(data)
│   └── setLanguageFromProfile(data.language)
└── catch (err) → console.error + setProfile(null)
```

After approval I'll apply the edit and show the final diff.
