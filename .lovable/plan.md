
Plan: harden product load in `src/pages/GenerateLanding.tsx`.

Scope: only the `useEffect` at lines ~46-52. No other code touched.

Changes:
1. Replace `.then(...)` with internal `async loadProduct()` function called from the effect.
2. Wrap body in `try/catch`.
3. Destructure `{ data, error }` from `supabase.from("products").select("*").eq("id", id).eq("user_id", user.id).single()`.
4. On `error`: `console.error("Error loading product:", error)` + `navigate("/products")` + `return`.
5. On missing `data`: `console.warn("Product not found")` + `navigate("/products")` + `return`.
6. On valid `data`: `setProduct(data)`.
7. `catch (err)`: `console.error("Unexpected error loading product:", err)` + `navigate("/products")`.
8. Update `useEffect` deps from `[id, user]` to `[id, user, navigate]`.

Resulting shape:

```text
useEffect(() => {
  if (!user || !id) return;
  const loadProduct = async () => {
    try {
      const { data, error } = await supabase
        .from("products").select("*")
        .eq("id", id).eq("user_id", user.id).single();
      if (error) → console.error + navigate("/products") + return
      if (!data) → console.warn + navigate("/products") + return
      setProduct(data)
    } catch (err) → console.error + navigate("/products")
  };
  loadProduct();
}, [id, user, navigate]);
```

After approval I'll apply the edit and show the final diff.
