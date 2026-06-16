/**
 * IndexedDB Storage Module
 *
 * All data is stored encrypted in IndexedDB on the user's local device.
 * No data is ever sent to any server. The encryption/decryption happens
 * entirely in the browser using the Web Crypto API.
 *
 * Data flow:
 * 1. User creates/edits data -> JSON serialize -> AES-256-GCM encrypt -> store in IndexedDB
 * 2. User reads data -> read from IndexedDB -> AES-256-GCM decrypt -> JSON parse -> display
 *
 * Each record stores: { id, encryptedData (base64), iv (base64), updatedAt }
 * The encryption key is held ONLY in memory and is destroyed on logout.
 */

import { encryptObject, decryptObject } from './crypto';

const DB_NAME = 'SalesVaultDB';
const DB_VERSION = 1;

// Store names - each corresponds to a data type
export const STORES = {
  CUSTOMERS: 'customers',
  CONTACTS: 'contacts',
  FOLLOWUPS: 'followups',
  PROBLEMS: 'problems',
  RESOURCES: 'resources',
  REMINDERS: 'reminders',
  REPORTS: 'reports',
  SETTINGS: 'settings',
  COMPETITORS: 'competitors',
} as const;

export type StoreName = (typeof STORES)[keyof typeof STORES];

// ============ Database Initialization ============

let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      const storeNames: StoreName[] = Object.values(STORES);

      for (const name of storeNames) {
        if (!db.objectStoreNames.contains(name)) {
          const store = db.createObjectStore(name, { keyPath: 'id' });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onerror = () => reject(request.error);
  });
}

// ============ Core CRUD Operations ============

/**
 * Save an encrypted record to IndexedDB.
 * The data object is serialized to JSON, encrypted with AES-256-GCM,
 * and stored with its IV for later decryption.
 */
export async function saveRecord<T extends { id: string; updatedAt?: number }>(
  storeName: StoreName,
  data: T,
  key: CryptoKey
): Promise<void> {
  const db = await openDB();
  const now = Date.now();
  const record = { ...data, updatedAt: now };

  const { data: encryptedData, iv } = await encryptObject(record, key);

  const storedRecord = {
    id: data.id,
    encryptedData,
    iv,
    updatedAt: now,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.put(storedRecord);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get a single encrypted record, decrypt it, and return the original object.
 */
export async function getRecord<T>(
  storeName: StoreName,
  id: string,
  key: CryptoKey
): Promise<T | null> {
  const db = await openDB();

  const storedRecord = await new Promise<any>((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  if (!storedRecord) return null;

  try {
    return await decryptObject<T>(storedRecord.encryptedData, storedRecord.iv, key);
  } catch {
    console.error('Decryption failed for record:', id);
    return null;
  }
}

/**
 * Get all records from a store, decrypt them, and return as array.
 * Records that fail decryption are silently skipped.
 */
export async function getAllRecords<T>(
  storeName: StoreName,
  key: CryptoKey
): Promise<T[]> {
  const db = await openDB();

  const storedRecords = await new Promise<any[]>((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });

  const results: T[] = [];
  for (const record of storedRecords) {
    try {
      const decrypted = await decryptObject<T>(record.encryptedData, record.iv, key);
      results.push(decrypted);
    } catch {
      // Skip records that fail decryption (wrong key or corrupted data)
    }
  }

  return results;
}

/**
 * Delete a single record by ID.
 */
export async function deleteRecord(storeName: StoreName, id: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete all records in a store.
 */
export async function clearStore(storeName: StoreName): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete the entire database. Used for account deletion.
 * This is irreversible.
 */
export async function deleteDatabase(): Promise<void> {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ============ Bulk Operations ============

/**
 * Save multiple records at once (batch operation for import).
 */
export async function saveRecords<T extends { id: string; updatedAt?: number }>(
  storeName: StoreName,
  records: T[],
  key: CryptoKey
): Promise<void> {
  const db = await openDB();
  const now = Date.now();

  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);

  for (const data of records) {
    const record = { ...data, updatedAt: now };
    const { data: encryptedData, iv } = await encryptObject(record, key);
    store.put({
      id: data.id,
      encryptedData,
      iv,
      updatedAt: now,
    });
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ============ Storage Statistics ============

/**
 * Estimate the total storage used by the database.
 * Uses the Storage API if available, otherwise estimates from record count.
 */
export async function getStorageEstimate(): Promise<{ used: number; quota: number }> {
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    return {
      used: estimate.usage || 0,
      quota: estimate.quota || 0,
    };
  }

  // Fallback: count records
  const db = await openDB();
  let totalRecords = 0;
  const storeNames = Object.values(STORES) as string[];

  for (const name of storeNames) {
    if (db.objectStoreNames.contains(name)) {
      const count = await new Promise<number>((resolve) => {
        const tx = db.transaction(name, 'readonly');
        const store = tx.objectStore(name);
        const request = store.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(0);
      });
      totalRecords += count;
    }
  }

  // Rough estimate: ~2KB per encrypted record
  return { used: totalRecords * 2048, quota: 50 * 1024 * 1024 };
}

/**
 * Check if the database has been initialized (has any records).
 */
export async function isDatabaseInitialized(): Promise<boolean> {
  const db = await openDB();
  const storeNames = Object.values(STORES) as string[];

  for (const name of storeNames) {
    if (db.objectStoreNames.contains(name)) {
      const count = await new Promise<number>((resolve) => {
        const tx = db.transaction(name, 'readonly');
        const store = tx.objectStore(name);
        const request = store.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(0);
      });
      if (count > 0) return true;
    }
  }

  return false;
}
