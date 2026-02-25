const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'password',
  database: 'honeycomb'
});

async function check() {
  try {
    const result = await pool.query(
      'SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND column_name = $2',
      ['companies', 'logo_url']
    );
    
    if (result.rows.length > 0) {
      console.log('✅ logo_url column EXISTS in companies table');
      process.exit(0);
    } else {
      console.log('❌ logo_url column NOT FOUND');
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ ERROR:', err.message);
    process.exit(1);
  } finally {
    pool.end();
  }
}

check();
