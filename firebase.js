import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCF8FcSQyu9FwmL5VyD70Jxh_yj_C0Zsv8",
  authDomain: "veinsofdrop.firebaseapp.com",
  projectId: "veinsofdrop",
  storageBucket: "veinsofdrop.firebasestorage.app",
  messagingSenderId: "989711121423",
  appId: "1:989711121423:web:05dab0d932b898a276777a",
  measurementId: "G-94DRZHW1DS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export default app;