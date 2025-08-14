const express = require('express');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../config/database');
const { adminAuth } = require('../middleware/auth');
const { handleUpload, deleteFile, validateMediaFields } = require('../middleware/upload');

const router = express.Router();

// Serve media files (for production/Vercel)
router.get('/serve/:id', async (req, res) => {
    try {
        const db = getDatabase();
        const { id } = req.params;
        
        const mediaItem = await db.get('SELECT * FROM media WHERE id = ?', [id]);
        
        if (!mediaItem) {
            return res.status(404).json({
                success: false,
                message: 'Media not found'
            });
        }
        
        if (process.env.NODE_ENV === 'production' && mediaItem.file_data) {
            // Serve from database (Base64)
            const buffer = Buffer.from(mediaItem.file_data, 'base64');
            res.set({
                'Content-Type': mediaItem.mime_type,
                'Content-Length': buffer.length,
                'Cache-Control': 'public, max-age=31536000'
            });
            res.send(buffer);
        } else if (mediaItem.file_path && !mediaItem.file_path.startsWith('memory://')) {
            // Serve from file system (development)
            res.sendFile(mediaItem.file_path, (err) => {
                if (err) {
                    console.error('Error serving file:', err);
                    res.status(404).json({
                        success: false,
                        message: 'File not found'
                    });
                }
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'File not available'
            });
        }
    } catch (error) {
        console.error('Error serving media:', error);
        res.status(500).json({
            success: false,
            message: 'Error serving media'
        });
    }
});

// Get all media (public endpoint)
router.get('/', async (req, res) => {
    try {
        const db = getDatabase();
        const { section } = req.query;
        
        let sql = 'SELECT * FROM media ORDER BY upload_date DESC';
        let params = [];
        
        if (section) {
            sql = 'SELECT * FROM media WHERE section = ? ORDER BY upload_date DESC';
            params = [section];
        }
        
        const media = await db.all(sql, params);
        
        // Transform file paths to URLs
        const mediaWithUrls = media.map(item => ({
            ...item,
            url: process.env.NODE_ENV === 'production' 
                ? `/api/media/serve/${item.id}` 
                : `/uploads/${item.section}/${item.filename}`,
            upload_date: item.upload_date
        }));
        
        res.json({
            success: true,
            data: mediaWithUrls
        });
    } catch (error) {
        console.error('Error fetching media:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching media'
        });
    }
});

// Get media by section (public endpoint)
router.get('/section/:section', async (req, res) => {
    try {
        const db = getDatabase();
        const { section } = req.params;
        
        const media = await db.all(
            'SELECT * FROM media WHERE section = ? ORDER BY upload_date DESC',
            [section]
        );
        
        // Transform file paths to URLs
        const mediaWithUrls = media.map(item => ({
            ...item,
            url: process.env.NODE_ENV === 'production' 
                ? `/api/media/serve/${item.id}` 
                : `/uploads/${item.section}/${item.filename}`
        }));
        
        res.json({
            success: true,
            data: mediaWithUrls
        });
    } catch (error) {
        console.error('Error fetching media by section:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching media'
        });
    }
});

