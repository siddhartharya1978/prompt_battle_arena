/*
  # Seed Demo Data for Prompt Battle Arena

  1. Demo Users
    - Regular demo user
    - Admin demo user

  2. Demo Battles
    - Sample battles with complete data
    - Both prompt and response battles
    - Auto and manual modes

  3. Demo Responses and Scores
    - Realistic battle results
    - Complete scoring data
*/

-- Insert demo users (these will be created when they sign up)
-- The trigger will handle profile creation automatically

-- Insert demo battles for the demo user
-- Note: We'll use a placeholder user_id that will be replaced when demo user signs up

-- Demo Response Battle 1
INSERT INTO battles (
  id,
  user_id,
  battle_type,
  prompt,
  prompt_category,
  models,
  mode,
  battle_mode,
  rounds,
  max_tokens,
  temperature,
  status,
  winner,
  total_cost,
  auto_selection_reason,
  created_at
) VALUES (
  'battle_demo_1',
  '00000000-0000-0000-0000-000000000001', -- Placeholder, will be updated
  'response',
  'Explain the concept of quantum computing in simple terms that a 12-year-old could understand.',
  'explanation',
  ARRAY['llama-3.3-70b-versatile', 'moonshotai/kimi-k2-instruct'],
  'standard',
  'auto',
  3,
  500,
  0.7,
  'completed',
  'llama-3.3-70b-versatile',
  0.23,
  'Selected Llama 3.3 70B for versatile explanations and Kimi K2 for detailed, comprehensive responses - both excel at breaking down complex topics for younger audiences.',
  now() - interval '2 hours'
);

-- Demo battle responses
INSERT INTO battle_responses (
  battle_id,
  model_id,
  response,
  latency,
  tokens,
  cost
) VALUES 
(
  'battle_demo_1',
  'llama-3.3-70b-versatile',
  'Imagine you have a magical coin that can be both heads and tails at the same time! That''s kind of how quantum computers work. Regular computers use bits that are either 0 or 1, like a normal coin that''s either heads or tails. But quantum computers use "qubits" that can be 0, 1, or both at once! This lets them try many solutions to a problem simultaneously, making them incredibly fast for certain types of calculations. It''s like having a superpower that lets you explore multiple paths at once to find the best answer.',
  1240,
  127,
  0.15
),
(
  'battle_demo_1',
  'moonshotai/kimi-k2-instruct',
  'Think of quantum computing like a maze solver that can walk through walls! Regular computers have to try one path at a time through the maze, but quantum computers can explore all paths simultaneously. They use tiny particles that follow weird quantum rules - these particles can be in multiple places at once. This means quantum computers can solve certain problems much faster than regular computers, especially things like breaking codes or finding patterns in huge amounts of data.',
  890,
  98,
  0.08
);

-- Demo battle scores
INSERT INTO battle_scores (
  battle_id,
  model_id,
  accuracy,
  reasoning,
  structure,
  creativity,
  overall,
  notes
) VALUES 
(
  'battle_demo_1',
  'llama-3.3-70b-versatile',
  9,
  8,
  9,
  8,
  8.5,
  'Excellent analogy with the magical coin. Very clear and engaging explanation perfect for the target age group.'
),
(
  'battle_demo_1',
  'moonshotai/kimi-k2-instruct',
  8,
  7,
  8,
  9,
  8.0,
  'Creative maze analogy, but slightly less detailed explanation. Good use of relatable concepts.'
);

-- Demo Prompt Battle
INSERT INTO battles (
  id,
  user_id,
  battle_type,
  prompt,
  final_prompt,
  prompt_category,
  models,
  mode,
  battle_mode,
  rounds,
  max_tokens,
  temperature,
  status,
  winner,
  total_cost,
  auto_selection_reason,
  created_at
) VALUES (
  'battle_demo_prompt_1',
  '00000000-0000-0000-0000-000000000001',
  'prompt',
  'Write about AI',
  'Write a compelling 500-word narrative story about artificial intelligence that explores both the transformative promises and ethical challenges of AI technology. Focus specifically on how AI impacts human creativity, decision-making autonomy, and interpersonal relationships. Include concrete examples and maintain a balanced perspective that acknowledges both benefits and concerns. Structure the narrative with a clear beginning, development, and thoughtful conclusion.',
  'creative',
  ARRAY['llama-3.3-70b-versatile', 'meta-llama/llama-4-maverick-17b-128e-instruct'],
  'standard',
  'auto',
  3,
  300,
  0.5,
  'completed',
  'llama-3.3-70b-versatile',
  0.18,
  'Selected models with excellent prompt engineering capabilities for creative writing tasks - skilled at crafting detailed, inspiring prompts.',
  now() - interval '1 day'
);

-- Demo prompt evolution
INSERT INTO prompt_evolution (
  battle_id,
  round,
  prompt,
  model_id,
  improvements,
  score
) VALUES 
(
  'battle_demo_prompt_1',
  1,
  'Write about AI',
  'initial',
  ARRAY[]::text[],
  3.0
),
(
  'battle_demo_prompt_1',
  2,
  'Write a compelling 500-word narrative about artificial intelligence that explores both the promises and challenges of AI technology, focusing on its impact on human creativity and decision-making.',
  'llama-3.3-70b-versatile',
  ARRAY['Added word count specification', 'Defined narrative structure', 'Specified focus areas', 'Balanced perspective requirement'],
  7.5
),
(
  'battle_demo_prompt_1',
  3,
  'Write a compelling 500-word narrative story about artificial intelligence that explores both the transformative promises and ethical challenges of AI technology. Focus specifically on how AI impacts human creativity, decision-making autonomy, and interpersonal relationships. Include concrete examples and maintain a balanced perspective that acknowledges both benefits and concerns. Structure the narrative with a clear beginning, development, and thoughtful conclusion.',
  'llama-3.3-70b-versatile',
  ARRAY['Added "story" for clarity', 'Specified ethical dimension', 'Included interpersonal relationships', 'Required concrete examples', 'Detailed structure requirements'],
  9.2
);

-- Demo prompt battle scores
INSERT INTO battle_scores (
  battle_id,
  model_id,
  accuracy,
  reasoning,
  structure,
  creativity,
  overall,
  notes
) VALUES 
(
  'battle_demo_prompt_1',
  'llama-3.3-70b-versatile',
  9,
  9,
  10,
  9,
  9.2,
  'Excellent prompt refinement with clear structure, specific requirements, and creative direction. Final prompt is highly actionable.'
),
(
  'battle_demo_prompt_1',
  'meta-llama/llama-4-maverick-17b-128e-instruct',
  8,
  8,
  9,
  8,
  8.2,
  'Good prompt improvements with solid structure, though less creative flair than the winner.'
);

-- Create function to update demo battles with real user ID
CREATE OR REPLACE FUNCTION update_demo_battles_user_id(real_user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE battles 
  SET user_id = real_user_id 
  WHERE user_id = '00000000-0000-0000-0000-000000000001';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;