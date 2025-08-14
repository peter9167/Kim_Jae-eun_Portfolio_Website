const { initializeDatabase } = require('../config/database.js');

async function checkDatabaseStatus() {
    try {
        const db = await initializeDatabase();
        
        console.log('📊 데이터베이스 상태 확인...\n');
        
        // 챕터별 미디어 개수 확인
        const sectionCounts = await db.all('SELECT section, COUNT(*) as count FROM media GROUP BY section ORDER BY section');
        console.log('📁 챕터별 미디어 개수:');
        sectionCounts.forEach(row => {
            console.log(`   ${row.section}: ${row.count}개`);
        });
        
        console.log('\n');
        
        // 각 챕터별 상세 정보 확인
        for (const sectionRow of sectionCounts) {
            const section = sectionRow.section;
            const files = await db.all('SELECT filename, original_name, title FROM media WHERE section = ? ORDER BY filename', [section]);
            
            console.log(`\n🔍 ${section} 섹션 파일들:`);
            files.forEach((file, index) => {
                console.log(`   ${index + 1}. ${file.filename} (원본: ${file.original_name})`);
            });
        }
        
        await db.close();
        
    } catch (error) {
        console.error('❌ 데이터베이스 확인 중 오류:', error);
    }
}

checkDatabaseStatus();