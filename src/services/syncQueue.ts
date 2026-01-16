import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";

const SYNC_QUEUE_KEY = "@puzzle_sync_queue";

interface QueuedProgress {
  chapterId: number;
  levelId: number;
  moves: number;
  stars: number;
  timestamp: number;
}

/**
 * Add progress to offline sync queue
 */
export const queueProgressUpdate = async (
  chapterId: number,
  levelId: number,
  moves: number,
  stars: number
): Promise<void> => {
  try {
    const queueData = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
    const queue: QueuedProgress[] = queueData ? JSON.parse(queueData) : [];

    const levelKey = `${chapterId}-${levelId}`;

    // Update or add to queue
    const existingIndex = queue.findIndex(
      (item) => `${item.chapterId}-${item.levelId}` === levelKey
    );

    const newItem: QueuedProgress = {
      chapterId,
      levelId,
      moves,
      stars,
      timestamp: Date.now(),
    };

    if (existingIndex >= 0) {
      // Update existing: keep best performance
      const existing = queue[existingIndex];
      queue[existingIndex] = {
        ...newItem,
        stars: Math.max(existing.stars, stars),
        moves: existing.moves === 0 ? moves : Math.min(existing.moves, moves),
      };
    } else {
      queue.push(newItem);
    }

    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    console.log("📦 Queued progress:", levelKey, newItem);
  } catch (error) {
    console.error("Error queueing progress:", error);
  }
};

/**
 * Process sync queue when online
 */
export const processSyncQueue = async (): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.log("⚠️ No user, skipping sync");
      return;
    }

    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      console.log("⚠️ Offline, skipping sync");
      return;
    }

    const queueData = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
    if (!queueData) {
      console.log("✅ No queued progress to sync");
      return;
    }

    const queue: QueuedProgress[] = JSON.parse(queueData);
    if (queue.length === 0) {
      console.log("✅ Queue empty");
      return;
    }

    console.log(`🔄 Syncing ${queue.length} queued progress items...`);

    // Get current cloud progress
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const cloudData = userDoc.exists() ? userDoc.data() : {};
    const cloudProgress = cloudData.progress || {
      completedLevels: {},
      totalStars: 0,
      unlockedChapters: [1],
    };

    let totalStarsDiff = 0;
    const updates: any = {};

    // Merge queue with cloud
    for (const item of queue) {
      const levelKey = `${item.chapterId}-${item.levelId}`;
      const cloudLevel = cloudProgress.completedLevels[levelKey];

      let finalStars = item.stars;
      let finalMoves = item.moves;

      if (cloudLevel) {
        // Merge: take max stars, min moves
        finalStars = Math.max(cloudLevel.stars || 0, item.stars);
        finalMoves =
          cloudLevel.bestMoves === 0
            ? item.moves
            : Math.min(cloudLevel.bestMoves, item.moves);

        totalStarsDiff += finalStars - (cloudLevel.stars || 0);
      } else {
        totalStarsDiff += finalStars;
      }

      updates[levelKey] = {
        completed: true,
        stars: finalStars,
        bestMoves: finalMoves,
      };
    }

    // Update Firestore with merged data
    const firestoreUpdate = {
      progress: {
        completedLevels: {
          ...cloudProgress.completedLevels,
          ...updates,
        },
        totalStars: (cloudProgress.totalStars || 0) + totalStarsDiff,
        unlockedChapters: cloudProgress.unlockedChapters || [1],
      },
      lastUpdated: new Date().toISOString(),
    };

    await setDoc(doc(db, "users", user.uid), firestoreUpdate, { merge: true });

    // Clear queue
    await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
    console.log(`✅ Synced ${queue.length} items, cleared queue`);
  } catch (error) {
    console.error("❌ Sync queue error:", error);
  }
};

/**
 * Setup network listener to auto-sync when online
 */
export const setupSyncListener = (): (() => void) => {
  const unsubscribe = NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      console.log("🌐 Network connected, processing sync queue...");
      processSyncQueue();
    }
  });

  // Process immediately if online
  NetInfo.fetch().then((state) => {
    if (state.isConnected) {
      processSyncQueue();
    }
  });

  return unsubscribe;
};