// Upload new media (admin only)
router.post('/upload', adminAuth, handleUpload, validateMediaFields, async (req, res) => {
    try {
        const db = getDatabase();
        const { section, mediaType, title, description } = req.body;
        const file = req.file;
        
        let fileData = null;
        let filePath = null;
        
        if (process.env.NODE_ENV === 'production') {
            // In production (Vercel), store file as base64 in database
            fileData = file.buffer.toString('base64');
            filePath = `memory://${file.filename || `${uuidv4()}${path.extname(file.originalname)}`}`;
        } else {
            // In development, use file system
            const fs = require('fs');
            const sectionDir = path.join(__dirname, '..', 'uploads', section);
            if (!fs.existsSync(sectionDir)) {
                fs.mkdirSync(sectionDir, { recursive: true });
            }
            
            const filename = file.filename || `${uuidv4()}${path.extname(file.originalname)}`;
            const newFilePath = path.join(sectionDir, filename);
            fs.renameSync(file.path, newFilePath);
            filePath = newFilePath;
        }
        
        // Save media info to database
        const filename = file.filename || `${uuidv4()}${path.extname(file.originalname)}`;
        const result = await db.run(
            `INSERT INTO media (
                filename, original_name, title, description, section, 
                media_type, file_path, file_size, mime_type, file_data
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                filename,
                file.originalname,
                title,
                description,
                section,
                mediaType,
                filePath,
                file.size,
                file.mimetype,
                fileData
            ]
        );
        
        // Get the inserted media item
        const mediaItem = await db.get(
            'SELECT * FROM media WHERE id = ?',
            [result.id]
        );
        
        // Transform file path to URL
        const responseData = {
            ...mediaItem,
            url: process.env.NODE_ENV === 'production' 
                ? `/api/media/serve/${mediaItem.id}` 
                : `/uploads/${section}/${filename}`
        };
        
        res.status(201).json({
            success: true,
            message: 'Media uploaded successfully',
            data: responseData
        });
    } catch (error) {
        console.error('Error uploading media:', error);
        
        // Clean up uploaded file if database operation failed
        if (req.file) {
            try {
                await deleteFile(req.file.path);
            } catch (deleteError) {
                console.error('Error deleting file after failed upload:', deleteError);
            }
        }
        
        res.status(500).json({
            success: false,
            message: 'Error uploading media'
        });
    }
});

// Delete media (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        const db = getDatabase();
        const { id } = req.params;
        
        // Get media info before deletion
        const mediaItem = await db.get('SELECT * FROM media WHERE id = ?', [id]);
        
        if (!mediaItem) {
            return res.status(404).json({
                success: false,
                message: 'Media not found'
            });
        }
        
        // Delete from database
        const result = await db.run('DELETE FROM media WHERE id = ?', [id]);
        
        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Media not found'
            });
        }
        
        // Delete physical file
        try {
            await deleteFile(mediaItem.file_path);
        } catch (fileError) {
            console.error('Error deleting physical file:', fileError);
            // Continue even if file deletion fails
        }
        
        res.json({
            success: true,
            message: 'Media deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting media:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting media'
        });
    }
});

// Update media info (admin only)
router.put('/:id', adminAuth, async (req, res) => {
    try {
        const db = getDatabase();
        const { id } = req.params;
        const { title, description } = req.body;
        
        if (!title || !description) {
            return res.status(400).json({
                success: false,
                message: 'Title and description are required'
            });
        }
        
        const result = await db.run(
            'UPDATE media SET title = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [title, description, id]
        );
        
        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Media not found'
            });
        }
        
        // Get updated media item
        const mediaItem = await db.get('SELECT * FROM media WHERE id = ?', [id]);
        const responseData = {
            ...mediaItem,
            url: process.env.NODE_ENV === 'production' 
                ? `/api/media/serve/${mediaItem.id}` 
                : `/uploads/${mediaItem.section}/${mediaItem.filename}`
        };
        
        res.json({
            success: true,
            message: 'Media updated successfully',
            data: responseData
        });
    } catch (error) {
        console.error('Error updating media:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating media'
        });
    }
});

// Get media statistics (admin only)
router.get('/stats', adminAuth, async (req, res) => {
    try {
        const db = getDatabase();
        
        // Get total count
        const totalResult = await db.get('SELECT COUNT(*) as total FROM media');
        
        // Get count by section
        const sectionCounts = await db.all(`
            SELECT section, COUNT(*) as count 
            FROM media 
            GROUP BY section 
            ORDER BY count DESC
        `);
        
        // Get count by media type
        const typeCounts = await db.all(`
            SELECT media_type, COUNT(*) as count 
            FROM media 
            GROUP BY media_type
        `);
        
        // Get total file size
        const sizeResult = await db.get('SELECT SUM(file_size) as totalSize FROM media');
        
        res.json({
            success: true,
            data: {
                total: totalResult.total,
                sections: sectionCounts,
                types: typeCounts,
                totalSize: sizeResult.totalSize || 0
            }
        });
    } catch (error) {
        console.error('Error fetching media stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics'
        });
    }
});

module.exports = router;