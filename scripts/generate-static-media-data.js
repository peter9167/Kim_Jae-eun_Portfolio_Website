require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { getDatabase } = require('../config/database');

async function generateStaticMediaData() {
    try {
        console.log('🚀 Generating static media data...');
        
        const db = getDatabase();
        await db.connect();
        
        // Get all media with Supabase URLs
        const allMedia = await db.all(`
            SELECT * FROM media 
            WHERE supabase_url IS NOT NULL 
            ORDER BY section, upload_date DESC
        `);
        
        // Group by section
        const mediaBySection = {};
        allMedia.forEach(item => {
            if (!mediaBySection[item.section]) {
                mediaBySection[item.section] = [];
            }
            mediaBySection[item.section].push({
                id: item.id,
                filename: item.filename,
                title: item.title,
                description: item.description,
                type: item.media_type,
                url: item.supabase_url,
                uploadDate: item.upload_date
            });
        });
        
        // Generate JavaScript data
        const jsContent = `
// Auto-generated static media data for Vercel deployment
// Generated on: ${new Date().toISOString()}

window.STATIC_MEDIA_DATA = ${JSON.stringify(mediaBySection, null, 2)};

// Helper function to load static media
window.loadStaticMedia = function() {
    console.log('Loading static media data...');
    
    const mediaData = window.STATIC_MEDIA_DATA;
    
    // Add media to each section
    Object.keys(mediaData).forEach(sectionKey => {
        const items = mediaData[sectionKey];
        console.log(\`Loading \${items.length} items for section: \${sectionKey}\`);
        
        // Add to DOM
        if (window.portfolioApp && window.portfolioApp.addDynamicMediaToSection) {
            window.portfolioApp.addDynamicMediaToSection(sectionKey, items);
        }
    });
    
    console.log('Static media loaded successfully');
};

// Auto-load when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.loadStaticMedia);
} else {
    window.loadStaticMedia();
}
`;
        
        // Write to public directory
        const outputPath = path.join(__dirname, '..', 'public', 'static-media-data.js');
        fs.writeFileSync(outputPath, jsContent);
        
        console.log(`✅ Static media data generated: ${outputPath}`);
        console.log(`📊 Total sections: ${Object.keys(mediaBySection).length}`);
        console.log(`📊 Total media items: ${allMedia.length}`);
        
        // Show section breakdown
        Object.keys(mediaBySection).forEach(section => {
            console.log(`   ${section}: ${mediaBySection[section].length} items`);
        });
        
    } catch (error) {
        console.error('❌ Error generating static media data:', error);
    }
}

generateStaticMediaData();