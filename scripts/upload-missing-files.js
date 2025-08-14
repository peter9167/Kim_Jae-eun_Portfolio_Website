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
        
        const { data, error } = await supabase.storage
            .from('portfolio-assets')
            .upload(supabasePath, fileBuffer, {
                contentType: mimeType,
                upsert: true
            });
        
        if (error) {
            console.error(`❌ Upload error for ${path.basename(filePath)}: ${error.message}`);
            return null;
        }
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('portfolio-assets')
            .getPublicUrl(supabasePath);
        
        console.log(`✅ Success: ${path.basename(filePath)} → ${publicUrl}`);
        return publicUrl;
        
    } catch (err) {
        console.error(`❌ Fatal error for ${path.basename(filePath)}: ${err.message}`);
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

async function uploadMissingFiles() {
    try {
        console.log('🚀 Starting upload of missing files...');
        
        const assetsDir = path.join(__dirname, '..', 'public', 'assets');
        const db = getDatabase();
        await db.connect();
        
        let uploadCount = 0;
        let errorCount = 0;
        
        // Define missing files (from previous check)
        const missingFiles = [
            { section: 'leadership', file: 'leadership-training-video.mp4' },
            { section: 'refugee', file: 'video (1).mp4' },
            { section: 'refugee', file: 'video (2).mp4' },
            { section: 'refugee', file: 'video (3).mp4' },
            { section: 'sign-language', file: 'KakaoTalk_20250716_155423788_05.jpg' },
            { section: 'sign-language', file: 'KakaoTalk_20250716_155423788_06.jpg' },
            { section: 'sign-language', file: 'KakaoTalk_20250716_155423788_07.jpg' },
            { section: 'sign-language', file: 'KakaoTalk_20250716_155423788_08.jpg' },
            { section: 'sign-language', file: 'KakaoTalk_20250716_155423788_09.jpg' },
            { section: 'sign-language', file: 'KakaoTalk_20250716_155423788_10.jpg' },
            { section: 'sign-language', file: 'KakaoTalk_20250716_155423788_11.jpg' },
            { section: 'sign-language', file: 'KakaoTalk_20250716_155423788_12.jpg' },
            { section: 'sign-language', file: 'KakaoTalk_20250716_155423788_13.jpg' },
            { section: 'sign-language', file: 'KakaoTalk_20250716_155423788_14.jpg' },
            { section: 'sign-language', file: 'KakaoTalk_20250716_155423788_15.jpg' },
            { section: 'sign-language', file: 'KakaoTalk_20250716_155423788_16.jpg' },
            { section: 'sign-language', file: 'KakaoTalk_20250716_155423788_17.jpg' },
            { section: 'sign-language', file: 'KakaoTalk_20250716_155423788_18.jpg' },
            { section: 'sign-language', file: 'KakaoTalk_20250716_155423788_19.jpg' },
            { section: 'sign-language', file: 'sign-language-01.jpg' },
            { section: 'sign-language', file: 'sign-language-02.jpg' },
            { section: 'sign-language', file: 'sign-language-03.jpg' },
            { section: 'sign-language', file: 'sign-language-04.jpg' },
            { section: 'sign-language', file: 'sign-language-05.jpg' },
            { section: 'sign-language', file: 'sign-language-demo-01.mp4' },
            { section: 'sign-language', file: 'sign-language-demo-02.mp4' },
            { section: 'sign-language', file: 'sign-language-demo-03.mp4' },
            { section: 'sports', file: 'KakaoTalk_20250716_154713105_04.jpg' },
            { section: 'sports', file: 'KakaoTalk_20250716_154713105_05.jpg' },
            { section: 'sports', file: 'KakaoTalk_20250716_154713105_06.jpg' },
            { section: 'sports', file: 'KakaoTalk_20250716_154713105_07.jpg' },
            { section: 'sports', file: 'KakaoTalk_20250716_154713105_08.jpg' },
            { section: 'sports', file: 'KakaoTalk_20250716_154713105_09.jpg' },
            { section: 'sports', file: 'KakaoTalk_20250716_154713105_10.jpg' },
            { section: 'sports', file: 'KakaoTalk_20250716_154713105_11.jpg' },
            { section: 'sports', file: 'KakaoTalk_20250716_154713105_12.jpg' },
            { section: 'sports', file: 'KakaoTalk_20250716_154713105_13.jpg' },
            { section: 'sports', file: 'KakaoTalk_20250716_155224947.jpg' },
            { section: 'sports', file: 'KakaoTalk_20250716_155224947_01.jpg' },
            { section: 'sports', file: 'KakaoTalk_20250716_155224947_02.jpg' },
            { section: 'sports', file: 'sports-activity-video-01.mp4' },
            { section: 'sports', file: 'sports-activity-video-02.mp4' },
            { section: 'sports', file: 'sports-activity-video-03.mp4' },
            { section: 'sports', file: 'sports-activity-video-04.mp4' },
            { section: 'sports', file: 'sports-hockey-01.jpg' },
            { section: 'sports', file: 'sports-hockey-02.jpg' },
            { section: 'sports', file: 'sports-hockey-03.jpg' },
            { section: 'sports', file: 'sports-hockey-04.jpg' },
            { section: 'sports', file: 'sports-hockey-05.jpg' }
        ];
        
        // Get directory mapping for each section
        const sectionDirMap = {};
        for (const [dirName, sectionName] of Object.entries(ASSET_SECTIONS)) {
            sectionDirMap[sectionName] = dirName;
        }
        
        console.log(`📁 Found ${missingFiles.length} missing files to upload\n`);
        
        for (const missingFile of missingFiles) {
            const dirName = sectionDirMap[missingFile.section];
            const filePath = path.join(assetsDir, dirName, missingFile.file);
            
            if (!fs.existsSync(filePath)) {
                console.log(`⚠️ File not found: ${filePath}`);
                errorCount++;
                continue;
            }
            
            const supabasePath = `${missingFile.section}/${missingFile.file}`;
            
            // Upload to Supabase
            const publicUrl = await uploadFileToSupabase(filePath, supabasePath);
            
            if (publicUrl) {
                // Add to database
                try {
                    const stats = fs.statSync(filePath);
                    const mediaType = getMediaType(filePath);
                    const title = missingFile.file.replace(/\\.[^/.]+$/, '').replace(/[-_]/g, ' ');
                    
                    await db.run(
                        `INSERT INTO media (
                            filename, original_name, title, description, section, 
                            media_type, file_path, file_size, mime_type, supabase_url
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            supabasePath,
                            missingFile.file,
                            title,
                            `Migrated ${mediaType} from ${dirName}`,
                            missingFile.section,
                            mediaType,
                            supabasePath,
                            stats.size,
                            getMimeType(filePath),
                            publicUrl
                        ]
                    );
                    
                    uploadCount++;
                    console.log(`✅ Added to database: ${missingFile.file}`);
                } catch (dbError) {
                    console.error(`❌ Database error for ${missingFile.file}:`, dbError.message);
                    errorCount++;
                }
            } else {
                errorCount++;
            }
            
            // Small delay to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        console.log(`\n🎉 Upload completed!`);
        console.log(`✅ Successfully uploaded: ${uploadCount} files`);
        console.log(`❌ Errors: ${errorCount} files`);
        
    } catch (error) {
        console.error('❌ Upload failed:', error);
    }
}

// Run upload
if (require.main === module) {
    uploadMissingFiles();
}

module.exports = { uploadMissingFiles };