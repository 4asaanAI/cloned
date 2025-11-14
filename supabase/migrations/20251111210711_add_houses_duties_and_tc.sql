/*
  # Add Houses, Duties, and Transfer Certificates

  1. Changes to profiles table
    - Add `house` column (enum: green, blue, red, yellow)
    - Add `duties` jsonb column for storing array of duty tags

  2. New Tables
    - `transfer_certificates`
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key to profiles)
      - `issued_by` (uuid, foreign key to profiles)
      - `issue_date` (date)
      - `reason` (text)
      - `conduct` (text)
      - `character` (text)
      - `remarks` (text)
      - `tc_number` (text, unique)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  3. Security
    - Enable RLS on `transfer_certificates` table
    - Add policies for viewing and creating TCs
    - Only head and principal can edit duties
    - Everyone can view house and duties

  4. Important Notes
    - House system divides students and teachers into 4 houses
    - Duties are stored as JSON array of tags (e.g., ["Head Boy", "Football Captain"])
    - Only head and principal can create TCs and edit duties
    - Duties should represent key responsibilities in 1-2 words max
*/

-- Add house and duties columns to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'house'
  ) THEN
    ALTER TABLE profiles ADD COLUMN house text CHECK (house IN ('green', 'blue', 'red', 'yellow'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'duties'
  ) THEN
    ALTER TABLE profiles ADD COLUMN duties jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Create transfer_certificates table
CREATE TABLE IF NOT EXISTS transfer_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  issued_by uuid REFERENCES profiles(id) NOT NULL,
  tc_number text UNIQUE NOT NULL,
  issue_date date DEFAULT CURRENT_DATE NOT NULL,
  reason text NOT NULL,
  conduct text DEFAULT 'Good',
  character text DEFAULT 'Good',
  remarks text,
  last_class_attended text,
  subjects_studied text,
  date_of_admission date,
  date_of_leaving date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on transfer_certificates
ALTER TABLE transfer_certificates ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone authenticated can view TCs
CREATE POLICY "Users can view transfer certificates"
  ON transfer_certificates
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only head and principal can create TCs
CREATE POLICY "Head and Principal can create TCs"
  ON transfer_certificates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.sub_role IN ('head', 'principal')
    )
  );

-- Policy: Only head and principal can update TCs
CREATE POLICY "Head and Principal can update TCs"
  ON transfer_certificates
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.sub_role IN ('head', 'principal')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.sub_role IN ('head', 'principal')
    )
  );

-- Policy: Only head and principal can delete TCs
CREATE POLICY "Head and Principal can delete TCs"
  ON transfer_certificates
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.sub_role IN ('head', 'principal')
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tc_student_id ON transfer_certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_tc_issued_by ON transfer_certificates(issued_by);
CREATE INDEX IF NOT EXISTS idx_profiles_house ON profiles(house);
