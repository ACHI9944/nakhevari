import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getFunctions } from 'firebase/functions'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: 'AIzaSyCicc6Kyr56iqk6PmAyLN0SA8ZDCgyeWt8',
  authDomain: 'nakhevari-ge.firebaseapp.com',
  projectId: 'nakhevari-ge',
  storageBucket: 'nakhevari-ge.firebasestorage.app',
  messagingSenderId: '865581901860',
  appId: '1:865581901860:web:16c24933d6910219b590b1',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const functions = getFunctions(app, 'europe-west1')
export const storage = getStorage(app)
