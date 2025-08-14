// Vercel API Route for media
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Import database
const { getDatabase } = require('../config/database');

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
        if (req.method === 'GET') {
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
            
            res.status(200).json({
                success: true,
                data: mediaWithUrls
            });
        } else {
            res.status(405).json({
                success: false,
                message: 'Method not allowed'
            });
        }
    } catch (error) {
        console.error('Error in media API:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}