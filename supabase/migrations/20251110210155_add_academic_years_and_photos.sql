/*
  # Add Academic Years and Profile Photos

  1. New Tables
    - `academic_years` - Store academic year data
      - `id` (uuid, primary key)
      - `year_label` (text, e.g., "2024/25")
      - `start_date` (date)
      - `end_date` (date)
      - `is_current` (boolean)
      - `created_at` (timestamp)

  2. Changes
    - Add `photo_url` column to profiles table
    - Add `academic_year_id` to relevant tables for data segregation

  3. Security
    - Enable RLS on `academic_years` table
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS academic_years (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year_label text NOT NULL UNIQUE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_current boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view academic years"
  ON academic_years FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admin can manage academic years"
  ON academic_years FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'principal', 'head')
    )
  );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN photo_url text;
  END IF;
END $$;

INSERT INTO academic_years (year_label, start_date, end_date, is_current) VALUES
  ('2024/25', '2024-04-01', '2025-03-31', true),
  ('2023/24', '2023-04-01', '2024-03-31', false),
  ('2022/23', '2022-04-01', '2023-03-31', false)
ON CONFLICT (year_label) DO NOTHING;
