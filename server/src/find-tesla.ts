import { pool } from './db';

(async () => {
  try {
    // Find Tesla
    const tesla = await pool.query(
      "SELECT id, name FROM companies WHERE name = 'Tesla'"
    );

    if (tesla.rows.length > 0) {
      console.log('Tesla company:', tesla.rows[0]);
    } else {
      console.log('No company named Tesla');
    }

    // List all companies
    const all = await pool.query('SELECT id, name FROM companies ORDER BY id');
    console.log('\nAll companies:');
    all.rows.forEach((r: any) => console.log(`ID: ${r.id} | Name: ${r.name}`));

    // Check current user's company
    const user = await pool.query(
      "SELECT id, company_id FROM users WHERE email = 'test@example.com' LIMIT 1"
    );
    if (user.rows.length > 0) {
      console.log('\nTest user company_id:', user.rows[0].company_id);
    }

    process.exit(0);
  } catch (e: any) {
    console.error('ERROR:', e.message);
    process.exit(1);
  }
})();
