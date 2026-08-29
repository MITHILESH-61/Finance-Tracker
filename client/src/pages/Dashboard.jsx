import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import SummaryCard from '../components/dashboard/SummaryCard'
import { getDashboardSummary } from '../services/dashboardService'
import { formatCurrency, formatDate } from '../utils/format'

const PALETTE = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#8b5cf6', // Purple
  '#f97316', // Orange
  '#64748b'  // Slate
]

const formatMonthLabel = (monthStr) => {
  if (!monthStr) return ''
  const parts = monthStr.split('-')
  if (parts.length === 2) {
    const year = parts[0]
    const monthIndex = parseInt(parts[1], 10) - 1
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${months[monthIndex] || monthStr} '${year.slice(-2)}`
  }
  return monthStr
}

function CustomBarTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-100 bg-white/95 p-3.5 shadow-xl backdrop-blur-md">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{formatMonthLabel(label)}</p>
        <div className="mt-2 space-y-1.5">
          {payload.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color || item.fill }} />
                {item.name}:
              </span>
              <span className="font-bold text-slate-900">{formatCurrency(item.value)}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}

function CustomPieTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0]
    return (
      <div className="rounded-xl border border-slate-100 bg-white/95 p-3 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: data.payload.fill }} />
          <p className="text-xs font-bold text-slate-800">{data.name}</p>
        </div>
        <p className="mt-1.5 text-base font-extrabold text-slate-900">{formatCurrency(data.value)}</p>
        {data.payload.percent !== undefined && (
          <p className="mt-0.5 text-xs text-slate-500">{(data.payload.percent * 100).toFixed(1)}% of total expenses</p>
        )}
      </div>
    )
  }
  return null
}

