/**
 * Security utilities for the frontend application.
 * Focused on preventing XSS and other injection attacks.
 */

/**
 * Strips all HTML tags from a string.
 * Used for sanitizing user-provided text before displaying it in sensitive DOM locations.
 */
export function stripHtml(str: string): string {
    if (!str || typeof str !== 'string') return '';
    // Basic regex to remove HTML tags: < followed by any characters except > and ends with >
    return str.replace(/<[^>]*>?/gm, '').trim();
}

/**
 * Sanitizes a URL for use in <img> tags or <a> tags.
 * Ensures the protocol is either http, https, or data:image/.
 */
export function sanitizeUrl(url: string | null | undefined): string {
    if (!url || typeof url !== 'string') return '';

    const trimmed = url.trim();
    if (!trimmed) return '';

    // Allow data:image/ URLs (base64 images)
    if (trimmed.toLowerCase().startsWith('data:image/')) {
        return trimmed;
    }

    // Allow relative paths starting with /
    if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
        return trimmed;
    }

    try {
        const parsed = new URL(trimmed, window.location.origin);
        // Strict protocol allowlist
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            return parsed.href;
        }
    } catch {
        // Fallback for relative paths that URL parser might fail on
        if (trimmed.startsWith('./') || trimmed.startsWith('../')) {
            return trimmed;
        }
    }

    return '';
}

/**
 * Deep sanitization for an object, stripping HTML from all string properties.
 */
export function sanitizeObject<T extends object>(obj: T): T {
    if (!obj || typeof obj !== 'object') return obj;

    const sanitized = { ...obj } as any;

    for (const key in sanitized) {
        if (typeof sanitized[key] === 'string') {
            sanitized[key] = stripHtml(sanitized[key]);
        } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
            sanitized[key] = sanitizeObject(sanitized[key]);
        }
    }

    return sanitized as T;
}
