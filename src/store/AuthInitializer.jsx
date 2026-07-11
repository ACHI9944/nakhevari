import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../config/firebase'
import { authStateChanged, loadUserProfile, serializeUser } from './authSlice'

export function AuthInitializer({ children }) {
  const dispatch = useDispatch()

  useEffect(() => onAuthStateChanged(auth, user => {
    if (user) dispatch(loadUserProfile(serializeUser(user)))
    else dispatch(authStateChanged(null))
  }), [dispatch])

  return children
}
