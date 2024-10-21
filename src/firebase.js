
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDvRlUQ-vdMPrH-i9MYRnLvp4RRRP0BsGQ",
    authDomain: "graffitimap-2a080.firebaseapp.com",
    projectId: "graffitimap-2a080",
    storageBucket: "graffitimap-2a080.appspot.com",
    messagingSenderId: "304255808903",
    appId: "1:304255808903:web:0ea2262dc778d707ad0f22"
};
  
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };