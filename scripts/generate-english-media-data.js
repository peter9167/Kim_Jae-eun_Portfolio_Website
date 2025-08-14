const { initializeDatabase } = require('../config/database.js');
const fs = require('fs');

// 섹션별 영어 제목 매핑
const sectionTitles = {
    'awards': 'Awards & Competitions',
    'fos': 'FOS Activities',
    'gem': 'GEM Program',
    'global-ensemble': 'Global Ensemble',
    'hyanggyo': 'Hyanggyo Program',
    'jeju-galot': 'Jeju Galot Experience',
    'leadership': 'Leadership Training',
    'news': 'Media Coverage',
    'rcy': 'RCY Activities',
    'refugee': 'Refugee Support',
    'refugee-support': 'Refugee Support',
    'sign-language': 'Sign Language Activities',
    'sports': 'Sports Activities'
};

// 파일명을 영어 제목으로 변환하는 함수
function generateEnglishTitle(filename, section, index) {
    const sectionTitle = sectionTitles[section] || section;
    
    // 이미 정리된 이름이 있는 경우
    if (filename.includes('ice-hockey-award')) {
        return `Ice Hockey Award ${index + 1}`;
    }
    if (filename.includes('fos-activity')) {
        return `FOS Activity ${index + 1}`;
    }
    if (filename.includes('gem-activity')) {
        return `GEM Activity ${index + 1}`;
    }
    if (filename.includes('gem-program')) {
        return `GEM Program ${index + 1}`;
    }
    if (filename.includes('global-ensemble')) {
        return `Global Ensemble ${index + 1}`;
    }
    if (filename.includes('jeju-galot')) {
        return `Jeju Galot ${index + 1}`;
    }
    if (filename.includes('leadership-training')) {
        return `Leadership Training ${index + 1}`;
    }
    if (filename.includes('sign-language')) {
        return `Sign Language ${index + 1}`;
    }
    if (filename.includes('sports-hockey') || filename.includes('sports-activity')) {
        return `Sports Activity ${index + 1}`;
    }
    
    // KakaoTalk 파일들의 경우
    if (filename.includes('KakaoTalk_')) {
        if (section === 'awards') {
            if (filename.includes('161559339')) {
                return `AI Drone Competition ${index + 1}`;
            } else if (filename.includes('161655180')) {
                return `Jeju Traditional Culture Design Contest ${index + 1}`;
            }
        }
        if (section === 'hyanggyo') {
            return `Hyanggyo Program ${index + 1}`;
        }
        if (section === 'jeju-galot') {
            return `Jeju Galot Experience ${index + 1}`;
        }
        if (section === 'news') {
            if (filename.includes('155733226')) {
                return `Ice Hockey Media Coverage ${index + 1}`;
            } else if (filename.includes('155826145')) {
                return `Volunteer Work Media Coverage ${index + 1}`;
            }
        }
        if (section === 'sign-language') {
            return `Sign Language Activity ${index + 1}`;
        }
        if (section === 'sports') {
            return `Sports Activity ${index + 1}`;
        }
        if (section === 'gem') {
            return `GEM Program ${index + 1}`;
        }
    }
    
    // img 파일들의 경우
    if (filename.includes('img (')) {
        return `${sectionTitle} ${index + 1}`;
    }
    
    // video 파일들의 경우
    if (filename.includes('video (')) {
        return `${sectionTitle} Video ${index + 1}`;
    }
    
    // 기본값
    return `${sectionTitle} ${index + 1}`;
}

async function generateEnglishMediaData() {
    try {
        console.log('🚀 Generating English media data...');
        
        const db = await initializeDatabase();
        
        // 모든 미디어 데이터를 섹션별로 가져오기
        const sections = await db.all('SELECT DISTINCT section FROM media ORDER BY section');
        
        const mediaData = {};
        
        for (const sectionRow of sections) {
            const section = sectionRow.section;
            const media = await db.all(`
                SELECT * FROM media 
                WHERE section = ? AND supabase_url IS NOT NULL 
                ORDER BY filename
            `, [section]);
            
            mediaData[section] = media.map((item, index) => ({
                id: item.id,
                filename: item.filename,
                title: generateEnglishTitle(item.filename, section, index),
                description: `${sectionTitles[section] || section} related ${item.media_type === 'video' ? 'video' : 'image'}`,
                type: item.media_type,
                url: item.supabase_url,
                uploadDate: item.upload_date || item.created_at
            }));
            
            console.log(`  ${section}: ${media.length} items`);
        }
        
        // JavaScript 파일로 저장
        const jsContent = `
// Auto-generated static media data for Vercel deployment
// Generated on: ${new Date().toISOString()}

window.STATIC_MEDIA_DATA = ${JSON.stringify(mediaData, null, 2)};
`;
        
        const outputPath = './public/static-media-data.js';
        fs.writeFileSync(outputPath, jsContent);
        
        console.log(`✅ English media data generated: ${outputPath}`);
        
        // 통계 출력
        const totalItems = Object.values(mediaData).reduce((sum, arr) => sum + arr.length, 0);
        console.log(`📊 Total sections: ${Object.keys(mediaData).length}`);
        console.log(`📊 Total media items: ${totalItems}`);
        
        Object.entries(mediaData).forEach(([section, items]) => {
            console.log(`   ${section}: ${items.length} items`);
        });
        
        await db.close();
        
    } catch (error) {
        console.error('❌ Error generating English media data:', error);
    }
}

generateEnglishMediaData();