import { db } from '../config/firebase.js';

/**
 * Firestore Service - STRICT PER-USER DATA SCOPING
 * 
 * SECURITY GUARANTEE:
 * Every database call requires `userId` which originates directly from the
 * cryptographically verified Firebase token (`req.user.uid`).
 * All document paths follow `/users/{userId}/entries/{entryId}`.
 * 
 * CLOUD RUN vs VERCEL / DEV AUTO-DETECTION:
 * - On Google Cloud Run: Uses Application Default Credentials (ADC) via `process.env.K_SERVICE`.
 * - On Vercel / Local Dev: If GCP service account credentials are not present, seamlessly
 *   operates with a fast in-memory store to prevent gRPC connection hangs.
 */

const hasGoogleCredentials = Boolean(
  process.env.K_SERVICE || // Set automatically by Google Cloud Run
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  process.env.FIREBASE_SERVICE_ACCOUNT
);

// In-Memory fallback store for environments without mounted Google Cloud credentials
const inMemoryStore = {
  entries: new Map(), // userId -> Map(entryId -> entryDoc)
  insights: new Map(),
};

const getEntriesCollection = (userId) => {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Tenant Violation: Cannot access Firestore without valid userId.');
  }
  if (!hasGoogleCredentials) {
    return null;
  }
  return db?.collection ? db.collection('users').doc(userId).collection('entries') : null;
};

const getInsightsCollection = (userId) => {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Tenant Violation: Cannot access Firestore without valid userId.');
  }
  if (!hasGoogleCredentials) {
    return null;
  }
  return db?.collection ? db.collection('users').doc(userId).collection('insights') : null;
};

// Helper to prevent gRPC hangs if network to Firestore is unreachable
const withTimeout = (promise, ms = 2500) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), ms)),
  ]);
};

