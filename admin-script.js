// ==================== ADMIN PANEL JAVASCRIPT ==================== //

class AdminPanel {
    constructor() {
        this.isLoggedIn = false;
        this.mediaData = JSON.parse(localStorage.getItem('portfolioMedia')) || {};
        
        // File size limits (must match server-side limits)
        this.FILE_LIMITS = {
            image: {
                maxSize: 3 * 1024 * 1024, // 3MB
                allowedTypes: ['jpg', 'jpeg', 'png', 'webp'],
                maxDimensions: { width: 1920, height: 1080 }
            },
            video: {
                maxSize: 50 * 1024 * 1024, // 50MB
                allowedTypes: ['mp4', 'webm', 'mov'],
                maxDuration: 180 // 3 minutes
            }
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkLoginStatus();
        this.loadMediaGrid();
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.handleLogout.bind(this));
        }

        // Upload form
        const uploadForm = document.getElementById('upload-form');
        if (uploadForm) {
            uploadForm.addEventListener('submit', this.handleUpload.bind(this));
        }

        // File input preview
        const fileInput = document.getElementById('file-input');
        if (fileInput) {
            fileInput.addEventListener('change', this.handleFilePreview.bind(this));
        }

        // Filter controls
        const filterSection = document.getElementById('filter-section');
        if (filterSection) {
            filterSection.addEventListener('change', this.filterMedia.bind(this));
        }

