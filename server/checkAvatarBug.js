const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT || 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'password',
  database: process.env.PGDATABASE || 'honeycomb'
});

(async () => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.company_id,
        c.name as company_name,
        u.email,
        u.full_name,
        u.avatar,
        u.role,
        u.active
      FROM users u
      LEFT JOIN companies c ON u.company_id = c.id
      ORDER BY c.name, u.id
    `);
    
    console.log('\n=== USERS AND AVATARS BY COMPANY ===\n');
    result.rows.forEach(row => {
      console.log(`Company: ${row.company_name || 'N/A'} | User: ${row.full_name} (${row.email}) | Avatar: ${row.avatar || 'NONE'} | Role: ${row.role}`);
    });

    // Check for duplicate avatars
    console.log('\n=== CHECKING FOR DUPLICATE AVATARS ===\n');
    const avatars = {};
    result.rows.forEach(row => {
      if (row.avatar) {
        if (!avatars[row.avatar]) {
          avatars[row.avatar] = [];
        }
        avatars[row.avatar].push(`${row.full_name} (${row.company_name})`);
      }
    });

    Object.entries(avatars).forEach(([avatar, users]) => {
      if (users.length > 1) {
        console.log(`⚠️  DUPLICATE AVATAR: ${avatar}`);
        users.forEach(user => console.log(`   - ${user}`));
      }
    });
    
    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
