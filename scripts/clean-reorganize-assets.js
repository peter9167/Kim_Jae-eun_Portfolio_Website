const fs = require('fs');
const path = require('path');
const { initializeDatabase } = require('../config/database.js');

// 폴더 구조에 따른 섹션 매핑
const sectionMapping = {
    'Awards/Ice Hockey': 'awards',
    'Awards/International Creative AI Drone Competition': 'awards', 
    'Awards/Jeju Traditional Culture Trademark Design Competition': 'awards',
    'FOS': 'fos',
    'GEM': 'gem',
    'Global Ensemble': 'global-ensemble',
    'Hyanggyo': 'hyanggyo',
    'Jeju Galot': 'jeju-galot',
    'Leadership': 'leadership',
    'News/Ice Hockey': 'news',
    'News/Volunteer work': 'news',
    'RCY': 'rcy',
    'Refugee Support': 'refugee',
    'Sign Language': 'sign-language',
    'Sports': 'sports'
};

// 파일명 정리 함수
function cleanFileName(fileName, folderName) {
    const ext = path.extname(fileName);
    const nameWithoutExt = path.basename(fileName, ext);
    
    // KakaoTalk 파일들의 경우 폴더명 기반으로 변경
    if (fileName.startsWith('KakaoTalk_')) {
        const folderKey = folderName.toLowerCase().replace(/\s+/g, '-');
        
        // 숫자 부분 추출
        const numberMatch = fileName.match(/_(\d+)\./) || fileName.match(/_(\d+)$/);
        if (numberMatch) {
            return `${folderKey}-${String(numberMatch[1]).padStart(2, '0')}${ext}`;
        } else {
            return `${folderKey}-01${ext}`;
        }
    }
    
    // img (숫자) 형태의 파일들
    if (fileName.match(/^img \(\d+\)/)) {
        const folderKey = folderName.toLowerCase().replace(/\s+/g, '-');
        const numberMatch = fileName.match(/img \((\d+)\)/);
        if (numberMatch) {
            return `${folderKey}-${String(numberMatch[1]).padStart(2, '0')}${ext}`;
        }
    }
    
    // video (숫자) 형태의 파일들
    if (fileName.match(/^video \(\d+\)/)) {
        const folderKey = folderName.toLowerCase().replace(/\s+/g, '-');
        const numberMatch = fileName.match(/video \((\d+)\)/);
        if (numberMatch) {
            return `${folderKey}-video-${String(numberMatch[1]).padStart(2, '0')}${ext}`;
        }
    }
    
    // 이미 정리된 파일명은 그대로 사용
    return fileName;
}

async function cleanAndReorganizeAssets() {
    try {
        console.log('🗑️  기존 데이터베이스 삭제 중...');
        if (fs.existsSync('./data/portfolio.db')) {
            fs.unlinkSync('./data/portfolio.db');
        }
        
        console.log('📊 새 데이터베이스 초기화 중...');
        const db = await initializeDatabase();
        
        const assetsDir = './public/assets';
        const sections = fs.readdirSync(assetsDir);
        
        console.log('🔍 파일 스캔 및 정리 중...\n');
        
        for (const section of sections) {
            const sectionPath = path.join(assetsDir, section);
            if (!fs.statSync(sectionPath).isDirectory()) continue;
            
            console.log(`📁 처리 중: ${section}`);
            
            // 섹션이 서브폴더를 가지는지 확인
            const items = fs.readdirSync(sectionPath);
            let hasSubfolders = false;
            
            for (const item of items) {
                if (fs.statSync(path.join(sectionPath, item)).isDirectory()) {
                    hasSubfolders = true;
                    break;
                }
            }
            
            if (hasSubfolders) {
                // 서브폴더가 있는 경우 (Awards, News 등)
                for (const subfolder of items) {
                    const subfolderPath = path.join(sectionPath, subfolder);
                    if (!fs.statSync(subfolderPath).isDirectory()) continue;
                    
                    const fullPath = `${section}/${subfolder}`;
                    const targetSection = sectionMapping[fullPath] || section.toLowerCase();
                    
                    console.log(`  📂 ${subfolder} -> ${targetSection}`);
                    
                    const files = fs.readdirSync(subfolderPath);
                    let counter = 1;
                    
                    for (const file of files) {
                        const filePath = path.join(subfolderPath, file);
                        if (fs.statSync(filePath).isFile()) {
                            
                            const cleanName = cleanFileName(file, subfolder);
                            const isVideo = path.extname(file).toLowerCase() === '.mp4';
                            
                            const mediaEntry = {
                                filename: `${targetSection}/${cleanName}`,
                                original_name: file,
                                title: `${subfolder} ${counter}`,
                                description: `${subfolder} 관련 ${isVideo ? '동영상' : '이미지'}`,
                                section: targetSection,
                                media_type: isVideo ? 'video' : 'image',
                                file_path: filePath.replace(/\\/g, '/'),
                                mime_type: isVideo ? 'video/mp4' : 'image/jpeg'
                            };
                            
                            await db.run(`
                                INSERT INTO media (filename, original_name, title, description, section, media_type, file_path, mime_type)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                            `, [
                                mediaEntry.filename,
                                mediaEntry.original_name,
                                mediaEntry.title,
                                mediaEntry.description,
                                mediaEntry.section,
                                mediaEntry.media_type,
                                mediaEntry.file_path,
                                mediaEntry.mime_type
                            ]);
                            
                            counter++;
                        }
                    }
                }
            } else {
                // 서브폴더가 없는 경우 (FOS, GEM 등)
                const targetSection = section.toLowerCase().replace(/\s+/g, '-');
                
                const files = fs.readdirSync(sectionPath);
                let counter = 1;
                
                for (const file of files) {
                    const filePath = path.join(sectionPath, file);
                    if (fs.statSync(filePath).isFile()) {
                        
                        const cleanName = cleanFileName(file, section);
                        const isVideo = path.extname(file).toLowerCase() === '.mp4';
                        
                        const mediaEntry = {
                            filename: `${targetSection}/${cleanName}`,
                            original_name: file,
                            title: `${section} ${counter}`,
                            description: `${section} 관련 ${isVideo ? '동영상' : '이미지'}`,
                            section: targetSection,
                            media_type: isVideo ? 'video' : 'image',
                            file_path: filePath.replace(/\\/g, '/'),
                            mime_type: isVideo ? 'video/mp4' : 'image/jpeg'
                        };
                        
                        await db.run(`
                            INSERT INTO media (filename, original_name, title, description, section, media_type, file_path, mime_type)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        `, [
                            mediaEntry.filename,
                            mediaEntry.original_name,
                            mediaEntry.title,
                            mediaEntry.description,
                            mediaEntry.section,
                            mediaEntry.media_type,
                            mediaEntry.file_path,
                            mediaEntry.mime_type
                        ]);
                        
                        counter++;
                    }
                }
            }
        }
        
        // 결과 확인
        console.log('\n📊 정리 완료! 최종 결과:');
        const sectionCounts = await db.all('SELECT section, COUNT(*) as count FROM media GROUP BY section ORDER BY section');
        sectionCounts.forEach(row => {
            console.log(`  ${row.section}: ${row.count}개 파일`);
        });
        
        console.log(`\n✅ 총 ${sectionCounts.reduce((sum, row) => sum + row.count, 0)}개 파일이 정리되었습니다.`);
        
        await db.close();
        
    } catch (error) {
        console.error('❌ 정리 중 오류 발생:', error);
    }
}

cleanAndReorganizeAssets();