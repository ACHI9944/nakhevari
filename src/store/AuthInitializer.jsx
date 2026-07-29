import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../config/firebase'
import { authStateChanged, loadUserProfile, serializeUser } from './authSlice'
import { clearFavorites, fetchFavoriteIds } from './favoritesSlice'

export function AuthInitializer({ children }) {
  const dispatch = useDispatch()

  useEffect(() => onAuthStateChanged(auth, user => {
    if (user) {
      dispatch(loadUserProfile(serializeUser(user)))
      dispatch(fetchFavoriteIds(user.uid))
    } else {
      dispatch(authStateChanged(null))
      dispatch(clearFavorites())
    }
  }), [dispatch])

  return children
}
