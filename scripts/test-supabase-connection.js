require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function testConnection() {
    console.log('🔗 Testing Supabase connection...');
    console.log('URL:', process.env.SUPABASE_URL);
    console.log('Key:', process.env.SUPABASE_ANON_KEY ? 'Set' : 'Missing');
    
    try {
        // Test 1: List buckets
        console.log('\n📦 Testing bucket access...');
        const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
        
        if (bucketError) {
            console.error('❌ Bucket error:', bucketError);
            return;
        }
        
        console.log('✅ Available buckets:', buckets.map(b => `${b.name} (${b.public ? 'public' : 'private'})`));
        
        // Test 2: Check portfolio-assets bucket
        const portfolioBucket = buckets.find(b => b.name === 'portfolio-assets');
        if (!portfolioBucket) {
            console.error('❌ portfolio-assets bucket not found!');
            console.log('💡 Create it in Supabase Dashboard: Storage → New Bucket → "portfolio-assets" (public)');
            return;
        }
        
        console.log('✅ portfolio-assets bucket exists and is', portfolioBucket.public ? 'public' : 'private');
        
        // Test 3: List files in bucket
        console.log('\n📁 Testing file listing...');
        const { data: files, error: listError } = await supabase.storage
            .from('portfolio-assets')
            .list('', { limit: 5 });
            
        if (listError) {
            console.error('❌ List error:', listError);
            return;
        }
        
        console.log('✅ Files in bucket:', files.length, 'files');
        if (files.length > 0) {
            console.log('   First few files:', files.slice(0, 3).map(f => f.name));
        }
        
        // Test 4: Upload test
        console.log('\n⬆️ Testing upload...');
        const testData = Buffer.from('Hello Supabase!');
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('portfolio-assets')
            .upload('test/connection-test.txt', testData, {
                contentType: 'text/plain',
                upsert: true
            });
            
        if (uploadError) {
            console.error('❌ Upload error:', uploadError);
            return;
        }
        
        console.log('✅ Test upload successful:', uploadData.path);
        
        // Test 5: Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('portfolio-assets')
            .getPublicUrl('test/connection-test.txt');
            
        console.log('✅ Public URL generated:', publicUrl);
        
        // Clean up test file
        await supabase.storage.from('portfolio-assets').remove(['test/connection-test.txt']);
        console.log('✅ Test file cleaned up');
        
        console.log('\n🎉 All tests passed! Supabase is ready for migration.');
        
    } catch (error) {
        console.error('❌ Connection test failed:', error);
    }
}

testConnection();