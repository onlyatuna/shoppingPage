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
        let safeMethod = String(req.method);
        safeMethod = safeMethod.replace(/\n|\r/g, "");
        let safePath = String(req.path);
        safePath = safePath.replace(/\n|\r/g, "");
        console.warn(`⚠️ CSRF Protection: Blocked request. Method: ${safeMethod}, Path: ${safePath}`);
        return res.status(StatusCodes.FORBIDDEN).json({
            message: 'CSRF validation failed: Token mismatch or missing'
        });
    }

    // 4. Origin & Referer Validation (Additional Layer)
    //
    // Build allowed origins from multiple sources:
    //   a) CSRF_ALLOWED_ORIGINS env var (comma-separated, highest priority)
    //   b) FRONTEND_URL env var (always included as fallback)
    //   c) Same-origin auto-detection: derive the request's own origin from the Host header.
    //      In production, the backend serves the frontend (same-origin via Caddy reverse proxy),
    //      so the browser's Origin header matches the server's own Host — this MUST be trusted.
    const explicitOrigins = process.env.CSRF_ALLOWED_ORIGINS
        ? process.env.CSRF_ALLOWED_ORIGINS.split(',').map(o => o.trim())
        : ['http://127.0.0.1:5173'];

    // Always include FRONTEND_URL if set
    const frontendUrl = process.env.FRONTEND_URL;
    if (frontendUrl && !explicitOrigins.includes(frontendUrl)) {
        explicitOrigins.push(frontendUrl);
    }

    // Auto-detect same-origin: derive origin from the incoming request's Host header.
    // This covers production (https://evanchen316.com) where Caddy proxies to the backend.
    const hostHeader = req.get('Host');
    if (hostHeader) {
        const protocol = req.protocol; // Express resolves this correctly with 'trust proxy'
        const selfOrigin = `${protocol}://${hostHeader}`;
        if (!explicitOrigins.includes(selfOrigin)) {
            explicitOrigins.push(selfOrigin);
        }
    }

    const allowedOrigins = explicitOrigins;

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
        // as per Security Audit 3: if browser didn't provide Origin, default to false.
        isValidSource = false;
    }

    if (!isValidSource) {
        let source = String(origin || referer || 'none');
        source = source.replace(/\n|\r/g, "");
        console.warn(`⚠️ CSRF Protection: Blocked request from invalid source: ${source}. Allowed: ${allowedOrigins.join(', ')}`);
        return res.status(StatusCodes.FORBIDDEN).json({
            message: 'CSRF validation failed: Invalid request source'
        });
    }

    next();
};
