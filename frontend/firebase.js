import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

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

const isExpoGo = Constants.executionEnvironment === "storeClient";

let auth;
if (Platform.OS === "web" || isExpoGo) {
  auth = getAuth(app);
} else {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (e) {
    auth = getAuth(app);
  }
}

const db = getFirestore(app);

export { auth, db };
