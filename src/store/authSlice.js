import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  getIdTokenResult,
  reload,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../config/firebase'

export const serializeUser = user => user ? {
  uid: user.uid,
  email: user.email,
  displayName: user.displayName,
  photoURL: user.photoURL,
  emailVerified: user.emailVerified,
  phoneNumber: user.phoneNumber,
} : null

const serializeProfile = snapshot => {
  if (!snapshot.exists()) return null
  const data = snapshot.data()
  return {
    ...data,
    createdAt: typeof data.createdAt?.toMillis === 'function' ? data.createdAt.toMillis() : data.createdAt,
    updatedAt: typeof data.updatedAt?.toMillis === 'function' ? data.updatedAt.toMillis() : data.updatedAt,
    lastLoginAt: typeof data.lastLoginAt?.toMillis === 'function' ? data.lastLoginAt.toMillis() : data.lastLoginAt,
  }
}

const readProfile = async uid => serializeProfile(await getDoc(doc(db, 'users', uid)))
const readAdminClaim = async user => user ? (await getIdTokenResult(user)).claims.admin === true : false
const companyStatusFor = accountType => accountType === 'company' ? 'pending' : 'not_required'

export const loadUserProfile = createAsyncThunk('auth/loadProfile', async user => {
  const currentUser = auth.currentUser
  return {
    user,
    profile: await readProfile(user.uid),
    isAdmin: currentUser?.uid === user.uid ? await readAdminClaim(currentUser) : false,
  }
})

export const registerUser = createAsyncThunk('auth/register', async ({ firstName, lastName, email, password, accountType, gender, birthDate, phone, companyName, identificationNumber }) => {
  const displayName = `${firstName} ${lastName}`.trim()
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(credential.user, { displayName })
  const profile = {
    firstName,
    lastName,
    name: displayName,
    email: credential.user.email || email,
    emailVerified: false,
    phone,
    phoneVerified: false,
    gender: accountType === 'individual' ? gender : '',
    birthDate: accountType === 'individual' ? birthDate : '',
    accountType,
    companyName: accountType === 'company' ? companyName : '',
    identificationNumber: accountType === 'company' ? identificationNumber : '',
    companyVerificationStatus: companyStatusFor(accountType),
    profileStatus: 'active',
    role: 'user',
    profileCompleted: true,
    createdAt: serverTimestamp(),
  }
  await setDoc(doc(db, 'users', credential.user.uid), profile)
  await sendEmailVerification(credential.user, { url: `${window.location.origin}/verify-email` })
  return { user: serializeUser(credential.user), profile: { ...profile, createdAt: Date.now() }, isAdmin: false }
})

export const loginUser = createAsyncThunk('auth/login', async ({ email, password }) => {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  return { user: serializeUser(credential.user), profile: await readProfile(credential.user.uid), isAdmin: await readAdminClaim(credential.user) }
})

export const loginWithGoogle = createAsyncThunk('auth/loginWithGoogle', async () => {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  const credential = await signInWithPopup(auth, provider)
  const googleUser = credential.user
  const userRef = doc(db, 'users', googleUser.uid)
  const existingProfile = await getDoc(userRef)
  const googleData = {
    name: googleUser.displayName || '',
    email: googleUser.email || '',
    photoURL: googleUser.photoURL || '',
    lastLoginAt: serverTimestamp(),
  }
  if (existingProfile.exists()) {
    await setDoc(userRef, googleData, { merge: true })
  } else {
    await setDoc(userRef, {
      ...googleData,
      emailVerified: googleUser.emailVerified,
      phoneVerified: false,
      accountType: '',
      companyVerificationStatus: 'not_required',
      role: 'user',
      profileStatus: 'active',
      profileCompleted: false,
      createdAt: serverTimestamp(),
    })
  }
  return { user: serializeUser(googleUser), profile: await readProfile(googleUser.uid), isAdmin: await readAdminClaim(googleUser) }
})

