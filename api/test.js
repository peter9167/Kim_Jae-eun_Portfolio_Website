// Simple test API to verify Vercel API routes work
module.exports = function handler(req, res) {
    res.status(200).json({ 
        success: true, 
        message: 'Vercel API routes working!', 
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url
    });
}