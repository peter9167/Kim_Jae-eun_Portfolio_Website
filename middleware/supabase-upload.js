const multer = require('multer');
const { getSupabase } = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

// Use memory storage for Supabase uploads
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

// Upload file to Supabase Storage
async function uploadToSupabase(file, section) {
    try {
        const supabase = getSupabase();
        
        // Generate unique filename
        const fileExtension = file.originalname.split('.').pop();
        const fileName = `${section}/${uuidv4()}.${fileExtension}`;
        
        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('portfolio-assets')
            .upload(fileName, file.buffer, {
                contentType: file.mimetype,
                upsert: false
            });
        
        if (error) {
            throw error;
        }
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('portfolio-assets')
            .getPublicUrl(fileName);
        
        return {
            fileName: data.path,
            publicUrl: publicUrl,
            originalName: file.originalname,
            size: file.size,
            mimeType: file.mimetype
        };
    } catch (error) {
        console.error('Supabase upload error:', error);
        throw error;
    }
}

// Delete file from Supabase Storage
async function deleteFromSupabase(fileName) {
    try {
        const supabase = getSupabase();
        
        const { error } = await supabase.storage
            .from('portfolio-assets')
            .remove([fileName]);
        
        if (error) {
            throw error;
        }
        
        return true;
    } catch (error) {
        console.error('Supabase delete error:', error);
        throw error;
    }
}

// Middleware for handling file uploads
const handleSupabaseUpload = upload.single('file');

module.exports = {
    handleSupabaseUpload,
    uploadToSupabase,
    deleteFromSupabase
};