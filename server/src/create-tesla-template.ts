import { pool } from './db';

(async () => {
  try {
    console.log('=== CREATING TESLA TEMPLATE WITH SECTIONS ===\n');

    // Get the source template from Company 1
    const source = await pool.query(
      'SELECT * FROM invoice_templates WHERE id = 5 AND company_id = 1'
    );

    if (source.rows.length === 0) {
      console.log('ERROR: Source template not found');
      process.exit(1);
    }

    const tpl = source.rows[0];
    console.log('Source template found:', tpl.name);
    console.log('Source sections:', tpl.sections);
    console.log('Source show_company_logo:', tpl.show_company_logo);

    // Ensure sections is a proper JSON array
    const sectionsToSave = Array.isArray(tpl.sections)
      ? tpl.sections
      : typeof tpl.sections === 'string'
      ? JSON.parse(tpl.sections)
      : [];

    console.log('\nSections to save:', JSON.stringify(sectionsToSave, null, 2));

    // First, unset other defaults for Company 2
    await pool.query(
      'UPDATE invoice_templates SET is_default = false WHERE company_id = 2'
    );
    console.log('✅ Cleared other defaults for Company 2');

    // Insert the template with proper JSON serialization
    const insert = await pool.query(
      `INSERT INTO invoice_templates (
        company_id, name, is_default, status, main_color, accent_color, text_color,
        font_size, indent_customer_address, orientation, header_background_color,
        border_color, border_width, table_header_background_color, table_header_gradient_color,
        table_header_text_color, table_header_style, description_background_color,
        description_border_color, description_text_color, show_company_logo, document_title,
        show_line_quantities, show_line_prices, show_line_totals, show_section_totals, show_line_items,
        show_labour_quantities, show_labour_prices, show_labour_totals, show_labour_section_totals,
        show_labour_items, show_material_quantities, show_material_prices, show_material_totals,
        show_material_section_totals, show_material_items, default_description, default_footer,
        sections, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38,
        $39, $40, NOW(), NOW()
      ) RETURNING id, name, is_default, sections, show_company_logo`,
      [
        2, // company_id
        tpl.name,
        true, // is_default
        tpl.status || 'active',
        tpl.main_color,
        tpl.accent_color,
        tpl.text_color,
        tpl.font_size,
        tpl.indent_customer_address || false,
        tpl.orientation || 'portrait',
        tpl.header_background_color,
        tpl.border_color,
        tpl.border_width,
        tpl.table_header_background_color,
        tpl.table_header_gradient_color,
        tpl.table_header_text_color,
        tpl.table_header_style,
        tpl.description_background_color,
        tpl.description_border_color,
        tpl.description_text_color,
        tpl.show_company_logo !== undefined ? tpl.show_company_logo : true,
        tpl.document_title,
        tpl.show_line_quantities !== undefined ? tpl.show_line_quantities : true,
        tpl.show_line_prices !== undefined ? tpl.show_line_prices : true,
        tpl.show_line_totals !== undefined ? tpl.show_line_totals : true,
        tpl.show_section_totals !== undefined ? tpl.show_section_totals : true,
        tpl.show_line_items !== undefined ? tpl.show_line_items : true,
        tpl.show_labour_quantities !== undefined ? tpl.show_labour_quantities : true,
        tpl.show_labour_prices !== undefined ? tpl.show_labour_prices : true,
        tpl.show_labour_totals !== undefined ? tpl.show_labour_totals : true,
        tpl.show_labour_section_totals !== undefined ? tpl.show_labour_section_totals : true,
        tpl.show_labour_items !== undefined ? tpl.show_labour_items : true,
        tpl.show_material_quantities !== undefined ? tpl.show_material_quantities : true,
        tpl.show_material_prices !== undefined ? tpl.show_material_prices : true,
        tpl.show_material_totals !== undefined ? tpl.show_material_totals : true,
        tpl.show_material_section_totals !== undefined ? tpl.show_material_section_totals : true,
        tpl.show_material_items !== undefined ? tpl.show_material_items : true,
        tpl.default_description,
        tpl.default_footer,
        JSON.stringify(sectionsToSave), // Ensure sections is JSON stringified
      ]
    );

    const newTemplate = insert.rows[0];
    console.log('\n✅ Template created for Tesla (Company 2):');
    console.log('  ID:', newTemplate.id);
    console.log('  Name:', newTemplate.name);
    console.log('  Is Default:', newTemplate.is_default);
    console.log('  Show Logo:', newTemplate.show_company_logo);
    console.log('  Sections:', newTemplate.sections);

    // Verify it was saved
    console.log('\n=== VERIFICATION ===');
    const verify = await pool.query(
      `SELECT id, name, is_default, show_company_logo, sections, table_header_background_color
       FROM invoice_templates WHERE company_id = 2 AND is_default = true`
    );

    if (verify.rows.length > 0) {
      const v = verify.rows[0];
      console.log('✅ DEFAULT TEMPLATE FOR COMPANY 2:');
      console.log('  ID:', v.id);
      console.log('  Name:', v.name);
      console.log('  Show Logo:', v.show_company_logo);
      console.log('  Color:', v.table_header_background_color);
      console.log('  Sections saved:', v.sections);
    } else {
      console.log('❌ NO DEFAULT TEMPLATE FOUND FOR COMPANY 2');
    }

    process.exit(0);
  } catch (e: any) {
    console.error('ERROR:', e.message);
    console.error('Stack:', e.stack);
    process.exit(1);
  }
})();
