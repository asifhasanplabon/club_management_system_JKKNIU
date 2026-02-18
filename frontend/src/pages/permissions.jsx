// frontend/src/utils/permissions.js

// This file centralizes permission logic to keep code DRY (Don't Repeat Yourself)

// The list of positions that are considered "executives"
export const EXECUTIVE_POSITIONS = [
  "President",
  "Vice President",
  "General Secretary",
  "Joint Secretary",
  "Treasurer",
  "Organizing Secretary",
  "Media & PR",
  "Event Coordinator",
  "Executive Member",
];

/**
 * Checks if a user has permission to upload/add images.
 * This includes site-wide authorities, club admins, and club executives.
 * @param {object} user - The user object from localStorage
 * @returns {boolean} - True if the user can upload, false otherwise
 */
export const canUpload = (user) => {
  if (!user) return false;
  
  // 'authority' is site-wide admin, 'admin' is club president/secretary
  if (user.role === 'admin' || user.role === 'authority') return true;
  
  // Check if their specific position is in the executive list
  return EXECUTIVE_POSITIONS.includes(user.position);
};