import express from 'express';
import { verifyFirebaseToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/me
 * 
 * Protected Route:
 * - Requires valid 'Authorization: Bearer <token>' header.
 * - Verifies the Firebase ID token using Firebase Admin SDK.
 * - Returns the authenticated user's `uid` and session metadata.
 * - Used to verify the full-stack auth loop end-to-end.
 */
router.get('/me', verifyFirebaseToken, (req, res) => {
  return res.json({
    status: 'authenticated',
    message: 'Firebase token verified successfully by Cloud Run backend.',
    user: {
      uid: req.user.uid,
      email: req.user.email,
      emailVerified: req.user.emailVerified,
      name: req.user.name,
      picture: req.user.picture,
      authTime: new Date(req.user.authTime * 1000).toISOString(),
    },
    securityCheck: {
      tokenVerifiedServerSide: true,
      perUserFirestoreScope: `/users/${req.user.uid}/*`,
      geminiKeySecured: 'Server-side (Secret Manager)',
    },
  });
});

export default router;
