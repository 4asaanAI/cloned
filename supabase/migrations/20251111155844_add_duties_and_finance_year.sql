/*
  # Add Duties System and Finance Year Tracking

  1. New Tables
    - `duties` - Stores duty definitions (head boy/girl, house heads, event coordinators, etc.)
      - `id` (uuid, primary key)
      - `title` (text) - Duty title
      - `category` (text) - Category (student_leadership, house, event, administrative)
      - `description` (text) - Duty description
      - `created_at` (timestamptz)
    
    - `user_duties` - Assigns duties to users with tenure
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `duty_id` (uuid, references duties)
      - `start_date` (date)
      - `end_date` (date) - When duty tenure expires
      - `assigned_by` (uuid, references profiles)
      - `notes` (text)
      - `created_at` (timestamptz)

  2. Changes
    - Add `academic_year_id` to finance_records table
    - Add `academic_year_id` to fee_records table

  3. Security
    - Enable RLS on all new tables
    - Policies for authenticated users to view
    - Admin-only policies for modifications
*/

-- Create duties table
CREATE TABLE IF NOT EXISTS duties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE duties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view duties"
  ON duties FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can insert duties"
  ON duties FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can update duties"
  ON duties FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can delete duties"
  ON duties FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create user_duties table
CREATE TABLE IF NOT EXISTS user_duties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  duty_id uuid REFERENCES duties(id) ON DELETE CASCADE,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  assigned_by uuid REFERENCES profiles(id),
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_duties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view user duties"
  ON user_duties FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can insert user duties"
  ON user_duties FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can update user duties"
  ON user_duties FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can delete user duties"
  ON user_duties FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add academic_year_id to finance_records
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'finance_records' AND column_name = 'academic_year_id'
  ) THEN
    ALTER TABLE finance_records ADD COLUMN academic_year_id uuid REFERENCES academic_years(id);
  END IF;
END $$;

-- Add academic_year_id to fee_records
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fee_records' AND column_name = 'academic_year_id'
  ) THEN
    ALTER TABLE fee_records ADD COLUMN academic_year_id uuid REFERENCES academic_years(id);
  END IF;
END $$;

-- Insert default duties
INSERT INTO duties (title, category, description) VALUES
  ('Head Boy', 'student_leadership', 'Student leadership position - Head Boy'),
  ('Head Girl', 'student_leadership', 'Student leadership position - Head Girl'),
  ('Green House Head', 'house', 'Head of Green House'),
  ('Blue House Head', 'house', 'Head of Blue House'),
  ('Yellow House Head', 'house', 'Head of Yellow House'),
  ('Red House Head', 'house', 'Head of Red House'),
  ('Event Coordinator', 'event', 'Responsible for coordinating events'),
  ('Sports Captain', 'student_leadership', 'Captain of sports activities'),
  ('Cultural Secretary', 'student_leadership', 'Manages cultural activities')
ON CONFLICT DO NOTHING;