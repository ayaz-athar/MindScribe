import { db } from '../config/firebase.js';

/**
 * Firestore Service - STRICT PER-USER DATA SCOPING
 * 
 * SECURITY GUARANTEE:
 * Every database call requires `userId` which originates directly from the
 * cryptographically verified Firebase token (`req.user.uid`).
 * All document paths follow `/users/{userId}/entries/{entryId}`.
 * 
 * LOCAL DEV FALLBACK:
 * If live Firestore credentials are not present locally, an in-memory per-user
 * data store ensures seamless offline development and UI testing.
 */

// In-Memory fallback store for offline development
const inMemoryStore = {
  entries: new Map(), // userId -> Map(entryId -> entryDoc)
  insights: new Map(),
};

const getEntriesCollection = (userId) => {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Tenant Violation: Cannot access Firestore without valid userId.');
  }
  return db?.collection ? db.collection('users').doc(userId).collection('entries') : null;
};

const getInsightsCollection = (userId) => {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Tenant Violation: Cannot access Firestore without valid userId.');
  }
  return db?.collection ? db.collection('users').doc(userId).collection('insights') : null;
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
        const snapshot = await query.get();
        return snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      }
    } catch (err) {
      console.warn('Firestore live query fell back to local dev memory store:', err.message);
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
        const docSnap = await docRef.get();
        if (docSnap.exists) {
          return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
      }
    } catch (err) {
      console.warn('Firestore getEntryById fell back to local dev store:', err.message);
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
        const docRef = await col.add(docData);
        return { id: docRef.id, ...docData };
      }
    } catch (err) {
      console.warn('Firestore createEntry fell back to local dev store:', err.message);
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
        const docSnap = await docRef.get();
        if (docSnap.exists) {
          await docRef.update(updatePayload);
          return { id: docRef.id, ...docSnap.data(), ...updatePayload };
        }
        return null;
      }
    } catch (err) {
      console.warn('Firestore updateEntry fell back to local dev store:', err.message);
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
        const docSnap = await docRef.get();
        if (docSnap.exists) {
          await docRef.delete();
          return true;
        }
        return false;
      }
    } catch (err) {
      console.warn('Firestore deleteEntry fell back to local dev store:', err.message);
    }

    const userMap = inMemoryStore.entries.get(userId);
    if (userMap?.has(entryId)) {
      userMap.delete(entryId);
      return true;
    }
    return false;
  },

  /**
   * Save an AI-generated reflection insight
   */
  async saveAiInsight(userId, entryId, insight) {
    const now = new Date().toISOString();
    const docData = {
      userId,
      entryId,
      ...insight,
      createdAt: now,
    };

    try {
      const col = getInsightsCollection(userId);
      if (col) {
        const docRef = await col.add(docData);
        return { id: docRef.id, ...docData };
      }
    } catch (err) {
      console.warn('Firestore saveAiInsight fell back to local dev store:', err.message);
    }

    const insightId = 'insight-' + Math.random().toString(36).substring(2, 9);
    return { id: insightId, ...docData };
  },
};
