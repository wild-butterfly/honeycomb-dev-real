const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT || 5432,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
});

async function verify() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'invoice_templates' 
      ORDER BY ordinal_position
    `);
    
    console.log('✅ invoice_templates table created with', result.rows.length, 'columns:');
    result.rows.forEach(row => {
      console.log(`   - ${row.column_name} (${row.data_type})`);
    });

    const countResult = await pool.query(`SELECT COUNT(*) FROM invoice_templates`);
    console.log('\n✅ Default templates created:', countResult.rows[0].count);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

verify();
