// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC2UhOmjM0EYrd-fr5_qRVOEAPKsZyhnV8",
  authDomain: "employee-d5800.firebaseapp.com",
  databaseURL: "https://employee-d5800-default-rtdb.firebaseio.com",
  projectId: "employee-d5800",
  storageBucket: "employee-d5800.firebasestorage.app",
  messagingSenderId: "799223223061",
  appId: "1:799223223061:web:ed8c9eeedc6ee7fa5f8f1c",
  measurementId: "G-9B4VNBT6TX"
};

// ফায়ারবেজ ইনিশিয়েলাইজ করা
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);