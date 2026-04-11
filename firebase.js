// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCF8FcSQyu9FwmL5VyD70Jxh_yj_C0Zsv8",
  authDomain: "veinsofdrop.firebaseapp.com",
  projectId: "veinsofdrop",
  storageBucket: "veinsofdrop.firebasestorage.app",
  messagingSenderId: "989711121423",
  appId: "1:989711121423:web:05dab0d932b898a276777a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);