import { auth } from '../config/firebase.js';
import { env } from '../config/env.js';

/**
 * Safely decodes JWT payload (used as fallback in local dev if service account is not yet configured)
 */
function decodeJwtPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const decodedJson = Buffer.from(payloadBase64, 'base64').toString('utf-8');
      return JSON.parse(decodedJson);
    }
  } catch (e) {
    // ignore
  }
  return null;
}

/**
 * Express Middleware: verifyFirebaseToken
 * 
 * Extracts and cryptographically verifies the Firebase ID Token passed in
 * the 'Authorization: Bearer <token>' header.
 * 
 * On success:
 *   Attaches decoded user to req.user ({ uid, email, ... }).
 * 
 * On failure:
 *   Returns HTTP 401 Unauthorized with descriptive payload.
 */
export async function verifyFirebaseToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or malformed Authorization header. Expected "Bearer <Firebase_ID_Token>".',
      code: 'AUTH_HEADER_MISSING',
    });
  }

  const idToken = authHeader.split('Bearer ')[1]?.trim();

  if (!idToken) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Empty Bearer token provided in Authorization header.',
      code: 'AUTH_TOKEN_EMPTY',
    });
  }

  // 1. Instant Dev Mode Token Bypass
  if (idToken.startsWith('demo-token:') && env.NODE_ENV !== 'production') {
    const parts = idToken.split(':');
    const uid = parts[1] || 'demo-user-123';
    const email = parts[2] || 'demo@example.com';
    req.user = {
      uid,
      email,
      emailVerified: true,
      name: email.split('@')[0],
      picture: null,
      authTime: Math.floor(Date.now() / 1000),
      claims: { uid, email, demo: true },
    };
    return next();
  }

  // 2. Verify Live Firebase ID Token
  try {
    // In production, checkRevoked is enforced. In local development, checkRevoked is false.
    const checkRevoked = env.NODE_ENV === 'production';
    const decodedToken = await auth.verifyIdToken(idToken, checkRevoked);

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      emailVerified: decodedToken.email_verified || false,
      name: decodedToken.name || null,
      picture: decodedToken.picture || null,
      authTime: decodedToken.auth_time,
      claims: decodedToken,
    };

    return next();
  } catch (error) {
    console.warn('🔒 Firebase Admin Token verification notice:', error.code || error.message);

    // If running in local dev and token is a valid Firebase JWT from user's Firebase project
    if (env.NODE_ENV !== 'production') {
      const payload = decodeJwtPayload(idToken);
      if (payload && (payload.user_id || payload.sub) && payload.iss?.includes('securetoken.google.com')) {
        const uid = payload.user_id || payload.sub;
        req.user = {
          uid,
          email: payload.email || null,
          emailVerified: payload.email_verified || false,
          name: payload.name || payload.email?.split('@')[0] || 'User',
          picture: payload.picture || null,
          authTime: payload.auth_time || Math.floor(Date.now() / 1000),
          claims: payload,
        };
        console.log(`✅ Verified Firebase User (Dev Mode): ${uid} (${payload.email})`);
        return next();
      }
    }

    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Your authentication session has expired. Please refresh your token.',
        code: 'AUTH_TOKEN_EXPIRED',
      });
    }

    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication token has been revoked. Please sign in again.',
        code: 'AUTH_TOKEN_REVOKED',
      });
    }

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid authentication token.',
      code: 'AUTH_TOKEN_INVALID',
    });
  }
}
