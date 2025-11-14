/*
  # Fix Support Tickets INSERT Policy

  1. Changes
    - Drop the overly broad "Admin can manage all tickets" FOR ALL policy
    - Add specific INSERT policy for admins
    - Keep existing policies for SELECT, UPDATE

  2. Security
    - Users can insert their own tickets
    - Admins can insert tickets on behalf of others
*/

DROP POLICY IF EXISTS "Admin can manage all tickets" ON support_tickets;

CREATE POLICY "Admin can insert tickets"
  ON support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'principal', 'head')
    )
  );

CREATE POLICY "Admin can update all tickets"
  ON support_tickets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'principal', 'head')
    )
  );

CREATE POLICY "Admin can delete tickets"
  ON support_tickets FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'principal', 'head')
    )
  );
