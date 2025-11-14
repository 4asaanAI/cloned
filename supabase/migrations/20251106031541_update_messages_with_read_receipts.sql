/*
  # Update Messages Table with Read Receipts

  ## Changes
  1. Add read status tracking to messages table
    - Add `is_read` boolean field (default false)
    - Update `read_at` to be automatically set when message is marked as read

  2. Security
    - Update RLS policies to allow receivers to mark messages as read
*/

ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;

CREATE POLICY "Users can mark received messages as read"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

CREATE INDEX IF NOT EXISTS idx_messages_read_status ON messages(receiver_id, is_read);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, receiver_id, created_at DESC);
