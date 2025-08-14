const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDatabase } = require('../config/database');

const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }

        // For simplicity, using environment variables for admin auth
        // In production, you should hash the password and store in database
        const adminUsername = process.env.ADMIN_USERNAME;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (username === adminUsername && password === adminPassword) {
            // Generate JWT token
            const token = jwt.sign(
                { username: username, role: 'admin' },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            // Store session
            req.session.user = {
                username: username,
                role: 'admin',
                loginTime: new Date().toISOString()
            };

            res.json({
                success: true,
                message: 'Login successful',
                token: token,
                user: {
                    username: username,
                    role: 'admin'
                }
            });
        } else {
            res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Logout endpoint
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({
                success: false,
                message: 'Could not log out'
            });
        }
        
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    });
});

// Check authentication status
router.get('/status', (req, res) => {
    if (req.session.user) {
        res.json({
            success: true,
            authenticated: true,
            user: req.session.user
        });
    } else {
        res.json({
            success: true,
            authenticated: false
        });
    }
});

// Verify token endpoint
router.post('/verify', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'No token provided'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        res.json({
            success: true,
            user: decoded
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
});

module.exports = router;