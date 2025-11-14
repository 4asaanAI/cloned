/*
  # Add Leave and Transport Modules

  1. New Tables
    - `leave_applications` - Comprehensive leave management
      - All leave records for students, teachers, employees
      - Status tracking, dates, reasons, approvals
    - `transport_routes` - Transport route information
      - Route details, vehicle info, capacity
    - `transport_assignments` - User-transport mappings
      - Assigns users to specific routes

  2. Security
    - Enable RLS on all new tables
    - Policies for viewing and managing leaves
    - Policies for transport management

  3. Important Notes
    - Links to existing profiles table
    - Supports comprehensive leave analytics
    - Full transport fleet management
*/

-- Drop existing leave_applications if exists and recreate with enhanced schema
DROP TABLE IF EXISTS leave_applications CASCADE;

CREATE TABLE leave_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  leave_type text NOT NULL CHECK (leave_type IN ('sick', 'casual', 'emergency', 'annual', 'maternity', 'paternity', 'study', 'other')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by uuid REFERENCES profiles(id),
  approval_date timestamptz,
  rejection_reason text,
  supporting_documents jsonb DEFAULT '[]'::jsonb,
  contact_during_leave text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Drop existing transport tables if they exist
DROP TABLE IF EXISTS student_transport CASCADE;
DROP TABLE IF EXISTS transport_routes CASCADE;

-- Create enhanced transport_routes table
CREATE TABLE transport_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_name text NOT NULL,
  route_number text UNIQUE NOT NULL,
  vehicle_type text NOT NULL CHECK (vehicle_type IN ('bus', 'van', 'taxi', 'car')),
  vehicle_number text,
  driver_name text,
  driver_phone text,
  capacity integer DEFAULT 0,
  current_occupancy integer DEFAULT 0,
  stops jsonb DEFAULT '[]'::jsonb,
  schedule jsonb DEFAULT '{}'::jsonb,
  monthly_fee numeric DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create transport_assignments table
CREATE TABLE transport_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  route_id uuid REFERENCES transport_routes(id) ON DELETE CASCADE NOT NULL,
  stop_name text NOT NULL,
  pickup_time time,
  drop_time time,
  assigned_date date DEFAULT CURRENT_DATE,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'temporary')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, route_id)
);

-- Enable RLS
ALTER TABLE leave_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_assignments ENABLE ROW LEVEL SECURITY;

-- Leave Applications Policies
CREATE POLICY "Users can view own leaves"
  ON leave_applications FOR SELECT
  TO authenticated
  USING (
    applicant_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.sub_role IN ('head', 'principal')
    )
  );

CREATE POLICY "Users can create own leaves"
  ON leave_applications FOR INSERT
  TO authenticated
  WITH CHECK (applicant_id = auth.uid());

CREATE POLICY "Users can update own pending leaves"
  ON leave_applications FOR UPDATE
  TO authenticated
  USING (applicant_id = auth.uid() AND status = 'pending')
  WITH CHECK (applicant_id = auth.uid());

CREATE POLICY "Admins can manage all leaves"
  ON leave_applications FOR ALL
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

-- Transport Routes Policies
CREATE POLICY "Everyone can view transport routes"
  ON transport_routes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage transport routes"
  ON transport_routes FOR ALL
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

-- Transport Assignments Policies
CREATE POLICY "Users can view own transport assignments"
  ON transport_assignments FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.sub_role IN ('head', 'principal')
    )
  );

CREATE POLICY "Admins can manage transport assignments"
  ON transport_assignments FOR ALL
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

-- Create indexes
CREATE INDEX idx_leaves_applicant ON leave_applications(applicant_id);
CREATE INDEX idx_leaves_status ON leave_applications(status);
CREATE INDEX idx_leaves_dates ON leave_applications(start_date, end_date);
CREATE INDEX idx_transport_assignments_user ON transport_assignments(user_id);
CREATE INDEX idx_transport_assignments_route ON transport_assignments(route_id);
