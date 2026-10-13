import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
  getDocs,
  waitForPendingWrites
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';

/**
 * Subscribe in real-time to user's fuel logs, trips, and settings
 * Provides automatic offline caching and sync status callbacks
 */
export function subscribeToUserData(userId, { onFuelLogs, onTrips, onSettings, onSyncStatus }) {
  if (!isFirebaseConfigured || !db || !userId) {
    return () => {};
  }

  const unsubscribes = [];
  let fuelPending = false;
  let tripsPending = false;

  const updateOverallSyncStatus = () => {
    const isSyncing = fuelPending || tripsPending;
    if (onSyncStatus) {
      onSyncStatus({
        isSyncing,
        isOnline: navigator.onLine,
      });
    }

    // Safety fallback: If pending writes are active, wait for Firestore to flush them to server
    if (isSyncing && navigator.onLine && db) {
      waitForPendingWrites(db)
        .then(() => {
          fuelPending = false;
          tripsPending = false;
          if (onSyncStatus) {
            onSyncStatus({
              isSyncing: false,
              isOnline: navigator.onLine,
            });
          }
        })
        .catch(() => {
          // Ignore offline errors
        });
    }
  };

  // 1. Subscribe to fuel logs with includeMetadataChanges enabled
  try {
    const fuelLogsRef = collection(db, 'users', userId, 'fuelLogs');
    const fuelQuery = query(fuelLogsRef, orderBy('date', 'desc'));

    const unsubFuel = onSnapshot(
      fuelQuery,
      { includeMetadataChanges: true },
      (snapshot) => {
        fuelPending = snapshot.metadata.hasPendingWrites;
        updateOverallSyncStatus();

        const logs = [];
        snapshot.forEach((docSnap) => {
          logs.push({ id: docSnap.id, ...docSnap.data() });
        });
        if (onFuelLogs) {
          onFuelLogs(logs);
        }
      },
      (error) => {
        console.error('Error in fuel logs subscription:', error);
        fuelPending = false;
        updateOverallSyncStatus();
      }
    );
    unsubscribes.push(unsubFuel);
  } catch (err) {
    console.error('Failed to listen to fuel logs:', err);
  }

  // 2. Subscribe to trips with includeMetadataChanges enabled
  try {
    const tripsRef = collection(db, 'users', userId, 'trips');
    const tripsQuery = query(tripsRef, orderBy('date', 'desc'));

    const unsubTrips = onSnapshot(
      tripsQuery,
      { includeMetadataChanges: true },
      (snapshot) => {
        tripsPending = snapshot.metadata.hasPendingWrites;
        updateOverallSyncStatus();

        const tripList = [];
        snapshot.forEach((docSnap) => {
          tripList.push({ id: docSnap.id, ...docSnap.data() });
        });
        if (onTrips) {
          onTrips(tripList);
        }
      },
      (error) => {
        console.error('Error in trips subscription:', error);
        tripsPending = false;
        updateOverallSyncStatus();
      }
    );
    unsubscribes.push(unsubTrips);
  } catch (err) {
    console.error('Failed to listen to trips:', err);
  }

  // 3. Subscribe to settings with includeMetadataChanges enabled
  try {
    const settingsDocRef = doc(db, 'users', userId, 'settings', 'general');
    const unsubSettings = onSnapshot(
      settingsDocRef,
      { includeMetadataChanges: true },
      (docSnap) => {
        if (docSnap.exists() && onSettings) {
          onSettings(docSnap.data());
        }
      },
      (error) => {
        console.error('Error in settings subscription:', error);
      }
    );
    unsubscribes.push(unsubSettings);
  } catch (err) {
    console.error('Failed to listen to settings:', err);
  }

  return () => {
    unsubscribes.forEach((unsub) => unsub());
  };
}

/**
 * Save or update a fuel log document in Firestore
 */
export async function saveFuelLogCloud(userId, log) {
  if (!isFirebaseConfigured || !db || !userId) return;
  const docId = log.id || `fuel_${Date.now()}`;
  const docRef = doc(db, 'users', userId, 'fuelLogs', docId);
  const data = { ...log, id: docId, updatedAt: new Date().toISOString() };
  await setDoc(docRef, data, { merge: true });
}

/**
 * Delete a fuel log document from Firestore
 */
export async function deleteFuelLogCloud(userId, logId) {
  if (!isFirebaseConfigured || !db || !userId) return;
  const docRef = doc(db, 'users', userId, 'fuelLogs', logId);
  await deleteDoc(docRef);
}

/**
 * Save or update a trip document in Firestore
 */
export async function saveTripCloud(userId, trip) {
  if (!isFirebaseConfigured || !db || !userId) return;
  const docId = trip.id || `trip_${Date.now()}`;
  const docRef = doc(db, 'users', userId, 'trips', docId);
  const data = { ...trip, id: docId, updatedAt: new Date().toISOString() };
  await setDoc(docRef, data, { merge: true });
}

