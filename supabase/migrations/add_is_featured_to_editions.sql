-- Add is_featured column to editions table
ALTER TABLE editions 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

-- Add index for faster queries on featured editions
CREATE INDEX IF NOT EXISTS idx_editions_is_featured ON editions(is_featured);
