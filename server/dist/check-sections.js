"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./db");
(async () => {
    try {
        console.log('Checking all templates for sections data...\n');
        const all = await db_1.pool.query('SELECT id, name, sections FROM invoice_templates ORDER BY id');
        console.log('All templates:');
        all.rows.forEach((t) => {
            console.log(`ID: ${t.id} | Name: ${t.name}`);
            console.log(`  Sections type: ${typeof t.sections}`);
            console.log(`  Sections value: ${JSON.stringify(t.sections)}`);
            console.log('  ---');
        });
        process.exit(0);
    }
    catch (e) {
        console.error('ERROR:', e.message);
        process.exit(1);
    }
})();
