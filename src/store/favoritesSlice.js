import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { addFavorite, getFavoriteIds, removeFavorite } from '../services/favorites/favoritesService'
import { getListingById } from '../services/listings/listingService'

export const fetchFavoriteIds = createAsyncThunk('favorites/fetchIds', getFavoriteIds)
export const favoriteListing = createAsyncThunk('favorites/add', addFavorite)
export const unfavoriteListing = createAsyncThunk('favorites/remove', removeFavorite)
export const fetchFavoriteListings = createAsyncThunk('favorites/fetchListings', async ids => {
  const listings = await Promise.all(ids.map(getListingById))
  return listings.filter(Boolean)
})

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState: {
    ids: [],
    status: 'idle',
    error: null,
    items: [],
    itemsStatus: 'idle',
    itemsError: null,
  },
  reducers: {
    clearFavorites: state => {
      state.ids = []
      state.status = 'idle'
      state.error = null
      state.items = []
      state.itemsStatus = 'idle'
      state.itemsError = null
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchFavoriteIds.pending, state => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchFavoriteIds.fulfilled, (state, action) => {
        state.ids = action.payload
        state.status = 'succeeded'
      })
      .addCase(fetchFavoriteIds.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error.message
      })
      .addCase(favoriteListing.fulfilled, (state, action) => {
        if (!state.ids.includes(action.payload)) state.ids.push(action.payload)
      })
      .addCase(unfavoriteListing.fulfilled, (state, action) => {
        state.ids = state.ids.filter(id => id !== action.payload)
        state.items = state.items.filter(item => item.id !== action.payload)
      })
      .addCase(fetchFavoriteListings.pending, state => {
        state.itemsStatus = 'loading'
        state.itemsError = null
      })
      .addCase(fetchFavoriteListings.fulfilled, (state, action) => {
        state.items = action.payload
        state.itemsStatus = 'succeeded'
      })
      .addCase(fetchFavoriteListings.rejected, (state, action) => {
        state.itemsStatus = 'failed'
        state.itemsError = action.error.message
      })
  },
})

export const { clearFavorites } = favoritesSlice.actions
export default favoritesSlice.reducer
