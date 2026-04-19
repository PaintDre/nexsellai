-- Eliminar la política permisiva que permitía UPDATE de cualquier columna
DROP POLICY IF EXISTS "Authenticated users can update usage_count" ON public.target_audiences;

-- Revocar UPDATE general en la tabla
REVOKE UPDATE ON public.target_audiences FROM authenticated, anon;

-- Otorgar UPDATE solo en la columna usage_count
GRANT UPDATE (usage_count) ON public.target_audiences TO authenticated;

-- Política RLS que permite UPDATE (limitada por el GRANT a nivel columna)
CREATE POLICY "Authenticated users can increment usage_count"
ON public.target_audiences
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);