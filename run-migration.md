# Run Database Migration

## Steps to add missing columns to edition_pages table:

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste this SQL:

```sql
-- Add metadata columns to edition_pages table
ALTER TABLE edition_pages 
ADD COLUMN IF NOT EXISTS title TEXT;

ALTER TABLE edition_pages 
ADD COLUMN IF NOT EXISTS alias TEXT;

ALTER TABLE edition_pages 
ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE edition_pages 
ADD COLUMN IF NOT EXISTS category TEXT;

-- Update existing rows with default values
UPDATE edition_pages 
SET 
  title = COALESCE(title, 'Page ' || page_number),
  alias = COALESCE(alias, 'page-' || page_number),
  description = COALESCE(description, ''),
  category = COALESCE(category, '')
WHERE title IS NULL OR alias IS NULL OR description IS NULL OR category IS NULL;

-- Add index on alias for faster lookups
CREATE INDEX IF NOT EXISTS idx_edition_pages_alias ON edition_pages(alias);
```

5. Click "Run" button
6. You should see "Success. No rows returned"

### Option 2: Using psql command line

If you have direct database access:

```bash
psql YOUR_DATABASE_URL -f supabase/migrations/20251128_add_page_metadata_columns.sql
```

### Verify Migration

After running the migration, verify it worked:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'edition_pages';
```

You should see the new columns: title, alias, description, category

## After Migration

Once the migration is complete, the Edit Page modal will work properly and save data to the database!
