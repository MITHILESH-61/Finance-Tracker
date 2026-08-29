import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'

const PAGE_TITLES = {
  '/dashboard': { title: 'Dashboard', category: 'Executive View' },
  '/transactions': { title: 'Transactions Ledger', category: 'Accounting' },
  '/budget': { title: 'Budget Management', category: 'Financial Controls' },
  '/insights': { title: 'AI Financial Insights', category: 'Intelligence' },
  '/reports': { title: 'Financial Reports', category: 'Audit & Analytics' },
  '/profile': { title: 'Profile & Security', category: 'Account Settings' }
}

function Navbar() {
  const user = useSelector((state) => state.auth?.user)
  const location = useLocation()
  const pageInfo = PAGE_TITLES[location.pathname] || { title: 'Finance Tracker', category: 'Overview' }

  const initials = (user?.name || user?.email || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="flex items-center justify-between px-6 py-3.5 sm:px-8">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-600">
            {pageInfo.category}
          </p>
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
            {pageInfo.title}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-3 rounded-full border border-slate-200/80 bg-slate-50/80 py-1 pl-3 pr-1.5 shadow-xs">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-800 leading-tight">{user.name || 'User'}</p>
                <p className="text-[10px] text-slate-400 leading-tight">{user.email}</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-800 text-xs font-bold text-white shadow-xs">
                {initials}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar