import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import * as aiService from '../../services/aiService'

// helper: extract a readable message from an axios/network error
const getError = (error) => error.response?.data?.message || error.message || 'Something went wrong'

// thunk: fetchInsights → calls aiService.generateInsights, returns response.data.data, rejects with getError
export const fetchInsights = createAsyncThunk('insights/fetch', async (_, { rejectWithValue }) => {
  try {
    const response = await aiService.generateInsights()
    return response.data.data
  } catch (error) {
    return rejectWithValue(getError(error))
  }
})

// thunk: fetchPrediction → calls aiService.predictSpending, returns response.data.data, rejects with getError
export const fetchPrediction = createAsyncThunk('insights/predict', async (_, { rejectWithValue }) => {
  try {
    const response = await aiService.predictSpending()
    return response.data.data
  } catch (error) {
    return rejectWithValue(getError(error))
  }
})

const initialState = {
  insights: [],
  predictions: {},
  provider: '',
  loading: false,
  error: ''
}

const insightSlice = createSlice({
  name: 'insights',
  initialState,
  reducers: {
    // setInsights(state, action) → set state.insights = action.payload
    setInsights: (state, action) => {
      state.insights = action.payload
    },

    // setPredictions(state, action) → set state.predictions = action.payload
    setPredictions: (state, action) => {
      state.predictions = action.payload
    },

    // setLoading(state, action) → set state.loading = action.payload
    setLoading: (state, action) => {
      state.loading = action.payload
    }
  },
  extraReducers: (builder) => {
    // fetchInsights
    builder
      .addCase(fetchInsights.pending, (state) => {
        state.loading = true
        state.error = ''
      })
      .addCase(fetchInsights.fulfilled, (state, action) => {
        state.loading = false
        state.insights = action.payload.insights || []
        state.provider = action.payload.provider || 'heuristic'
      })
      .addCase(fetchInsights.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // fetchPrediction
      .addCase(fetchPrediction.fulfilled, (state, action) => {
        state.predictions = action.payload
      })
  }
})

export const { setInsights, setPredictions, setLoading } = insightSlice.actions
export default insightSlice.reducer