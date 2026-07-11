import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import listingsReducer from './listingsSlice'
import adminListingsReducer from './adminListingsSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    listings: listingsReducer,
    adminListings: adminListingsReducer,
  },
})
