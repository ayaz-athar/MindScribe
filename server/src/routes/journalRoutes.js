import express from 'express';
import { z } from 'zod';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { firestoreService } from '../services/firestoreService.js';

const router = express.Router();

// Enforce authentication on all journal routes
router.use(verifyFirebaseToken);

// Validation schemas
const createEntrySchema = z.object({
  title: z.string().min(1, 'Title cannot be empty').max(200, 'Title too long'),
  content: z.string().min(1, 'Content cannot be empty'),
  mood: z.string().default('Reflective'),
  tags: z.array(z.string()).optional().default([]),
});

const updateEntrySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  mood: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * GET /api/entries
 * List all journal entries for the current authenticated user
 */
router.get('/', async (req, res, next) => {
  try {
    const { mood, tag, limit } = req.query;
    const entries = await firestoreService.listEntries(req.user.uid, {
      mood,
      tag,
      limit: limit ? parseInt(limit, 10) : 50,
    });

    return res.json({
      count: entries.length,
      entries,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/entries
 * Create a new journal entry scoped to req.user.uid
 */
router.post('/', async (req, res, next) => {
  try {
    const validation = createEntrySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'ValidationError',
        details: validation.error.flatten(),
      });
    }

    const createdEntry = await firestoreService.createEntry(req.user.uid, validation.data);

    return res.status(201).json({
      message: 'Journal entry created successfully',
      entry: createdEntry,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/entries/:id
 * Retrieve single entry
 */
router.get('/:id', async (req, res, next) => {
  try {
    const entry = await firestoreService.getEntryById(req.user.uid, req.params.id);

    if (!entry) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Journal entry not found or you do not have permission to view it.',
      });
    }

    return res.json({ entry });
  } catch (error) {
    return next(error);
  }
});

/**
 * PUT /api/entries/:id
 * Update an existing entry
 */
router.put('/:id', async (req, res, next) => {
  try {
    const validation = updateEntrySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'ValidationError',
        details: validation.error.flatten(),
      });
    }

    const updatedEntry = await firestoreService.updateEntry(
      req.user.uid,
      req.params.id,
      validation.data
    );

    if (!updatedEntry) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Journal entry not found or you do not have permission to modify it.',
      });
    }

    return res.json({
      message: 'Journal entry updated successfully',
      entry: updatedEntry,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * DELETE /api/entries/:id
 * Delete an entry
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const success = await firestoreService.deleteEntry(req.user.uid, req.params.id);

    if (!success) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Journal entry not found or you do not have permission to delete it.',
      });
    }

    return res.json({
      message: 'Journal entry deleted successfully',
      id: req.params.id,
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
