const { initializeDatabase } = require('../config/database.js');
const fs = require('fs');

// 섹션별 한국어 제목 매핑
const sectionTitles = {
    'awards': '수상 및 대회',
    'fos': 'FOS 활동',
    'gem': 'GEM 프로그램',
    'global-ensemble': '글로벌 앙상블',
    'hyanggyo': '향교 프로그램',
    'jeju-galot': '제주 갈옷',
    'leadership': '리더십 교육',
    'news': '언론 보도',
    'rcy': 'RCY 활동',
    'refugee': '난민 지원',
    'refugee-support': '난민 지원',
    'sign-language': '수어 활동',
    'sports': '스포츠 활동'
};

// 파일명을 보기 좋게 변환하는 함수
function generateDisplayTitle(filename, section, index) {
    const sectionTitle = sectionTitles[section] || section;
    
    // 이미 정리된 이름이 있는 경우
    if (filename.includes('ice-hockey-award')) {
        return `아이스하키 수상 ${index + 1}`;
    }
    if (filename.includes('fos-activity')) {
        return `FOS 활동 ${index + 1}`;
    }
    if (filename.includes('gem-activity')) {
        return `GEM 활동 ${index + 1}`;
    }
    if (filename.includes('gem-program')) {
        return `GEM 프로그램 ${index + 1}`;
    }
    if (filename.includes('global-ensemble')) {
        return `글로벌 앙상블 ${index + 1}`;
    }
    if (filename.includes('jeju-galot')) {
        return `제주 갈옷 ${index + 1}`;
    }
    if (filename.includes('leadership-training')) {
        return `리더십 교육 ${index + 1}`;
    }
    if (filename.includes('sign-language')) {
        return `수어 활동 ${index + 1}`;
    }
    if (filename.includes('sports-hockey') || filename.includes('sports-activity')) {
        return `스포츠 활동 ${index + 1}`;
    }
    
    // KakaoTalk 파일들의 경우
    if (filename.includes('KakaoTalk_')) {
        if (section === 'awards') {
            if (filename.includes('161559339')) {
                return `AI 드론 대회 ${index + 1}`;
            } else if (filename.includes('161655180')) {
                return `제주 전통문화 상표 디자인 공모전 ${index + 1}`;
            }
        }
        if (section === 'hyanggyo') {
            return `향교 프로그램 ${index + 1}`;
        }
        if (section === 'jeju-galot') {
            return `제주 갈옷 체험 ${index + 1}`;
        }
        if (section === 'news') {
            if (filename.includes('155733226')) {
                return `아이스하키 언론 보도 ${index + 1}`;
            } else if (filename.includes('155826145')) {
                return `봉사활동 언론 보도 ${index + 1}`;
            }
        }
        if (section === 'sign-language') {
            return `수어 활동 ${index + 1}`;
        }
        if (section === 'sports') {
            return `스포츠 활동 ${index + 1}`;
        }
        if (section === 'gem') {
            return `GEM 프로그램 ${index + 1}`;
        }
    }
    
    // img 파일들의 경우
    if (filename.includes('img (')) {
        return `${sectionTitle} ${index + 1}`;
    }
    
    // video 파일들의 경우
    if (filename.includes('video (')) {
        return `${sectionTitle} 영상 ${index + 1}`;
    }
    
    // 기본값
    return `${sectionTitle} ${index + 1}`;
}

async function generateImprovedMediaData() {
    try {
        console.log('🚀 개선된 미디어 데이터 생성 중...');
        
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
                title: generateDisplayTitle(item.filename, section, index),
                description: item.description || `${sectionTitles[section] || section} 관련 ${item.media_type === 'video' ? '영상' : '이미지'}`,
                type: item.media_type,
                url: item.supabase_url,
                uploadDate: item.upload_date || item.created_at
            }));
            
            console.log(`  ${section}: ${media.length}개 항목`);
        }
        
        // JavaScript 파일로 저장
        const jsContent = `
// Auto-generated static media data for Vercel deployment
// Generated on: ${new Date().toISOString()}

window.STATIC_MEDIA_DATA = ${JSON.stringify(mediaData, null, 2)};
`;
        
        const outputPath = './public/static-media-data.js';
        fs.writeFileSync(outputPath, jsContent);
        
        console.log(`✅ 개선된 미디어 데이터 생성 완료: ${outputPath}`);
        
        // 통계 출력
        const totalItems = Object.values(mediaData).reduce((sum, arr) => sum + arr.length, 0);
        console.log(`📊 총 섹션: ${Object.keys(mediaData).length}`);
        console.log(`📊 총 미디어 항목: ${totalItems}`);
        
        Object.entries(mediaData).forEach(([section, items]) => {
            console.log(`   ${section}: ${items.length}개 항목`);
        });
        
        await db.close();
        
    } catch (error) {
        console.error('❌ 미디어 데이터 생성 중 오류:', error);
    }
}

generateImprovedMediaData();