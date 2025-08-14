// Inline static media data - guaranteed to load
console.log('📦 Loading inline media data...');

// Sample data from our Supabase uploads - first few items for immediate testing
window.STATIC_MEDIA_DATA = {
  "awards": [
    {
      "id": 1,
      "filename": "awards/ice-hockey-award-01.jpg",
      "title": "Ice Hockey Award 01",
      "description": "Ice Hockey Achievement Award",
      "type": "image",
      "url": "https://voxkkotekbzrxpqcvdik.supabase.co/storage/v1/object/public/portfolio-assets/awards/ice-hockey-award-01.jpg",
      "uploadDate": "2025-08-10"
    },
    {
      "id": 2,
      "filename": "awards/ice-hockey-award-02.jpg", 
      "title": "Ice Hockey Award 02",
      "description": "Ice Hockey Achievement Award",
      "type": "image",
      "url": "https://voxkkotekbzrxpqcvdik.supabase.co/storage/v1/object/public/portfolio-assets/awards/ice-hockey-award-02.jpg",
      "uploadDate": "2025-08-10"
    }
  ],
  "leadership": [
    {
      "id": 3,
      "filename": "leadership/leadership-activity-01.jpg",
      "title": "Leadership Activity",
      "description": "Leadership Program Activity",
      "type": "image", 
      "url": "https://voxkkotekbzrxpqcvdik.supabase.co/storage/v1/object/public/portfolio-assets/leadership/leadership-activity-01.jpg",
      "uploadDate": "2025-08-10"
    }
  ],
  "sports": [
    {
      "id": 4,
      "filename": "sports/sports-hockey-01.jpg",
      "title": "Sports Hockey 01", 
      "description": "Hockey Sports Activity",
      "type": "image",
      "url": "https://voxkkotekbzrxpqcvdik.supabase.co/storage/v1/object/public/portfolio-assets/sports/sports-hockey-01.jpg",
      "uploadDate": "2025-08-10"
    }
  ],
  "sign-language": [
    {
      "id": 5,
      "filename": "sign-language/sign-language-01.jpg",
      "title": "Sign Language 01",
      "description": "Sign Language Learning Activity", 
      "type": "image",
      "url": "https://voxkkotekbzrxpqcvdik.supabase.co/storage/v1/object/public/portfolio-assets/sign-language/sign-language-01.jpg",
      "uploadDate": "2025-08-10"
    }
  ]
};

console.log('✅ Inline media data loaded - sections available:', Object.keys(window.STATIC_MEDIA_DATA));

// Test function that can be called from console
window.testMediaLoad = function() {
  if (window.portfolioApp && window.portfolioApp.addDynamicMediaToSection) {
    console.log('Testing media loading...');
    Object.keys(window.STATIC_MEDIA_DATA).forEach(section => {
      const items = window.STATIC_MEDIA_DATA[section];
      console.log(`Loading ${items.length} items for section: ${section}`);
      window.portfolioApp.addDynamicMediaToSection(section, items);
    });
  } else {
    console.warn('portfolioApp not available yet');
  }
};