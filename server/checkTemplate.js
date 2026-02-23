const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT || 5432,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
});

(async () => {
  // Get all recent invoices
  const allInvoices = await pool.query(
    "SELECT id, invoice_number, company_id FROM invoices WHERE company_id = 2 ORDER BY created_at DESC LIMIT 5"
  );
  
  console.log('Recent Invoices for Tesla (company_id=2):');
  allInvoices.rows.forEach(inv => {
    console.log(`  - ${inv.invoice_number} (ID: ${inv.id})`);
  });
  
  // Get template for company 2 (Tesla)
  const tmplResult = await pool.query(
    'SELECT id, name, sections, show_company_logo FROM invoice_templates WHERE company_id = 2 AND is_default = true'
  );
  
  if (tmplResult.rows.length > 0) {
    const template = tmplResult.rows[0];
    console.log('\nDefault Template for Tesla:');
    console.log('  Template ID:', template.id);
    console.log('  Template Name:', template.name);
    console.log('  Show Company Logo:', template.show_company_logo);
    
    const sections = typeof template.sections === 'string' 
      ? JSON.parse(template.sections)
      : template.sections;
    
    console.log('  Sections Count:', sections.length);
    console.log('\nSections Data:');
    console.log(JSON.stringify(sections, null, 2));
  } else {
    console.log('\nNO TEMPLATE FOUND for Tesla');
  }
  
  await pool.end();
})();
