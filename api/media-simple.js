const { getSupabase } = require('../config/supabase');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

// Use memory storage for Vercel
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
        files: 1
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'mov', 'avi', 'webm'];
        const fileExtension = file.originalname.split('.').pop().toLowerCase();
        
        if (allowedTypes.includes(fileExtension)) {
            cb(null, true);
        } else {
            cb(new Error(`File type .${fileExtension} is not allowed`), false);
        }
    }
});

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
        const supabase = getSupabase();

        if (req.method === 'GET') {
            // Get all media from Supabase storage
            const { data: files, error } = await supabase.storage
                .from('portfolio-assets')
                .list('', {
                    limit: 1000,
                    sortBy: { column: 'created_at', order: 'desc' }
                });

            if (error) {
                throw error;
            }

            // Get public URLs for all files
            const mediaWithUrls = files.map(file => {
                const { data: { publicUrl } } = supabase.storage
                    .from('portfolio-assets')
                    .getPublicUrl(file.name);

                // Parse section from file path
                const section = file.name.split('/')[0];
                const fileExtension = file.name.split('.').pop().toLowerCase();
                const mediaType = ['mp4', 'mov', 'avi', 'webm'].includes(fileExtension) ? 'video' : 'image';

                return {
                    id: file.id || file.name,
                    filename: file.name,
                    original_name: file.name.split('/').pop(),
                    title: file.metadata?.title || file.name.split('/').pop(),
                    description: file.metadata?.description || '',
                    section: section,
                    media_type: mediaType,
                    url: publicUrl,
                    upload_date: file.created_at,
                    file_size: file.metadata?.size
                };
            });
            
            res.status(200).json({
                success: true,
                data: mediaWithUrls
            });

        } else if (req.method === 'POST') {
            // Handle file upload
            upload.single('file')(req, res, async (err) => {
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
                    // Generate unique filename
                    const fileExtension = req.file.originalname.split('.').pop();
                    const fileName = `${section}/${uuidv4()}.${fileExtension}`;
                    
                    // Upload to Supabase Storage with metadata
                    const { data, error } = await supabase.storage
                        .from('portfolio-assets')
                        .upload(fileName, req.file.buffer, {
                            contentType: req.file.mimetype,
                            upsert: false,
                            metadata: {
                                title: title,
                                description: description,
                                section: section,
                                mediaType: mediaType,
                                originalName: req.file.originalname,
                                size: req.file.size
                            }
                        });
                    
                    if (error) {
                        throw error;
                    }
                    
                    // Get public URL
                    const { data: { publicUrl } } = supabase.storage
                        .from('portfolio-assets')
                        .getPublicUrl(fileName);
                    
                    res.status(201).json({
                        success: true,
                        message: 'Media uploaded successfully to Supabase',
                        data: {
                            id: data.path,
                            filename: data.path,
                            original_name: req.file.originalname,
                            title: title,
                            description: description,
                            section: section,
                            media_type: mediaType,
                            url: publicUrl,
                            upload_date: new Date().toISOString(),
                            file_size: req.file.size
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
            // Delete media from Supabase
            const { fileName } = req.query;
            
            if (!fileName) {
                return res.status(400).json({
                    success: false,
                    message: 'File name is required'
                });
            }
            
            try {
                const { error } = await supabase.storage
                    .from('portfolio-assets')
                    .remove([fileName]);
                
                if (error) {
                    throw error;
                }
                
                res.json({
                    success: true,
                    message: 'Media deleted successfully from Supabase'
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
        console.error('Error in media-simple API:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};