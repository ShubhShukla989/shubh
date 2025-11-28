-- Add linked_page_number column to area_maps table for page navigation
ALTER TABLE area_maps 
ADD COLUMN IF NOT EXISTS linked_page_number INTEGER;

-- Add comment
COMMENT ON COLUMN area_maps.linked_page_number IS 'Page number to navigate to when area is clicked';
