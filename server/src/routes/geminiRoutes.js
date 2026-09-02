import express from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { geminiService } from '../services/geminiService.js';

const router = express.Router();

/**
 * AI Abuse Prevention Rate Limiter
 * Limits requests to 60 per 5 minutes per user/IP
 */
const geminiRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'TooManyRequests',
    message: 'Rate limit exceeded for AI assistant. Please wait a few minutes before sending more prompts.',
    code: 'AI_RATE_LIMIT_EXCEEDED',
  },
});

/**
 * Input length and format validation schema (supports null & optional fields)
 */
const geminiPromptSchema = z.object({
  prompt: z
    .string({ required_error: 'Prompt is required' })
    .trim()
    .min(1, 'Prompt cannot be empty')
    .max(4000, 'Prompt cannot exceed 4,000 characters to prevent resource abuse'),
  history: z
    .array(
      z.object({
        role: z.string(),
        text: z.string().max(4000),
      })
    )
    .nullable()
    .optional()
    .default([]),
  systemInstruction: z.string().max(1000).nullable().optional(),
});

/**
 * POST /api/gemini
 * 
 * Protected Route:
 * - Requires Firebase Bearer ID Token verification.
 * - Authenticated user attached to req.user.
 * - Calls Gemini 1.5 via server-side SDK using process.env.GEMINI_API_KEY from Secret Manager.
 */
router.post('/', verifyFirebaseToken, geminiRateLimiter, async (req, res, next) => {
  try {
    // 1. Validate request body and prompt length
    const parseResult = geminiPromptSchema.safeParse(req.body);

    if (!parseResult.success) {
      console.warn('⚠️ Gemini Validation Warning:', parseResult.error.format());
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid prompt input.',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const { prompt, history, systemInstruction } = parseResult.data;

    // 2. Call server-side Gemini service
    const geminiResult = await geminiService.generateChatResponse(
      prompt,
      history || [],
      systemInstruction || null
    );

    // 3. Return response with authenticated context
    return res.status(200).json({
      status: 'success',
      prompt,
      response: geminiResult.text,
      model: geminiResult.model,
      timestamp: geminiResult.timestamp,
      userId: req.user.uid,
    });
  } catch (error) {
    // Gracefully handle missing Secret Manager configuration in production
    if (error.message && error.message.includes('GEMINI_API_KEY')) {
      return res.status(503).json({
        error: 'ServiceUnavailable',
        message: 'Gemini AI service is temporarily unavailable. The GEMINI_API_KEY secret is not configured in Google Secret Manager.',
        code: 'SECRET_KEY_MISSING',
      });
    }

    return next(error);
  }
});

export default router;
