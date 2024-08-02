// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDJneFtksoQ5KxLKyISUO9RaGi-GjeOsQE",
  authDomain: "pantry-tracker-de058.firebaseapp.com",
  projectId: "pantry-tracker-de058",
  storageBucket: "pantry-tracker-de058.appspot.com",
  messagingSenderId: "945429558053",
  appId: "1:945429558053:web:e7a7c7910bd1ee4f9be0cc",
  measurementId: "G-H4TZYFZ1Y0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
const analytics = getAnalytics(app);