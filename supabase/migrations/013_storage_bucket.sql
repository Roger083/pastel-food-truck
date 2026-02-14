-- ============================================================
-- Migration 013: Storage bucket para fotos do menu
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO NOTHING;

-- Qualquer um pode ver as fotos
CREATE POLICY "public_read_menu_images" ON storage.objects
  FOR SELECT TO anon USING (bucket_id = 'menu-images');

-- Admin pode fazer upload/delete
CREATE POLICY "auth_all_menu_images" ON storage.objects
  FOR ALL TO authenticated USING (bucket_id = 'menu-images') WITH CHECK (bucket_id = 'menu-images');