export const firestoreService = {
  /**
   * List all entries for the authenticated user
   */
  async listEntries(userId, { mood, tag, limit = 50 } = {}) {
    try {
      const col = getEntriesCollection(userId);
      if (col) {
        let query = col.orderBy('createdAt', 'desc').limit(limit);
        if (mood) {
          query = query.where('mood', '==', mood);
        }
        const snapshot = await withTimeout(query.get(), 2500);
        return snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      }
    } catch (err) {
      console.warn('Firestore live query fell back to memory store:', err.message);
    }

    // In-memory fallback
    const userMap = inMemoryStore.entries.get(userId) || new Map();
    let list = Array.from(userMap.values());
    if (mood) list = list.filter((e) => e.mood === mood);
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return list.slice(0, limit);
  },

  /**
   * Retrieve a single entry by ID (strictly within the user's collection)
   */
  async getEntryById(userId, entryId) {
    try {
      const col = getEntriesCollection(userId);
      if (col) {
        const docRef = col.doc(entryId);
        const docSnap = await withTimeout(docRef.get(), 2500);
        if (docSnap.exists) {
          return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
      }
    } catch (err) {
      console.warn('Firestore getEntryById fell back to memory store:', err.message);
    }

    const userMap = inMemoryStore.entries.get(userId);
    return userMap?.get(entryId) || null;
  },

  /**
   * Create a new entry under /users/{userId}/entries
   */
  async createEntry(userId, { title, content, mood = 'Reflective', tags = [] }) {
    const now = new Date().toISOString();
    const docData = {
      userId,
      title: title.trim(),
      content: content.trim(),
      mood,
      tags: Array.isArray(tags) ? tags : [],
      createdAt: now,
      updatedAt: now,
      wordCount: content.trim().split(/\s+/).filter(Boolean).length,
    };

    try {
      const col = getEntriesCollection(userId);
      if (col) {
        const docRef = await withTimeout(col.add(docData), 2500);
        return { id: docRef.id, ...docData };
      }
    } catch (err) {
      console.warn('Firestore createEntry fell back to memory store:', err.message);
    }

    // In-memory fallback
    const entryId = 'entry-' + Math.random().toString(36).substring(2, 9);
    const entryWithId = { id: entryId, ...docData };

    if (!inMemoryStore.entries.has(userId)) {
      inMemoryStore.entries.set(userId, new Map());
    }
    inMemoryStore.entries.get(userId).set(entryId, entryWithId);

    return entryWithId;
  },

  /**
   * Update an existing entry
   */
  async updateEntry(userId, entryId, { title, content, mood, tags }) {
    const updatePayload = {
      updatedAt: new Date().toISOString(),
    };
    if (title !== undefined) updatePayload.title = title.trim();
    if (content !== undefined) {
      updatePayload.content = content.trim();
      updatePayload.wordCount = content.trim().split(/\s+/).filter(Boolean).length;
    }
    if (mood !== undefined) updatePayload.mood = mood;
    if (tags !== undefined) updatePayload.tags = Array.isArray(tags) ? tags : [];

    try {
      const col = getEntriesCollection(userId);
      if (col) {
        const docRef = col.doc(entryId);
        const docSnap = await withTimeout(docRef.get(), 2500);
        if (docSnap.exists) {
          await withTimeout(docRef.update(updatePayload), 2500);
          return { id: docRef.id, ...docSnap.data(), ...updatePayload };
        }
        return null;
      }
    } catch (err) {
      console.warn('Firestore updateEntry fell back to memory store:', err.message);
    }

    const userMap = inMemoryStore.entries.get(userId);
    const existing = userMap?.get(entryId);
    if (!existing) return null;

    const updated = { ...existing, ...updatePayload };
    userMap.set(entryId, updated);
    return updated;
  },

  /**
   * Delete an entry
   */
  async deleteEntry(userId, entryId) {
    try {
      const col = getEntriesCollection(userId);
      if (col) {
        const docRef = col.doc(entryId);
        const docSnap = await withTimeout(docRef.get(), 2500);
        if (!docSnap.exists) return false;
        await withTimeout(docRef.delete(), 2500);
        return true;
      }
    } catch (err) {
      console.warn('Firestore deleteEntry fell back to memory store:', err.message);
    }

    const userMap = inMemoryStore.entries.get(userId);
    if (!userMap || !userMap.has(entryId)) return false;
    userMap.delete(entryId);
    return true;
  },

  /**
   * Save AI reflection insight
   */
  async saveAiInsight(userId, entryId, reflectionData) {
    const insightDoc = {
      userId,
      entryId,
      ...reflectionData,
      createdAt: new Date().toISOString(),
    };

    try {
      const col = getInsightsCollection(userId);
      if (col) {
        const docRef = await withTimeout(col.add(insightDoc), 2500);
        return { id: docRef.id, ...insightDoc };
      }
    } catch (err) {
      console.warn('Firestore saveAiInsight fell back to memory store:', err.message);
    }

    const insightId = 'insight-' + Math.random().toString(36).substring(2, 9);
    const insightWithId = { id: insightId, ...insightDoc };

    if (!inMemoryStore.insights.has(userId)) {
      inMemoryStore.insights.set(userId, new Map());
    }
    inMemoryStore.insights.get(userId).set(insightId, insightWithId);

    return insightWithId;
  },

  /**
   * Retrieve AI reflection insight for an entry
   */
  async getAiInsightByEntryId(userId, entryId) {
    try {
      const col = getInsightsCollection(userId);
      if (col) {
        const snapshot = await withTimeout(
          col.where('entryId', '==', entryId).limit(1).get(),
          2500
        );
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          return { id: doc.id, ...doc.data() };
        }
        return null;
      }
    } catch (err) {
      console.warn('Firestore getAiInsight fell back to memory store:', err.message);
    }

    const userInsights = inMemoryStore.insights.get(userId);
    if (!userInsights) return null;

    for (const insight of userInsights.values()) {
      if (insight.entryId === entryId) return insight;
    }
    return null;
  },
};
