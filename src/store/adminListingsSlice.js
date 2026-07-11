import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import {
  getAdminListings,
} from '../services/listings/listingService'
import {
  moderateListing,
} from '../services/listings/listingModerationService'
import {
  getAdmins,
  setAdminAccess,
} from '../services/admins/adminService'
import { getProfiles } from '../services/users/profileService'
import { updateCompanyVerification } from '../services/companies/companyVerificationService'

export const fetchAdminListings = createAsyncThunk('adminListings/fetch', () => getAdminListings('all'))
export const reviewListing = createAsyncThunk('adminListings/review', moderateListing)
export const fetchAdmins = createAsyncThunk('adminListings/fetchAdmins', getAdmins)
export const changeAdminAccess = createAsyncThunk('adminListings/changeAdminAccess', setAdminAccess)
export const fetchProfiles = createAsyncThunk('adminListings/fetchProfiles', getProfiles)
export const verifyCompany = createAsyncThunk('adminListings/verifyCompany', updateCompanyVerification)

const adminListingsSlice = createSlice({
  name: 'adminListings',
  initialState: {
    items: [],
    admins: [],
    profiles: [],
    status: 'idle',
    adminsStatus: 'idle',
    profilesStatus: 'idle',
    actionStatus: 'idle',
    listingsError: null,
    adminsError: null,
    profilesError: null,
    actionError: null,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchAdminListings.pending, state => {
        state.status = 'loading'
        state.listingsError = null
      })
      .addCase(fetchAdminListings.fulfilled, (state, action) => {
        state.items = action.payload
        state.status = 'succeeded'
      })
      .addCase(fetchAdminListings.rejected, (state, action) => {
        state.status = 'failed'
        state.listingsError = action.error.message
      })
      .addCase(reviewListing.pending, state => {
        state.actionStatus = 'loading'
        state.actionError = null
      })
      .addCase(reviewListing.fulfilled, (state, action) => {
        const listing = state.items.find(item => item.id === action.payload.listingId)
        if (listing) {
          listing.status = action.payload.status
          listing.rejectionReason = action.payload.status === 'rejected' ? action.meta.arg.reason : ''
          listing.reviewedAt = Date.now()
        }
        state.actionStatus = 'succeeded'
      })
      .addCase(reviewListing.rejected, (state, action) => {
        state.actionStatus = 'failed'
        state.actionError = action.error.message
      })
      .addCase(fetchAdmins.pending, state => {
        state.adminsStatus = 'loading'
        state.adminsError = null
      })
      .addCase(fetchAdmins.fulfilled, (state, action) => {
        state.admins = action.payload
        state.adminsStatus = 'succeeded'
      })
      .addCase(fetchAdmins.rejected, (state, action) => {
        state.adminsStatus = 'failed'
        state.adminsError = action.error.message
      })
      .addCase(changeAdminAccess.pending, state => {
        state.actionStatus = 'loading'
        state.actionError = null
      })
      .addCase(changeAdminAccess.fulfilled, (state, action) => {
        if (action.payload.enabled) {
          if (!state.admins.some(admin => admin.uid === action.payload.uid)) state.admins.push(action.payload)
        } else {
          state.admins = state.admins.filter(admin => admin.uid !== action.payload.uid)
        }
        state.actionStatus = 'succeeded'
      })
      .addCase(changeAdminAccess.rejected, (state, action) => {
        state.actionStatus = 'failed'
        state.actionError = action.error.message
      })
      .addCase(fetchProfiles.pending, state => {
        state.profilesStatus = 'loading'
        state.profilesError = null
      })
      .addCase(fetchProfiles.fulfilled, (state, action) => {
        state.profiles = action.payload
        state.profilesStatus = 'succeeded'
      })
      .addCase(fetchProfiles.rejected, (state, action) => {
        state.profilesStatus = 'failed'
        state.profilesError = action.error.message
      })
      .addCase(verifyCompany.pending, state => {
        state.actionStatus = 'loading'
        state.actionError = null
      })
      .addCase(verifyCompany.fulfilled, (state, action) => {
        const profile = state.profiles.find(item => item.uid === action.payload.uid)
        if (profile) {
          profile.companyVerificationStatus = action.payload.status
          profile.companyVerificationReason = action.payload.reason
        }
        state.actionStatus = 'succeeded'
      })
      .addCase(verifyCompany.rejected, (state, action) => {
        state.actionStatus = 'failed'
        state.actionError = action.error.message
      })
  },
})

export default adminListingsSlice.reducer
