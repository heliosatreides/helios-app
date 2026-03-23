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

/** @internal — only for tests to reset the cached db promise */
export function _resetDBPromise() {
  dbPromise = null;
}

/**
 * Drop-in replacement for useLocalStorage using IndexedDB.
 * Same API: [value, setValue, ready]
 * Migration: on first use, if localStorage has data for this key, migrates it to IDB.
 */
export function useIDB(key, initialValue) {
  const [storedValue, setStoredValue] = useState(initialValue);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const db = await getDB();
        let val = await db.get(STORE, key);

        if (val === undefined) {
          // Check if localStorage has data to migrate
          try {
            const lsRaw = localStorage.getItem(key);
            if (lsRaw !== null) {
              val = JSON.parse(lsRaw);
              // Migrate to IDB and remove from localStorage
              await db.put(STORE, val, key);
              localStorage.removeItem(key);
            } else {
              val = initialValue;
            }
          } catch {
            val = initialValue;
          }
        }

        if (!cancelled) {
          setStoredValue(val);
          setReady(true);
        }
      } catch {
        if (!cancelled) {
          setReady(true);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const storedValueRef = useRef(storedValue);
  storedValueRef.current = storedValue;

  const setValue = useCallback(
    async (value) => {
      // Update React state synchronously first (for immediate UI response)
      const valueToStore =
        value instanceof Function ? value(storedValueRef.current) : value;
      setStoredValue(valueToStore);
      // Then persist to IDB asynchronously
      try {
        const db = await getDB();
        await db.put(STORE, valueToStore, key);
      } catch (err) {
        console.error('useIDB setValue error:', err);
      }
    },
    [key]
  );

  return [storedValue, setValue, ready];
}

/**
 * Utility: read a value from IDB directly.
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
