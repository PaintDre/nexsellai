-- Create dropi-videos bucket (public, 100MB limit, video MIME types)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'dropi-videos',
  'dropi-videos',
  true,
  104857600,
  ARRAY['video/mp4','video/webm','video/quicktime','video/x-msvideo','video/x-matroska','video/ogg']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public read access
CREATE POLICY "Public can view dropi videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'dropi-videos');

-- Admin/super_admin can upload
CREATE POLICY "Admins can upload dropi videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'dropi-videos'
  AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'super_admin'::public.app_role))
);

-- Admin/super_admin can update
CREATE POLICY "Admins can update dropi videos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'dropi-videos'
  AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'super_admin'::public.app_role))
);

-- Admin/super_admin can delete
CREATE POLICY "Admins can delete dropi videos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'dropi-videos'
  AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'super_admin'::public.app_role))
);