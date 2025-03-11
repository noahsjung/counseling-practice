-- Enable row level security
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow authenticated users to use storage" 
ON storage.buckets FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to upload files" 
ON storage.objects FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update files" 
ON storage.objects FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read files" 
ON storage.objects FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete files" 
ON storage.objects FOR DELETE TO authenticated USING (true);
