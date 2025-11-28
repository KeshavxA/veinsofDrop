import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCF8FcSQyu9FwmL5VyD70Jxh_yj_C0Zsv8",
  authDomain: "veinsofdrop.firebaseapp.com",
  projectId: "veinsofdrop",
  storageBucket: "veinsofdrop.firebasestorage.app",
  messagingSenderId: "989711121423",
  appId: "1:989711121423:web:05dab0d932b898a276777a",
  measurementId: "G-94DRZHW1DS"
};


const app = initializeApp(firebaseConfig);


export const auth = getAuth(app);


export const db = getFirestore(app);


if (!auth) {
  console.error('Firebase Auth failed to initialize');
} else {
  console.log('Firebase Auth initialized successfully');
}

export default app;