function Dashboard() {
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    remainingBudget: 0,
    totalSavings: 0,
    monthlyBudget: 0,
    hasBudget: false,
    monthlyTrend: [],
    categoryBreakdown: [],
    recentTransactions: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false
    const fetchData = async () => {
      try {
        const response = await getDashboardSummary()
        const data = response.data?.data || {}
        if (!ignore) {
          setSummary({
            totalIncome: data.totalIncome || 0,
            totalExpense: data.totalExpense || 0,
            remainingBudget: data.remainingBudget ?? data.budgetRemaining ?? 0,
            totalSavings: data.totalSavings ?? data.savings ?? 0,
            monthlyBudget: data.monthlyBudget || 0,
            hasBudget: Boolean(data.hasBudget || data.monthlyBudget > 0),
            monthlyTrend: data.monthlyTrend || [],
            categoryBreakdown: data.categoryBreakdown || [],
            recentTransactions: data.recentTransactions || []
          })
        }
      } catch (err) {
        if (!ignore) {
          setError(err.response?.data?.message || 'Failed to load dashboard')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }
    fetchData()
    return () => {
      ignore = true
    }
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
          <p className="text-sm font-semibold text-slate-500">Loading your financial dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-6 text-rose-800 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="text-base font-bold">Failed to load dashboard</h3>
            <p className="mt-1 text-sm text-rose-600">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  // Prepared chart data
  const trend = summary.monthlyTrend.map((item) => ({
    ...item,
    formattedMonth: formatMonthLabel(item.month)
  }))

  const categories = Array.isArray(summary.categoryBreakdown)
    ? summary.categoryBreakdown.map((item, idx) => ({
        name: item.name || item.category,
        value: Number(item.value ?? item.amount ?? 0),
        fill: PALETTE[idx % PALETTE.length]
      }))
    : Object.entries(summary.categoryBreakdown || {}).map(([name, value], idx) => ({
        name,
        value: Number(value),
        fill: PALETTE[idx % PALETTE.length]
      }))

  const totalCategorizedExpense = categories.reduce((sum, item) => sum + item.value, 0)
  const categoriesWithShare = categories.map((c) => ({
    ...c,
    percent: totalCategorizedExpense > 0 ? c.value / totalCategorizedExpense : 0
  }))

  const incomeExpense = trend.map((item) => ({
    month: item.month || '',
    formattedMonth: formatMonthLabel(item.month),
    Income: item.income || 0,
    Expense: item.expense || 0
  }))

  return (
    <div className="mx-auto max-w-[1440px] space-y-8">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/70 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Overview
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Current Month</span>
          </div>
          <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Financial Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Real-time breakdown of cash flow, monthly spending patterns, and budget limits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/transactions"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition-all duration-150 hover:bg-indigo-700 hover:shadow-md"
          >
            <span>+</span> Record Transaction
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total Income"
          value={formatCurrency(summary.totalIncome)}
          tone="green"
          icon="↑"
          subtitle="Monthly cash inflow"
        />
        <SummaryCard
          label="Total Expenses"
          value={formatCurrency(summary.totalExpense)}
          tone="red"
          icon="↓"
          subtitle="Monthly expenditures"
        />
        <SummaryCard
          label="Remaining Budget"
          value={summary.hasBudget ? formatCurrency(summary.remainingBudget) : 'No Budget Set'}
          tone={summary.hasBudget ? (summary.remainingBudget >= 0 ? 'blue' : 'red') : 'slate'}
          icon="🎯"
          subtitle={
            summary.hasBudget
              ? `Budget: ${formatCurrency(summary.monthlyBudget)}`
              : 'Click to configure monthly limit'
          }
        />
        <SummaryCard
          label="Net Savings"
          value={formatCurrency(summary.totalSavings)}
          tone={summary.totalSavings >= 0 ? 'slate' : 'red'}
          icon="💰"
          subtitle={summary.totalSavings >= 0 ? 'Cash flow positive' : 'Overspending deficit'}
        />
      </div>

      {/* Main Charts Section */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Monthly Spending Trend Bar Graph */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Monthly Spending Trend</h3>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">Historical expenses across previous billing cycles</p>
            </div>
            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              Bar Graph Analysis
            </span>
          </div>

          <div className="mt-6 h-80">
            {trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="expenseBarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#818cf8" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="formattedMonth"
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `₹${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`}
                  />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar
                    dataKey="expense"
                    name="Expense"
                    fill="url(#expenseBarGradient)"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center rounded-xl bg-slate-50/70 p-6 text-center">
                <span className="text-3xl">📊</span>
                <p className="mt-2 text-sm font-semibold text-slate-700">No trend data available yet</p>
                <p className="text-xs text-slate-400">Add transactions across months to generate trends.</p>
              </div>
            )}
          </div>
        </section>

        {/* Category Distribution Donut Chart */}
        <section className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Category Distribution</h3>
              </div>
              <span className="text-xs font-semibold text-slate-400">Expenses</span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">Spending breakdown by category</p>
          </div>

          <div className="my-3 h-64">
            {categoriesWithShare.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoriesWithShare}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    cornerRadius={6}
                    dataKey="value"
                  >
                    {categoriesWithShare.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} stroke="#ffffff" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center rounded-xl bg-slate-50/70 p-6 text-center">
                <span className="text-3xl">🥧</span>
                <p className="mt-2 text-sm font-semibold text-slate-700">No category expenses yet</p>
                <p className="text-xs text-slate-400">Your category allocation will show here.</p>
              </div>
            )}
          </div>

          {/* Category Pills Breakdown */}
          {categoriesWithShare.length > 0 && (
            <div className="mt-2 max-h-36 space-y-2 overflow-y-auto pr-1">
              {categoriesWithShare.map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: cat.fill }} />
                    <span className="truncate font-medium text-slate-700">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <span>{formatCurrency(cat.value)}</span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                      {(cat.percent * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Lower Row: Income vs Expense & Recent Activity */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Income vs Expense Grouped Bar Chart */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-teal-500" />
                <h3 className="text-base font-bold text-slate-900">Income vs Expense Comparison</h3>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">Monthly side-by-side cash inflow and outflow</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Inflow
              </span>
              <span className="flex items-center gap-1.5 text-rose-700">
                <span className="h-2.5 w-2.5 rounded-sm bg-rose-500" /> Outflow
              </span>
            </div>
          </div>

          <div className="mt-6 h-80">
            {incomeExpense.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incomeExpense} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="formattedMonth"
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `₹${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`}
                  />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Legend wrapperStyle={{ display: 'none' }} />
                  <Bar
                    dataKey="Income"
                    name="Income"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={32}
                  />
                  <Bar
                    dataKey="Expense"
                    name="Expense"
                    fill="#f43f5e"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center rounded-xl bg-slate-50/70 p-6 text-center">
                <span className="text-3xl">⚖️</span>
                <p className="mt-2 text-sm font-semibold text-slate-700">No comparative data yet</p>
                <p className="text-xs text-slate-400">Record both income and expense entries to visualize.</p>
              </div>
            )}
          </div>
        </section>

        {/* Recent Transactions List */}
        <section className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-slate-400" />
                <h3 className="text-base font-bold text-slate-900">Recent Transactions</h3>
              </div>
              <Link to="/transactions" className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
                View all →
              </Link>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">Latest 5 account movements</p>
          </div>

          <div className="mt-5 flex-1 space-y-3">
            {summary.recentTransactions && summary.recentTransactions.length > 0 ? (
              summary.recentTransactions.map((tx) => {
                const isIncome = tx.type === 'income'
                return (
                  <div
                    key={tx._id}
                    className="group flex items-center justify-between rounded-xl border border-slate-100 p-3 transition-colors hover:bg-slate-50/80"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold shadow-xs ${
                          isIncome
                            ? 'bg-emerald-100/80 text-emerald-800'
                            : 'bg-rose-100/80 text-rose-800'
                        }`}
                      >
                        {isIncome ? '+' : '-'}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {tx.title}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {tx.category} • {formatDate(tx.date || tx.transactionDate)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className={`text-xs font-bold ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isIncome ? '+' : '-'}
                        {formatCurrency(tx.amount)}
                      </p>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400">
                        {tx.paymentMethod || 'card'}
                      </span>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="flex h-56 flex-col items-center justify-center rounded-xl bg-slate-50/70 p-6 text-center">
                <span className="text-3xl">📝</span>
                <p className="mt-2 text-sm font-semibold text-slate-700">No transactions recorded</p>
                <p className="text-xs text-slate-400">Transactions you log will show here instantly.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default Dashboard