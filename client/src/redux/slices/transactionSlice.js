import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import * as transactionService from '../../services/transactionService'

// helper: extract a readable message from an axios/network error
const getError = (error) => error.response?.data?.message || error.message || 'Something went wrong'

// thunk: fetchTransactions → calls transactionService.getTransactions(params),
//                            returns response.data, rejects with getError
export const fetchTransactions = createAsyncThunk('transactions/fetch', async (params, { rejectWithValue }) => {
  try {
    const response = await transactionService.getTransactions(params)
    return response.data
  } catch (error) {
    return rejectWithValue(getError(error))
  }
})

// thunk: saveTransaction → if id present → updateTransaction(id, data), else createTransaction(data);
//                          returns response.data.data, rejects with getError
export const saveTransaction = createAsyncThunk('transactions/save', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = id
      ? await transactionService.updateTransaction(id, data)
      : await transactionService.createTransaction(data)
    return response.data.data
  } catch (error) {
    return rejectWithValue(getError(error))
  }
})

// thunk: removeTransactionById → calls transactionService.deleteTransaction(id),
//                                returns the id, rejects with getError
export const removeTransactionById = createAsyncThunk('transactions/delete', async (id, { rejectWithValue }) => {
  try {
    await transactionService.deleteTransaction(id)
    return id
  } catch (error) {
    return rejectWithValue(getError(error))
  }
})

const initialState = {
  transactions: [],
  pagination: { page: 1, limit: 10, total: 0, pages: 1 },
  loading: false,
  error: '',
  filters: {},
  selectedTransaction: null
}

const transactionSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    // setTransactions(state, action) → set state.transactions = action.payload
    setTransactions: (state, action) => {
      state.transactions = action.payload
    },

    // setLoading(state, action) → set state.loading = action.payload
    setLoading: (state, action) => {
      state.loading = action.payload
    },

    // setFilters(state, action) → set state.filters = action.payload
    setFilters: (state, action) => {
      state.filters = action.payload
    },

    // setSelectedTransaction(state, action) → set state.selectedTransaction = action.payload
    setSelectedTransaction: (state, action) => {
      state.selectedTransaction = action.payload
    },

    // addTransaction(state, action) → prepend action.payload to state.transactions
    addTransaction: (state, action) => {
      state.transactions.unshift(action.payload)
    },

    // updateTransaction(state, action) → find by _id and replace with action.payload
    updateTransaction: (state, action) => {
      const index = state.transactions.findIndex((t) => t._id === action.payload._id)
      if (index !== -1) {
        state.transactions[index] = action.payload
      }
    },

    // removeTransaction(state, action) → filter out transaction whose _id matches action.payload
    removeTransaction: (state, action) => {
      state.transactions = state.transactions.filter((t) => t._id !== action.payload)
    }
  },
  extraReducers: (builder) => {
    // fetchTransactions
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true
        state.error = ''
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false
        const payload = action.payload || {}
        state.transactions = payload.data || payload.transactions || []
        state.pagination = payload.pagination || { page: 1, limit: 10, total: 0, pages: 1 }
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // saveTransaction
      .addCase(saveTransaction.pending, (state) => {
        state.loading = true
        state.error = ''
      })
      .addCase(saveTransaction.fulfilled, (state, action) => {
        state.loading = false
        const existingIndex = state.transactions.findIndex((t) => t._id === action.payload._id)
        if (existingIndex !== -1) {
          state.transactions[existingIndex] = action.payload
        } else {
          state.transactions.unshift(action.payload)
        }
      })
      .addCase(saveTransaction.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // removeTransactionById
      .addCase(removeTransactionById.fulfilled, (state, action) => {
        state.transactions = state.transactions.filter((t) => t._id !== action.payload)
      })
  }
})

export const {
  setTransactions,
  setLoading,
  setFilters,
  setSelectedTransaction,
  addTransaction,
  updateTransaction,
  removeTransaction
} = transactionSlice.actions
export default transactionSlice.reducer