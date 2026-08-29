import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { updateProfileThunk } from '../redux/slices/authSlice'
import { changePassword, getAccountStats } from '../services/authService'
import { formatCurrency } from '../utils/format'

function Profile() {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)

  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || ''
  })
  const [prevUser, setPrevUser] = useState(user)
  if (user !== prevUser) {
    setPrevUser(user)
    if (user) {
      setProfile({ name: user.name || '', email: user.email || '' })
    }
  }

  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' })
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalIncome: 0,
    totalExpense: 0,
    savings: 0
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  // Load account statistics
  const loadAccountStats = async () => {
    try {
      const response = await getAccountStats()
      if (response.data?.data) {
        setStats(response.data.data)
      }
    } catch (err) {
      console.error('Failed to load account stats:', err)
    }
  }

  // useEffect on mount → fetch account stats
  useEffect(() => {
    let ignore = false
    getAccountStats()
      .then((response) => {
        if (!ignore && response.data?.data) {
          setStats(response.data.data)
        }
      })
      .catch((err) => {
        console.error('Failed to load account stats:', err)
      })

    return () => {
      ignore = true
    }
  }, [])

  // saveProfile handler
  const saveProfile = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setSavingProfile(true)
    try {
      await dispatch(updateProfileThunk(profile)).unwrap()
      await loadAccountStats()
      setMessage('Profile credentials updated successfully!')
      setTimeout(() => setMessage(''), 3500)
    } catch (err) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  // savePassword handler
  const savePassword = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (passwords.newPassword.length < 6) {
      setError('New password must be at least 6 characters long')
      return
    }

    setSavingPassword(true)
    try {
      await changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      })
      setPasswords({ currentPassword: '', newPassword: '' })
      setMessage('Password successfully changed!')
      setTimeout(() => setMessage(''), 3500)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password')
    } finally {
      setSavingPassword(false)
    }
  }

  const getInitials = (name = 'User') => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-8">
      {/* Header Profile Identity Card */}
      <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-emerald-400 text-2xl font-extrabold text-white shadow-lg">
              {getInitials(user?.name || profile.name)}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                  {user?.name || profile.name || 'Personal Account'}
                </h1>
                <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-300 border border-emerald-500/30">
                  ✓ Verified
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-300">{user?.email || profile.email}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-lg bg-white/10 px-2.5 py-1 font-medium text-slate-300">
                  FinTrack Member
                </span>
                <span className="rounded-lg bg-white/10 px-2.5 py-1 font-medium text-slate-300">
                  Currency: INR (₹)
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm sm:text-right">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">Account Health</p>
            <p className="mt-1 text-xl font-extrabold text-emerald-400">Good Standing</p>
            <p className="mt-0.5 text-xs text-slate-400">{stats.totalTransactions} recorded transactions</p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-sm font-semibold text-emerald-800 shadow-sm">
          ✓ {message}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-sm font-medium text-rose-800 shadow-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Main Form & Stats Layout */}
      <div className="grid gap-7 xl:grid-cols-3">
        {/* Left 2 Columns: Credentials & Password Forms */}
        <div className="space-y-6 xl:col-span-2">
          {/* Card 1: Personal Details */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900">Personal Information</h3>
              <p className="text-xs text-slate-500">Update your account name and contact email address</p>
            </div>

            <form onSubmit={saveProfile} className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Your legal name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="your.email@domain.com"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition-all hover:bg-indigo-700 disabled:opacity-50"
                >
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </section>

          {/* Card 2: Password & Authentication */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900">Security & Password</h3>
              <p className="text-xs text-slate-500">Ensure your account is protected with a secure passkey</p>
            </div>

            <form onSubmit={savePassword} className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="currentPassword" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Current Password
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    value={passwords.currentPassword}
                    onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                    required
                    minLength={6}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-2">
                <p className="text-xs text-slate-400 font-medium">Must be at least 6 characters long.</p>
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 shadow-xs transition-all hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
                >
                  {savingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </section>
        </div>

        {/* Right Column: Account Stats & Security Info */}
        <div className="space-y-6">
          {/* Lifetime Finance Summary Card */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900">Financial Ledger Stats</h3>
            <p className="text-xs text-slate-500">Lifetime aggregations across all transactions</p>

            <div className="mt-5 space-y-3">
              {/* Transactions Count */}
              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-200/80 text-sm font-bold text-slate-700">
                    🧾
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Transactions</p>
                    <p className="text-lg font-extrabold text-slate-900">{stats.totalTransactions || 0}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-400">Total</span>
              </div>

              {/* Lifetime Income */}
              <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/40 p-3.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-sm font-bold text-emerald-800">
                    ↑
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Lifetime Income</p>
                    <p className="text-lg font-extrabold text-emerald-700">{formatCurrency(stats.totalIncome)}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-600">+Inflow</span>
              </div>

              {/* Lifetime Expense */}
              <div className="flex items-center justify-between rounded-xl border border-rose-100 bg-rose-50/40 p-3.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-sm font-bold text-rose-800">
                    ↓
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Lifetime Expenses</p>
                    <p className="text-lg font-extrabold text-rose-600">{formatCurrency(stats.totalExpense)}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-rose-600">-Outflow</span>
              </div>

              {/* Net Accumulated Savings */}
              <div className="flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50/40 p-3.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-sm font-bold text-indigo-800">
                    💰
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Net Accumulated</p>
                    <p className="text-lg font-extrabold text-indigo-700">{formatCurrency(stats.savings)}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-indigo-600">Savings</span>
              </div>
            </div>
          </section>

          {/* Privacy & Security Card */}
          <section className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Security Guarantee</h4>
            <div className="mt-3 space-y-2 text-xs text-slate-600">
              <p className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                All passwords are encrypted with bcrypt hashing before storage.
              </p>
              <p className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                JSON Web Tokens (JWT) guarantee session privacy and user isolation.
              </p>
              <p className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                Your financial data is only accessible by your authenticated account.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default Profile