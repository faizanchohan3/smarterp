
-- Add photo_url to customers
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS photo_url text;

-- Create storage bucket for uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public read access" ON storage.objects FOR SELECT USING (bucket_id = 'uploads');
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'uploads' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update own" ON storage.objects FOR UPDATE USING (bucket_id = 'uploads' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete own" ON storage.objects FOR DELETE USING (bucket_id = 'uploads' AND auth.role() = 'authenticated');
