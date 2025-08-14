// ==================== MODERN PORTFOLIO JAVASCRIPT ==================== //

class PortfolioApp {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeMobileMenu();
        this.initializeTabSystem();
        this.initializeAnimations();
        this.initializeLightbox();
        this.loadDynamicMedia();
        this.setupAdminEventListeners();
    }

    setupEventListeners() {
        // Scroll events
        window.addEventListener('scroll', this.handleScroll.bind(this));
        
        // Resize events
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // Tab navigation
        document.addEventListener('click', this.handleTabClick.bind(this));
        
        // Mobile dropdown toggles
        document.addEventListener('click', this.handleDropdownClick.bind(this));
        
        // Touch events for mobile
        this.setupTouchEvents();
    }

    handleScroll() {
        const header = document.querySelector('.header');
        const scrollY = window.scrollY;
        
        // Header background on scroll
        if (scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        // Scroll animations
        this.animateOnScroll();
    }

    handleResize() {
        const mobileMenu = document.querySelector('.nav-menu');
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        
        // Close mobile menu on resize to desktop
        if (window.innerWidth > 768) {
            mobileMenu.classList.remove('active');
            mobileToggle.classList.remove('active');
        }
        
        // Reset any mobile dropdown states
        this.closeMobileDropdowns();
    }

    // ==================== MOBILE MENU SYSTEM ==================== //
    initializeMobileMenu() {
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        const mobileMenu = document.querySelector('.nav-menu');
        
        if (mobileToggle && mobileMenu) {
            mobileToggle.addEventListener('click', () => {
                mobileToggle.classList.toggle('active');
                mobileMenu.classList.toggle('active');
                
                // Prevent body scroll when menu is open
                if (mobileMenu.classList.contains('active')) {
                    document.body.style.overflow = 'hidden';
                } else {
                    document.body.style.overflow = '';
                }
            });
        }
    }

    handleDropdownClick(e) {
        if (window.innerWidth <= 768) {
            const navLink = e.target.closest('.nav-link');
            if (navLink && navLink.parentElement.querySelector('.dropdown-menu')) {
                e.preventDefault();
                const navItem = navLink.parentElement;
                const isActive = navItem.classList.contains('active');
                
                // Close all other dropdowns
                this.closeMobileDropdowns();
                
                // Toggle current dropdown
                if (!isActive) {
                    navItem.classList.add('active');
                }
            }
        }
    }

    closeMobileDropdowns() {
        const activeDropdowns = document.querySelectorAll('.nav-item.active');
        activeDropdowns.forEach(item => {
            item.classList.remove('active');
        });
    }

    // ==================== TAB SYSTEM ==================== //
    initializeTabSystem() {
        // Set home as default active tab
        this.showTab('home');
    }

    handleTabClick(e) {
        const tabTrigger = e.target.closest('[data-tab]');
        if (tabTrigger) {
            e.preventDefault();
            const tabName = tabTrigger.getAttribute('data-tab');
            this.showTab(tabName);
            
            // Close mobile menu after tab selection
            if (window.innerWidth <= 768) {
                this.closeMobileMenu();
            }
            
            // Smooth scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    showTab(tabName) {
        // Hide all tab contents
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(tab => {
            tab.classList.remove('active');
        });

        // Remove active class from all nav links
        const navLinks = document.querySelectorAll('.nav-link, .dropdown-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
        });

        // Show selected tab
        const selectedTab = document.getElementById(tabName);
        if (selectedTab) {
            selectedTab.classList.add('active');
        }

        // Add active class to appropriate nav link
        const activeLink = document.querySelector(`[data-tab=\"${tabName}\"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        // Trigger scroll animations for new content
        setTimeout(() => {
            this.animateOnScroll();
        }, 100);
    }

    closeMobileMenu() {
        const mobileMenu = document.querySelector('.nav-menu');
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        
        mobileMenu.classList.remove('active');
        mobileToggle.classList.remove('active');
        document.body.style.overflow = '';
        this.closeMobileDropdowns();
    }

    // ==================== ANIMATIONS ==================== //
    initializeAnimations() {
        // Add fade-in class to elements that should animate
        const animatedElements = document.querySelectorAll(`
            .gallery-item,
            .activity-card,
            .award-item,
            .news-item,
            .section-header
        `);
        
        animatedElements.forEach(el => {
            el.classList.add('fade-in');
        });
        
        // Initial animation check
        this.animateOnScroll();
    }

    animateOnScroll() {
        const fadeElements = document.querySelectorAll('.fade-in:not(.visible)');
        const windowHeight = window.innerHeight;
        
        fadeElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const elementVisible = 150; // Trigger point
            
            if (elementTop < windowHeight - elementVisible) {
                element.classList.add('visible');
            }
        });
    }

    // ==================== TOUCH EVENTS ==================== //
    setupTouchEvents() {
        // Add touch feedback to interactive elements
        const interactiveElements = document.querySelectorAll(`
            .gallery-item,
            .activity-card,
            .award-item,
            .news-item,
            .nav-link,
            .dropdown-link,
            .hero-cta
        `);
        
        interactiveElements.forEach(element => {
            element.addEventListener('touchstart', this.handleTouchStart.bind(this));
            element.addEventListener('touchend', this.handleTouchEnd.bind(this));
        });
    }

    handleTouchStart(e) {
        const element = e.currentTarget;
        element.style.transform = 'scale(0.98)';
        element.style.transition = 'transform 0.1s ease';
    }

    handleTouchEnd(e) {
        const element = e.currentTarget;
        setTimeout(() => {
            element.style.transform = '';
            element.style.transition = '';
        }, 150);
    }

    // ==================== UTILITY METHODS ==================== //
    
    // Smooth scroll to section
    scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            const headerHeight = document.querySelector('.header').offsetHeight;
            const targetPosition = section.offsetTop - headerHeight - 20;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    }

    // Loading state management
    setLoadingState(element, isLoading) {
        if (isLoading) {
            element.classList.add('loading');
        } else {
            element.classList.remove('loading');
        }
    }

    // Debounce utility for performance
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // ==================== LIGHTBOX FUNCTIONALITY ==================== //
    
    initializeLightbox() {
        this.currentImageIndex = 0;
        this.galleryImages = [];
        this.createLightboxHTML();
        this.setupLightboxEvents();
    }

    createLightboxHTML() {
        const lightboxHTML = `
            <div class="lightbox" id="lightbox">
                <button class="lightbox-close" id="lightbox-close">&times;</button>
                <button class="lightbox-nav lightbox-prev" id="lightbox-prev">&#8249;</button>
                <button class="lightbox-nav lightbox-next" id="lightbox-next">&#8250;</button>
                <img class="lightbox-content" id="lightbox-content" src="" alt="">
                <video class="lightbox-content" id="lightbox-video" controls style="display: none;">
                    <source src="" type="video/mp4">
                </video>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', lightboxHTML);
    }

    setupLightboxEvents() {
        const lightbox = document.getElementById('lightbox');
        const lightboxClose = document.getElementById('lightbox-close');
        const lightboxPrev = document.getElementById('lightbox-prev');
        const lightboxNext = document.getElementById('lightbox-next');

        // Close lightbox events
        lightboxClose.addEventListener('click', () => this.closeLightbox());
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) this.closeLightbox();
        });

        // Navigation events
        lightboxPrev.addEventListener('click', () => this.showPrevImage());
        lightboxNext.addEventListener('click', () => this.showNextImage());

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (!lightbox.classList.contains('active')) return;
            
            switch(e.key) {
                case 'Escape':
                    this.closeLightbox();
                    break;
                case 'ArrowLeft':
                    this.showPrevImage();
                    break;
                case 'ArrowRight':
                    this.showNextImage();
                    break;
            }
        });

        // Setup media item clicks
        this.setupMediaItemClicks();
    }

    setupMediaItemClicks() {
        document.addEventListener('click', (e) => {
            const mediaItem = e.target.closest('.media-item');
            if (!mediaItem) return;

            e.preventDefault();
            const img = mediaItem.querySelector('img');
            const video = mediaItem.querySelector('video');
            
            if (img) {
                this.openLightbox(img.src, img.alt, 'image');
                this.buildGalleryArray(mediaItem);
            } else if (video) {
                this.openLightbox(video.src, video.alt || 'Video', 'video');
                this.buildGalleryArray(mediaItem);
            }
        });
    }

    buildGalleryArray(clickedItem) {
        const section = clickedItem.closest('.tab-content');
        const mediaItems = section.querySelectorAll('.media-item');
        
        this.galleryImages = [];
        mediaItems.forEach((item, index) => {
            const img = item.querySelector('img');
            const video = item.querySelector('video');
            
            if (img) {
                this.galleryImages.push({
                    src: img.src,
                    alt: img.alt,
                    type: 'image'
                });
            } else if (video) {
                this.galleryImages.push({
                    src: video.src,
                    alt: video.alt || 'Video',
                    type: 'video'
                });
            }
            
            if (item === clickedItem) {
                this.currentImageIndex = this.galleryImages.length - 1;
            }
        });
    }

    openLightbox(src, alt, type) {
        const lightbox = document.getElementById('lightbox');
        const lightboxImg = document.getElementById('lightbox-content');
        const lightboxVideo = document.getElementById('lightbox-video');
        
        if (type === 'image') {
            lightboxImg.src = src;
            lightboxImg.alt = alt;
            lightboxImg.style.display = 'block';
            lightboxVideo.style.display = 'none';
        } else if (type === 'video') {
            lightboxVideo.querySelector('source').src = src;
            lightboxVideo.load();
            lightboxVideo.style.display = 'block';
            lightboxImg.style.display = 'none';
        }
        
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeLightbox() {
        const lightbox = document.getElementById('lightbox');
        const lightboxVideo = document.getElementById('lightbox-video');
        
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
        
        // Pause video if playing
        if (!lightboxVideo.paused) {
            lightboxVideo.pause();
        }
    }

    showPrevImage() {
        if (this.galleryImages.length === 0) return;
        
        this.currentImageIndex = this.currentImageIndex > 0 
            ? this.currentImageIndex - 1 
            : this.galleryImages.length - 1;
            
        const currentImage = this.galleryImages[this.currentImageIndex];
        this.openLightbox(currentImage.src, currentImage.alt, currentImage.type);
    }

    showNextImage() {
        if (this.galleryImages.length === 0) return;
        
        this.currentImageIndex = this.currentImageIndex < this.galleryImages.length - 1 
            ? this.currentImageIndex + 1 
            : 0;
            
        const currentImage = this.galleryImages[this.currentImageIndex];
        this.openLightbox(currentImage.src, currentImage.alt, currentImage.type);
    }

    // ==================== DYNAMIC MEDIA LOADING ==================== //
    
    async loadDynamicMedia() {
        // FIRST: Try to load static data (more reliable for Vercel)
        console.log('🔄 Checking for static media data first...');
        console.log('window.STATIC_MEDIA_DATA exists:', !!window.STATIC_MEDIA_DATA);
        
        if (window.STATIC_MEDIA_DATA) {
            try {
                console.log('📊 Found static media data, loading...');
                console.log('Static data keys:', Object.keys(window.STATIC_MEDIA_DATA));
                const mediaData = window.STATIC_MEDIA_DATA;
                
                // Add media to each section
                Object.keys(mediaData).forEach(section => {
                    const items = mediaData[section];
                    console.log(`Loading ${items.length} items for section: ${section}`);
                    this.addDynamicMediaToSection(section, items);
                });
                
                console.log('✅ Successfully loaded static media for sections:', Object.keys(mediaData));
                return true;
            } catch (staticError) {
                console.error('❌ Error loading static media data:', staticError);
                // Continue to API fallback
            }
        }

        // SECOND: Try API as fallback
        try {
            console.log('🔄 Static data failed or not found, trying API...');
            console.log('Loading dynamic media from /api/media-v2...');
            const response = await fetch('/api/media-v2');
            
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Response is not JSON:', text.substring(0, 200) + '...');
                throw new Error('Response is not JSON');
            }
            
            const data = await response.json();
            console.log('API response:', data);
            
            if (data.success) {
                // Group media by section
                const mediaBySection = {};
                data.data.forEach(item => {
                    if (!mediaBySection[item.section]) {
                        mediaBySection[item.section] = [];
                    }
                    mediaBySection[item.section].push(item);
                });
                
                // Add media to each section
                Object.keys(mediaBySection).forEach(section => {
                    this.addDynamicMediaToSection(section, mediaBySection[section]);
                });
                
                console.log('✅ Successfully loaded media via API for sections:', Object.keys(mediaBySection));
                return true;
            } else {
                console.error('API returned success: false', data);
                throw new Error('API returned failure');
            }
        } catch (error) {
            console.error('❌ Both static and API loading failed:', error);
            console.warn('⚠️ No media could be loaded');
            return false;
        }
    }

    getPortfolioMedia() {
        // This method is now replaced by loadDynamicMedia()
        // Keeping for backward compatibility
        return {};
    }

    addDynamicMediaToSection(sectionId, mediaItems) {
        const section = document.getElementById(sectionId);
        if (!section) return;

        let mediaGallery = section.querySelector('.media-gallery');
        if (!mediaGallery) {
            // Create media gallery if it doesn't exist
            mediaGallery = document.createElement('div');
            mediaGallery.className = 'media-gallery';
            
            // Insert after the activity card or at the end of the section
            const activityCard = section.querySelector('.activity-card');
            if (activityCard) {
                activityCard.insertAdjacentElement('afterend', mediaGallery);
            } else {
                const container = section.querySelector('.container');
                if (container) {
                    container.appendChild(mediaGallery);
                }
            }
        } else {
            // Clear existing hardcoded images first
            console.log(`🧹 Clearing existing media in section: ${sectionId}`);
            mediaGallery.innerHTML = '';
        }

        // Add dynamic media items
        console.log(`📸 Adding ${mediaItems.length} media items to section: ${sectionId}`);
        mediaItems.forEach(mediaItem => {
            const mediaElement = this.createDynamicMediaElement(mediaItem);
            mediaGallery.appendChild(mediaElement);
        });
    }

    mediaItemExists(container, mediaId) {
        return container.querySelector(`[data-media-id="${mediaId}"]`) !== null;
    }

    createDynamicMediaElement(mediaItem) {
        const div = document.createElement('div');
        div.className = 'media-item';
        div.setAttribute('data-media-id', mediaItem.id);
        div.setAttribute('data-dynamic', 'true');

        const mediaElement = mediaItem.media_type === 'image' 
            ? `<img src="${mediaItem.url}" alt="${mediaItem.title}" loading="lazy">`
            : `<video src="${mediaItem.url}" muted loop></video>`;

        div.innerHTML = `
            ${mediaElement}
            <div class="media-overlay">
                <h3 class="media-title">${mediaItem.title}</h3>
                <p class="media-description">${mediaItem.description}</p>
            </div>
        `;

        return div;
    }

    setupAdminEventListeners() {
        // Check for updates periodically (every 30 seconds)
        setInterval(() => {
            this.refreshMediaIfNeeded();
        }, 30000);
        
        // Listen for focus events to refresh when user returns to tab
        window.addEventListener('focus', () => {
            this.refreshMediaIfNeeded();
        });
    }

    async refreshMediaIfNeeded() {
        // Only refresh if not currently in admin mode
        if (!window.location.pathname.includes('admin')) {
            try {
                const response = await fetch('/api/media-v2');
                const data = await response.json();
                
                if (data.success) {
                    // Simple refresh - reload dynamic media
                    this.clearDynamicMedia();
                    
                    // Group media by section
                    const mediaBySection = {};
                    data.data.forEach(item => {
                        if (!mediaBySection[item.section]) {
                            mediaBySection[item.section] = [];
                        }
                        mediaBySection[item.section].push(item);
                    });
                    
                    // Add media to each section
                    Object.keys(mediaBySection).forEach(section => {
                        this.addDynamicMediaToSection(section, mediaBySection[section]);
                    });
                }
            } catch (error) {
                console.error('Error refreshing media:', error);
            }
        }
    }

    clearDynamicMedia() {
        // Remove all dynamic media items
        const dynamicItems = document.querySelectorAll('[data-dynamic="true"]');
        dynamicItems.forEach(item => item.remove());
    }

    removeDynamicMediaItem(sectionId, mediaId) {
        const section = document.getElementById(sectionId);
        if (!section) return;

        const mediaItem = section.querySelector(`[data-media-id="${mediaId}"]`);
        if (mediaItem && mediaItem.getAttribute('data-dynamic') === 'true') {
            mediaItem.remove();
        }
    }

    showNotification(message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;

        // Add styles if not already added
        if (!document.querySelector('#notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 2rem;
                    right: 2rem;
                    background: white;
                    border-radius: 8px;
                    padding: 1rem 1.5rem;
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    min-width: 300px;
                    animation: slideInNotification 0.3s ease;
                    border-left: 4px solid #10b981;
                }
                
                .notification-info {
                    border-left-color: #3b82f6;
                }
                
                .notification-close {
                    background: none;
                    border: none;
                    font-size: 1.2rem;
                    cursor: pointer;
                    color: #6b7280;
                    padding: 0;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                @keyframes slideInNotification {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
            `;
            document.head.appendChild(styles);
        }

        // Add to page
        document.body.appendChild(notification);

        // Close button functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

}

// ==================== ENHANCED INTERACTIONS ==================== //

class InteractionEnhancer {
    constructor() {
        this.initializeHoverEffects();
        this.initializeKeyboardNavigation();
        this.initializeAccessibilityFeatures();
    }

    initializeHoverEffects() {
        // Enhanced gallery interactions
        const galleryItems = document.querySelectorAll('.gallery-item');
        galleryItems.forEach(item => {
            item.addEventListener('mouseenter', this.enhanceGalleryHover.bind(this));
            item.addEventListener('mouseleave', this.resetGalleryHover.bind(this));
        });
    }

    enhanceGalleryHover(e) {
        const item = e.currentTarget;
        const siblings = Array.from(item.parentElement.children);
        
        siblings.forEach(sibling => {
            if (sibling !== item) {
                sibling.style.opacity = '0.7';
                sibling.style.transform = 'scale(0.95)';
            }
        });
    }

    resetGalleryHover(e) {
        const item = e.currentTarget;
        const siblings = Array.from(item.parentElement.children);
        
        siblings.forEach(sibling => {
            sibling.style.opacity = '';
            sibling.style.transform = '';
        });
    }

    initializeKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // ESC key to close mobile menu
            if (e.key === 'Escape') {
                const mobileMenu = document.querySelector('.nav-menu.active');
                if (mobileMenu && portfolioApp) {
                    portfolioApp.closeMobileMenu();
                }
            }
            
            // Arrow keys for tab navigation (optional enhancement)
            if (e.altKey) {
                if (e.key === 'ArrowRight') {
                    this.navigateToNextTab();
                } else if (e.key === 'ArrowLeft') {
                    this.navigateToPrevTab();
                }
            }
        });
    }

    navigateToNextTab() {
        const tabs = ['home', 'leadership', 'global-ensemble', 'refugee', 'sports', 'awards', 'news'];
        const activeTab = document.querySelector('.tab-content.active');
        if (activeTab && portfolioApp) {
            const currentIndex = tabs.indexOf(activeTab.id);
            const nextIndex = (currentIndex + 1) % tabs.length;
            portfolioApp.showTab(tabs[nextIndex]);
        }
    }

    navigateToPrevTab() {
        const tabs = ['home', 'leadership', 'global-ensemble', 'refugee', 'sports', 'awards', 'news'];
        const activeTab = document.querySelector('.tab-content.active');
        if (activeTab && portfolioApp) {
            const currentIndex = tabs.indexOf(activeTab.id);
            const prevIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
            portfolioApp.showTab(tabs[prevIndex]);
        }
    }

    initializeAccessibilityFeatures() {
        // Focus management
        const focusableElements = document.querySelectorAll(`
            .nav-link,
            .dropdown-link,
            .gallery-item,
            .mobile-menu-toggle,
            .hero-cta
        `);
        
        focusableElements.forEach(element => {
            element.addEventListener('focus', this.handleFocus.bind(this));
            element.addEventListener('blur', this.handleBlur.bind(this));
        });
    }

    handleFocus(e) {
        const element = e.currentTarget;
        element.style.outline = '2px solid #2563eb';
        element.style.outlineOffset = '2px';
    }

    handleBlur(e) {
        const element = e.currentTarget;
        element.style.outline = '';
        element.style.outlineOffset = '';
    }
}

// ==================== PERFORMANCE OPTIMIZATION ==================== //

class PerformanceOptimizer {
    constructor() {
        this.initializeLazyLoading();
        this.optimizeAnimations();
    }

    initializeLazyLoading() {
        // Lazy load images when they come into view
        const images = document.querySelectorAll('img[data-src]');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        imageObserver.unobserve(img);
                    }
                });
            });
            
            images.forEach(img => imageObserver.observe(img));
        }
    }

    optimizeAnimations() {
        // Reduce animations on low-power devices
        if ('connection' in navigator && navigator.connection.saveData) {
            document.body.classList.add('reduced-motion');
        }
        
        // Pause animations when tab is not visible
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                document.body.classList.add('paused-animations');
            } else {
                document.body.classList.remove('paused-animations');
            }
        });
    }
}

// ==================== INITIALIZATION ==================== //

// Initialize app when DOM is ready
let portfolioApp;
let interactionEnhancer;
let performanceOptimizer;

document.addEventListener('DOMContentLoaded', () => {
    try {
        portfolioApp = new PortfolioApp();
        interactionEnhancer = new InteractionEnhancer();
        performanceOptimizer = new PerformanceOptimizer();
        
        // Add loaded class for CSS animations
        setTimeout(() => {
            document.body.classList.add('loaded');
        }, 100);
        
        console.log('Portfolio app initialized successfully');
    } catch (error) {
        console.error('Error initializing portfolio app:', error);
    }
});

// Expose useful methods globally for debugging
window.portfolioApp = portfolioApp;

// Force load static media (emergency function)
window.forceLoadStaticMedia = function() {
    console.log('🚨 FORCE LOADING static media...');
    if (window.STATIC_MEDIA_DATA && portfolioApp) {
        console.log('Data and app available, loading...');
        Object.keys(window.STATIC_MEDIA_DATA).forEach(section => {
            const items = window.STATIC_MEDIA_DATA[section];
            console.log(`Force loading ${items.length} items for section: ${section}`);
            portfolioApp.addDynamicMediaToSection(section, items);
        });
        console.log('✅ Force loading completed');
    } else {
        console.warn('❌ Force loading failed - missing data or app');
        console.log('STATIC_MEDIA_DATA:', !!window.STATIC_MEDIA_DATA);
        console.log('portfolioApp:', !!portfolioApp);
    }
};