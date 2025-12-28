const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');

async function createAdminUser() {
  const db = new Database('./database/epapercms.db');
  
  // Check if admin user already exists
  const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@epaper.com');
  
  if (existingUser) {
    console.log('Admin user already exists!');
    console.log('Email: admin@epaper.com');
    console.log('Password: admin123');
    return;
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  // Insert admin user
  const stmt = db.prepare(`
    INSERT INTO users (fullname, email, password_hash, role, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);
  
  const result = stmt.run(
    'Administrator',
    'admin@epaper.com', 
    hashedPassword,
    'Super Admin',
    'Active'
  );
  
  console.log('✅ Admin user created successfully!');
  console.log('Email: admin@epaper.com');
  console.log('Password: admin123');
  console.log('Role: Super Admin');
  
  db.close();
}

createAdminUser().catch(console.error);