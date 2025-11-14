/*
  # Add image support to support tickets

  1. Changes
    - Add image_url column to support_tickets table
    - Add attachments jsonb column for multiple images

  2. Notes
    - Stores image URLs from Supabase storage
    - Supports multiple attachments per ticket
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'support_tickets' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE support_tickets ADD COLUMN image_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'support_tickets' AND column_name = 'attachments'
  ) THEN
    ALTER TABLE support_tickets ADD COLUMN attachments jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;
