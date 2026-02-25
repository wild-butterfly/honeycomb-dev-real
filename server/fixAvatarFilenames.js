const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT || 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'password',
  database: process.env.PGDATABASE || 'honeycomb'
});

(async () => {
  try {
    console.log('\n=== FIXING INCORRECT AVATAR FILENAMES ===\n');

    // Get all users with avatars
    const result = await pool.query('SELECT id, avatar FROM users WHERE avatar IS NOT NULL');
    
    const avatarDir = path.join(process.cwd(), 'uploads', 'avatars');
    let fixedCount = 0;

    for (const row of result.rows) {
      const userId = row.id;
      const avatarPath = row.avatar; // e.g., /uploads/avatars/avatar-3-1771745535811.jpg
      
      if (!avatarPath) continue;

      // Extract filename from path
      const filename = path.basename(avatarPath);
      const match = filename.match(/avatar-(\d+)-(.*)/);
      
      if (!match) {
        console.log(`⚠️  Skipping ${filename} - invalid format`);
        continue;
      }

      const fileUserId = parseInt(match[1], 10);
      const fileTimestampAndExt = match[2]; // e.g., 1771745535811.jpg

      if (fileUserId === userId) {
        console.log(`✅ OK: User ${userId} - ${filename}`);
        continue;
      }

      // Filename has wrong user ID - fix it
      console.log(`❌ FIXING: User ${userId} - filename has wrong ID: ${fileUserId}`);
      
      const oldFilename = `avatar-${fileUserId}-${fileTimestampAndExt}`;
      const newFilename = `avatar-${userId}-${fileTimestampAndExt}`;
      
      const oldPath = path.join(avatarDir, oldFilename);
      const newPath = path.join(avatarDir, newFilename);

      // Check if old file exists
      if (!fs.existsSync(oldPath)) {
        console.log(`   ⚠️  Old file not found: ${oldFilename}`);
        console.log(`   📝 Updating database to new path...`);
      } else {
        // Rename file
        try {
          fs.renameSync(oldPath, newPath);
          console.log(`   ✔️  Renamed file: ${oldFilename} → ${newFilename}`);
        } catch (err) {
          console.log(`   ❌ Error renaming file: ${err.message}`);
          continue;
        }
      }

      // Update database
      const newAvatarPath = `/uploads/avatars/${newFilename}`;
      await pool.query(
        'UPDATE users SET avatar = $1 WHERE id = $2',
        [newAvatarPath, userId]
      );
      console.log(`   ✔️  Updated database record`);
      fixedCount++;
    }

    console.log(`\n✅ DONE! Fixed ${fixedCount} avatar filename(s)\n`);
    
    // Show final state
    const finalResult = await pool.query('SELECT id, full_name, avatar FROM users WHERE avatar IS NOT NULL ORDER BY id');
    console.log('=== FINAL STATE ===\n');
    finalResult.rows.forEach(row => {
      console.log(`User ${row.id} (${row.full_name}): ${row.avatar}`);
    });

    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