export const completeUserProfile = createAsyncThunk('auth/completeProfile', async data => {
  if (!auth.currentUser) throw new Error('No authenticated user')
  const userRef = doc(db, 'users', auth.currentUser.uid)
  const existingProfile = await readProfile(auth.currentUser.uid)
  const nextCompanyName = data.accountType === 'company' ? data.companyName.trim() : ''
  const nextIdentificationNumber = data.accountType === 'company' ? data.identificationNumber.trim() : ''
  const companyDetailsChanged = existingProfile?.accountType !== data.accountType
    || existingProfile?.companyName !== nextCompanyName
    || existingProfile?.identificationNumber !== nextIdentificationNumber
  const profileData = {
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    name: `${data.firstName} ${data.lastName}`.trim(),
    phone: data.phone,
    gender: data.accountType === 'individual' ? data.gender : '',
    birthDate: data.accountType === 'individual' ? data.birthDate : '',
    accountType: data.accountType,
    companyName: nextCompanyName,
    identificationNumber: nextIdentificationNumber,
    companyVerificationStatus: data.accountType === 'company' && !companyDetailsChanged
      ? existingProfile?.companyVerificationStatus || 'pending'
      : companyStatusFor(data.accountType),
    profileCompleted: true,
    updatedAt: serverTimestamp(),
  }
  await updateProfile(auth.currentUser, { displayName: profileData.name })
  await setDoc(userRef, profileData, { merge: true })
  return {
    user: serializeUser(auth.currentUser),
    profile: await readProfile(auth.currentUser.uid),
  }
})

export const refreshUser = createAsyncThunk('auth/refreshUser', async () => {
  if (!auth.currentUser) return null
  await reload(auth.currentUser)
  return { user: serializeUser(auth.currentUser), isAdmin: await readAdminClaim(auth.currentUser) }
})

export const resendEmailVerification = createAsyncThunk('auth/resendEmailVerification', async () => {
  if (!auth.currentUser) throw new Error('No authenticated user')
  await sendEmailVerification(auth.currentUser, { url: `${window.location.origin}/verify-email` })
})

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  await signOut(auth)
})

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, profile: null, profileError: null, isAdmin: false, initialized: false },
  reducers: {
    authStateChanged(state, action) {
      state.user = action.payload
      state.profile = null
      state.profileError = null
      state.isAdmin = false
      state.initialized = true
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadUserProfile.pending, (state, action) => {
        state.user = action.meta.arg
        state.profile = null
        state.profileError = null
        state.isAdmin = false
        state.initialized = false
      })
      .addCase(loadUserProfile.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.profile = action.payload.profile
        state.profileError = null
        state.isAdmin = action.payload.isAdmin
        state.initialized = true
      })
      .addCase(loadUserProfile.rejected, (state, action) => {
        state.profile = null
        state.profileError = action.error.message || 'Profile could not be loaded.'
        state.isAdmin = false
        state.initialized = true
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.profile = action.payload.profile
        state.profileError = null
        state.isAdmin = action.payload.isAdmin
        state.initialized = true
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.profile = action.payload.profile
        state.profileError = null
        state.isAdmin = action.payload.isAdmin
        state.initialized = true
      })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.profile = action.payload.profile
        state.profileError = null
        state.isAdmin = action.payload.isAdmin
        state.initialized = true
      })
      .addCase(completeUserProfile.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.profile = action.payload.profile
        state.profileError = null
      })
      .addCase(refreshUser.fulfilled, (state, action) => {
        state.user = action.payload?.user || null
        state.isAdmin = action.payload?.isAdmin || false
      })
      .addCase(logoutUser.fulfilled, state => {
        state.user = null
        state.profile = null
        state.profileError = null
        state.isAdmin = false
      })
  },
})

export const { authStateChanged } = authSlice.actions
export default authSlice.reducer
