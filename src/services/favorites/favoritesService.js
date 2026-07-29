import { collection, deleteDoc, doc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../../config/firebase'

export async function getFavoriteIds(uid) {
  const snapshot = await getDocs(collection(db, 'users', uid, 'favorites'))
  return snapshot.docs.map(document => document.id)
}

export async function addFavorite({ uid, listingId }) {
  await setDoc(doc(db, 'users', uid, 'favorites', listingId), { createdAt: serverTimestamp() })
  return listingId
}

export async function removeFavorite({ uid, listingId }) {
  await deleteDoc(doc(db, 'users', uid, 'favorites', listingId))
  return listingId
}
