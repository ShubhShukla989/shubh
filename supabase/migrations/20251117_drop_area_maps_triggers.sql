-- Drop all triggers on area_maps table
DO $$ 
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_table = 'area_maps'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_record.trigger_name || ' ON area_maps CASCADE';
        RAISE NOTICE 'Dropped trigger: %', trigger_record.trigger_name;
    END LOOP;
END $$;

-- Drop any functions that might be related to area_number
DROP FUNCTION IF EXISTS set_area_number() CASCADE;
DROP FUNCTION IF EXISTS assign_area_number() CASCADE;
DROP FUNCTION IF EXISTS auto_assign_area_number() CASCADE;

-- List remaining triggers (should be empty)
SELECT trigger_name, event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'area_maps';
