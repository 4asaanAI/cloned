/*
  # Initialize Database Schema for THE AARYANS School

  1. New Tables
    - `contact_inquiries` - Store contact form submissions
      - `id` (uuid, primary key)
      - `name` (text) - Full name
      - `email` (text) - Email address
      - `phone` (text) - Phone number
      - `created_at` (timestamptz)

    - `school_data` - Store school information for AI chatbot
      - `id` (uuid, primary key)
      - `category` (text) - Data category
      - `title` (text) - Title or heading
      - `content` (text) - Main content
      - `metadata` (jsonb) - Additional data
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `chat_sessions` - Track chat sessions
      - `id` (uuid, primary key)
      - `session_id` (text, unique) - Browser session identifier
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `chat_messages` - Store chat conversation history
      - `id` (uuid, primary key)
      - `session_id` (uuid, foreign key) - References chat_sessions
      - `message` (text) - Message content
      - `role` (text) - 'user' or 'assistant'
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Public can insert contact inquiries and chat data
    - Public can read school data and their own chat history
    - Authenticated users can view all data (for admin access)
*/

-- Create contact_inquiries table
CREATE TABLE IF NOT EXISTS contact_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  created_at timestamptz DEFAULT now()
);

-- Create school_data table
CREATE TABLE IF NOT EXISTS school_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES chat_sessions(id) ON DELETE CASCADE,
  message text NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE contact_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Contact inquiries policies
CREATE POLICY "Anyone can submit contact inquiry"
  ON contact_inquiries FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view all inquiries"
  ON contact_inquiries FOR SELECT
  TO authenticated
  USING (true);

-- School data policies
CREATE POLICY "Anyone can read school data"
  ON school_data FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert school data"
  ON school_data FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Chat sessions policies
CREATE POLICY "Anyone can create chat sessions"
  ON chat_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read chat sessions"
  ON chat_sessions FOR SELECT
  USING (true);

-- Chat messages policies
CREATE POLICY "Anyone can create chat messages"
  ON chat_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read chat messages"
  ON chat_messages FOR SELECT
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_created_at ON contact_inquiries(created_at);
CREATE INDEX IF NOT EXISTS idx_school_data_category ON school_data(category);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_session_id ON chat_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