        const refreshBtn = document.getElementById('refresh-media');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', this.loadMediaGrid.bind(this));
        }
    }

    async checkLoginStatus() {
        try {
            const response = await fetch('/api/auth/status', {
                credentials: 'include'
            });
            const result = await response.json();
            
            if (result.success && result.authenticated) {
                this.isLoggedIn = true;
                this.showDashboard();
            } else {
                this.showLogin();
            }
        } catch (error) {
            console.error('Error checking login status:', error);
            this.showLogin();
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('login-error');
        const loginBtn = e.target.querySelector('button[type="submit"]');

        // Show loading state
        loginBtn.disabled = true;
        loginBtn.textContent = '로그인 중...';

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password }),
                credentials: 'include'
            });

            const result = await response.json();

            if (response.ok && result.success) {
                this.isLoggedIn = true;
                this.showDashboard();
                this.showMessage('로그인 성공!', 'success');
            } else {
                errorDiv.textContent = result.message || '로그인에 실패했습니다.';
                errorDiv.style.display = 'block';
                setTimeout(() => {
                    errorDiv.style.display = 'none';
                }, 3000);
            }
        } catch (error) {
            console.error('Login error:', error);
            errorDiv.textContent = '로그인 중 오류가 발생했습니다.';
            errorDiv.style.display = 'block';
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 3000);
        } finally {
            // Reset loading state
            loginBtn.disabled = false;
            loginBtn.textContent = '로그인';
        }
    }

    async handleLogout() {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.error('Logout error:', error);
        }
        
        this.isLoggedIn = false;
        this.showLogin();
        this.showMessage('로그아웃되었습니다.', 'success');
    }

    showLogin() {
        document.getElementById('login-section').style.display = 'flex';
        document.getElementById('admin-dashboard').style.display = 'none';
    }

    showDashboard() {
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'block';
        this.loadMediaGrid();
    }

    validateFile(file) {
        const fileExtension = file.name.split('.').pop().toLowerCase();
        const isImageType = this.FILE_LIMITS.image.allowedTypes.includes(fileExtension);
        const isVideoType = this.FILE_LIMITS.video.allowedTypes.includes(fileExtension);
        
        // Check file type
        if (!isImageType && !isVideoType) {
            const allowedTypes = [...this.FILE_LIMITS.image.allowedTypes, ...this.FILE_LIMITS.video.allowedTypes];
            return {
                valid: false,
                message: `File type .${fileExtension} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
            };
        }
        
        // Check file size
        const fileType = isImageType ? 'image' : 'video';
        const limit = this.FILE_LIMITS[fileType].maxSize;
        const limitMB = (limit / (1024 * 1024)).toFixed(1);
        
        if (file.size > limit) {
            return {
                valid: false,
                message: `${fileType === 'image' ? 'Image' : 'Video'} file too large. Maximum size is ${limitMB}MB.`
            };
        }
        
        return {
            valid: true,
            fileType: fileType,
            message: `File valid. Size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`
        };
    }

    handleFilePreview(e) {
        const file = e.target.files[0];
        const preview = document.getElementById('file-preview');
        const previewImage = document.getElementById('preview-image');
        const previewVideo = document.getElementById('preview-video');
        const previewFilename = document.getElementById('preview-filename');
        const uploadBtn = document.querySelector('#upload-form button[type="submit"]');

        if (file) {
            // Validate file first
            const validation = this.validateFile(file);
            
            if (!validation.valid) {
                this.showMessage(validation.message, 'error');
                e.target.value = ''; // Clear the input
                preview.style.display = 'none';
                if (uploadBtn) uploadBtn.disabled = true;
                return;
            }

            preview.style.display = 'block';
            previewFilename.innerHTML = `
                <strong>${file.name}</strong><br>
                <small class="file-info">${validation.message}</small>
            `;
            if (uploadBtn) uploadBtn.disabled = false;

            const reader = new FileReader();
            reader.onload = (e) => {
                if (file.type.startsWith('image/')) {
                    previewImage.src = e.target.result;
                    previewImage.style.display = 'block';
                    previewVideo.style.display = 'none';
                } else if (file.type.startsWith('video/')) {
                    previewVideo.src = e.target.result;
                    previewVideo.style.display = 'block';
                    previewImage.style.display = 'none';
                }
            };
            reader.readAsDataURL(file);
        } else {
            preview.style.display = 'none';
            if (uploadBtn) uploadBtn.disabled = true;
        }
    }

    handleUpload(e) {
        e.preventDefault();
        
        // Get form values by ID
        const section = document.getElementById('section-select').value;
        const mediaType = document.getElementById('media-type').value;
        const title = document.getElementById('media-title').value;
        const description = document.getElementById('media-description').value;
        const fileInput = document.getElementById('file-input');
        const file = fileInput.files[0];

        // Debug log
        console.log('Form values:', { section, mediaType, title, description, file: file?.name });

        if (!file || !section || !mediaType || !title || !description) {
            this.showMessage('모든 필드를 입력해주세요.', 'error');
            return;
        }

        // Show loading state
        const uploadBtn = document.querySelector('.upload-btn');
        uploadBtn.classList.add('loading');
        uploadBtn.disabled = true;
        uploadBtn.textContent = '업로드 중...';

        // Process upload asynchronously
        this.processUpload(section, mediaType, title, description, file, () => {
            // Reset form
            e.target.reset();
            document.getElementById('file-preview').style.display = 'none';
            
            // Remove loading state
            uploadBtn.classList.remove('loading');
            uploadBtn.disabled = false;
            uploadBtn.textContent = '업로드';
            
            this.showMessage('업로드가 완료되었습니다!', 'success');
            this.loadMediaGrid();
        });
    }

    async processUpload(section, mediaType, title, description, file, callback) {
        try {
            // Debug log
            console.log('Upload parameters:', { section, mediaType, title, description, file: file?.name });
            
            // Create FormData for server upload
            const formData = new FormData();
            formData.append('file', file);
            formData.append('section', section);
            formData.append('mediaType', mediaType);
            formData.append('title', title);
            formData.append('description', description);
            
            // Debug log FormData
            for (let [key, value] of formData.entries()) {
                console.log(`FormData ${key}:`, value);
            }

            // Upload to server
            const response = await fetch('/api/media/upload', {
                method: 'POST',
                body: formData,
                credentials: 'include' // Include session cookies
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || `서버 오류: ${response.status}`);
            }

            // Update local data for immediate display
            if (!this.mediaData[section]) {
                this.mediaData[section] = [];
            }
            
            const mediaItem = {
                id: result.data.id,
                filename: result.data.filename,
                originalName: result.data.original_name,
                title: result.data.title,
                description: result.data.description,
                type: result.data.media_type,
                url: result.data.url,
                uploadDate: result.data.upload_date,
                section: result.data.section
            };
            
            this.mediaData[section].push(mediaItem);
            
            // Update localStorage for consistency
            localStorage.setItem('portfolioMedia', JSON.stringify(this.mediaData));
            
            // Update main portfolio page
            this.updateMainPortfolio(section, mediaItem);
            
            if (callback) callback();
        } catch (error) {
            console.error('Upload error:', error);
            this.showMessage(error.message, 'error');
            if (callback) callback();
        }
    }

    updateMainPortfolio(section, mediaItem) {
        // This function would update the main index.html page
        // In a real application, this would make an API call to update the database
        
        try {
            // Dispatch custom event to update main page if it's open
            window.dispatchEvent(new CustomEvent('mediaUploaded', {
                detail: { section, mediaItem }
            }));
        } catch (error) {
            console.log('Main portfolio page not open or event not caught');
        }
    }

    async loadMediaGrid() {
        const mediaGrid = document.getElementById('media-grid');
        if (!mediaGrid) return;

        mediaGrid.innerHTML = '<p style="text-align: center; color: #6b7280; grid-column: 1 / -1;">로딩 중...</p>';
        
        try {
            const filterSection = document.getElementById('filter-section').value;
            let url = '/api/media';
            if (filterSection) {
                url += `?section=${filterSection}`;
            }

            const response = await fetch(url, {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`서버 오류: ${response.status}`);
            }

            const result = await response.json();
            const allMedia = result.data || [];
            
            // Update local data for consistency
            this.mediaData = {};
            allMedia.forEach(item => {
                if (!this.mediaData[item.section]) {
                    this.mediaData[item.section] = [];
                }
                this.mediaData[item.section].push({
                    id: item.id,
                    filename: item.filename,
                    originalName: item.original_name,
                    title: item.title,
                    description: item.description,
                    type: item.media_type,
                    url: item.url,
                    uploadDate: item.upload_date,
                    section: item.section
                });
            });
            
            // Update localStorage
            localStorage.setItem('portfolioMedia', JSON.stringify(this.mediaData));
            
            mediaGrid.innerHTML = '';
            
            if (allMedia.length === 0) {
                mediaGrid.innerHTML = '<p style="text-align: center; color: #6b7280; grid-column: 1 / -1;">업로드된 미디어가 없습니다.</p>';
                return;
            }
            
            // Sort by upload date (newest first)
            allMedia.sort((a, b) => new Date(b.upload_date) - new Date(a.upload_date));
            
            // Create media items
            allMedia.forEach(item => {
                const mediaElement = this.createMediaElement({
                    id: item.id,
                    filename: item.filename,
                    originalName: item.original_name,
                    title: item.title,
                    description: item.description,
                    type: item.media_type,
                    url: item.url,
                    uploadDate: item.upload_date,
                    section: item.section
                });
                mediaGrid.appendChild(mediaElement);
            });
        } catch (error) {
            console.error('Error loading media:', error);
            mediaGrid.innerHTML = '<p style="text-align: center; color: #ef4444; grid-column: 1 / -1;">미디어를 불러오는 중 오류가 발생했습니다.</p>';
        }
    }

    createMediaElement(item) {
        const div = document.createElement('div');
        div.className = 'media-item-admin';
        
        const mediaElement = item.type === 'image' 
            ? `<img src="${item.url}" alt="${item.title}" loading="lazy" style="object-fit: cover;">`
            : `<video src="${item.url}" muted style="object-fit: cover;"></video>`;
        
        div.innerHTML = `
            ${mediaElement}
            <div class="media-item-info">
                <div class="media-item-title">${item.title}</div>
                <div class="media-item-section">${this.getSectionDisplayName(item.section)}</div>
                <div class="media-item-actions">
                    <button class="delete-btn" onclick="adminPanel.deleteMedia('${item.section}', ${item.id})">
                        삭제
                    </button>
                </div>
            </div>
        `;
        
        return div;
    }

    getSectionDisplayName(section) {
        const sectionNames = {
            'leadership': 'Leadership',
            'global-ensemble': 'Global Ensemble',
            'refugee': 'Refugee Support',
            'gem': 'GEM Program',
            'fos': 'FOS Initiative',
            'rcy': 'RCY Activities',
            'jeju-galot': 'Jeju Galot',
            'hyanggyo': 'Hyanggyo',
            'sports': 'Sports',
            'sign-language': 'Sign Language',
            'awards': 'Awards',
            'news': 'News'
        };
        
        return sectionNames[section] || section;
    }

    async deleteMedia(section, itemId) {
        if (!confirm('이 미디어를 삭제하시겠습니까?')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/media/${itemId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || `서버 오류: ${response.status}`);
            }

            // Reload grid to reflect changes
            this.loadMediaGrid();
            
            this.showMessage('미디어가 삭제되었습니다.', 'success');
            
            // Dispatch event to update main page
            window.dispatchEvent(new CustomEvent('mediaDeleted', {
                detail: { section, itemId }
            }));
        } catch (error) {
            console.error('Delete error:', error);
            this.showMessage(error.message, 'error');
        }
    }

    filterMedia() {
        this.loadMediaGrid();
    }

    showMessage(message, type = 'success') {
        const container = document.getElementById('message-container');
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        
        container.appendChild(messageDiv);
        
        // Remove message after 3 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 3000);
    }
}

// ==================== INITIALIZATION ==================== //

let adminPanel;

document.addEventListener('DOMContentLoaded', () => {
    try {
        adminPanel = new AdminPanel();
        console.log('Admin panel initialized successfully');
    } catch (error) {
        console.error('Error initializing admin panel:', error);
    }
});

// ==================== HELPER FUNCTIONS ==================== //

// Export function for main portfolio to get media data
window.getPortfolioMedia = () => {
    return JSON.parse(localStorage.getItem('portfolioMedia')) || {};
};

// Function to clear all media (for testing)
window.clearAllMedia = () => {
    localStorage.removeItem('portfolioMedia');
    if (adminPanel) {
        adminPanel.mediaData = {};
        adminPanel.loadMediaGrid();
        adminPanel.showMessage('모든 미디어가 삭제되었습니다.', 'success');
    }
};