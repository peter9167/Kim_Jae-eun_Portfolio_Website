const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple auth endpoint for admin
app.post('/api/auth/login', (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Simple admin check
        if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
            res.json({
                success: true,
                message: 'Login successful',
                user: { username: username, role: 'admin' }
            });
        } else {
            res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Login error'
        });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString()
    });
});

// Media API endpoints
app.post('/api/media-simple', (req, res) => {
    // Simple media upload endpoint
    res.json({
        success: true,
        message: 'Upload functionality temporarily disabled',
        data: null
    });
});

app.get('/api/media-simple', (req, res) => {
    // Simple media list endpoint
    res.json({
        success: true,
        data: [],
        message: 'Media list temporarily empty'
    });
});

app.delete('/api/media-simple', (req, res) => {
    // Simple media delete endpoint
    res.json({
        success: true,
        message: 'Delete functionality temporarily disabled'
    });
});

// Static files routes
app.get('/admin-script.js', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'admin-script.js'));
});

app.get('/admin-styles.css', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'admin-styles.css'));
});

app.get('/script.js', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'script.js'));
});

app.get('/styles.css', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'styles.css'));
});

// Admin page route
app.get('/admin', (req, res) => {
    try {
        const adminHtmlPath = path.join(__dirname, '..', 'public', 'admin.html');
        res.sendFile(adminHtmlPath);
    } catch (error) {
        console.error('Admin page error:', error);
        res.status(500).send('Admin page error');
    }
});

// Root route
app.get('/', (req, res) => {
    try {
        const indexPath = path.join(__dirname, '..', 'public', 'index.html');
        if (fs.existsSync(indexPath)) {
            res.sendFile(indexPath);
        } else {
            res.send('<h1>Portfolio Website</h1><p><a href="/admin">Admin</a></p>');
        }
    } catch (error) {
        res.status(500).send('Error loading page');
    }
});

module.exports = app;