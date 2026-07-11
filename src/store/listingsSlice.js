import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import {
  getListingById,
  getMyListings,
  getPublishedListings,
  removeListing,
} from '../services/listings/listingService'

const publishedListingsTtlMs = 60 * 1000
const publishedQueryKey = options => JSON.stringify({
  filters: options?.filters || {},
  sort: options?.sort || 'newest',
  pageSize: options?.pageSize || 24,
})

export const fetchPublishedListings = createAsyncThunk(
  'listings/fetchPublished',
  async (options = {}) => ({
    ...await getPublishedListings(options),
    append: Boolean(options?.append),
    queryKey: publishedQueryKey(options),
  }),
  {
    condition: (options, { getState }) => {
      if (options?.append) return getState().listings.published.status !== 'loading'
      if (options?.force) return true
      const queryKey = publishedQueryKey(options)
      const { fetchedAt, status, queryKey: currentQueryKey } = getState().listings.published
      const isFresh = fetchedAt && Date.now() - fetchedAt < publishedListingsTtlMs
      return currentQueryKey !== queryKey
        || status !== 'loading' && status !== 'succeeded'
        || (status === 'succeeded' && !isFresh)
    },
  },
)
export const fetchMyListings = createAsyncThunk('listings/fetchMine', getMyListings)
export const fetchListing = createAsyncThunk('listings/fetchOne', getListingById)
export const deleteListing = createAsyncThunk('listings/delete', async id => {
  await removeListing(id)
  return id
})

const setPending = target => {
  target.status = 'loading'
  target.error = null
}

const setRejected = (target, action) => {
  target.status = 'failed'
  target.error = action.error.message
}

const listingsSlice = createSlice({
  name: 'listings',
  initialState: {
    published: {
      items: [],
      status: 'idle',
      loadingMore: false,
      error: null,
      fetchedAt: null,
      queryKey: null,
      cursorToken: null,
      hasMore: false,
    },
    mine: { items: [], status: 'idle', error: null },
    details: { byId: {}, statusById: {}, errorById: {} },
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchPublishedListings.pending, (state, action) => {
        if (action.meta.arg?.append) {
          state.published.loadingMore = true
          state.published.error = null
        } else {
          setPending(state.published)
          state.published.loadingMore = false
        }
      })
      .addCase(fetchPublishedListings.fulfilled, (state, action) => {
        if (action.payload.append && state.published.queryKey === action.payload.queryKey) {
          const existingIds = new Set(state.published.items.map(item => item.id))
          state.published.items.push(...action.payload.items.filter(item => !existingIds.has(item.id)))
        } else {
          state.published.items = action.payload.items
        }
        state.published.status = 'succeeded'
        state.published.loadingMore = false
        state.published.queryKey = action.payload.queryKey
        state.published.cursorToken = action.payload.cursorToken
        state.published.hasMore = action.payload.hasMore
        state.published.fetchedAt = action.payload.fetchedAt
      })
      .addCase(fetchPublishedListings.rejected, (state, action) => {
        state.published.loadingMore = false
        setRejected(state.published, action)
      })
      .addCase(fetchMyListings.pending, state => setPending(state.mine))
      .addCase(fetchMyListings.fulfilled, (state, action) => {
        state.mine.items = action.payload
        state.mine.status = 'succeeded'
      })
      .addCase(fetchMyListings.rejected, (state, action) => setRejected(state.mine, action))
      .addCase(fetchListing.pending, (state, action) => {
        state.details.statusById[action.meta.arg] = 'loading'
        delete state.details.errorById[action.meta.arg]
      })
      .addCase(fetchListing.fulfilled, (state, action) => {
        const id = action.meta.arg
        if (action.payload) state.details.byId[id] = action.payload
        else delete state.details.byId[id]
        state.details.statusById[id] = 'succeeded'
      })
      .addCase(fetchListing.rejected, (state, action) => {
        const id = action.meta.arg
        state.details.statusById[id] = 'failed'
        state.details.errorById[id] = action.error.message
      })
      .addCase(deleteListing.fulfilled, (state, action) => {
        state.mine.items = state.mine.items.filter(item => item.id !== action.payload)
        state.published.items = state.published.items.filter(item => item.id !== action.payload)
        delete state.details.byId[action.payload]
      })
  },
})

export default listingsSlice.reducer
