// Quick fix script to reset avatars and create A1 Testing admin
const { pool } = require('./src/db');

async function fixAvatarsAndUsers() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Starting database fix...\n');
    
    // Step 1: Reset all avatars
    console.log('1️⃣ Resetting all avatars to default...');
    const resetResult = await client.query('UPDATE users SET avatar = NULL');
    console.log(`   ✅ Reset ${resetResult.rowCount} user avatar(s)\n`);
    
    // Step 2: Check companies
    console.log('2️⃣ Checking companies...');
    const companiesResult = await client.query('SELECT id, name FROM companies ORDER BY id');
    companiesResult.rows.forEach(c => {
      console.log(`   - Company ID ${c.id}: ${c.name}`);
    });
    console.log('');
    
    // Step 3: Create A1 Testing admin if doesn't exist
    console.log('3️⃣ Creating A1 Testing admin user...');
    const insertResult = await client.query(`
      INSERT INTO users (
        email, 
        password_hash, 
        role, 
        company_id, 
        full_name,
        phone,
        job_title,
        department,
        active,
        created_at
      ) VALUES (
        'admin@a1testing.com',
        '$2b$10$N9qo8uLOickgx2ZMRZoMy.xRygO8R3Yp3k0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z',
        'admin',
        1,
        'A1 Testing Admin',
        '',
        'Administrator',
        'Management',
        true,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (email) DO NOTHING
      RETURNING id, email
    `);
    
    if (insertResult.rowCount > 0) {
      console.log(`   ✅ Created new admin: ${insertResult.rows[0].email} (ID: ${insertResult.rows[0].id})`);
    } else {
      console.log(`   ℹ️  Admin user already exists: admin@a1testing.com`);
    }
    console.log('');
    
    // Step 4: Show final user state
    console.log('4️⃣ Final user state:');
    const usersResult = await client.query(`
      SELECT 
        u.id,
        u.email,
        u.role,
        u.company_id,
        c.name as company_name,
        u.full_name,
        u.avatar
      FROM users u
      LEFT JOIN companies c ON u.company_id = c.id
      WHERE u.active = true
      ORDER BY u.id
    `);
    
    console.table(usersResult.rows);
    
    console.log('\n✅ Database fix completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Restart your backend server');
    console.log('   2. Refresh your browser');
    console.log('   3. Switch between companies to verify separate profiles\n');
    
  } catch (error) {
    console.error('❌ Error fixing database:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixAvatarsAndUsers();
