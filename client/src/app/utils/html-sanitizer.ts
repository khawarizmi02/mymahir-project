import DOMPurify from 'dompurify';

/**
 * Configuration for DOMPurify to allow only safe HTML formatting tags
 * Used for sanitizing rich text content like property descriptions
 */
export const SAFE_HTML_CONFIG = {
  ALLOWED_TAGS: ['p', 'br', 'b', 'strong', 'i', 'em', 'u', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div'],
  ALLOWED_ATTR: []
};

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string safe for display
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, SAFE_HTML_CONFIG);
}
