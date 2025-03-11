-- Add role column to users table if it doesn't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'counselor';

-- Create index on role column
CREATE INDEX IF NOT EXISTS users_role_idx ON public.users (role);

-- Update existing users to have counselor role by default
UPDATE public.users SET role = 'counselor' WHERE role IS NULL;
