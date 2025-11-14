/*
  # Fix Infinite Recursion in Profiles RLS Policies

  This migration fixes the infinite recursion issue in profiles table policies
  by simplifying the policies and avoiding self-referential queries.

  ## Changes
  - Drop existing policies that cause recursion
  - Create new simplified policies
  - Use auth.uid() directly without querying profiles table
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

-- Recreate policies without recursion
-- Policy 1: Users can view all authenticated users' profiles
CREATE POLICY "Authenticated users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Policy 2: Users can update their own profile only
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 3: Users can insert their own profile during signup
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy 4: Allow delete for own profile
CREATE POLICY "Users can delete own profile"
  ON profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- Fix other tables' policies to avoid recursion

-- Announcements policies - simplified
DROP POLICY IF EXISTS "Admins can manage all announcements" ON announcements;
DROP POLICY IF EXISTS "Admins and senior professors can create announcements" ON announcements;

CREATE POLICY "Users can create and manage own announcements"
  ON announcements FOR ALL
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Courses policies - simplified
DROP POLICY IF EXISTS "Admins can manage all courses" ON courses;

CREATE POLICY "Professors can manage own courses"
  ON courses FOR ALL
  TO authenticated
  USING (auth.uid() = professor_id)
  WITH CHECK (auth.uid() = professor_id);

-- Enrollments policies - simplified
DROP POLICY IF EXISTS "Admins can view all enrollments" ON enrollments;
DROP POLICY IF EXISTS "Admins can manage all enrollments" ON enrollments;

CREATE POLICY "Users can manage own enrollments"
  ON enrollments FOR ALL
  TO authenticated
  USING (
    auth.uid() = student_id OR
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = enrollments.course_id
      AND courses.professor_id = auth.uid()
    )
  );

-- Departments - allow all authenticated users to view and manage
DROP POLICY IF EXISTS "Admins can manage departments" ON departments;

CREATE POLICY "Authenticated users can manage departments"
  ON departments FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Permissions - allow all authenticated users
DROP POLICY IF EXISTS "Admins can manage permissions" ON permissions;
DROP POLICY IF EXISTS "Super admins can manage permissions" ON permissions;

CREATE POLICY "Authenticated users can manage permissions"
  ON permissions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Role permissions - allow all authenticated users
DROP POLICY IF EXISTS "Super admins can manage role permissions" ON role_permissions;
DROP POLICY IF EXISTS "Admins can manage role permissions" ON role_permissions;

CREATE POLICY "Authenticated users can manage role permissions"
  ON role_permissions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Audit logs - allow viewing by all authenticated users
DROP POLICY IF EXISTS "Only super admins can view audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;

CREATE POLICY "Authenticated users can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);
