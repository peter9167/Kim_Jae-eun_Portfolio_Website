# Kim Je-eun Portfolio Website

A professional portfolio website with admin panel for dynamic content management.

## Features

- **Modern Portfolio Website**: Responsive design with gallery lightbox functionality
- **Admin Panel**: Secure admin interface for content management
- **File Upload**: Support for images and videos with automatic optimization
- **Database Storage**: SQLite database for reliable data persistence
- **API-based**: RESTful API architecture for scalability
- **Security**: JWT authentication, rate limiting, and security headers

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite3
- **File Upload**: Multer
- **Authentication**: JWT, bcryptjs
- **Frontend**: Vanilla JavaScript, CSS3, HTML5
- **Security**: Helmet, CORS, Rate Limiting

## Installation

1. **Clone or download the project**
   ```bash
   # Navigate to the project directory
   cd "김제은 포트폴리오 웹"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   - Copy `.env` file and update the following variables for production:
   ```env
   # Change these in production!
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   SESSION_SECRET=your-super-secret-session-key-change-this-in-production
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=portfolio2024
   ```

4. **Initialize Database**
   ```bash
   npm run init-db
   ```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The application will start on `http://localhost:3000`

## Usage

### Main Portfolio
- Visit: `http://localhost:3000`
- Browse different sections using the navigation menu
- Click on images/videos to view in lightbox mode

### Admin Panel
- Visit: `http://localhost:3000/admin`
- Login credentials:
  - **Username**: `admin`
  - **Password**: `portfolio2024`

### Admin Features
1. **Upload Media**
   - Select section (Leadership, Sports, Awards, etc.)
   - Choose image or video file
   - Add title and description
   - Upload to add to portfolio

2. **Manage Media**
   - View all uploaded media
   - Filter by section
   - Delete unwanted files

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Admin logout
- `GET /api/auth/status` - Check auth status

### Media Management
- `GET /api/media` - Get all media (public)
- `GET /api/media/section/:section` - Get media by section
- `POST /api/media/upload` - Upload new media (admin)
- `DELETE /api/media/:id` - Delete media (admin)
- `PUT /api/media/:id` - Update media info (admin)

### Admin
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/media` - Admin media management
- `GET /api/admin/system` - System information

## File Structure

```
portfolio-website/
├── config/
│   └── database.js          # Database configuration
├── middleware/
│   ├── auth.js              # Authentication middleware
│   └── upload.js            # File upload middleware
├── public/                  # Static frontend files
│   ├── index.html           # Main portfolio page
│   ├── admin.html           # Admin panel
│   ├── styles.css           # Main styles
│   ├── script.js            # Main JavaScript
│   ├── admin-styles.css     # Admin styles
│   └── admin-script.js      # Admin JavaScript
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── media.js             # Media management routes
│   └── admin.js             # Admin routes
├── scripts/
│   └── init-db.js           # Database initialization
├── uploads/                 # Uploaded files (auto-created)
├── data/                    # Database files (auto-created)
├── .env                     # Environment variables
├── package.json             # Node.js dependencies
└── server.js                # Main server file
```

## Deployment

### Production Deployment

1. **Update Environment Variables**
   ```env
   NODE_ENV=production
   PORT=3000
   JWT_SECRET=your-production-jwt-secret
   SESSION_SECRET=your-production-session-secret
   ```

2. **Install PM2 (recommended)**
   ```bash
   npm install -g pm2
   ```

3. **Start with PM2**
   ```bash
   pm2 start server.js --name "portfolio"
   pm2 save
   pm2 startup
   ```

### Nginx Configuration (optional)
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Security Notes

- Change default admin credentials before deployment
- Use strong JWT and session secrets
- Enable HTTPS in production
- Regular backup of database and uploads
- Monitor file upload sizes and types

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Change PORT in .env file or kill existing process
   lsof -ti:3000 | xargs kill -9
   ```

2. **Database connection issues**
   ```bash
   # Reinitialize database
   npm run init-db
   ```

3. **File upload issues**
   - Check file size limits in `.env`
   - Ensure uploads directory has write permissions
   - Verify allowed file types

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions, please check the troubleshooting section or create an issue in the project repository.