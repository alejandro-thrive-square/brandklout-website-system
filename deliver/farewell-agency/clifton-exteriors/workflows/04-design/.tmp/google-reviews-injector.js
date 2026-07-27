/**
 * Google Reviews Injector for Webflow
 *
 * This script fetches Google Maps reviews and injects them into a Webflow section.
 *
 * SETUP INSTRUCTIONS:
 * 1. Get a Google Maps API key with Places API enabled: https://console.cloud.google.com
 * 2. Find your Google Place ID: https://developers.google.com/maps/documentation/places/web-service/place-id
 * 3. Add this script to Webflow: Project Settings > Custom Code > Footer Code
 * 4. Configure the PLACE_ID and API_KEY below
 *
 * @version 1.0.0
 */

(function() {
  'use strict';

  // ==================== CONFIGURATION ====================

  // REPLACE THESE WITH YOUR VALUES
  const CONFIG = {
    // Find your Place ID using: https://developers.google.com/maps/documentation/places/web-service/place-id
    // Example: For "Clifton Exteriors, LLC" in Clifton, VA, search for the business
    PLACE_ID: 'PLACE_ID_HERE', // e.g., 'ChIJZxivkPmWt4kRzgf0m4Hw-0A'

    // Get API key from: https://console.cloud.google.com/apis/credentials
    // Enable: Places API
    API_KEY: 'YOUR_API_KEY_HERE',

    // Webflow section selector where reviews will be injected
    TARGET_SELECTOR: '[data-id="34a01144"], .google-reviews-section, #reviews-section',

    // Number of reviews to display
    MAX_REVIEWS: 5,

    // Minimum rating (1-5)
    MIN_RATING: 4,

    // Language code for reviews (e.g., 'en', 'es')
    LANGUAGE: 'en'
  };

  // ==================== HTML TEMPLATES ====================

  const TEMPLATES = {
    wrapper: `
      <div class="google-reviews-wrapper">
        <div class="reviews-header">
          <div class="business-info">
            <img src="" alt="" class="business-icon">
            <div class="business-details">
              <h3 class="business-name"></h3>
              <div class="rating-summary">
                <div class="stars" aria-label="Rating"></div>
                <span class="rating-text"></span>
                <span class="review-count"></span>
              </div>
            </div>
          </div>
          <a href="#" target="_blank" rel="noopener" class="write-review-btn">
            Review us on <img src="" alt="Google" class="google-logo">
          </a>
        </div>
        <div class="reviews-list"></div>
      </div>
    `,

    review: `
      <div class="review-item" itemprop="review" itemscope itemtype="https://schema.org/Review">
        <div class="review-author">
          <img src="" alt="" class="author-avatar">
          <div class="author-info">
            <span class="author-name" itemprop="author" itemscope itemtype="https://schema.org/Person">
              <span itemprop="name"></span>
            </span>
            <span class="review-date"></span>
          </div>
        </div>
        <div class="review-rating" itemprop="reviewRating" itemscope itemtype="https://schema.org/Rating">
          <meta itemprop="ratingValue" content="">
          <div class="stars" aria-label=""></div>
        </div>
        <p class="review-text" itemprop="reviewBody"></p>
      </div>
    `,

    star: '★',
    emptyStar: '☆',
    googleLogo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzUiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGc+PHBhdGggZmlsbD0iIzQyODVmNCIgZD0iTTYwIDEwTDM1LjUgMjEuNSAxMCAxMEwzNS41IDUuNSA2MCAxMHoiLz48cGF0aCBmaWxsPSIjMzQ5NzU4IiBkPSJNMzUuNSA1LjVMMTAgMTBMNDAuNSAxNS41TDI5LjUgMjEuNSAzNS41IDUuNXoiLz48cGF0aCBmaWxsPSIjZmZjIiBkPSJNMjkuNSAyMS41TDEwIDEwTDM1LjUgNS41TDQwLjUgMTUuNSAyOS41IDIxLjV6Ii8+PHBhdGggZmlsbD0iI2ZiYmMwNCIgZD0iTTM1LjUgNS41TDI5LjUgMjEuNUw0MC41IDE1LjVMMzUuNSA1LjV6Ii8+PHBhdGggZmlsbD0iI2ZhYTkwNSIgZD0iTTEwIDEwTDI5LjUgMjEuNUw0MC41IDE1LjUgMTAgMTB6Ii8+PC9nPjwvc3ZnPg==',
    defaultAvatar: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNlMmU4ZTgiLz48Y2lyY2xlIGN4PSIyMCIgY3k9IjE1IiByPSI3IiBmaWxsPSIjOTM5YTlmIi8+PHBhdGggZD0iTTIwIDM1Yy04IDAtMTQtNy0xNC03cy03LTctNy0xNCAxNC03IDE0IDcgNyA3IDE0LTE0IDd6IiBmaWxsPSIjOTM5YTlmIi8+PC9zdmc+'
  };

  // ==================== UTILITY FUNCTIONS ====================

  function createStars(rating, max = 5) {
    return Array(max).fill(0).map((_, i) =>
      i < Math.floor(rating) ? TEMPLATES.star : TEMPLATES.emptyStar
    ).join('');
  }

  function formatDate(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffYears > 0) return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
    if (diffMonths > 0) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return 'Recently';
  }

  function debounce(func, wait) {
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

  // ==================== GOOGLE PLACES API ====================

  async function fetchPlaceDetails(placeId, apiKey) {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=reviews,rating,user_ratings_total,name,icon,formatted_address,website&reviews_sort=newest&language=${CONFIG.LANGUAGE}&key=${apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Google API Error: ${data.status} - ${data.error_message || 'Unknown error'}`);
      }

      return data.result;
    } catch (error) {
      console.error('Failed to fetch place details:', error);
      throw error;
    }
  }

  // ==================== RENDER FUNCTIONS ====================

  function renderHeader(placeDetails) {
    return `
      <div class="reviews-header">
        <div class="business-info">
          <img src="${placeDetails.icon}" alt="${placeDetails.name}" class="business-icon">
          <div class="business-details">
            <h3 class="business-name">${placeDetails.name}</h3>
            <div class="rating-summary">
              <div class="stars" aria-label="${placeDetails.rating} out of 5 stars">
                ${createStars(placeDetails.rating)}
              </div>
              <span class="rating-text">${placeDetails.rating.toFixed(1)}</span>
              <span class="review-count">Based on ${placeDetails.user_ratings_total} reviews</span>
            </div>
          </div>
        </div>
        <a href="${placeDetails.website || '#'}" target="_blank" rel="noopener" class="write-review-btn">
          review us on <img src="${TEMPLATES.googleLogo}" alt="Google" class="google-logo">
        </a>
      </div>
    `;
  }

  function renderReview(review) {
    const authorName = review.author_name || 'Anonymous';
    const rating = review.rating || 0;
    const text = review.text || '';
    const time = review.relative_time_description || formatDate(review.time * 1000);
    const profilePhoto = review.profile_photo_url || TEMPLATES.defaultAvatar;

    return `
      <div class="review-item" itemprop="review" itemscope itemtype="https://schema.org/Review">
        <div class="review-author">
          <img src="${profilePhoto}" alt="${authorName}" class="author-avatar">
          <div class="author-info">
            <span class="author-name" itemprop="author" itemscope itemtype="https://schema.org/Person">
              <span itemprop="name">${authorName}</span>
            </span>
            <span class="review-date">${time}</span>
          </div>
        </div>
        <div class="review-rating" itemprop="reviewRating" itemscope itemtype="https://schema.org/Rating">
          <meta itemprop="ratingValue" content="${rating}">
          <div class="stars" aria-label="${rating} out of 5 stars">
            ${createStars(rating)}
          </div>
        </div>
        <p class="review-text" itemprop="reviewBody">${text}</p>
      </div>
    `;
  }

  function renderReviewsList(reviews) {
    const filtered = reviews
      .filter(r => r.rating >= CONFIG.MIN_RATING && r.text)
      .slice(0, CONFIG.MAX_REVIEWS);

    return filtered.map(renderReview).join('');
  }

  // ==================== INJECTION ====================

  function injectReviews(placeDetails) {
    // Find target element
    let targetElement = document.querySelector(CONFIG.TARGET_SELECTOR);

    if (!targetElement) {
      console.warn('Target element not found. Available targets:',
        document.querySelectorAll('[data-id^="34a"]'));
      return false;
    }

    // Clear existing content and inject new reviews
    targetElement.innerHTML = `
      <div class="google-reviews-injector">
        ${renderHeader(placeDetails)}
        <div class="reviews-list">
          ${renderReviewsList(placeDetails.reviews || [])}
        </div>
        <p class="powered-by">powered by Google</p>
      </div>
    `;

    return true;
  }

  // ==================== LOADER ====================

  function showLoader(targetElement) {
    if (!targetElement) return;
    targetElement.innerHTML = `
      <div class="google-reviews-loading">
        <div class="spinner"></div>
        <p>Loading reviews...</p>
      </div>
    `;
  }

  function hideLoader() {
    const loader = document.querySelector('.google-reviews-loading');
    if (loader) loader.remove();
  }

  // ==================== MAIN FUNCTION ====================

  async function loadGoogleReviews() {
    const targetElement = document.querySelector(CONFIG.TARGET_SELECTOR);

    if (!targetElement) {
      console.error('Target element not found:', CONFIG.TARGET_SELECTOR);
      return;
    }

    // Show loading state
    showLoader(targetElement);

    try {
      const placeDetails = await fetchPlaceDetails(CONFIG.PLACE_ID, CONFIG.API_KEY);
      injectReviews(placeDetails);

      // Emit custom event for other scripts
      window.dispatchEvent(new CustomEvent('googleReviewsLoaded', {
        detail: placeDetails
      }));

    } catch (error) {
      console.error('Failed to load Google reviews:', error);
      targetElement.innerHTML = `
        <div class="google-reviews-error">
          <p>Unable to load reviews at this time.</p>
          <p><small>Error: ${error.message}</small></p>
        </div>
      `;
    }
  }

  // ==================== CSS STYLES ====================

  function injectStyles() {
    const styleId = 'google-reviews-injector-styles';
    if (document.getElementById(styleId)) return;

    const styles = `
      <style id="${styleId}">
        .google-reviews-injector {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        .reviews-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
          margin-bottom: 30px;
          padding-bottom: 30px;
          border-bottom: 1px solid #e5e7eb;
        }

        .business-info {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .business-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          object-fit: cover;
        }

        .business-name {
          font-size: 24px;
          font-weight: 600;
          margin: 0 0 5px 0;
        }

        .rating-summary {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .stars {
          color: #fbbf24;
          font-size: 18px;
          letter-spacing: 2px;
        }

        .rating-text {
          font-weight: 600;
          font-size: 18px;
        }

        .review-count {
          color: #6b7280;
          font-size: 14px;
        }

        .write-review-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: #4285f4;
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 500;
          transition: background 0.2s;
        }

        .write-review-btn:hover {
          background: #3367d6;
        }

        .google-logo {
          height: 20px;
          width: auto;
        }

        .reviews-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }

        .review-item {
          background: #f9fafb;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
        }

        .review-author {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .author-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
        }

        .author-info {
          display: flex;
          flex-direction: column;
        }

        .author-name {
          font-weight: 600;
          font-size: 14px;
        }

        .review-date {
          font-size: 12px;
          color: #6b7280;
        }

        .review-rating {
          margin-bottom: 10px;
        }

        .review-rating .stars {
          font-size: 14px;
        }

        .review-text {
          margin: 0;
          font-size: 14px;
          line-height: 1.6;
          color: #374151;
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .powered-by {
          text-align: center;
          color: #9ca3af;
          font-size: 12px;
          margin-top: 30px;
        }

        .google-reviews-loading,
        .google-reviews-error {
          text-align: center;
          padding: 40px;
        }

        .spinner {
          border: 3px solid #e5e7eb;
          border-top: 3px solid #4285f4;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 0 auto 15px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .reviews-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .reviews-list {
            grid-template-columns: 1fr;
          }
        }
      </style>
    `;

    document.head.insertAdjacentHTML('beforeend', styles);
  }

  // ==================== INITIALIZATION ====================

  function init() {
    // Check configuration
    if (CONFIG.PLACE_ID === 'PLACE_ID_HERE' || CONFIG.API_KEY === 'YOUR_API_KEY_HERE') {
      console.error('Google Reviews Injector: Please configure PLACE_ID and API_KEY');
      return;
    }

    // Inject styles
    injectStyles();

    // Load reviews when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', loadGoogleReviews);
    } else {
      loadGoogleReviews();
    }

    // Expose for manual reloading
    window.GoogleReviewsInjector = {
      reload: loadGoogleReviews,
      config: CONFIG
    };
  }

  // Auto-initialize
  init();

})();
