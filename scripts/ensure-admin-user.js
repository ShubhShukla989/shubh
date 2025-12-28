/**
 * Ensure Admin User Exists
 * Creates a default admin user if none exists
 */

const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

async function ensureAdminUser() {
  try {
    // Database path - use same as main app
    const dbPath = path.join(process.cwd(), 'database', 'epapercms.db');
    const db = new Database(dbPath);

    console.log('🔍 Checking for existing admin users...');

    // Check if any admin users exist
    const adminUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE role_id = 1').get();
    
    if (adminUsers.count > 0) {
      console.log('✅ Admin user already exists');
      db.close();
      return;
    }

    console.log('👤 Creating default admin user...');

    // Create default admin user
    const adminPassword = bcrypt.hashSync('admin123', 10);
    
    const insertUser = db.prepare(`
      INSERT INTO users (
        fullname, email, password_hash, role, role_id, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertUser.run(
      'Super Admin',
      'admin@example.com',
      adminPassword,
      'Super Admin',
      1,
      'Active',
      new Date().toISOString(),
      new Date().toISOString()
    );

    console.log('✅ Default admin user created successfully!');
    console.log('📧 Email: admin@example.com');
    console.log('🔑 Password: admin123');
    console.log('⚠️  Please change the password after first login!');

    db.close();
  } catch (error) {
    console.error('❌ Error ensuring admin user:', error);
    process.exit(1);
  }
}

ensureAdminUser();