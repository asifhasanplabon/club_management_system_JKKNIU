// frontend/src/utils/imageHelper.js
// Utility to handle image URLs properly

const API_BASE = 'http://localhost:5000';

/**
 * Get properly formatted image URL
 * Handles both backend URLs and fallback to default
 * @param {string|null} photoUrl - Photo URL from API
 * @returns {string} - Full URL to image
 */
export function getImageUrl(photoUrl) {
  // If no photo provided, use default
  if (!photoUrl) {
    return `${API_BASE}/images/default.jpg`;
  }
  
  // If already a full URL, return as is
  if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
    return photoUrl;
  }
  
  // If relative path, make it absolute to backend
  if (photoUrl.startsWith('/')) {
    return `${API_BASE}${photoUrl}`;
  }
  
  // Otherwise, assume it's a filename in uploads
  return `${API_BASE}/uploads/${photoUrl}`;
}

/**
 * Get default avatar URL
 * @returns {string}
 */
export function getDefaultAvatar() {
  return `${API_BASE}/images/default.jpg`;
}

const imageHelper = { getImageUrl, getDefaultAvatar };
export default imageHelper;
