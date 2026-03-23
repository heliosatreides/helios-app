import { useState, useEffect, useCallback, useRef } from 'react';
import { openDB } from 'idb';

const DB_NAME = 'helios-db';
const DB_VERSION = 1;
const STORE = 'kv';

let dbPromise = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE);
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Drop-in replacement for useLocalStorage using IndexedDB.
 * Same API: [value, setValue]
 * Migration: on first use, if localStorage has data for this key, migrates it to IDB.
 */
export function useIDB(key, initialValue) {
  const [storedValue, setStoredValue] = useState(initialValue);
  const [ready, setReady] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    let cancelled = false;

    async function init() {
      const db = await getDB();
      // Try to read from IDB first
      let val = await db.get(STORE, key);

      if (val === undefined) {
        // Check if localStorage has data to migrate
        try {
          const lsRaw = localStorage.getItem(key);
          if (lsRaw !== null) {
            val = JSON.parse(lsRaw);
            // Migrate to IDB
            await db.put(STORE, val, key);
            // Remove from localStorage to avoid future confusion
            localStorage.removeItem(key);
          } else {
            val = initialValue;
          }
        } catch {
          val = initialValue;
        }
      }

      if (!cancelled && isMounted.current) {
        setStoredValue(val);
        setReady(true);
      }
    }

    init().catch(() => {
      if (!cancelled && isMounted.current) {
        setReady(true);
      }
    });

    return () => {
      cancelled = true;
      isMounted.current = false;
    };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const setValue = useCallback(
    async (value) => {
      // Update React state synchronously first (for immediate UI response)
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      // Then persist to IDB asynchronously
      try {
        const db = await getDB();
        await db.put(STORE, valueToStore, key);
      } catch (err) {
        console.error('useIDB setValue error:', err);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue, ready];
}

/**
 * Utility: read a value from IDB directly (for migration checks).
 */
export async function idbGet(key) {
  const db = await getDB();
  return db.get(STORE, key);
}

/**
 * Utility: write a value to IDB directly.
 */
export async function idbSet(key, value) {
  const db = await getDB();
  return db.put(STORE, value, key);
}
