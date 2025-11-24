-- Role-Based Access Control (RBAC) System

-- Drop existing tables if needed (comment out if you want to keep existing data)
-- DROP TABLE IF EXISTS role_permissions CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP TABLE IF EXISTS permissions CASCADE;
-- DROP TABLE IF EXISTS roles CASCADE;

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
  id SERIAL PRIMARY KEY,
  role_id INTEGER,
  permission_key TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(role_id, permission_key)
);

-- Add foreign keys for role_permissions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'role_permissions_role_id_fkey'
  ) THEN
    ALTER TABLE role_permissions ADD CONSTRAINT role_permissions_role_id_fkey 
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'role_permissions_permission_key_fkey'
  ) THEN
    ALTER TABLE role_permissions ADD CONSTRAINT role_permissions_permission_key_fkey 
    FOREIGN KEY (permission_key) REFERENCES permissions(key) ON DELETE CASCADE;
  END IF;
END $$;

-- Create users table (if not exists)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  fullname TEXT,
  mobile TEXT,
  role_id INTEGER DEFAULT 2,
  status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add foreign key constraint if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'users_role_id_fkey'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_role_id_fkey 
    FOREIGN KEY (role_id) REFERENCES roles(id);
  END IF;
END $$;

-- Insert default roles
INSERT INTO roles (id, name, description) VALUES
  (1, 'Super Admin', 'Full access to all features'),
  (2, 'Admin', 'Limited access based on permissions')
ON CONFLICT (id) DO NOTHING;

-- Insert all available permissions
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

-- Grant Super Admin all permissions
INSERT INTO role_permissions (role_id, permission_key)
SELECT 1, key FROM permissions
ON CONFLICT (role_id, permission_key) DO NOTHING;

-- Grant Admin basic permissions (can be customized)
INSERT INTO role_permissions (role_id, permission_key) VALUES
  (2, 'view_dashboard'),
  (2, 'view_editions'),
  (2, 'view_pages'),
  (2, 'view_media')
ON CONFLICT (role_id, permission_key) DO NOTHING;

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all for authenticated" ON roles;
DROP POLICY IF EXISTS "Allow all for authenticated" ON permissions;
DROP POLICY IF EXISTS "Allow all for authenticated" ON role_permissions;
DROP POLICY IF EXISTS "Allow all for authenticated" ON users;

-- RLS Policies
CREATE POLICY "Allow all for authenticated" ON roles FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON permissions FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON role_permissions FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON users FOR ALL USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_key ON role_permissions(permission_key);

COMMENT ON TABLE roles IS 'User roles (Super Admin, Admin)';
COMMENT ON TABLE permissions IS 'Available system permissions';
COMMENT ON TABLE role_permissions IS 'Maps roles to their permissions';
COMMENT ON TABLE users IS 'System users with role assignments';
