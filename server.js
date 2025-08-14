const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Import routes
const authRoutes = require('./routes/auth');
const mediaRoutes = require('./routes/media');
const adminRoutes = require('./routes/admin');

// Security middleware with relaxed video settings
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "blob:", "*"],
            mediaSrc: ["'self'", "data:", "blob:", "*"],
            connectSrc: ["'self'", "*"],
        },
    },
    crossOriginEmbedderPolicy: false, // Disable for video compatibility
    crossOriginResourcePolicy: false, // Disable for video compatibility
}));

// Rate limiting with video exemption
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    skip: (req) => {
        // Skip rate limiting for video files
        const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];
        return videoExtensions.some(ext => req.path.toLowerCase().endsWith(ext));
    }
});
app.use(limiter);

// CORS configuration
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://yourdomain.com'] 
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// API Routes - Define API routes BEFORE static file serving
app.use('/api/auth', authRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/admin', adminRoutes);

// Static files - Serve public directory content
app.use(express.static(path.join(__dirname, 'public')));

// Assets directory - serve from public/assets
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));

// Uploads directory for user-generated content (handled by API)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve main pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Add a test endpoint to verify API routing
app.get('/api/test', (req, res) => {
    res.json({ success: true, message: 'API routing works', timestamp: new Date().toISOString() });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            success: false,
            message: 'File too large. Maximum size is 10MB.'
        });
    }
    
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
            success: false,
            message: 'Invalid file type or too many files.'
        });
    }
    
    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : err.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Initialize database and start server
const { initializeDatabase } = require('./config/database');

async function startServer() {
    try {
        await initializeDatabase();
        console.log('Database initialized successfully');
        
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV}`);
            console.log(`Access the portfolio at: http://localhost:${PORT}`);
            console.log(`Access the admin panel at: http://localhost:${PORT}/admin`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});

module.exports = app;