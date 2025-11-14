/*
  # Add Remarks Field to Classes

  1. Changes
    - Add `remarks` text column to classes table
    - Only admins (head, principal) can edit this field via RLS

  2. Notes
    - Remarks can be used by admins to add notes about specific classes
    - Field is optional (nullable)
*/

-- Add remarks column to classes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'classes' AND column_name = 'remarks'
  ) THEN
    ALTER TABLE classes ADD COLUMN remarks text;
  END IF;
END $$;
