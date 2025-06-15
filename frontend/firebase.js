import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyD7jNgQUt3Eilw7By3fhKJxWoYnOkPi5j8",
  authDomain: "aroundnus-fa582.firebaseapp.com",
  projectId: "aroundnus-fa582",
  storageBucket: "aroundnus-fa582.firebasestorage.app",
  messagingSenderId: "727796046319",
  appId: "1:727796046319:web:6d189b69f153e440ddbe1a",
  measurementId: "G-MT3SPL9Q5P"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let auth;
if (Platform.OS === "web") {
  // On web, use standard getAuth
  auth = getAuth(app);
} else {
  // On native, use initializeAuth with persistence
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (e) {
    // Fallback if already initialized
    auth = getAuth(app);
  }
}

const db = getFirestore(app);

export { auth, db };
