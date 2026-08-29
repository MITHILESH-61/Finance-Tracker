import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { logout } from '../../redux/slices/authSlice'

function Sidebar({ isOpen = false, onClose = () => {} }) {
  const location = useLocation()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: '📊' },
    { label: 'Transactions', path: '/transactions', icon: '💳' },
    { label: 'Budget', path: '/budget', icon: '🎯' },
    { label: 'AI Insights', path: '/insights', icon: '✨' },
    { label: 'Reports', path: '/reports', icon: '📑' },
    { label: 'Profile', path: '/profile', icon: '👤' }
  ]

  const isActive = (path) => location.pathname === path

  const handleLogout = () => {
    onClose()
    dispatch(logout())
    navigate('/login')
  }

  // Sidebar content (Shared between desktop and mobile drawer)
  const renderSidebarContent = (isMobile = false) => (
    <div className="flex h-full flex-col">
      {/* Brand Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-400 text-lg shadow-md">
            📈
          </span>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">
              Fin<span className="text-emerald-400">Track</span>
            </h2>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              AI Finance OS
            </p>
          </div>
        </div>

        {/* Mobile Close Button */}
        {isMobile && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
            aria-label="Close menu"
          >
            ✕
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 space-y-1.5 p-4 overflow-y-auto">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
          Main Navigation
        </p>
        {navItems.map((item) => {
          const active = isActive(item.path)
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                active
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
              }`}
            >
              <span className={`text-base transition-transform group-hover:scale-110 ${active ? 'scale-105' : 'opacity-70'}`}>
                {item.icon}
              </span>
              <span>{item.label}</span>
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white animate-pulse" />}
            </Link>
          )
        })}
      </nav>

      {/* User footer / Logout */}
      <div className="border-t border-slate-800/80 p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
        >
          <span>🚪</span>
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* 1. Desktop Persistent Sidebar (Hidden on screens smaller than lg) */}
      <aside className="hidden lg:flex lg:sticky lg:top-0 lg:h-screen lg:w-64 shrink-0 flex-col bg-[#0f172a] text-white border-r border-slate-800 shadow-xl">
        {renderSidebarContent(false)}
      </aside>

      {/* 2. Mobile & Tablet Drawer (Active when isOpen is true) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop Blur Overlay */}
          <div
            className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Slide-over Panel */}
          <div className="relative flex w-72 max-w-[85vw] flex-1 flex-col bg-[#0f172a] text-white shadow-2xl transition-transform animate-in slide-in-from-left duration-250">
            {renderSidebarContent(true)}
          </div>
        </div>
      )}
    </>
  )
}

export default Sidebar