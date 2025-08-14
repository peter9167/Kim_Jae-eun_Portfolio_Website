const { initializeDatabase } = require('../config/database.js');
const fs = require('fs');

async function fixMediaTypes() {
    try {
        console.log('🔧 Fixing media types...');
        
        const db = await initializeDatabase();
        
        // 1. Remove non-media files like JSON files
        console.log('🗑️ Removing non-media files...');
        await db.run(`DELETE FROM media WHERE filename LIKE '%.json'`);
        
        // 2. Fix media types based on file extensions
        console.log('🔧 Fixing media types based on file extensions...');
        
        // Update video files
        await db.run(`
            UPDATE media 
            SET media_type = 'video' 
            WHERE (filename LIKE '%.mp4' OR filename LIKE '%.mov' OR filename LIKE '%.avi' OR filename LIKE '%.webm')
            AND media_type != 'video'
        `);
        
        // Update image files
        await db.run(`
            UPDATE media 
            SET media_type = 'image' 
            WHERE (filename LIKE '%.jpg' OR filename LIKE '%.jpeg' OR filename LIKE '%.png' OR filename LIKE '%.gif' OR filename LIKE '%.webp')
            AND media_type != 'image'
        `);
        
        // 3. Remove duplicates (keep only the one with supabase_url)
        console.log('🗑️ Removing duplicates...');
        await db.run(`
            DELETE FROM media 
            WHERE id NOT IN (
                SELECT MAX(id) 
                FROM media 
                GROUP BY filename, section
            )
        `);
        
        // 4. Check results
        const stats = await db.all(`
            SELECT 
                media_type,
                COUNT(*) as count
            FROM media 
            GROUP BY media_type
            ORDER BY media_type
        `);
        
        console.log('\n📊 Updated media type statistics:');
        stats.forEach(stat => {
            console.log(`  ${stat.media_type}: ${stat.count} files`);
        });
        
        // 5. Check for problematic files
        const problematicFiles = await db.all(`
            SELECT filename, media_type 
            FROM media 
            WHERE (
                (filename LIKE '%.json' OR filename LIKE '%.txt' OR filename LIKE '%.md')
                OR (filename LIKE '%.mp4' AND media_type = 'image')
                OR (filename LIKE '%.jpg' AND media_type = 'video')
            )
        `);
        
        if (problematicFiles.length > 0) {
            console.log('\n⚠️ Problematic files found:');
            problematicFiles.forEach(file => {
                console.log(`  ${file.filename} -> ${file.media_type}`);
            });
        } else {
            console.log('\n✅ No problematic files found');
        }
        
        await db.close();
        console.log('✅ Media types fixed successfully!');
        
    } catch (error) {
        console.error('❌ Error fixing media types:', error);
    }
}

fixMediaTypes();