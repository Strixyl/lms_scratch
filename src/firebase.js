import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCdVc0Z6xOnAv8VtctBF0fosPRiUMHeCWo",
  authDomain: "hll-system.firebaseapp.com",
  projectId: "hll-system",
  storageBucket: "hll-system.firebasestorage.app",
  messagingSenderId: "869089526272",
  appId: "1:869089526272:web:fc19ea93cf163c028ccee5",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
