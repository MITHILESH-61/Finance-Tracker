import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import * as authService from '../../services/authService'

// helper: extract a readable message from an axios/network error
const getError = (error) => error.response?.data?.message || error.message || 'Something went wrong'

// thunk: loginUser → calls authService.login, returns response.data, rejects with getError
export const loginUser = createAsyncThunk('auth/login', async (data, { rejectWithValue }) => {
  try {
    const response = await authService.login(data)
    return response.data
  } catch (error) {
    return rejectWithValue(getError(error))
  }
})

// thunk: signupUser → calls authService.signup, returns response.data, rejects with getError
export const signupUser = createAsyncThunk('auth/signup', async (data, { rejectWithValue }) => {
  try {
    const response = await authService.signup(data)
    return response.data
  } catch (error) {
    return rejectWithValue(getError(error))
  }
})

// thunk: refreshUser → calls authService.getMe, returns response.data.user, rejects with getError
export const refreshUser = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try {
    const response = await authService.getMe()
    return response.data.user
  } catch (error) {
    return rejectWithValue(getError(error))
  }
})

// thunk: updateProfileThunk → calls authService.updateProfile, returns response.data.user, rejects with getError
export const updateProfileThunk = createAsyncThunk('auth/updateProfile', async (data, { rejectWithValue }) => {
  try {
    const response = await authService.updateProfile(data)
    return response.data.user
  } catch (error) {
    return rejectWithValue(getError(error))
  }
})

// read raw user JSON from localStorage (may be null)
const storedUser = localStorage.getItem('user')

// parseStoredUser() → safely JSON.parse storedUser; on failure remove it and return null
const parseStoredUser = () => {
  if (!storedUser) return null
  try {
    return JSON.parse(storedUser)
  } catch {
    localStorage.removeItem('user')
    return null
  }
}

const initialState = {
  user: parseStoredUser(),
  token: localStorage.getItem('token') || null,
  loading: false,
  error: '',
  isAuthenticated: !!localStorage.getItem('token')
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // setLoading(state, action) → set state.loading = action.payload
    setLoading: (state, action) => {
      state.loading = action.payload
    },

    // setUser(state, action) → set user/token/isAuthenticated; persist token & user to localStorage
    setUser: (state, action) => {
      const { user, token } = action.payload
      state.user = user
      state.token = token
      state.isAuthenticated = !!token
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
    },

    // updateUser(state, action) → replace user, mark authenticated, persist user to localStorage
    updateUser: (state, action) => {
      state.user = action.payload
      state.isAuthenticated = true
      localStorage.setItem('user', JSON.stringify(action.payload))
    },

    // logout(state) → clear user/token/isAuthenticated/error and remove both from localStorage
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      state.error = ''
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  },
  extraReducers: (builder) => {
    // loginUser
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true
        state.error = ''
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
        localStorage.setItem('token', action.payload.token)
        localStorage.setItem('user', JSON.stringify(action.payload.user))
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // signupUser
      .addCase(signupUser.pending, (state) => {
        state.loading = true
        state.error = ''
      })
      .addCase(signupUser.fulfilled, (state) => {
        state.loading = false
        // Do not auto-authenticate upon signup; user is redirected to sign-in page
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // refreshUser
      .addCase(refreshUser.fulfilled, (state, action) => {
        state.user = action.payload
        state.isAuthenticated = true
        localStorage.setItem('user', JSON.stringify(action.payload))
      })
      .addCase(refreshUser.rejected, (state) => {
        state.user = null
        state.token = null
        state.isAuthenticated = false
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      })

    // updateProfileThunk
      .addCase(updateProfileThunk.fulfilled, (state, action) => {
        state.user = action.payload
        localStorage.setItem('user', JSON.stringify(action.payload))
      })
  }
})

export const { setLoading, setUser, updateUser, logout } = authSlice.actions
export default authSlice.reducer