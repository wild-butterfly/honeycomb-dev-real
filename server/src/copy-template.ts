import { pool } from './db';

(async () => {
  try {
    console.log('=== COPYING TEMPLATE TO TESLA COMPANY ===\n');
    
    // Get source template from Company 1
    const source = await pool.query(
      'SELECT * FROM invoice_templates WHERE id = 5 AND company_id = 1'
    );
    
    if (source.rows.length === 0) {
      console.log('ERROR: Source template not found');
      process.exit(1);
    }
    
    const tpl = source.rows[0];
    console.log('Source template:', tpl.name, '\n');
    
    // Unset other defaults for Company 2
    await pool.query('UPDATE invoice_templates SET is_default = false WHERE company_id = 2');
    
    // Copy template to Company 2
    const insert = await pool.query(
      `INSERT INTO invoice_templates (
        company_id, name, status, main_color, accent_color, text_color, 
        font_size, indent_customer_address, orientation, header_background_color, 
        border_color, border_width, table_header_background_color, 
        table_header_gradient_color, table_header_text_color, table_header_style, 
        description_background_color, description_border_color, description_text_color, 
        show_company_logo, document_title, show_line_quantities, show_line_prices, 
        show_line_totals, show_section_totals, show_labour_items, 
        show_labour_quantities, show_labour_prices, show_labour_totals, 
        show_labour_section_totals, show_material_items, show_material_quantities, 
        show_material_prices, show_material_totals, show_material_section_totals, 
        default_description, default_footer, sections, created_at, updated_at, is_default
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 
        $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, 
        $31, $32, $33, $34, $35, $36, $37, $38, NOW(), NOW(), $39
      ) RETURNING id, name, is_default`,
      [
        2, tpl.name, tpl.status, tpl.main_color, tpl.accent_color, tpl.text_color,
        tpl.font_size, tpl.indent_customer_address, tpl.orientation, tpl.header_background_color,
        tpl.border_color, tpl.border_width, tpl.table_header_background_color,
        tpl.table_header_gradient_color, tpl.table_header_text_color, tpl.table_header_style,
        tpl.description_background_color, tpl.description_border_color, tpl.description_text_color,
        tpl.show_company_logo, tpl.document_title, tpl.show_line_quantities, tpl.show_line_prices,
        tpl.show_line_totals, tpl.show_section_totals, tpl.show_labour_items,
        tpl.show_labour_quantities, tpl.show_labour_prices, tpl.show_labour_totals,
        tpl.show_labour_section_totals, tpl.show_material_items, tpl.show_material_quantities,
        tpl.show_material_prices, tpl.show_material_totals, tpl.show_material_section_totals,
        tpl.default_description, tpl.default_footer, tpl.sections, true
      ]
    );
    
    console.log('✅ New template created for Tesla:');
    console.log('  ID:', insert.rows[0].id);
    console.log('  Name:', insert.rows[0].name);
    console.log('  Is Default:', insert.rows[0].is_default);
    
    console.log('\n=== VERIFICATION ===');
    const verify = await pool.query(
      'SELECT id, name, is_default, table_header_background_color FROM invoice_templates WHERE company_id = 2'
    );
    verify.rows.forEach((r: any) => {
      console.log('Company 2 Template:', r.id, r.name, r.is_default ? '(DEFAULT)' : '', r.table_header_background_color);
    });
    
    process.exit(0);
  } catch (e: any) {
    console.error('ERROR:', e.message);
    process.exit(1);
  }
})();
