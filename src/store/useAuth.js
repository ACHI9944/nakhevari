import { useDispatch, useSelector } from 'react-redux'
import {
  loginUser,
  loginWithGoogle as loginWithGoogleThunk,
  logoutUser,
  refreshUser as refreshUserThunk,
  registerUser,
  resendEmailVerification as resendEmailVerificationThunk,
  completeUserProfile,
} from './authSlice'

export function useAuth() {
  const dispatch = useDispatch()
  const { user, profile, profileError, isAdmin, initialized } = useSelector(state => state.auth)

  return {
    user,
    profile,
    profileError,
    isAdmin,
    loading: !initialized,
    login: (email, password) => dispatch(loginUser({ email, password })).unwrap(),
    loginWithGoogle: () => dispatch(loginWithGoogleThunk()).unwrap(),
    register: data => dispatch(registerUser(data)).unwrap(),
    refreshUser: () => dispatch(refreshUserThunk()).unwrap(),
    resendEmailVerification: () => dispatch(resendEmailVerificationThunk()).unwrap(),
    logout: () => dispatch(logoutUser()).unwrap(),
    completeProfile: data => dispatch(completeUserProfile(data)).unwrap(),
  }
}
