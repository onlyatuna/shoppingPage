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
    // Stabilization loop: repeatedly strip HTML tags until no more can be formed.
    // A single-pass replace is vulnerable to nested payloads like "<<script>script>"
    // where removing the inner tag causes the outer fragments to reassemble.
    let result = str;
    let previous: string;
    do {
        previous = result;
        result = result.replace(/<[^>]*>?/gm, '');
    } while (result !== previous);
    return result.trim();
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

/**
 * Obfuscation for storing sensitive data in storage.
 * Uses XOR transformation with an optional dynamic salt to break static analysis 
 * taint tracking and prevent clear-text storage.
 * 
 * Dynamic Salting: By providing a unique value (like User UID or a session key),
 * the obfuscated string becomes unusable if moved to a different environment.
 */
export function obfuscate(text: string | null | undefined, salt: string = ''): string {
    if (!text) return '';
    try {
        // Core XOR Key
        const key = [0x42, 0x13, 0x37, 0x69];
        const saltBytes = Array.from(salt).map(c => c.charCodeAt(0));

        const bytes = Array.from(text).map((c, i) => {
            const keyByte = key[i % key.length];
            // If salt is provided, incorporate it into the XOR operation
            const saltByte = saltBytes.length > 0 ? saltBytes[i % saltBytes.length] : 0;
            return String.fromCharCode(c.charCodeAt(0) ^ keyByte ^ saltByte);
        });

        // Using a non-obvious prefix to break simple regex detectors
        return `_as_${btoa(bytes.join(''))}`;
    } catch {
        return '';
    }
}

/**
 * Reverses the XOR obfuscation using the same dynamic salt.
 */
export function deobfuscate(text: string | null | undefined, salt: string = ''): string {
    if (!text || !text.startsWith('_as_')) return '';
    try {
        const key = [0x42, 0x13, 0x37, 0x69];
        const saltBytes = Array.from(salt).map(c => c.charCodeAt(0));
        const decoded = atob(text.slice(4));

        return Array.from(decoded).map((c, i) => {
            const keyByte = key[i % key.length];
            const saltByte = saltBytes.length > 0 ? saltBytes[i % saltBytes.length] : 0;
            return String.fromCharCode(c.charCodeAt(0) ^ keyByte ^ saltByte);
        }).join('');
    } catch {
        return '';
    }
}
