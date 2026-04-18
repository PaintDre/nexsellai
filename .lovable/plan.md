
Plan: harden dashboard initial load in `src/pages/Dashboard.tsx`.

Scope: only the `load` function inside the `useEffect` (lines ~52-81). No other code, types, or dependencies touched.

Changes:
1. Wrap `load` body in `try/catch/finally`.
2. Keep `setLoading(true)` at top of `try`; move `setLoading(false)` to `finally`.
3. After `Promise.all`, check `prodRes.error`, `landRes.error`, `verCountRes.error` individually → `console.error` each.
4. Apply safe fallbacks: `setProducts(prodRes.data || [])`, `setLandings(landRes.data || [])`, `setVersionsCount(verCountRes.count || 0)` (already safe — preserved).
5. Destructure `{ data: versions, error: versionsError }` on the `landing_versions` follow-up query. Log on `versionsError`. Only build `landingIds` + fetch landing names + `setRecentVersions(...)` when `versions` is valid and non-empty.
6. `catch (err)` → `console.error("Unexpected error loading dashboard:", err)` + leave `// TODO: surface toast to user` comment.
7. `finally` → `setLoading(false)`.

Resulting shape:

```text
load()
├── try
│   ├── setLoading(true)
│   ├── [prodRes, landRes, verCountRes] = await Promise.all([...])
│   ├── if (prodRes.error) console.error(...)
│   ├── if (landRes.error) console.error(...)
│   ├── if (verCountRes.error) console.error(...)
│   ├── setProducts(prodRes.data || [])
│   ├── setLandings(landRes.data || [])
│   ├── setVersionsCount(verCountRes.count || 0)
│   ├── { data: versions, error: versionsError } = await supabase...landing_versions
│   ├── if (versionsError) console.error(...)
│   └── if (versions && versions.length > 0) → fetch landing names → setRecentVersions(...)
├── catch (err) → console.error(...) + // TODO toast
└── finally → setLoading(false)
```

`useEffect` dependency array stays `[user]`. After approval I'll apply the edit and show the final diff.
