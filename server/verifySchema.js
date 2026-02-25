const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'password',
  database: 'honeycomb'
});

(async () => {
  try {
    const result = await pool.query(
      'SELECT column_name FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position',
      ['companies']
    );
    console.log('\n✅ Companies table columns:');
    result.rows.forEach(row => console.log('   ' + row.column_name));
    
    const check = await pool.query(
      'SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND column_name = ANY($2)',
      ['companies', ['logo_url', 'updated_at', 'avatar']]
    );
    
    console.log('\n✅ Required columns status:');
    const cols = check.rows.map(r => r.column_name);
    console.log('   logo_url:', cols.includes('logo_url') ? '✅ EXISTS' : '❌ MISSING');
    console.log('   updated_at:', cols.includes('updated_at') ? '✅ EXISTS' : '❌ MISSING');
    console.log('   avatar:', cols.includes('avatar') ? '✅ EXISTS' : '❌ MISSING');
    
    pool.end();
  } catch (err) {
    console.error('❌ ERROR:', err.message);
    pool.end();
    process.exit(1);
  }
})();
