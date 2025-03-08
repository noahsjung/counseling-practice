-- Create scenarios table
CREATE TABLE IF NOT EXISTS scenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  difficulty TEXT NOT NULL,
  duration INTEGER NOT NULL,
  thumbnail_url TEXT,
  video_url TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create scenario_segments table for pause points
CREATE TABLE IF NOT EXISTS scenario_segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scenario_id UUID REFERENCES scenarios(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time INTEGER NOT NULL,
  end_time INTEGER,
  pause_point BOOLEAN DEFAULT FALSE,
  expert_response_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_responses table
CREATE TABLE IF NOT EXISTS user_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_id UUID REFERENCES scenarios(id) ON DELETE CASCADE,
  segment_id UUID REFERENCES scenario_segments(id) ON DELETE CASCADE,
  response_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_progress table
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_id UUID REFERENCES scenarios(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  completion_date TIMESTAMP WITH TIME ZONE,
  rating INTEGER,
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, scenario_id)
);

-- Enable RLS on all tables
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Scenarios - everyone can view
DROP POLICY IF EXISTS "Scenarios are viewable by everyone" ON scenarios;
CREATE POLICY "Scenarios are viewable by everyone"
  ON scenarios FOR SELECT
  USING (true);

-- Scenario segments - everyone can view
DROP POLICY IF EXISTS "Scenario segments are viewable by everyone" ON scenario_segments;
CREATE POLICY "Scenario segments are viewable by everyone"
  ON scenario_segments FOR SELECT
  USING (true);

-- User responses - users can only view/modify their own responses
DROP POLICY IF EXISTS "Users can view their own responses" ON user_responses;
CREATE POLICY "Users can view their own responses"
  ON user_responses FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own responses" ON user_responses;
CREATE POLICY "Users can insert their own responses"
  ON user_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own responses" ON user_responses;
CREATE POLICY "Users can update their own responses"
  ON user_responses FOR UPDATE
  USING (auth.uid() = user_id);

-- User progress - users can only view/modify their own progress
DROP POLICY IF EXISTS "Users can view their own progress" ON user_progress;
CREATE POLICY "Users can view their own progress"
  ON user_progress FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own progress" ON user_progress;
CREATE POLICY "Users can insert their own progress"
  ON user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own progress" ON user_progress;
CREATE POLICY "Users can update their own progress"
  ON user_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Enable realtime for all tables
alter publication supabase_realtime add table scenarios;
alter publication supabase_realtime add table scenario_segments;
alter publication supabase_realtime add table user_responses;
alter publication supabase_realtime add table user_progress;

-- Insert sample data
INSERT INTO scenarios (title, description, difficulty, duration, thumbnail_url, category) VALUES
('Initial Client Assessment', 'Practice conducting an initial assessment with a new client presenting with anxiety symptoms.', 'Beginner', 15, 'https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=400&q=80', 'Assessment'),
('Managing Client Resistance', 'Learn techniques for working with resistant clients who are hesitant to engage in the therapeutic process.', 'Intermediate', 20, 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&q=80', 'Therapeutic Techniques'),
('Crisis Intervention', 'Practice responding to a client experiencing an acute crisis situation requiring immediate intervention.', 'Advanced', 25, 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&q=80', 'Crisis Management');