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

    let str: string;
    if (typeof input === 'object') {
        try {
            str = JSON.stringify(input);
        } catch {
            str = String(input);
        }
    } else {
        str = String(input);
    }

    // Replace newlines and carriage returns with spaces to prevent log injection
    // and maintain some readability.
    return str.replace(/[\n\r]/g, ' ');
}

/**
 * Validates if a string is a valid UUID to further protect sensitive actions.
 */
export function isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-12a-f]{12}$/i;
    return uuidRegex.test(uuid);
}
