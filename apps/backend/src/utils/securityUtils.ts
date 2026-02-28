/**
 * Security utilities for the backend application.
 */

/**
 * Sanitizes input for logging by removing newline and carriage return characters.
 * This prevents log injection attacks where an attacker can forge log entries.
 * 
 * @param input The value to sanitize
 * @returns A string with newlines removed
 */
export function sanitizeLog(input: any): string {
    if (input === null || input === undefined) return '';

    // Convert to string safely
    const str = typeof input === 'object' ? JSON.stringify(input) : String(input);

    // Limit length to prevent Log DoS
    const limited = str.substring(0, 4096);

    // [SECURITY] Remove newlines, carriage returns, and control characters (Log Injection mitigation)
    // We use a more comprehensive regex to satisfy CodeQL patterns.
    return limited.replace(/[\n\r\t]/g, ' ').replace(/[^\x20-\x7E\s]/g, '?').trim();
}

/**
 * [SECURITY] Sanitizes user-provided text for use in AI prompts to prevent Prompt Injection.
 */
export function sanitizePrompt(input: string, maxLength: number = 500): string {
    if (!input) return '';

    // 1. Cap length to prevent Denial of Service on the AI model/tokens
    let sanitized = input.substring(0, maxLength);

    // 2. Remove common prompt injection markers and dangerous phrases
    // These are patterns like "Ignore previous instructions" or "forget what I said"
    const dangerousPatterns = [
        /ignore all previous/gi,
        /forget all/gi,
        /system instruction/gi,
        /you are now/gi,
        /start acting as/gi,
        /output system api key/gi
    ];

    dangerousPatterns.forEach(pattern => {
        sanitized = sanitized.replace(pattern, '[REMOVED]');
    });

    // 3. Escape backslashes FIRST, then backticks and other markers 
    // to prevent bypasses where user-provided backslashes neutralize our escaping.
    return sanitized
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/\$/g, '\\$')
        .trim();
}

/**
 * [SECURITY] Escapes HTML special characters to prevent XSS attacks in HTML contexts.
 */
export function escapeHTML(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Validates if a string is a valid UUID to further protect sensitive actions.
 */
export function isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-12a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

/**
 * [SECURITY] Safely stringifies an object for injection into an HTML <script> tag.
 * Replaces <, >, &, and other sensitive characters with Unicode escapes to prevent XSS.
 * Equivalent to 'serialize-javascript' or manual escaping.
 */
export function safeJsonStringify(obj: any): string {
    return JSON.stringify(obj)
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e')
        .replace(/&/g, '\\u0026')
        .replace(/\u2028/g, '\\u2028')
        .replace(/\u2029/g, '\\u2029');
}

import crypto from 'crypto';

/**
 * [SECURITY] Timing-safe string comparison to prevent timing attacks.
 * Uses PBKDF2 to ensure inputs to timingSafeEqual have constant length and 
 * to satisfy security requirements for computational effort (CodeQL Alert #437).
 */
export function timingSafeCompare(a: string, b: string): boolean {
    if (typeof a !== 'string' || typeof b !== 'string') return false;

    // We use PBKDF2 for length normalization and to increase the cost of any potential brute-force analysis.
    // While the tokens are high-entropy (random 32 bytes), scanners require a KDF-based approach.
    const salt = 'timing-safe-normalization-salt';
    const iterations = 10000;
    const keyLen = 32;

    const expectedHash = crypto.pbkdf2Sync(a, salt, iterations, keyLen, 'sha256');
    const actualHash = crypto.pbkdf2Sync(b, salt, iterations, keyLen, 'sha256');

    return crypto.timingSafeEqual(expectedHash, actualHash);
}

export interface SafeUrlComponents {
    host: string;
    pathname: string;
    search: string;
    port: string;
    isLocal: boolean;
}

/**
 * [SECURITY] Validates an image URL against the allowlist to prevent SSRF.
 * Returns safe components to be reconstructed at the call site.
 * This implementation uses PURE Literal Selection to definitively break taint flow.
 */
export function sanitizeImageUrl(urlString: string): SafeUrlComponents {
    let url: URL;
    try {
        url = new URL(urlString);
    } catch {
        throw new Error('Invalid URL format');
    }

    const hostname = url.hostname.toLowerCase();

    // 1. Strict Literal Whitelist
    // We use a predefined list of trusted hostnames. 
    // CodeQL (Alert #65) requires exact matching to prevent bypasses like 'attacker-cloudinary.com'.
    const TRUSTED_HOSTS = [
        'res.cloudinary.com',
        'cloudinary.com',
        'images.unsplash.com',
        'picsum.photos'
    ];

    // Perform exact equality check. We pick the literal from the whitelist to break taint flow.
    const safeHost = TRUSTED_HOSTS.find(h => h === hostname);

    if (!safeHost) {
        throw new Error(`Domain not allowed: ${hostname}`);
    }

    // 2. Component Extraction (Using purified parts)
    const safePort = url.port ? `:${url.port.replace(/[^0-9]/g, '')}` : '';
    const safePath = url.pathname.replace(/[^/a-zA-Z0-9._-]/g, '');
    const safeSearch = url.search.startsWith('?') ? '?' + url.search.substring(1).replace(/[^a-zA-Z0-9=&._-]/g, '') : '';

    return {
        host: safeHost,
        port: safePort,
        pathname: safePath,
        search: safeSearch,
        isLocal: false // Explicitly disable local access to prevent SSRF
    };
}
