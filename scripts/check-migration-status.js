require('dotenv').config();
const { getDatabase } = require('../config/database');

async function checkMigrationStatus() {
    try {
        console.log('🔍 Checking migration status...');
        
        const db = getDatabase();
        await db.connect();
        
        // Check total files in database
        const totalCount = await db.get('SELECT COUNT(*) as count FROM media WHERE supabase_url IS NOT NULL');
        console.log(`📊 Total files with Supabase URLs: ${totalCount.count}`);
        
        // Check by section
        const sectionCounts = await db.all(`
            SELECT section, COUNT(*) as count 
            FROM media WHERE supabase_url IS NOT NULL 
            GROUP BY section 
            ORDER BY section
        `);
        
        console.log('\n📁 Files by section:');
        sectionCounts.forEach(row => {
            console.log(`   ${row.section}: ${row.count} files`);
        });
        
        // Check for missing files (files without supabase_url)
        const missingCount = await db.get('SELECT COUNT(*) as count FROM media WHERE supabase_url IS NULL');
        console.log(`\n❌ Files missing Supabase URLs: ${missingCount.count}`);
        
        if (missingCount.count > 0) {
            const missingFiles = await db.all(`
                SELECT filename, section, original_name 
                FROM media WHERE supabase_url IS NULL 
                LIMIT 10
            `);
            
            console.log('\n📋 First 10 missing files:');
            missingFiles.forEach(file => {
                console.log(`   ${file.section}/${file.original_name || file.filename}`);
            });
        }
        
        console.log(`\n🏁 Migration Status: ${totalCount.count}/220 files completed`);
        
    } catch (error) {
        console.error('❌ Error checking migration status:', error);
    }
}

checkMigrationStatus();