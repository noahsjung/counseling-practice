-- Add supervisor-related fields to user_responses table
ALTER TABLE user_responses ADD COLUMN IF NOT EXISTS supervisor_feedback TEXT;
ALTER TABLE user_responses ADD COLUMN IF NOT EXISTS supervisor_rating INTEGER;
ALTER TABLE user_responses ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;

-- Add role field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'counselor';

-- Add created_by field to scenarios table
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Create storage buckets for scenario videos, thumbnails, and expert responses
INSERT INTO storage.buckets (id, name, public) 
VALUES ('scenario-videos', 'scenario-videos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('scenario-thumbnails', 'scenario-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('expert-responses', 'expert-responses', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for scenario videos
DROP POLICY IF EXISTS "Scenario Videos - Authenticated users can upload" ON storage.objects;
CREATE POLICY "Scenario Videos - Authenticated users can upload" 
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'scenario-videos');

DROP POLICY IF EXISTS "Scenario Videos - Public can view" ON storage.objects;
CREATE POLICY "Scenario Videos - Public can view" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'scenario-videos');

-- Set up storage policies for scenario thumbnails
DROP POLICY IF EXISTS "Scenario Thumbnails - Authenticated users can upload" ON storage.objects;
CREATE POLICY "Scenario Thumbnails - Authenticated users can upload" 
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'scenario-thumbnails');

DROP POLICY IF EXISTS "Scenario Thumbnails - Public can view" ON storage.objects;
CREATE POLICY "Scenario Thumbnails - Public can view" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'scenario-thumbnails');

-- Set up storage policies for expert responses
DROP POLICY IF EXISTS "Expert Responses - Authenticated users can upload" ON storage.objects;
CREATE POLICY "Expert Responses - Authenticated users can upload" 
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'expert-responses');

DROP POLICY IF EXISTS "Expert Responses - Public can view" ON storage.objects;
CREATE POLICY "Expert Responses - Public can view" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'expert-responses');

-- Create a supervisor user for testing
INSERT INTO auth.users (id, email, created_at, confirmed_at)
VALUES ('00000000-0000-0000-0000-000000000000', 'supervisor@example.com', now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, full_name, role)
VALUES ('00000000-0000-0000-0000-000000000000', 'supervisor@example.com', 'Supervisor User', 'supervisor')
ON CONFLICT (id) DO NOTHING;