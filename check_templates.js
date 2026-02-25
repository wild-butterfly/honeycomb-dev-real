const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'honeycomb',
  user: 'postgres',
  password: 'password'
});

(async () => {
  try {
    // Get all templates
    const result = await pool.query(
      'SELECT id, name, company_id, is_default, main_color, created_at FROM invoice_templates ORDER BY created_at DESC LIMIT 10'
    );
    
    console.log('\n=== RECENT TEMPLATES IN DATABASE ===\n');
    if (result.rows.length === 0) {
      console.log('No templates found!');
    } else {
      result.rows.forEach(row => {
        console.log(`ID: ${row.id}`);
        console.log(`  Name: ${row.name || 'NULL ⚠️'}`);
        console.log(`  Company: ${row.company_id}`);
        console.log(`  Default: ${row.is_default}`);
        console.log(`  Color: ${row.main_color}`);
        console.log(`  Created: ${row.created_at}`);
        console.log('---');
      });
    }
    
    // Also check for any with null names
    const nullNames = await pool.query(
      'SELECT id, company_id, created_at FROM invoice_templates WHERE name IS NULL'
    );
    
    if (nullNames.rows.length > 0) {
      console.log('\n⚠️  WARNING: Found templates with NULL names:');
      nullNames.rows.forEach(row => {
        console.log(`  ID: ${row.id}, Company: ${row.company_id}, Created: ${row.created_at}`);
      });
    }
    
    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
