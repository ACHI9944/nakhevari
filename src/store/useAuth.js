import { useDispatch, useSelector } from 'react-redux'
import {
  confirmReset as confirmResetThunk,
  loginUser,
  loginWithGoogle as loginWithGoogleThunk,
  logoutUser,
  refreshUser as refreshUserThunk,
  registerUser,
  resendEmailVerification as resendEmailVerificationThunk,
  resetPassword as resetPasswordThunk,
  verifyResetCode as verifyResetCodeThunk,
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
    resetPassword: email => dispatch(resetPasswordThunk(email)).unwrap(),
    verifyResetCode: oobCode => dispatch(verifyResetCodeThunk(oobCode)).unwrap(),
    confirmReset: (oobCode, newPassword) => dispatch(confirmResetThunk({ oobCode, newPassword })).unwrap(),
    logout: () => dispatch(logoutUser()).unwrap(),
    completeProfile: data => dispatch(completeUserProfile(data)).unwrap(),
  }
}
