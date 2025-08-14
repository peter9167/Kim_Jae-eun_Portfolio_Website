require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { getDatabase } = require('../config/database');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Directory mappings
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

async function uploadFileToSupabase(filePath, supabasePath) {
    try {
        console.log(`📤 Uploading: ${path.basename(filePath)}`);
        
        const fileBuffer = fs.readFileSync(filePath);
        const mimeType = getMimeType(filePath);
        
        // Test Supabase connection first
        const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
        if (bucketError) {
            console.error(`❌ Supabase connection error:`, bucketError);
            return null;
        }
        
        const portfolioBucket = buckets.find(b => b.name === 'portfolio-assets');
        if (!portfolioBucket) {
            console.error(`❌ Bucket 'portfolio-assets' not found. Available buckets:`, buckets.map(b => b.name));
            return null;
        }
        
        const { data, error } = await supabase.storage
            .from('portfolio-assets')
            .upload(supabasePath, fileBuffer, {
                contentType: mimeType,
                upsert: true
            });
        
        if (error) {
            console.error(`❌ Upload error for ${path.basename(filePath)}:`, error.message);
            return null;
        }
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('portfolio-assets')
            .getPublicUrl(supabasePath);
        
        console.log(`✅ Success: ${path.basename(filePath)} → ${publicUrl}`);
        return publicUrl;
        
    } catch (err) {
        console.error(`❌ Fatal error for ${path.basename(filePath)}:`, err.message);
        return null;
    }
}

function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg', 
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.gif': 'image/gif',
        '.mp4': 'video/mp4',
        '.mov': 'video/mov',
        '.avi': 'video/avi',
        '.webm': 'video/webm'
    };
    return mimeTypes[ext] || 'application/octet-stream';
}

function getMediaType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const videoExts = ['.mp4', '.mov', '.avi', '.webm'];
    return videoExts.includes(ext) ? 'video' : 'image';
}

async function migrateAssets() {
    try {
        console.log('🚀 Starting asset migration to Supabase...');
        
        const assetsDir = path.join(__dirname, '..', 'public', 'assets');
        const db = getDatabase();
        
        // Initialize database
        await db.connect();
        await db.initializeTables();
        
        let uploadCount = 0;
        let errorCount = 0;
        
        // Process each section directory
        for (const [dirName, sectionName] of Object.entries(ASSET_SECTIONS)) {
            const sectionPath = path.join(assetsDir, dirName);
            
            if (!fs.existsSync(sectionPath)) {
                console.log(`⚠️ Directory not found: ${sectionPath}`);
                continue;
            }
            
            console.log(`\n📁 Processing section: ${dirName} -> ${sectionName}`);
            
            const files = fs.readdirSync(sectionPath, { recursive: true });
            
            for (const file of files) {
                const filePath = path.join(sectionPath, file);
                const stats = fs.statSync(filePath);
                
                if (!stats.isFile()) continue;
                
                const fileName = path.basename(file);
                const supabasePath = `${sectionName}/${fileName}`;
                
                // Upload to Supabase
                const publicUrl = await uploadFileToSupabase(filePath, supabasePath);
                
                if (publicUrl) {
                    // Add to database
                    try {
                        const mediaType = getMediaType(filePath);
                        const title = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
                        
                        await db.run(
                            `INSERT INTO media (
                                filename, original_name, title, description, section, 
                                media_type, file_path, file_size, mime_type, supabase_url
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                supabasePath,
                                fileName,
                                title,
                                `Migrated ${mediaType} from ${dirName}`,
                                sectionName,
                                mediaType,
                                supabasePath,
                                stats.size,
                                getMimeType(filePath),
                                publicUrl
                            ]
                        );
                        
                        uploadCount++;
                        console.log(`✅ Added to database: ${fileName}`);
                    } catch (dbError) {
                        console.error(`❌ Database error for ${fileName}:`, dbError);
                        errorCount++;
                    }
                } else {
                    errorCount++;
                }
                
                // Small delay to avoid rate limits
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        console.log(`\n🎉 Migration completed!`);
        console.log(`✅ Successfully uploaded: ${uploadCount} files`);
        console.log(`❌ Errors: ${errorCount} files`);
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
    }
}

// Run migration
if (require.main === module) {
    migrateAssets();
}

module.exports = { migrateAssets };