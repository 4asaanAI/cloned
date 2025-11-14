/*
  # Remove Enrollments Table

  1. Changes
    - Drop enrollments table and its associated policies
    - Clean up foreign key relationships
  
  2. Notes
    - This table had CASCADE delete on student_id and course_id
    - All enrollment data will be permanently deleted
*/

-- Drop policies first
DROP POLICY IF EXISTS "Users can view their own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Users can create their own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Admins can view all enrollments" ON enrollments;
DROP POLICY IF EXISTS "Admins can manage all enrollments" ON enrollments;

-- Drop the enrollments table
DROP TABLE IF EXISTS enrollments CASCADE;
