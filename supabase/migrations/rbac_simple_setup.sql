-- Simple RBAC Setup - Run this step by step

-- Step 1: Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Step 2: Insert roles
INSERT INTO roles (id, name, description) VALUES
  (1, 'Super Admin', 'Full access to all features'),
  (2, 'Admin', 'Limited access based on permissions')
ON CONFLICT (id) DO NOTHING;

-- Step 3: Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Step 4: Insert permissions
INSERT INTO permissions (key, name, description, category) VALUES
  -- Dashboard
  ('view_dashboard', 'View Dashboard', 'Access to main dashboard', 'Dashboard'),
  
  -- Editions
  ('view_editions', 'View Editions', 'View editions list', 'Editions'),
  ('create_editions', 'Create Editions', 'Create new editions', 'Editions'),
  ('edit_editions', 'Edit Editions', 'Edit existing editions', 'Editions'),
  ('delete_editions', 'Delete Editions', 'Delete editions', 'Editions'),
  ('publish_editions', 'Publish Editions', 'Publish/unpublish editions', 'Editions'),
  ('extract_pages', 'Extract Pages', 'Extract pages from PDF', 'Editions'),
  
  -- Pages
  ('view_pages', 'View Pages', 'View pages list', 'Pages'),
  ('create_pages', 'Create Pages', 'Create new pages', 'Pages'),
  ('edit_pages', 'Edit Pages', 'Edit existing pages', 'Pages'),
  ('delete_pages', 'Delete Pages', 'Delete pages', 'Pages'),
  ('manage_area_maps', 'Manage Area Maps', 'Create/edit area maps', 'Pages'),
  
  -- Media
  ('view_media', 'View Media', 'View media library', 'Media'),
  ('upload_media', 'Upload Media', 'Upload new media files', 'Media'),
  ('delete_media', 'Delete Media', 'Delete media files', 'Media'),
  
  -- Menus
  ('view_menus', 'View Menus', 'View menus list', 'Menus'),
  ('create_menus', 'Create Menus', 'Create new menus', 'Menus'),
  ('edit_menus', 'Edit Menus', 'Edit existing menus', 'Menus'),
  ('delete_menus', 'Delete Menus', 'Delete menus', 'Menus'),
  
  -- Categories
  ('view_categories', 'View Categories', 'View categories list', 'Categories'),
  ('create_categories', 'Create Categories', 'Create new categories', 'Categories'),
  ('edit_categories', 'Edit Categories', 'Edit existing categories', 'Categories'),
  ('delete_categories', 'Delete Categories', 'Delete categories', 'Categories'),
  
  -- Sliders
  ('view_sliders', 'View Sliders', 'View sliders list', 'Sliders'),
  ('create_sliders', 'Create Sliders', 'Create new sliders', 'Sliders'),
  ('edit_sliders', 'Edit Sliders', 'Edit existing sliders', 'Sliders'),
  ('delete_sliders', 'Delete Sliders', 'Delete sliders', 'Sliders'),
  
  -- Designer
  ('view_designer', 'View Designer', 'Access page designer', 'Designer'),
  ('edit_layouts', 'Edit Layouts', 'Edit page layouts', 'Designer'),
  
  -- Users
  ('view_users', 'View Users', 'View users list', 'Users'),
  ('create_users', 'Create Users', 'Create new users', 'Users'),
  ('edit_users', 'Edit Users', 'Edit existing users', 'Users'),
  ('delete_users', 'Delete Users', 'Delete users', 'Users'),
  ('manage_permissions', 'Manage Permissions', 'Manage role permissions', 'Users'),
  
  -- Settings
  ('view_settings', 'View Settings', 'View system settings', 'Settings'),
  ('edit_settings', 'Edit Settings', 'Edit system settings', 'Settings')
ON CONFLICT (key) DO NOTHING;

-- Step 5: Create role_permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
  id SERIAL PRIMARY KEY,
  role_id INTEGER NOT NULL,
  permission_key TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(role_id, permission_key)
);

-- Step 6: Add foreign keys
ALTER TABLE role_permissions 
  DROP CONSTRAINT IF EXISTS role_permissions_role_id_fkey;
  
ALTER TABLE role_permissions 
  ADD CONSTRAINT role_permissions_role_id_fkey 
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE;

ALTER TABLE role_permissions 
  DROP CONSTRAINT IF EXISTS role_permissions_permission_key_fkey;
  
ALTER TABLE role_permissions 
  ADD CONSTRAINT role_permissions_permission_key_fkey 
  FOREIGN KEY (permission_key) REFERENCES permissions(key) ON DELETE CASCADE;

-- Step 7: Grant Super Admin all permissions
DELETE FROM role_permissions WHERE role_id = 1;

INSERT INTO role_permissions (role_id, permission_key)
SELECT 1, key FROM permissions
ON CONFLICT (role_id, permission_key) DO NOTHING;

-- Step 8: Grant Admin basic permissions
DELETE FROM role_permissions WHERE role_id = 2;

INSERT INTO role_permissions (role_id, permission_key) VALUES
  (2, 'view_dashboard'),
  (2, 'view_editions'),
  (2, 'view_pages'),
  (2, 'view_media')
ON CONFLICT (role_id, permission_key) DO NOTHING;

-- Step 9: Add role_id column to users table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'role_id'
  ) THEN
    ALTER TABLE users ADD COLUMN role_id INTEGER DEFAULT 2;
  END IF;
END $$;

-- Step 10: Update existing users (set first user as Super Admin)
UPDATE users SET role_id = 1 WHERE id = (SELECT MIN(id) FROM users);
UPDATE users SET role_id = 2 WHERE role_id IS NULL;

-- Step 11: Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Step 12: Create RLS policies
DROP POLICY IF EXISTS "Allow all for authenticated" ON roles;
DROP POLICY IF EXISTS "Allow all for authenticated" ON permissions;
DROP POLICY IF EXISTS "Allow all for authenticated" ON role_permissions;

CREATE POLICY "Allow all for authenticated" ON roles FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON permissions FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON role_permissions FOR ALL USING (true);

-- Step 13: Create indexes
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_key ON role_permissions(permission_key);

-- Done! Verify with:
SELECT 'Roles:', COUNT(*) FROM roles;
SELECT 'Permissions:', COUNT(*) FROM permissions;
SELECT 'Role Permissions:', COUNT(*) FROM role_permissions;
SELECT 'Users with roles:', COUNT(*) FROM users WHERE role_id IS NOT NULL;
