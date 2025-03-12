-- Add missing columns to user_responses table if they don't exist
DO $$
BEGIN
  -- Check if supervisor_feedback column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'user_responses' 
                AND column_name = 'supervisor_feedback') THEN
    ALTER TABLE public.user_responses ADD COLUMN supervisor_feedback TEXT;
  END IF;

  -- Check if supervisor_rating column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'user_responses' 
                AND column_name = 'supervisor_rating') THEN
    ALTER TABLE public.user_responses ADD COLUMN supervisor_rating INTEGER;
  END IF;

  -- Check if reviewed_at column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'user_responses' 
                AND column_name = 'reviewed_at') THEN
    ALTER TABLE public.user_responses ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE;
  END IF;
END
$$;
