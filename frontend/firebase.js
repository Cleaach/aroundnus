import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD7jNgQUt3Eilw7By3fhKJxWoYnOkPi5j8",
  authDomain: "aroundnus-fa582.firebaseapp.com",
  projectId: "aroundnus-fa582",
  storageBucket: "aroundnus-fa582.firebasestorage.app",
  messagingSenderId: "727796046319",
  appId: "1:727796046319:web:6d189b69f153e440ddbe1a",
  measurementId: "G-MT3SPL9Q5P"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

export { auth, db };
