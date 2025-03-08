-- Insert sample segments for the existing scenarios

-- Segments for "Initial Client Assessment"
INSERT INTO scenario_segments (scenario_id, title, description, start_time, end_time, pause_point)
SELECT 
  id, 
  'Introduction and Building Rapport', 
  'The counselor introduces themselves and begins to establish rapport with the client.',
  0,
  60,
  false
FROM scenarios WHERE title = 'Initial Client Assessment'
ON CONFLICT DO NOTHING;

INSERT INTO scenario_segments (scenario_id, title, description, start_time, end_time, pause_point)
SELECT 
  id, 
  'Client Presents Anxiety Symptoms', 
  'The client describes their anxiety symptoms and how they are affecting daily life.',
  61,
  180,
  false
FROM scenarios WHERE title = 'Initial Client Assessment'
ON CONFLICT DO NOTHING;

INSERT INTO scenario_segments (scenario_id, title, description, start_time, end_time, pause_point)
SELECT 
  id, 
  'Response Point: Initial Reflection', 
  'Provide an empathetic response that reflects the client''s feelings about their anxiety.',
  181,
  182,
  true
FROM scenarios WHERE title = 'Initial Client Assessment'
ON CONFLICT DO NOTHING;

INSERT INTO scenario_segments (scenario_id, title, description, start_time, end_time, pause_point)
SELECT 
  id, 
  'Exploring Triggers and Patterns', 
  'Discussion about what triggers the client''s anxiety and identifying patterns.',
  183,
  300,
  false
FROM scenarios WHERE title = 'Initial Client Assessment'
ON CONFLICT DO NOTHING;

INSERT INTO scenario_segments (scenario_id, title, description, start_time, end_time, pause_point)
SELECT 
  id, 
  'Response Point: Formulating Assessment Questions', 
  'Ask appropriate questions to gather more information about the client''s anxiety patterns.',
  301,
  302,
  true
FROM scenarios WHERE title = 'Initial Client Assessment'
ON CONFLICT DO NOTHING;

-- Segments for "Managing Client Resistance"
INSERT INTO scenario_segments (scenario_id, title, description, start_time, end_time, pause_point)
SELECT 
  id, 
  'Client Expresses Reluctance', 
  'The client expresses doubts about the counseling process and its effectiveness.',
  0,
  90,
  false
FROM scenarios WHERE title = 'Managing Client Resistance'
ON CONFLICT DO NOTHING;

INSERT INTO scenario_segments (scenario_id, title, description, start_time, end_time, pause_point)
SELECT 
  id, 
  'Response Point: Addressing Resistance', 
  'Respond to the client''s resistance in a way that acknowledges their concerns without being defensive.',
  91,
  92,
  true
FROM scenarios WHERE title = 'Managing Client Resistance'
ON CONFLICT DO NOTHING;

INSERT INTO scenario_segments (scenario_id, title, description, start_time, end_time, pause_point)
SELECT 
  id, 
  'Client Challenges Counselor', 
  'The client directly challenges the counselor''s expertise or approach.',
  93,
  180,
  false
FROM scenarios WHERE title = 'Managing Client Resistance'
ON CONFLICT DO NOTHING;

INSERT INTO scenario_segments (scenario_id, title, description, start_time, end_time, pause_point)
SELECT 
  id, 
  'Response Point: Maintaining Therapeutic Alliance', 
  'Respond to the challenge while maintaining the therapeutic alliance and avoiding power struggles.',
  181,
  182,
  true
FROM scenarios WHERE title = 'Managing Client Resistance'
ON CONFLICT DO NOTHING;

-- Segments for "Crisis Intervention"
INSERT INTO scenario_segments (scenario_id, title, description, start_time, end_time, pause_point)
SELECT 
  id, 
  'Client in Emotional Crisis', 
  'The client presents in an emotionally heightened state, expressing thoughts of hopelessness.',
  0,
  120,
  false
FROM scenarios WHERE title = 'Crisis Intervention'
ON CONFLICT DO NOTHING;

INSERT INTO scenario_segments (scenario_id, title, description, start_time, end_time, pause_point)
SELECT 
  id, 
  'Response Point: Initial Crisis Response', 
  'Provide an immediate response to the client''s crisis state, focusing on safety and stabilization.',
  121,
  122,
  true
FROM scenarios WHERE title = 'Crisis Intervention'
ON CONFLICT DO NOTHING;

INSERT INTO scenario_segments (scenario_id, title, description, start_time, end_time, pause_point)
SELECT 
  id, 
  'Risk Assessment', 
  'The counselor conducts a risk assessment to determine the severity of the crisis.',
  123,
  240,
  false
FROM scenarios WHERE title = 'Crisis Intervention'
ON CONFLICT DO NOTHING;

INSERT INTO scenario_segments (scenario_id, title, description, start_time, end_time, pause_point)
SELECT 
  id, 
  'Response Point: Safety Planning', 
  'Develop a safety plan with the client, addressing immediate concerns and next steps.',
  241,
  242,
  true
FROM scenarios WHERE title = 'Crisis Intervention'
ON CONFLICT DO NOTHING;