// Supabase-powered Media API
const { getDatabase } = require('../config/database');
const { handleSupabaseUpload, uploadToSupabase, deleteFromSupabase } = require('../middleware/supabase-upload');
const { adminAuth } = require('../middleware/auth');

module.exports = async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const db = getDatabase();

        if (req.method === 'GET') {
            // Get all media with Supabase URLs
            const { section } = req.query;
            
            let sql = 'SELECT * FROM media ORDER BY upload_date DESC';
            let params = [];
            
            if (section) {
                sql = 'SELECT * FROM media WHERE section = ? ORDER BY upload_date DESC';
                params = [section];
            }
            
            const media = await db.all(sql, params);
            
            // Media items already have Supabase URLs stored
            const mediaWithUrls = media.map(item => ({
                ...item,
                // Use supabase_url if available, fallback to legacy url
                url: item.supabase_url || item.url || `/uploads/${item.section}/${item.filename}`,
                upload_date: item.upload_date
            }));
            
            res.status(200).json({
                success: true,
                data: mediaWithUrls
            });

        } else if (req.method === 'POST') {
            // Upload new media to Supabase
            handleSupabaseUpload(req, res, async (err) => {
                if (err) {
                    return res.status(400).json({
                        success: false,
                        message: err.message
                    });
                }

                if (!req.file) {
                    return res.status(400).json({
                        success: false,
                        message: 'No file uploaded'
                    });
                }

                const { section, mediaType, title, description } = req.body;
                
                if (!section || !mediaType || !title || !description) {
                    return res.status(400).json({
                        success: false,
                        message: 'Missing required fields: section, mediaType, title, description'
                    });
                }

                try {
                    // Upload to Supabase
                    const uploadResult = await uploadToSupabase(req.file, section);
                    
                    // Save to database with Supabase URL
                    const result = await db.run(
                        `INSERT INTO media (
                            filename, original_name, title, description, section, 
                            media_type, file_path, file_size, mime_type, supabase_url
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            uploadResult.fileName,
                            uploadResult.originalName,
                            title,
                            description,
                            section,
                            mediaType,
                            uploadResult.fileName, // Store Supabase path
                            uploadResult.size,
                            uploadResult.mimeType,
                            uploadResult.publicUrl
                        ]
                    );
                    
                    // Get the inserted media item
                    const mediaItem = await db.get(
                        'SELECT * FROM media WHERE id = ?',
                        [result.id]
                    );
                    
                    res.status(201).json({
                        success: true,
                        message: 'Media uploaded successfully to Supabase',
                        data: {
                            ...mediaItem,
                            url: uploadResult.publicUrl
                        }
                    });
                } catch (uploadError) {
                    console.error('Upload error:', uploadError);
                    res.status(500).json({
                        success: false,
                        message: 'Error uploading to Supabase: ' + uploadError.message
                    });
                }
            });

        } else if (req.method === 'DELETE') {
            // Delete media from Supabase and database
            const { id } = req.query;
            
            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'Media ID is required'
                });
            }
            
            // Get media info before deletion
            const mediaItem = await db.get('SELECT * FROM media WHERE id = ?', [id]);
            
            if (!mediaItem) {
                return res.status(404).json({
                    success: false,
                    message: 'Media not found'
                });
            }
            
            try {
                // Delete from Supabase if it's a Supabase file
                if (mediaItem.filename && mediaItem.filename.includes('/')) {
                    await deleteFromSupabase(mediaItem.filename);
                }
                
                // Delete from database
                const result = await db.run('DELETE FROM media WHERE id = ?', [id]);
                
                res.json({
                    success: true,
                    message: 'Media deleted successfully from Supabase and database'
                });
            } catch (deleteError) {
                console.error('Delete error:', deleteError);
                res.status(500).json({
                    success: false,
                    message: 'Error deleting from Supabase: ' + deleteError.message
                });
            }

        } else {
            res.status(405).json({
                success: false,
                message: 'Method not allowed'
            });
        }
    } catch (error) {
        console.error('Error in media-v2 API:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}