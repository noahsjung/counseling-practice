-- Create a function to add the role column if it doesn't exist
CREATE OR REPLACE FUNCTION add_role_column_if_not_exists()
RETURNS void AS $$
BEGIN
    -- Check if the column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
        -- Add the column
        ALTER TABLE public.users ADD COLUMN role TEXT DEFAULT 'counselor';
        
        -- Create index on role column
        CREATE INDEX IF NOT EXISTS users_role_idx ON public.users (role);
        
        -- Update existing users to have counselor role by default
        UPDATE public.users SET role = 'counselor' WHERE role IS NULL;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
