import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Pega aquí TUS datos que copiaste de la consola de Firebase
const firebaseConfig = {
 apiKey: "AIzaSyDVhQb0WL2Agq2rsKvIhkNVGHyiM95GMcs",
  authDomain: "pagos-familia.firebaseapp.com",
  projectId: "pagos-familia",
  storageBucket: "pagos-familia.firebasestorage.app",
  messagingSenderId: "1028289055808",
  appId: "1:1028289055808:web:05a5085f03d0c59a15a3a5",
  measurementId: "G-41T6RJBHZP"
};

// Inicializamos Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);