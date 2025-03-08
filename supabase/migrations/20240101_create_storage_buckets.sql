-- Create storage bucket for user responses
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-responses', 'user-responses', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for user responses
CREATE POLICY "User Response Storage - Authenticated users can upload" 
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'user-responses' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "User Response Storage - Users can view their own responses" 
ON storage.objects FOR SELECT TO authenticated 
USING (bucket_id = 'user-responses' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "User Response Storage - Users can update their own responses" 
ON storage.objects FOR UPDATE TO authenticated 
USING (bucket_id = 'user-responses' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "User Response Storage - Users can delete their own responses" 
ON storage.objects FOR DELETE TO authenticated 
USING (bucket_id = 'user-responses' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Create policy for public access to responses (for sharing/viewing)
CREATE POLICY "User Response Storage - Public can view responses" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'user-responses');