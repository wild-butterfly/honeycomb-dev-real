import { pool } from './db';

(async () => {
  try {
    console.log('Checking all templates for sections data...\n');
    
    const all = await pool.query(
      'SELECT id, name, sections FROM invoice_templates ORDER BY id'
    );
    
    console.log('All templates:');
    all.rows.forEach((t: any) => {
      console.log(`ID: ${t.id} | Name: ${t.name}`);
      console.log(`  Sections type: ${typeof t.sections}`);
      console.log(`  Sections value: ${JSON.stringify(t.sections)}`);
      console.log('  ---');
    });
    
    process.exit(0);
  } catch (e: any) {
    console.error('ERROR:', e.message);
    process.exit(1);
  }
})();
