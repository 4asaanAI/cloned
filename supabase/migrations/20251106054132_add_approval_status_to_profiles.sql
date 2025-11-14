/*
  # Add Approval Status to Profiles

  1. Changes
    - Add `approval_status` column to profiles table
    - Add `approved_at` timestamp column
    - Add `approved_by` column to track who approved
    - Update RLS policies to restrict pending users
    - Create index for faster approval queries

  2. Approval Status Values
    - 'pending': Waiting for admin approval (new signups)
    - 'approved': Approved and can access dashboard
    - 'rejected': Application rejected
    
  3. Security
    - Pending users cannot access dashboard features
    - Only admins can approve/reject users
*/

-- Add approval columns to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'approval_status'
  ) THEN
    ALTER TABLE profiles ADD COLUMN approval_status text DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN approved_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE profiles ADD COLUMN approved_by uuid REFERENCES profiles(id);
  END IF;
END $$;

-- Create index for approval queries
CREATE INDEX IF NOT EXISTS idx_profiles_approval_status ON profiles(approval_status);
CREATE INDEX IF NOT EXISTS idx_profiles_status_created ON profiles(status, created_at DESC);

-- Update existing profiles to be approved (grandfather clause)
UPDATE profiles 
SET approval_status = 'approved', 
    approved_at = created_at
WHERE approval_status = 'pending' 
  AND created_at < NOW();

-- Add check constraint for approval_status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_approval_status_check'
  ) THEN
    ALTER TABLE profiles 
    ADD CONSTRAINT profiles_approval_status_check 
    CHECK (approval_status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Users can view approved profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles including pending" ON profiles;

-- Allow users to view only approved profiles (excluding pending)
CREATE POLICY "Users can view approved profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    approval_status = 'approved' 
    OR id = auth.uid()
  );

-- Allow admins to view all profiles including pending
CREATE POLICY "Admins can view all profiles including pending"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Allow admins to update approval status
DROP POLICY IF EXISTS "Admins can update approval status" ON profiles;

CREATE POLICY "Admins can update approval status"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );
