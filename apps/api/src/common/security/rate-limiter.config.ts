/**
 * Rate limiting configuration per endpoint category
 * Applied via @Throttle() decorator on specific routes
 */
export const RateLimitConfig = {
  // Auth endpoints — strictest limits (brute force protection)
  auth: {
    login: { ttl: 300000, limit: 5 },          // 5 attempts per 5 minutes
    register: { ttl: 3600000, limit: 3 },       // 3 registrations per hour per IP
    refresh: { ttl: 60000, limit: 10 },         // 10 refreshes per minute
    passwordReset: { ttl: 3600000, limit: 3 },  // 3 resets per hour
  },

  // Read endpoints — generous limits
  read: {
    ttl: 60000,
    limit: 100,    // 100 reads per minute
  },

  // Write endpoints — moderate limits
  write: {
    ttl: 60000,
    limit: 30,     // 30 writes per minute
  },

  // File upload/download — restrictive
  file: {
    ttl: 60000,
    limit: 10,     // 10 file operations per minute
  },

  // Public endpoints (unauthenticated)
  public: {
    ttl: 60000,
    limit: 60,     // 60 requests per minute
  },

  // Admin endpoints — moderate (already role-protected)
  admin: {
    ttl: 60000,
    limit: 200,    // 200 per minute
  },
};