import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import * as budgetService from '../../services/budgetService'

// helper: extract a readable message from an axios/network error
const getError = (error) => error.response?.data?.message || error.message || 'Something went wrong'

// thunk: fetchBudget → calls budgetService.getBudget, returns response.data.data, rejects with getError
export const fetchBudget = createAsyncThunk('budget/fetch', async (_, { rejectWithValue }) => {
  try {
    const response = await budgetService.getBudget()
    return response.data.data
  } catch (error) {
    return rejectWithValue(getError(error))
  }
})

// thunk: saveBudget → calls budgetService.setBudget, returns response.data.data, rejects with getError
export const saveBudget = createAsyncThunk('budget/save', async (data, { rejectWithValue }) => {
  try {
    const response = await budgetService.setBudget(data)
    return response.data.data
  } catch (error) {
    return rejectWithValue(getError(error))
  }
})

const initialState = {
  monthlyBudget: 0,
  categories: [],
  remaining: 0,
  loading: false,
  error: ''
}

const budgetSlice = createSlice({
  name: 'budget',
  initialState,
  reducers: {
    // setBudget(state, action) → set monthlyBudget, categories (from categoryBudgets), remaining
    setBudget: (state, action) => {
      const { monthlyBudget, categoryBudgets, remaining } = action.payload
      state.monthlyBudget = monthlyBudget
      state.categories = categoryBudgets || []
      state.remaining = remaining
    },

    // setLoading(state, action) → set state.loading = action.payload
    setLoading: (state, action) => {
      state.loading = action.payload
    },

    // updateRemaining(state, action) → set state.remaining = action.payload
    updateRemaining: (state, action) => {
      state.remaining = action.payload
    }
  },
  extraReducers: (builder) => {
    // fetchBudget
    builder
      .addCase(fetchBudget.pending, (state) => {
        state.loading = true
        state.error = ''
      })
      .addCase(fetchBudget.fulfilled, (state, action) => {
        state.loading = false
        state.monthlyBudget = action.payload.monthlyBudget
        state.categories = action.payload.categoryBudgets || []
        state.remaining = action.payload.remaining
      })
      .addCase(fetchBudget.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // saveBudget
      .addCase(saveBudget.pending, (state) => {
        state.loading = true
        state.error = ''
      })
      .addCase(saveBudget.fulfilled, (state, action) => {
        state.loading = false
        state.monthlyBudget = action.payload.monthlyBudget
        state.categories = action.payload.categoryBudgets || []
        state.remaining = action.payload.remaining
      })
      .addCase(saveBudget.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  }
})

export const { setBudget, setLoading, updateRemaining } = budgetSlice.actions
export default budgetSlice.reducer