/**
 * Delete a trip document from Firestore
 */
export async function deleteTripCloud(userId, tripId) {
  if (!isFirebaseConfigured || !db || !userId) return;
  const docRef = doc(db, 'users', userId, 'trips', tripId);
  await deleteDoc(docRef);
}

/**
 * Save settings document in Firestore
 */
export async function saveSettingsCloud(userId, settings) {
  if (!isFirebaseConfigured || !db || !userId) return;
  const docRef = doc(db, 'users', userId, 'settings', 'general');
  await setDoc(docRef, { ...settings, updatedAt: new Date().toISOString() }, { merge: true });
}

/**
 * Migrate existing localStorage data to Cloud Firestore if cloud collections are empty
 */
export async function migrateLocalDataToCloud(userId, localFuelLogs, localTrips, localSettings) {
  if (!isFirebaseConfigured || !db || !userId) return false;

  try {
    const fuelRef = collection(db, 'users', userId, 'fuelLogs');
    const existingFuel = await getDocs(fuelRef);

    // Only migrate if cloud has no fuel logs yet and local has data
    if (existingFuel.empty && localFuelLogs && localFuelLogs.length > 0) {
      const batch = writeBatch(db);

      localFuelLogs.forEach((log) => {
        const id = log.id || `fuel_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
        const ref = doc(db, 'users', userId, 'fuelLogs', id);
        batch.set(ref, { ...log, id });
      });

      if (localTrips && localTrips.length > 0) {
        localTrips.forEach((trip) => {
          const id = trip.id || `trip_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
          const ref = doc(db, 'users', userId, 'trips', id);
          batch.set(ref, { ...trip, id });
        });
      }

      if (localSettings) {
        const settingsRef = doc(db, 'users', userId, 'settings', 'general');
        batch.set(settingsRef, localSettings);
      }

      await batch.commit();

      try {
        if (navigator.onLine) {
          await waitForPendingWrites(db);
        }
      } catch (err) {
        // offline or flushed
      }

      return true;
    }
  } catch (error) {
    console.error('Migration to cloud error:', error);
  }
  return false;
}

/**
 * Delete all fuel logs and trips documents for the user from Firestore
 */
export async function clearAllCloudData(userId) {
  if (!isFirebaseConfigured || !db || !userId) return;

  try {
    const fuelRef = collection(db, 'users', userId, 'fuelLogs');
    const fuelDocs = await getDocs(fuelRef);

    const tripsRef = collection(db, 'users', userId, 'trips');
    const tripDocs = await getDocs(tripsRef);

    const allDocs = [...fuelDocs.docs, ...tripDocs.docs];
    
    // Firestore writeBatch limit is 500 operations
    const CHUNK_SIZE = 400;
    for (let i = 0; i < allDocs.length; i += CHUNK_SIZE) {
      const chunk = allDocs.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach((docSnap) => batch.delete(docSnap.ref));
      await batch.commit();
    }

    if (navigator.onLine) {
      try {
        await waitForPendingWrites(db);
      } catch (e) {
        // offline or flushed
      }
    }
  } catch (error) {
    console.error('Error clearing cloud data:', error);
    throw error;
  }
}

/**
 * Replace all user data in Cloud Firestore with the provided dataset
 */
export async function replaceUserDataInCloud(userId, fuelLogs = [], trips = [], settings = null) {
  if (!isFirebaseConfigured || !db || !userId) return;

  try {
    // 1. Clear existing fuelLogs & trips
    await clearAllCloudData(userId);

    // 2. Insert new documents in chunks of 400
    const ops = [];

    if (Array.isArray(fuelLogs)) {
      fuelLogs.forEach((log) => {
        const id = log.id || `fuel_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
        const ref = doc(db, 'users', userId, 'fuelLogs', id);
        ops.push((batch) => batch.set(ref, { ...log, id, updatedAt: new Date().toISOString() }));
      });
    }

    if (Array.isArray(trips)) {
      trips.forEach((trip) => {
        const id = trip.id || `trip_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
        const ref = doc(db, 'users', userId, 'trips', id);
        ops.push((batch) => batch.set(ref, { ...trip, id, updatedAt: new Date().toISOString() }));
      });
    }

    if (settings) {
      const settingsRef = doc(db, 'users', userId, 'settings', 'general');
      ops.push((batch) => batch.set(settingsRef, { ...settings, updatedAt: new Date().toISOString() }, { merge: true }));
    }

    const CHUNK_SIZE = 400;
    for (let i = 0; i < ops.length; i += CHUNK_SIZE) {
      const chunk = ops.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach((op) => op(batch));
      await batch.commit();
    }

    if (navigator.onLine) {
      try {
        await waitForPendingWrites(db);
      } catch (e) {
        // offline or flushed
      }
    }
  } catch (error) {
    console.error('Error replacing user data in cloud:', error);
    throw error;
  }
}

