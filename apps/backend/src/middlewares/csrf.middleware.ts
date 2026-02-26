import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import crypto from 'crypto';

/**
 * CSRF Protection Middleware - Double Submit Cookie Pattern
 * 
 * Sets a non-httpOnly cookie 'XSRF-TOKEN' with a random token.
 * For state-changing requests, verifies that the 'X-XSRF-TOKEN' header matches the cookie.
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
    // 1. Set XSRF-TOKEN cookie if it doesn't exist
    let xsrfToken = req.cookies['XSRF-TOKEN'];
    if (!xsrfToken) {
        xsrfToken = crypto.randomBytes(32).toString('hex');
        // Set cookie (NOT httpOnly so frontend can read it)
        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie('XSRF-TOKEN', xsrfToken, {
            httpOnly: false, // Mandatory for Double Submit Pattern
            secure: isProduction,
            sameSite: 'lax', // Lax is enough for modern browsers with XSRF tokens
            path: '/'
        });
    }

    // 2. Skip CSRF check for safe methods (GET, HEAD, OPTIONS)
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    // 3. Double Submit Check: Compare Header with Cookie
    const xsrfHeader = req.get('X-XSRF-TOKEN');

    // In some edge cases (like testing), tokens might be present but mismatch
    if (!xsrfHeader || !xsrfToken || xsrfHeader !== xsrfToken) {
        console.warn(`⚠️ CSRF Protection: Blocked request. Method: ${String(req.method).replace(/\n|\r/g, ' ')}, Path: ${String(req.path).replace(/\n|\r/g, ' ')}`);
        return res.status(StatusCodes.FORBIDDEN).json({
            message: 'CSRF validation failed: Token mismatch or missing'
        });
    }

    // 4. Origin & Referer Validation (Additional Layer)
    const allowedOrigins = [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'http://127.0.0.1:5173',
        'https://evanchen316.com'
    ];

    const origin = req.get('Origin');
    const referer = req.get('Referer');

    let isValidSource = false;
    if (origin) {
        isValidSource = allowedOrigins.some(allowed => origin === allowed);
    } else if (referer) {
        try {
            const refererUrl = new URL(referer);
            const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`;
            isValidSource = allowedOrigins.some(allowed => refererOrigin === allowed);
        } catch {
            isValidSource = false;
        }
    } else {
        // No Origin or Referer header - block for state-changing requests if no header either 
        // (but since we checked the X-XSRF-TOKEN above, it's quite safe already)
        isValidSource = true; // Trust the token check if the browser didn't provide Origin (uncommon)
    }

    if (!isValidSource) {
        console.warn(`⚠️ CSRF Protection: Blocked request from invalid source: ${String(origin || referer || 'none').replace(/\n|\r/g, ' ')}`);
        return res.status(StatusCodes.FORBIDDEN).json({
            message: 'CSRF validation failed: Invalid request source'
        });
    }

    next();
};
