// utils/offlineStorage.ts

import { DraftData } from '../services/reportsApi';

const DB_NAME = 'SGA_QA_System';
const DB_VERSION = 1;
const DRAFT_STORE = 'drafts';

/**
 * Initialize IndexedDB
 */
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(DRAFT_STORE)) {
        const objectStore = db.createObjectStore(DRAFT_STORE, { keyPath: 'id' });
        objectStore.createIndex('jobId', 'jobId', { unique: false });
        objectStore.createIndex('lastSaved', 'lastSaved', { unique: false });
      }
    };
  });
};

/**
 * Save draft to offline storage (IndexedDB)
 */
export const saveDraftOffline = async (data: DraftData): Promise<void> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([DRAFT_STORE], 'readwrite');
    const store = transaction.objectStore(DRAFT_STORE);

    const draftWithTimestamp = {
      ...data,
      lastSaved: new Date().toISOString(),
      syncStatus: 'pending' as const,
    };

    return new Promise((resolve, reject) => {
      const request = store.put(draftWithTimestamp);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);

      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error('Failed to save draft offline:', error);
    throw error;
  }
};

/**
 * Get draft from offline storage
 */
export const getDraftOffline = async (id: string): Promise<DraftData | null> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([DRAFT_STORE], 'readonly');
    const store = transaction.objectStore(DRAFT_STORE);

    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);

      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error('Failed to get draft offline:', error);
    return null;
  }
};

/**
 * Get all drafts from offline storage
 */
export const getAllDraftsOffline = async (): Promise<DraftData[]> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([DRAFT_STORE], 'readonly');
    const store = transaction.objectStore(DRAFT_STORE);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);

      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error('Failed to get all drafts offline:', error);
    return [];
  }
};

/**
 * Delete draft from offline storage
 */
export const deleteDraftOffline = async (id: string): Promise<void> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([DRAFT_STORE], 'readwrite');
    const store = transaction.objectStore(DRAFT_STORE);

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);

      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error('Failed to delete draft offline:', error);
    throw error;
  }
};

/**
 * Sync drafts when online
 * Attempts to upload all pending drafts to the server
 */
export const syncDraftsWhenOnline = async (): Promise<{ synced: number; failed: number }> => {
  if (!navigator.onLine) {
    return { synced: 0, failed: 0 };
  }

  try {
    const drafts = await getAllDraftsOffline();
    const pendingDrafts = drafts.filter((d: any) => d.syncStatus === 'pending');

    let synced = 0;
    let failed = 0;

    for (const draft of pendingDrafts) {
      try {
        const response = await fetch('/api/save-draft', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(draft),
        });

        if (response.ok) {
          // Update sync status
          const db = await initDB();
          const transaction = db.transaction([DRAFT_STORE], 'readwrite');
          const store = transaction.objectStore(DRAFT_STORE);

          await new Promise<void>((resolve, reject) => {
            const request = store.put({ ...draft, syncStatus: 'synced' });
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
            transaction.oncomplete = () => db.close();
          });

          synced++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error('Failed to sync draft:', draft.id, error);
        failed++;
      }
    }

    return { synced, failed };
  } catch (error) {
    console.error('Failed to sync drafts:', error);
    return { synced: 0, failed: 0 };
  }
};

/**
 * Clear all synced drafts (cleanup)
 */
export const clearSyncedDrafts = async (): Promise<void> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([DRAFT_STORE], 'readwrite');
    const store = transaction.objectStore(DRAFT_STORE);

    const drafts = await getAllDraftsOffline();
    const syncedDrafts = drafts.filter((d: any) => d.syncStatus === 'synced');

    for (const draft of syncedDrafts) {
      await new Promise<void>((resolve, reject) => {
        const request = store.delete(draft.id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }

    transaction.oncomplete = () => db.close();
  } catch (error) {
    console.error('Failed to clear synced drafts:', error);
  }
};

/**
 * Setup online/offline event listeners for auto-sync
 */
export const setupAutoSync = (): void => {
  window.addEventListener('online', () => {
    console.log('Network connection restored, syncing drafts...');
    syncDraftsWhenOnline().then(result => {
      console.log(`Sync complete: ${result.synced} synced, ${result.failed} failed`);
    });
  });

  // Also sync periodically when online
  setInterval(() => {
    if (navigator.onLine) {
      syncDraftsWhenOnline();
    }
  }, 5 * 60 * 1000); // Every 5 minutes
};
