const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
function verifyToken(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1] || req.session.token;
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. No token provided.'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
}

// Middleware to check session-based authentication
function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }
    
    req.user = req.session.user;
    next();
}

// Middleware to check admin role
function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Admin access required'
        });
    }
    next();
}

// Combined middleware for admin routes
function adminAuth(req, res, next) {
    // Try session-based auth first
    if (req.session.user && req.session.user.role === 'admin') {
        req.user = req.session.user;
        return next();
    }
    
    // Fall back to token-based auth
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
}

module.exports = {
    verifyToken,
    requireAuth,
    requireAdmin,
    adminAuth
};