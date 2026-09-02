import express from 'express';
import { z } from 'zod';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { geminiService } from '../services/geminiService.js';
import { firestoreService } from '../services/firestoreService.js';

const router = express.Router();

// Enforce authentication on all AI routes
router.use(verifyFirebaseToken);

const reflectSchema = z.object({
  entryId: z.string().nullable().optional(),
  content: z.string({ required_error: 'Content is required' }).trim().min(1, 'Content cannot be empty'),
  mood: z.string().nullable().optional().default('Reflective'),
});

/**
 * POST /api/ai/reflect
 * Server-side Gemini analysis of journal entry
 */
router.post('/reflect', async (req, res, next) => {
  try {
    const validation = reflectSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid reflection request.',
        details: validation.error.flatten(),
      });
    }

    const { content, mood, entryId } = validation.data;

    // Call server-side Gemini
    const reflection = await geminiService.generateReflection(content, mood || 'Reflective');

    // Optionally save insight in Firestore linked to entry and user
    let savedInsight = null;
    if (entryId) {
      savedInsight = await firestoreService.saveAiInsight(req.user.uid, entryId, reflection);
    }

    return res.json({
      message: 'AI Reflection generated successfully',
      reflection,
      insightId: savedInsight ? savedInsight.id : null,
    });
  } catch (error) {
    console.error('AI Reflection Route Error:', error);
    return res.status(500).json({
      error: 'ReflectionError',
      message: error.message || 'Failed to generate reflection.',
    });
  }
});

/**
 * POST /api/ai/prompts
 * Server-side generation of daily journaling prompts
 */
router.post('/prompts', async (req, res, next) => {
  try {
    const { recentMoods, topics } = req.body;
    const prompts = await geminiService.generateDailyPrompts(recentMoods || [], topics || []);

    return res.json({
      prompts,
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
