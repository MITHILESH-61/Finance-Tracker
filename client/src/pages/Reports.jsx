import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { downloadMonthlyReport, getMonthlyReport } from '../services/reportService'
import { formatCurrency, formatDate } from '../utils/format'

function Reports() {
  // state: period ({ month, year } — defaults to current month/year),
  //        report, loading (initial true), error (local)
  const now = new Date()
  const [period, setPeriod] = useState({
    month: now.getMonth() + 1,
    year: now.getFullYear()
  })
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // params → memoized copy of period (used as effect dependency)
  const params = useMemo(() => ({ month: period.month, year: period.year }), [period.month, period.year])

  // useEffect (on params change) → set loading, call getMonthlyReport,
  //                                set report on success, set error on failure,
  //                                set loading false in finally
  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await getMonthlyReport(params.month, params.year)
        setReport(response.data.data || {})
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load report')
      } finally {
        setLoading(false)
      }
    }
    fetchReport()
  }, [params])

  // exportPdf() → call downloadMonthlyReport, create blob URL,
  //               trigger download as `finance-report-YYYY-MM.pdf`, revoke URL
  const exportPdf = async () => {
    try {
      const response = await downloadMonthlyReport(period.month, period.year)
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `finance-report-${period.year}-${String(period.month).padStart(2, '0')}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to download report')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
          <p className="text-gray-600">View and export your monthly financial reports</p>
        </div>
        {/* Export PDF button → triggers exportPdf */}
        <button
          onClick={exportPdf}
          disabled={loading || !report}
          className="rounded bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:bg-gray-400"
        >
          📥 Export PDF
        </button>
      </div>

      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          {/* Month select (12 month options) */}
          <div>
            <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">
              Month
            </label>
            <select
              id="month"
              value={period.month}
              onChange={(e) => setPeriod({ ...period, month: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((month, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {month}
                </option>
              ))}
            </select>
          </div>

          {/* Year number input */}
          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
              Year
            </label>
            <input
              id="year"
              type="number"
              value={period.year}
              onChange={(e) => setPeriod({ ...period, year: Number(e.target.value) })}
              min={2020}
              max={now.getFullYear()}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </section>

      {/* if loading → "Loading report..." text */}
      {loading && (
        <div className="flex items-center justify-center py-12 text-gray-500">
          Loading report...
        </div>
      )}

      {/* if error → error banner */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          Error: {error}
        </div>
      )}

      {/* if report && !loading → render the following: */}
      {report && !loading && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            {/* 4 summary cards: Income, Expense, Savings, Remaining */}
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 shadow-sm">
              <p className="text-sm text-gray-600">Total Income</p>
              <p className="mt-2 text-2xl font-bold text-green-600">
                {formatCurrency(report.totalIncome || 0)}
              </p>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm">
              <p className="text-sm text-gray-600">Total Expense</p>
              <p className="mt-2 text-2xl font-bold text-red-600">
                {formatCurrency(report.totalExpense || 0)}
              </p>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm">
              <p className="text-sm text-gray-600">Savings</p>
              <p className="mt-2 text-2xl font-bold text-blue-600">
                {formatCurrency((report.totalIncome || 0) - (report.totalExpense || 0))}
              </p>
            </div>
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 shadow-sm">
              <p className="text-sm text-gray-600">Remaining Budget</p>
              <p className="mt-2 text-2xl font-bold text-purple-600">
                {formatCurrency(report.remainingBudget || 0)}
              </p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <section className="rounded-lg border bg-white p-5 shadow-sm xl:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900">Category Analytics</h3>
              <div className="mt-4 h-72">
                {/* BarChart (recharts) → report.categoryBreakdown by category/amount */}
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.categoryBreakdown || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Bar dataKey="amount" fill="#2563eb" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="rounded-lg border bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">Transactions</h3>
              <div className="mt-4 max-h-72 space-y-3 overflow-auto">
                {/* if report.transactions has items → list each (title, signed amount, category • date)
                    else → "No transactions for this period." */}
                {report.transactions && report.transactions.length > 0 ? (
                  report.transactions.map((transaction) => (
                    <div key={transaction._id} className="border-b pb-3">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900">{transaction.title}</p>
                        <p
                          className={`font-semibold ${
                            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {transaction.type === 'income' ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500">
                        {transaction.category} • {formatDate(transaction.date || transaction.transactionDate)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500">No transactions for this period.</p>
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  )
}

export default Reports