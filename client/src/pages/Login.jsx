import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { loginUser } from '../redux/slices/authSlice'

function Login() {
  const location = useLocation()
  const [formData, setFormData] = useState({
    email: location.state?.email || '',
    password: ''
  })
  const [error, setError] = useState('')
  const [successMessage] = useState(location.state?.message || '')

  const { loading } = useSelector((state) => state.auth)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const result = await dispatch(loginUser(formData))
      if (result.payload && result.payload.token) {
        navigate('/dashboard')
      } else {
        setError(result.payload || 'Login failed')
      }
    } catch (err) {
      setError(err.message || 'An error occurred during sign in')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-emerald-400 text-2xl shadow-lg shadow-indigo-600/30">
            📈
          </div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white">
            Fin<span className="text-emerald-400">Track</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Executive AI-Powered Personal Finance Platform
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl">
          <h2 className="text-xl font-bold text-white">Welcome back</h2>
          <p className="mt-1 text-xs text-slate-400">Sign in to access your financial dashboard</p>

          {/* Success Banner from Signup Redirect */}
          {successMessage && (
            <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-sm font-semibold text-emerald-300">
              ✓ {successMessage}
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-sm font-medium text-rose-300">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="you@domain.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 transition-all hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Switch to signup */}
          <div className="mt-6 border-t border-slate-800/80 pt-4 text-center">
            <p className="text-xs text-slate-400">
              Don't have an account?{' '}
              <Link to="/signup" className="font-bold text-indigo-400 hover:text-indigo-300">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login