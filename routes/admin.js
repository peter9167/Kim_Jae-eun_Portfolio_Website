const express = require('express');
const { getDatabase } = require('../config/database');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// Admin dashboard data
router.get('/dashboard', adminAuth, async (req, res) => {
    try {
        const db = getDatabase();
        
        // Get recent uploads
        const recentUploads = await db.all(`
            SELECT * FROM media 
            ORDER BY upload_date DESC 
            LIMIT 10
        `);
        
        // Get upload statistics
        const totalMedia = await db.get('SELECT COUNT(*) as count FROM media');
        const totalImages = await db.get("SELECT COUNT(*) as count FROM media WHERE media_type = 'image'");
        const totalVideos = await db.get("SELECT COUNT(*) as count FROM media WHERE media_type = 'video'");
        
        // Get storage usage
        const storageUsage = await db.get('SELECT SUM(file_size) as totalSize FROM media');
        
        // Get uploads by section
        const sectionStats = await db.all(`
            SELECT section, COUNT(*) as count, SUM(file_size) as totalSize
            FROM media 
            GROUP BY section 
            ORDER BY count DESC
        `);
        
        // Get recent uploads by day (last 7 days)
        const recentStats = await db.all(`
            SELECT 
                DATE(upload_date) as date,
                COUNT(*) as count
            FROM media 
            WHERE upload_date >= datetime('now', '-7 days')
            GROUP BY DATE(upload_date)
            ORDER BY date DESC
        `);
        
        res.json({
            success: true,
            data: {
                summary: {
                    totalMedia: totalMedia.count,
                    totalImages: totalImages.count,
                    totalVideos: totalVideos.count,
                    totalStorage: storageUsage.totalSize || 0
                },
                recentUploads: recentUploads.map(item => ({
                    ...item,
                    url: process.env.NODE_ENV === 'production' 
                        ? `/api/media/serve/${item.id}` 
                        : `/uploads/${item.section}/${item.filename}`
                })),
                sectionStats,
                recentStats
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard data'
        });
    }
});

// Get all media for admin management
router.get('/media', adminAuth, async (req, res) => {
    try {
        const db = getDatabase();
        const { section, type, page = 1, limit = 20 } = req.query;
        
        let sql = 'SELECT * FROM media';
        let countSql = 'SELECT COUNT(*) as total FROM media';
        let params = [];
        let conditions = [];
        
        if (section) {
            conditions.push('section = ?');
            params.push(section);
        }
        
        if (type) {
            conditions.push('media_type = ?');
            params.push(type);
        }
        
        if (conditions.length > 0) {
            const whereClause = ' WHERE ' + conditions.join(' AND ');
            sql += whereClause;
            countSql += whereClause;
        }
        
        sql += ' ORDER BY upload_date DESC';
        
        // Add pagination
        const offset = (page - 1) * limit;
        sql += ` LIMIT ${limit} OFFSET ${offset}`;
        
        const [media, countResult] = await Promise.all([
            db.all(sql, params),
            db.get(countSql, params)
        ]);
        
        const mediaWithUrls = media.map(item => ({
            ...item,
            url: process.env.NODE_ENV === 'production' 
                ? `/api/media/serve/${item.id}` 
                : `/uploads/${item.section}/${item.filename}`
        }));
        
        res.json({
            success: true,
            data: {
                media: mediaWithUrls,
                pagination: {
                    total: countResult.total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(countResult.total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching admin media:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching media'
        });
    }
});

// Bulk delete media
router.delete('/media/bulk', adminAuth, async (req, res) => {
    try {
        const db = getDatabase();
        const { ids } = req.body;
        
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Media IDs array is required'
            });
        }
        
        // Get media items before deletion for file cleanup
        const mediaItems = await db.all(
            `SELECT * FROM media WHERE id IN (${ids.map(() => '?').join(',')})`,
            ids
        );
        
        // Delete from database
        const result = await db.run(
            `DELETE FROM media WHERE id IN (${ids.map(() => '?').join(',')})`,
            ids
        );
        
        // Delete physical files
        const { deleteFile } = require('../middleware/upload');
        const deletionPromises = mediaItems.map(item => 
            deleteFile(item.file_path).catch(err => 
                console.error(`Error deleting file ${item.file_path}:`, err)
            )
        );
        
        await Promise.all(deletionPromises);
        
        res.json({
            success: true,
            message: `Successfully deleted ${result.changes} media items`
        });
    } catch (error) {
        console.error('Error bulk deleting media:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting media items'
        });
    }
});

// System information
router.get('/system', adminAuth, async (req, res) => {
    try {
        const fs = require('fs');
        const os = require('os');
        const path = require('path');
        
        // Get disk usage of uploads directory
        const uploadsPath = path.join(__dirname, '..', 'uploads');
        let uploadsSize = 0;
        
        try {
            const getDirectorySize = (dirPath) => {
                let size = 0;
                const files = fs.readdirSync(dirPath);
                
                files.forEach(file => {
                    const filePath = path.join(dirPath, file);
                    const stats = fs.statSync(filePath);
                    
                    if (stats.isDirectory()) {
                        size += getDirectorySize(filePath);
                    } else {
                        size += stats.size;
                    }
                });
                
                return size;
            };
            
            if (fs.existsSync(uploadsPath)) {
                uploadsSize = getDirectorySize(uploadsPath);
            }
        } catch (error) {
            console.error('Error calculating uploads size:', error);
        }
        
        res.json({
            success: true,
            data: {
                node: {
                    version: process.version,
                    uptime: process.uptime(),
                    memory: process.memoryUsage()
                },
                system: {
                    platform: os.platform(),
                    arch: os.arch(),
                    totalMemory: os.totalmem(),
                    freeMemory: os.freemem(),
                    cpus: os.cpus().length
                },
                storage: {
                    uploadsSize: uploadsSize
                },
                environment: process.env.NODE_ENV || 'development'
            }
        });
    } catch (error) {
        console.error('Error fetching system info:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching system information'
        });
    }
});

// Clear cache/temporary files
router.post('/maintenance/cleanup', adminAuth, async (req, res) => {
    try {
        // This is a placeholder for cleanup operations
        // In a real implementation, you might:
        // - Clean up orphaned files
        // - Clear temporary directories
        // - Optimize database
        // - Clear logs
        
        res.json({
            success: true,
            message: 'Maintenance cleanup completed'
        });
    } catch (error) {
        console.error('Error during cleanup:', error);
        res.status(500).json({
            success: false,
            message: 'Error during cleanup'
        });
    }
});

module.exports = router;