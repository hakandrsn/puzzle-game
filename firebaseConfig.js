import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDbw35GvHjcXVdt4x__MCVo6IeaERVuOV4",
  authDomain: "puzzle-game-a5b2a.firebaseapp.com",
  projectId: "puzzle-game-a5b2a",
  storageBucket: "puzzle-game-a5b2a.firebasestorage.app",
  messagingSenderId: "167040071688",
  appId: "1:167040071688:web:9877039f99e61702e579bd",
  measurementId: "G-3SQGX6R0R4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export { auth, db };
export default app;