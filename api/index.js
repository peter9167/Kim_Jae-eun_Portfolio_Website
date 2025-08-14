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

// Admin page route
app.get('/admin', (req, res) => {
    try {
        const adminHtmlPath = path.join(__dirname, '..', 'public', 'admin.html');
        
        // Check if file exists
        if (fs.existsSync(adminHtmlPath)) {
            res.sendFile(adminHtmlPath);
        } else {
            // Send inline admin page if file doesn't exist
            res.send(`
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Portfolio Admin</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 50px; }
        .login-form { max-width: 400px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; }
        input { width: 100%; padding: 10px; margin: 10px 0; }
        button { width: 100%; padding: 10px; background: #007cba; color: white; border: none; }
    </style>
</head>
<body>
    <div class="login-form">
        <h1>Portfolio Admin</h1>
        <form id="loginForm">
            <input type="text" id="username" placeholder="아이디" required>
            <input type="password" id="password" placeholder="비밀번호" required>
            <button type="submit">로그인</button>
        </form>
        <div id="message"></div>
    </div>
    <script>
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    document.getElementById('message').innerHTML = 
                        '<p style="color: green;">로그인 성공! 관리자 기능은 현재 개발 중입니다.</p>';
                } else {
                    document.getElementById('message').innerHTML = 
                        '<p style="color: red;">로그인 실패: ' + result.message + '</p>';
                }
            } catch (error) {
                document.getElementById('message').innerHTML = 
                    '<p style="color: red;">에러가 발생했습니다.</p>';
            }
        });
    </script>
</body>
</html>
            `);
        }
    } catch (error) {
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