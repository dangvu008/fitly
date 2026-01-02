/**
 * Shared input validation utilities for Edge Functions
 */

// Maximum allowed base64 image size (10MB)
const MAX_BASE64_SIZE = 10 * 1024 * 1024;

// Valid image MIME type prefixes
const VALID_IMAGE_PREFIXES = [
  'data:image/jpeg',
  'data:image/jpg',
  'data:image/png',
  'data:image/webp',
  'data:image/gif',
];

/**
 * Validate base64 image data
 * - Checks size limits
 * - Validates image MIME type
 */
export function validateBase64Image(imageBase64: string): { valid: boolean; error?: string } {
  if (!imageBase64) {
    return { valid: false, error: 'Image data is required' };
  }

  // Check size limit
  if (imageBase64.length > MAX_BASE64_SIZE) {
    return { valid: false, error: 'Image size exceeds maximum limit (10MB)' };
  }

  // Validate it's a proper base64 data URL with image MIME type
  const isValidImageType = VALID_IMAGE_PREFIXES.some(prefix => 
    imageBase64.toLowerCase().startsWith(prefix)
  );

  if (!isValidImageType && imageBase64.startsWith('data:')) {
    return { valid: false, error: 'Invalid image format. Supported formats: JPEG, PNG, WebP, GIF' };
  }

  // If it's a URL (not data:), we allow it
  if (imageBase64.startsWith('http://') || imageBase64.startsWith('https://')) {
    return { valid: true };
  }

  // If it's base64 without data: prefix, it's also allowed (legacy support)
  if (!imageBase64.startsWith('data:') && !imageBase64.startsWith('http')) {
    // Basic check that it looks like base64
    const base64Regex = /^[A-Za-z0-9+/=]+$/;
    if (!base64Regex.test(imageBase64.slice(0, 100))) {
      return { valid: false, error: 'Invalid image data format' };
    }
  }

  return { valid: true };
}

/**
 * Validate URL for crawling
 * - Checks if URL is valid
 * - Only allows HTTP/HTTPS protocols
 * - Blocks private/internal IPs to prevent SSRF
 */
export function validateCrawlUrl(url: string): { valid: boolean; error?: string } {
  if (!url) {
    return { valid: false, error: 'URL is required' };
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }

  // Only allow HTTP and HTTPS
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return { valid: false, error: 'Only HTTP and HTTPS URLs are allowed' };
  }

  // Block localhost and private IPs (SSRF prevention)
  const hostname = parsedUrl.hostname.toLowerCase();
  const blockedPatterns = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '::1',
    '10.',
    '172.16.',
    '172.17.',
    '172.18.',
    '172.19.',
    '172.20.',
    '172.21.',
    '172.22.',
    '172.23.',
    '172.24.',
    '172.25.',
    '172.26.',
    '172.27.',
    '172.28.',
    '172.29.',
    '172.30.',
    '172.31.',
    '192.168.',
    '169.254.',
  ];

  for (const pattern of blockedPatterns) {
    if (hostname === pattern || hostname.startsWith(pattern)) {
      return { valid: false, error: 'URL not allowed' };
    }
  }

  // Block internal AWS/cloud metadata endpoints
  if (hostname === '169.254.169.254' || hostname.includes('metadata')) {
    return { valid: false, error: 'URL not allowed' };
  }

  return { valid: true };
}

/**
 * Sanitize error message for client response
 * Removes sensitive information like API keys, internal paths, etc.
 */
export function sanitizeErrorMessage(error: unknown): string {
  const defaultMessage = 'An error occurred while processing your request';
  
  if (!error) return defaultMessage;
  
  const message = error instanceof Error ? error.message : String(error);
  
  // List of patterns that should be hidden from clients
  const sensitivePatterns = [
    /api[_-]?key/i,
    /secret/i,
    /password/i,
    /token/i,
    /supabase/i,
    /lovable/i,
    /huggingface/i,
    /authorization/i,
    /configured/i,
    /not set/i,
    /missing/i,
    /internal/i,
    /gateway/i,
  ];
  
  for (const pattern of sensitivePatterns) {
    if (pattern.test(message)) {
      return defaultMessage;
    }
  }
  
  // Limit message length
  if (message.length > 200) {
    return defaultMessage;
  }
  
  return message;
}
