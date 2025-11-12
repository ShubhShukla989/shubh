-- First, update any existing statuses to lowercase
UPDATE editions SET status = LOWER(status) WHERE status IS NOT NULL;

-- Drop the old constraint
ALTER TABLE editions DROP CONSTRAINT IF EXISTS editions_status_check;

-- Add new constraint that includes 'scheduled'
ALTER TABLE editions 
ADD CONSTRAINT editions_status_check 
CHECK (status IN ('draft', 'processing', 'published', 'scheduled'));
