/*
  # Remove Unused Tables

  ## Changes
  This migration removes tables that are no longer needed:
  1. audit_logs - Audit logging functionality
  2. chat_messages - Old chat messages (replaced by messages table)
  3. chat_sessions - Old chat sessions

  ## Notes
  - Using IF EXISTS to prevent errors if tables don't exist
  - CASCADE will remove all related foreign key constraints
*/

DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_sessions CASCADE;
