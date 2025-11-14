/*
  # Update Profiles Table for School ERP
  
  ## Changes
  - Add new fields for school-specific data:
    - `admission_no` (text) - For students
    - `employee_id` (text) - For teachers and admins
    - `parent_name` (text) - For students
    - `parent_phone` (text) - For students
    - `address` (text) - For all users
    - `date_of_birth` (date) - For all users
    - `gender` (text) - For all users
    - `blood_group` (text) - For all users
  - Update status enum to include 'pending_approval'
  - Add indexes for admission_no and employee_id
*/

-- Add new columns to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'admission_no'
  ) THEN
    ALTER TABLE profiles ADD COLUMN admission_no text UNIQUE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'employee_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN employee_id text UNIQUE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'parent_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN parent_name text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'parent_phone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN parent_phone text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'address'
  ) THEN
    ALTER TABLE profiles ADD COLUMN address text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'date_of_birth'
  ) THEN
    ALTER TABLE profiles ADD COLUMN date_of_birth date;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'gender'
  ) THEN
    ALTER TABLE profiles ADD COLUMN gender text CHECK (gender IN ('male', 'female', 'other'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'blood_group'
  ) THEN
    ALTER TABLE profiles ADD COLUMN blood_group text;
  END IF;
END $$;

-- Drop existing check constraint on status if it exists
DO $$
BEGIN
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_status_check;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Add updated status check constraint
ALTER TABLE profiles ADD CONSTRAINT profiles_status_check 
  CHECK (status IN ('active', 'inactive', 'suspended', 'pending_approval'));

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_profiles_admission_no ON profiles(admission_no) WHERE admission_no IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_employee_id ON profiles(employee_id) WHERE employee_id IS NOT NULL;

-- Add hod_id column to departments if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'departments' AND column_name = 'hod_id'
  ) THEN
    ALTER TABLE departments ADD COLUMN hod_id uuid REFERENCES profiles(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_departments_hod ON departments(hod_id) WHERE hod_id IS NOT NULL;