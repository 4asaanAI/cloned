/*
  # Enhance Events Table
  
  ## Overview
  This migration enhances the existing events table and adds event_volunteers table
  for comprehensive event management with volunteer tracking.
  
  ## Modified Tables
  
  ### events (enhanced)
  - Add `end_date` for multi-day events
  - Add `current_volunteers` to track volunteer count
  - Add `budget` for event budget tracking
  - Add `created_by` to track who created the event
  - Add `updated_at` timestamp
  
  ## New Tables
  
  ### event_volunteers
  - Tracks student volunteers for events
  - `id` (uuid, primary key)
  - `event_id` (uuid, references events)
  - `student_id` (uuid, references profiles)
  - `role` (text) - Volunteer role
  - `status` (text) - registered, confirmed, attended, cancelled
  - `registered_at` (timestamptz)
  - `confirmed_at` (timestamptz)
  - `attendance_marked` (boolean)
  
  ## Security
  - Enable RLS on event_volunteers table
  - Add policies for students, coordinators, and admins
*/

-- Enhance events table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE events ADD COLUMN end_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'current_volunteers'
  ) THEN
    ALTER TABLE events ADD COLUMN current_volunteers integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'budget'
  ) THEN
    ALTER TABLE events ADD COLUMN budget numeric(10,2) DEFAULT 0.00;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE events ADD COLUMN created_by uuid REFERENCES profiles(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE events ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create event_volunteers table
CREATE TABLE IF NOT EXISTS event_volunteers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text,
  status text DEFAULT 'registered',
  registered_at timestamptz DEFAULT now(),
  confirmed_at timestamptz,
  attendance_marked boolean DEFAULT false,
  UNIQUE(event_id, student_id)
);

-- Function to update volunteer count
CREATE OR REPLACE FUNCTION update_event_volunteer_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE events
  SET current_volunteers = (
    SELECT COUNT(*)
    FROM event_volunteers
    WHERE event_id = COALESCE(NEW.event_id, OLD.event_id)
    AND status IN ('registered', 'confirmed', 'attended')
  ),
  updated_at = now()
  WHERE id = COALESCE(NEW.event_id, OLD.event_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update volunteer count
DROP TRIGGER IF EXISTS trigger_update_volunteer_count ON event_volunteers;
CREATE TRIGGER trigger_update_volunteer_count
  AFTER INSERT OR UPDATE OR DELETE ON event_volunteers
  FOR EACH ROW
  EXECUTE FUNCTION update_event_volunteer_count();

-- Enable RLS
ALTER TABLE event_volunteers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_volunteers

-- Students can view volunteer records
CREATE POLICY "Students can view volunteer records"
  ON event_volunteers FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_volunteers.event_id
      AND e.coordinator_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Students can register as volunteers
CREATE POLICY "Students can register as volunteers"
  ON event_volunteers FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'student'
    )
  );

-- Students can update their own volunteer status
CREATE POLICY "Students can update own volunteer status"
  ON event_volunteers FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- Coordinators can manage volunteers for their events
CREATE POLICY "Coordinators can manage event volunteers"
  ON event_volunteers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_volunteers.event_id
      AND e.coordinator_id = auth.uid()
    )
  );

-- Admins have full access to volunteers
CREATE POLICY "Admins have full access to volunteers"
  ON event_volunteers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_coordinator_id ON events(coordinator_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_event_volunteers_event_id ON event_volunteers(event_id);
CREATE INDEX IF NOT EXISTS idx_event_volunteers_student_id ON event_volunteers(student_id);