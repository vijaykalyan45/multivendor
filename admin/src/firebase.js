// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// const firebaseConfig = {
//   apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
//   authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
//   projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
//   storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
//   appId: process.env.REACT_APP_FIREBASE_APP_ID
// };
const firebaseConfig = {
  apiKey: "AIzaSyCaNeVfkkstyR724vIBqyNzkUyKxO2YM4I",
  authDomain: "ecommerce-77d8b.firebaseapp.com",
  projectId: "ecommerce-77d8b",
  storageBucket: "ecommerce-77d8b.appspot.com",
  messagingSenderId: "245727146498",
  appId: "1:245727146498:web:dec4e262da4caa3e6b6d1b",
  measurementId: "G-EMG47YN77L"
};

// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig);