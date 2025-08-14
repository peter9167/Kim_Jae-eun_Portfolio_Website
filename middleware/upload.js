const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage - Use memory storage for Vercel compatibility
const storage = process.env.NODE_ENV === 'production' 
    ? multer.memoryStorage() // Use memory storage in production (Vercel)
    : multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, uploadDir);
        },
        filename: function (req, file, cb) {
            const fileExtension = path.extname(file.originalname);
            const fileName = `${uuidv4()}${fileExtension}`;
            cb(null, fileName);
        }
    });

// File size limits
const FILE_LIMITS = {
    image: {
        maxSize: 3 * 1024 * 1024, // 3MB
        allowedTypes: ['jpg', 'jpeg', 'png', 'webp'],
        maxDimensions: { width: 1920, height: 1080 }
    },
    video: {
        maxSize: 50 * 1024 * 1024, // 50MB
        allowedTypes: ['mp4', 'webm', 'mov'],
        maxDuration: 180 // 3 minutes (in seconds)
    }
};

// File filter function
const fileFilter = (req, file, cb) => {
    const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
    const isImageType = FILE_LIMITS.image.allowedTypes.includes(fileExtension);
    const isVideoType = FILE_LIMITS.video.allowedTypes.includes(fileExtension);
    
    if (isImageType || isVideoType) {
        // Store file type in request for later validation
        req.fileType = isImageType ? 'image' : 'video';
        cb(null, true);
    } else {
        const allowedTypes = [...FILE_LIMITS.image.allowedTypes, ...FILE_LIMITS.video.allowedTypes];
        cb(new Error(`File type .${fileExtension} is not allowed. Allowed types: ${allowedTypes.join(', ')}`), false);
    }
};

// Dynamic file size validation function
const getFileSizeLimit = (req, file) => {
    const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
    const isImageType = FILE_LIMITS.image.allowedTypes.includes(fileExtension);
    return isImageType ? FILE_LIMITS.image.maxSize : FILE_LIMITS.video.maxSize;
};

// Configure multer with dynamic limits
const upload = multer({
    storage: storage,
    limits: {
        fileSize: FILE_LIMITS.video.maxSize, // Use max limit (will be validated later)
        files: 1 // Only allow single file upload
    },
    fileFilter: fileFilter
});

// Middleware for single file upload
const uploadSingle = upload.single('file');

// Error handling wrapper with dynamic size validation
const handleUpload = (req, res, next) => {
    uploadSingle(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    message: 'File too large. Maximum size for images is 3MB, for videos is 50MB.'
                });
            }
            if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                return res.status(400).json({
                    success: false,
                    message: 'Too many files or invalid field name.'
                });
            }
            return res.status(400).json({
                success: false,
                message: `Upload error: ${err.message}`
            });
        } else if (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }
        
        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // Validate file size based on type
        const fileType = req.fileType;
        const fileSize = req.file.size;
        const limit = fileType === 'image' ? FILE_LIMITS.image.maxSize : FILE_LIMITS.video.maxSize;
        
        if (fileSize > limit) {
            // Delete the uploaded file since it exceeds limit
            deleteFile(req.file.path);
            const limitMB = (limit / (1024 * 1024)).toFixed(1);
            return res.status(400).json({
                success: false,
                message: `${fileType === 'image' ? 'Image' : 'Video'} file too large. Maximum size is ${limitMB}MB.`
            });
        }
        
        next();
    });
};

// Utility function to delete file
const deleteFile = (filePath) => {
    return new Promise((resolve, reject) => {
        fs.unlink(filePath, (err) => {
            if (err && err.code !== 'ENOENT') {
                console.error('Error deleting file:', err);
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

// Middleware to validate required fields
const validateMediaFields = (req, res, next) => {
    const { section, mediaType, title, description } = req.body;
    
    if (!section || !mediaType || !title || !description) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields: section, mediaType, title, description'
        });
    }
    
    // Validate section
    const validSections = [
        'leadership', 'global-ensemble', 'refugee', 'gem', 'fos', 'rcy',
        'jeju-galot', 'hyanggyo', 'sports', 'sign-language', 'awards', 'news'
    ];
    
    if (!validSections.includes(section)) {
        return res.status(400).json({
            success: false,
            message: `Invalid section. Must be one of: ${validSections.join(', ')}`
        });
    }
    
    // Validate media type
    const validMediaTypes = ['image', 'video'];
    if (!validMediaTypes.includes(mediaType)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid mediaType. Must be "image" or "video"'
        });
    }
    
    next();
};

module.exports = {
    handleUpload,
    deleteFile,
    validateMediaFields,
    uploadDir,
    FILE_LIMITS
};