/*
  # Add Academic Year Statistics Table

  1. New Tables
    - `academic_year_stats` - Store yearly statistics
      - `id` (uuid, primary key)
      - `academic_year_id` (uuid, references academic_years)
      - `metric_name` (text)
      - `metric_value` (numeric)
      - `month` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS academic_year_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id uuid REFERENCES academic_years(id) ON DELETE CASCADE,
  metric_name text NOT NULL,
  metric_value numeric NOT NULL,
  month text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE academic_year_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view year stats"
  ON academic_year_stats FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage year stats"
  ON academic_year_stats FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'principal', 'head')
    )
  );

INSERT INTO academic_year_stats (academic_year_id, metric_name, metric_value, month)
SELECT 
  ay.id,
  'students',
  CASE 
    WHEN ay.year_label = '2024/25' THEN 450 + (floor(random() * 50))::int
    WHEN ay.year_label = '2023/24' THEN 420 + (floor(random() * 30))::int
    ELSE 380 + (floor(random() * 40))::int
  END,
  m.month
FROM academic_years ay
CROSS JOIN (
  SELECT unnest(ARRAY['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']) as month
) m
ON CONFLICT DO NOTHING;
