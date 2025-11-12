-- Create a function to automatically publish scheduled editions
-- This function will be called periodically to check and publish editions

CREATE OR REPLACE FUNCTION auto_publish_scheduled_editions()
RETURNS void AS $$
BEGIN
  UPDATE editions
  SET status = 'published'
  WHERE status = 'scheduled'
    AND scheduled_date IS NOT NULL
    AND scheduled_date <= NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a cron job to run this function every minute (requires pg_cron extension)
-- Note: You may need to enable pg_cron extension in Supabase dashboard first
-- Alternatively, you can call this function from your API or use Supabase Edge Functions

-- If pg_cron is available:
-- SELECT cron.schedule('auto-publish-editions', '* * * * *', 'SELECT auto_publish_scheduled_editions()');
