-- ============================================
-- Database Migration for Backend Fixes
-- ============================================

-- 1. Add telegram_chat_id column to websites table
ALTER TABLE websites ADD COLUMN IF NOT EXISTS telegram_chat_id VARCHAR(255);

-- 2. Update current_status column to use new values
-- First, convert existing data
UPDATE websites SET current_status = 'online' WHERE current_status = 'up';
UPDATE websites SET current_status = 'offline' WHERE current_status = 'down';
UPDATE websites SET current_status = 'warning' WHERE current_status = 'unknown';

-- 3. Update check_logs status column
UPDATE check_logs SET status = 'online' WHERE status = 'up';
UPDATE check_logs SET status = 'offline' WHERE status = 'down';

-- 4. Note: For production, you may want to add a CHECK constraint
-- ALTER TABLE websites DROP CONSTRAINT IF EXISTS websites_status_check;
-- ALTER TABLE websites ADD CONSTRAINT websites_status_check 
--   CHECK (current_status IN ('online', 'warning', 'offline'));

-- 5. Note: For check_logs table
-- ALTER TABLE check_logs DROP CONSTRAINT IF EXISTS check_logs_status_check;
-- ALTER TABLE check_logs ADD CONSTRAINT check_logs_status_check 
--   CHECK (status IN ('online', 'offline'));

-- ============================================
-- End of Migration
-- ============================================