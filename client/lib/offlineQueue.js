import { Platform, Alert, AppState } from 'react-native';
import { getSetting, setSetting } from './secureStore';
import api from './api';

const QUEUE_KEY = 'offline_scans_queue';

let listeners = new Set();
let isProcessing = false;
let unlockedListeners = new Set();

/**
 * Notify all subscribers of queue changes
 */
const notifyListeners = async () => {
  const queue = await getQueue();
  listeners.forEach((fn) => {
    try {
      fn(queue, isProcessing);
    } catch (err) {
      console.warn('[OfflineQueue] Listener error:', err);
    }
  });
};

/**
 * Register a listener for queue changes
 */
export const subscribeQueue = (listener) => {
  listeners.add(listener);
  getQueue().then((q) => listener(q, isProcessing));
  return () => {
    listeners.delete(listener);
  };
};

/**
 * Register a listener for unlockedCheckpoints updates
 */
export const subscribeUnlockedCheckpoints = (listener) => {
  unlockedListeners.add(listener);
  return () => {
    unlockedListeners.delete(listener);
  };
};

/**
 * Get current queue from storage
 */
export const getQueue = async () => {
  try {
    const queue = await getSetting(QUEUE_KEY, []);
    return Array.isArray(queue) ? queue : [];
  } catch {
    return [];
  }
};

/**
 * Save queue to storage
 */
const saveQueue = async (queue) => {
  try {
    await setSetting(QUEUE_KEY, queue);
  } catch (err) {
    console.error('[OfflineQueue] Failed to persist queue:', err);
  }
};

/**
 * Enqueue a scan payload when offline
 */
export const enqueueScan = async ({
  checkpointId,
  qrData,
  userLocation,
  scannedAt,
  locationStale,
}) => {
  const queue = await getQueue();
  const item = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    checkpointId: checkpointId || null,
    qrData: qrData ? String(qrData).trim() : '',
    userLocation: userLocation || null,
    scannedAt: scannedAt || Date.now(),
    locationStale: !!locationStale,
    enqueuedAt: Date.now(),
    attempts: 0,
    failed: false,
    errorMessage: null,
  };

  queue.push(item);
  await saveQueue(queue);
  await notifyListeners();
  return item;
};

/**
 * Process the queue sequentially (FIFO)
 */
export const processQueue = async (customUnlockedCallback = null) => {
  if (isProcessing) return { success: false, reason: 'already_syncing' };

  isProcessing = true;
  await notifyListeners();

  try {
    let queue = await getQueue();
    if (queue.length === 0) {
      return { success: true, processedCount: 0 };
    }

    let processedCount = 0;

    while (queue.length > 0) {
      const item = queue[0];

      // If item is already marked permanently failed from a prior 4xx, stop replay
      if (item.failed) {
        Alert.alert(
          'Sync Paused',
          `A queued scan for "${item.qrData}" previously failed: ${item.errorMessage || 'Invalid scan'}. Please resolve or discard it.`
        );
        break;
      }

      try {
        const payload = {
          qrCode: item.qrData,
          latitude: item.userLocation?.latitude,
          longitude: item.userLocation?.longitude,
          scannedAt: item.scannedAt,
          locationStale: item.locationStale,
        };

        const res = await api.post('/checkpoints/verify', payload);

        // Success or already verified
        if (res.unlockedCheckpoints) {
          if (customUnlockedCallback) {
            customUnlockedCallback(res.unlockedCheckpoints);
          }
          unlockedListeners.forEach((fn) => {
            try {
              fn(res.unlockedCheckpoints);
            } catch (uErr) {
              console.warn('[OfflineQueue] Unlocked callback error:', uErr);
            }
          });
        }

        // Dequeue item
        queue.shift();
        await saveQueue(queue);
        processedCount++;
      } catch (err) {
        // Check if error is network offline vs 4xx client error
        const isClientError = err.status && err.status >= 400 && err.status < 500;

        if (isClientError) {
          // Backend explicitly rejected with 4xx
          item.failed = true;
          item.errorMessage = err.message || 'Verification rejected by server';
          await saveQueue(queue);
          await notifyListeners();

          Alert.alert(
            'Sync Stopped',
            `Offline scan for "${item.qrData}" failed (${err.status}): ${err.message || 'Verification rejected'}. Replay stopped.`
          );
          break; // Stop replay on 4xx, do not silently discard
        } else {
          // Network failure, still unreachable, pause sync
          break;
        }
      }
    }

    return { success: true, processedCount };
  } finally {
    isProcessing = false;
    await notifyListeners();
  }
};

/**
 * Remove an item or clear queue
 */
export const removeQueueItem = async (itemId) => {
  let queue = await getQueue();
  queue = queue.filter((i) => i.id !== itemId);
  await saveQueue(queue);
  await notifyListeners();
};

export const clearQueue = async () => {
  await saveQueue([]);
  await notifyListeners();
};

/**
 * Auto-sync listener on reconnect / app active
 */
let isAutoSyncSetup = false;
export const initOfflineQueue = () => {
  if (isAutoSyncSetup) return;
  isAutoSyncSetup = true;

  // AppState change (resuming to foreground)
  AppState.addEventListener('change', (nextState) => {
    if (nextState === 'active') {
      getQueue().then((q) => {
        if (q.length > 0) {
          processQueue().catch(() => {});
        }
      });
    }
  });

  // Web online event
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      processQueue().catch(() => {});
    });
  }

  // Heartbeat periodic retry when items are pending
  setInterval(async () => {
    const queue = await getQueue();
    if (queue.length > 0 && !isProcessing) {
      processQueue().catch(() => {});
    }
  }, 30000);
};

export default {
  enqueueScan,
  processQueue,
  getQueue,
  removeQueueItem,
  clearQueue,
  subscribeQueue,
  subscribeUnlockedCheckpoints,
  initOfflineQueue,
};
