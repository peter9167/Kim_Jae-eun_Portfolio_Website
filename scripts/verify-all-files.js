require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { getDatabase } = require('../config/database');

// Directory mappings (same as migration script)
const ASSET_SECTIONS = {
    'Awards': 'awards',
    'FOS': 'fos', 
    'GEM': 'gem',
    'Global Ensemble': 'global-ensemble',
    'Hyanggyo': 'hyanggyo',
    'Jeju Galot': 'jeju-galot',
    'Leadership': 'leadership',
    'News': 'news',
    'RCY': 'rcy',
    'Refugee Support': 'refugee',
    'Sign Language': 'sign-language',
    'Sports': 'sports'
};

async function verifyAllFiles() {
    try {
        console.log('🔍 Verifying all files are migrated...');
        
        const assetsDir = path.join(__dirname, '..', 'public', 'assets');
        const db = getDatabase();
        await db.connect();
        
        let totalLocalFiles = 0;
        let missingFiles = [];
        
        // Check each section directory
        for (const [dirName, sectionName] of Object.entries(ASSET_SECTIONS)) {
            const sectionPath = path.join(assetsDir, dirName);
            
            if (!fs.existsSync(sectionPath)) {
                console.log(`⚠️ Directory not found: ${dirName}`);
                continue;
            }
            
            console.log(`📁 Checking section: ${dirName} -> ${sectionName}`);
            
            const files = fs.readdirSync(sectionPath, { recursive: true });
            let sectionFileCount = 0;
            
            for (const file of files) {
                const filePath = path.join(sectionPath, file);
                const stats = fs.statSync(filePath);
                
                if (!stats.isFile()) continue;
                
                const fileName = path.basename(file);
                totalLocalFiles++;
                sectionFileCount++;
                
                // Check if file exists in database
                const dbFile = await db.get(`
                    SELECT * FROM media 
                    WHERE (original_name = ? OR filename LIKE ?) 
                    AND section = ? 
                    AND supabase_url IS NOT NULL
                `, [fileName, `%${fileName}`, sectionName]);
                
                if (!dbFile) {
                    missingFiles.push({
                        section: sectionName,
                        filename: fileName,
                        path: filePath
                    });
                }
            }
            
            console.log(`   ✅ ${sectionFileCount} local files found`);
        }
        
        console.log(`\n📊 Summary:`);
        console.log(`   Local files: ${totalLocalFiles}`);
        console.log(`   Missing from database: ${missingFiles.length}`);
        
        if (missingFiles.length > 0) {
            console.log(`\n❌ Missing files:`);
            missingFiles.forEach(file => {
                console.log(`   ${file.section}/${file.filename}`);
            });
            
            console.log(`\n💡 To upload missing files, run the migration script again or upload manually.`);
        } else {
            console.log(`\n🎉 All files successfully migrated!`);
        }
        
    } catch (error) {
        console.error('❌ Error verifying files:', error);
    }
}

verifyAllFiles();