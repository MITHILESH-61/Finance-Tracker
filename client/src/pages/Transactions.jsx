import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchTransactions,
  removeTransactionById,
  saveTransaction
} from '../redux/slices/transactionSlice'
import { categories, formatCurrency, formatDate, paymentMethods } from '../utils/format'

const emptyForm = {
  type: 'expense',
  title: '',
  amount: '',
  category: 'Food',
  paymentMethod: 'upi',
  description: '',
  transactionDate: new Date().toISOString().slice(0, 10)
}

function Transactions() {
  // redux: dispatch, { transactions, pagination, loading, error } from state.transactions
  const dispatch = useDispatch()
  const { transactions, pagination, loading, error } = useSelector((state) => state.transactions)

  // state: filters ({ search, type, category, sort, page }),
  //        form (initialized to emptyForm), editingId, showForm, message (local)
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    category: '',
    sort: 'latest',
    page: 1
  })
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')

  // query → memoized { ...filters, limit: 10 } (used as effect dependency)
  const query = useMemo(
    () => ({
      search: filters.search,
      type: filters.type,
      category: filters.category,
      sort: filters.sort,
      page: filters.page,
      limit: 10
    }),
    [filters.search, filters.type, filters.category, filters.sort, filters.page]
  )

  // useEffect (on query change) → dispatch(fetchTransactions(query))
  useEffect(() => {
    dispatch(fetchTransactions(query))
  }, [query, dispatch])

  // openCreate() → reset editingId, reset form, open modal
  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
    setMessage('')
  }

  // openEdit(item) → set editingId, populate form from item, open modal
  const openEdit = (item) => {
    const rawDate = item.date || item.transactionDate
    setEditingId(item._id)
    setForm({
      type: item.type,
      title: item.title,
      amount: item.amount,
      category: item.category,
      paymentMethod: item.paymentMethod,
      description: item.description || '',
      transactionDate: rawDate
        ? new Date(rawDate).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10)
    })
    setShowForm(true)
    setMessage('')
  }

  // submitForm(event) → preventDefault, dispatch saveTransaction (create or update),
  //                      close modal, refetch, set success/error message
  const submitForm = async (event) => {
    event.preventDefault()
    try {
      await dispatch(
        saveTransaction({
          id: editingId,
          data: form
        })
      ).unwrap()
      setShowForm(false)
      setForm(emptyForm)
      setEditingId(null)
      setMessage(editingId ? 'Transaction updated successfully!' : 'Transaction created successfully!')
      dispatch(fetchTransactions(query))
      setTimeout(() => setMessage(''), 3000)
    } catch {
      setMessage('Failed to save transaction')
    }
  }

  // deleteItem(item) → confirm, dispatch removeTransactionById, refetch
  const deleteItem = async (item) => {
    if (window.confirm(`Are you sure you want to delete "${item.title}"?`)) {
      try {
        await dispatch(removeTransactionById(item._id)).unwrap()
        dispatch(fetchTransactions(query))
        setMessage('Transaction deleted successfully!')
        setTimeout(() => setMessage(''), 3000)
      } catch {
        setMessage('Failed to delete transaction')
      }
    }
  }

  const handleResetFilters = () => {
    setFilters({
      search: '',
      type: '',
      category: '',
      sort: 'latest',
      page: 1
    })
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
              Transactions
            </span>
            <span className="text-xs font-medium text-slate-400">Total: {pagination.total} records</span>
          </div>
          <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Transactions
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track, filter, and audit every incoming and outgoing cash movement.
          </p>
        </div>
        {/* Add Transaction button → triggers openCreate */}
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition-all duration-150 hover:bg-indigo-700 hover:shadow-md"
        >
          <span className="text-base font-bold">+</span> Add Transaction
        </button>
      </div>

      {/* Filter and Search Bar */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {/* Search input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by title, desc..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Type select */}
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-700 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All Flow Types</option>
            <option value="income">Income (+)</option>
            <option value="expense">Expense (-)</option>
          </select>

          {/* Category select */}
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-700 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Sort select */}
          <select
            value={filters.sort}
            onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-700 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="latest">Date: Latest First</option>
            <option value="oldest">Date: Oldest First</option>
            <option value="amount-high">Amount: High to Low</option>
            <option value="amount-low">Amount: Low to High</option>
          </select>

          {/* Reset filters button */}
          <button
            onClick={handleResetFilters}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            Reset Filters
          </button>
        </div>
      </section>

      {/* Error or Success notification */}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-sm font-medium text-rose-800 shadow-sm">
          ⚠️ {error}
        </div>
      )}

      {message && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-sm font-semibold text-emerald-800 shadow-sm">
          ✓ {message}
        </div>
      )}

      {/* Transactions Table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-slate-200/80 bg-slate-50/70 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Title & Details</th>
                <th className="px-6 py-4">Flow Type</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400 font-medium">
                    <div className="inline-flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                      Loading records...
                    </div>
                  </td>
                </tr>
              ) : transactions && transactions.length > 0 ? (
                transactions.map((item) => {
                  const isIncome = item.type === 'income'
                  return (
                    <tr key={item._id} className="transition-colors hover:bg-slate-50/60">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{item.title}</p>
                        {item.description && (
                          <p className="mt-0.5 text-xs text-slate-400 truncate max-w-xs">{item.description}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                            isIncome
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                              : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                          }`}
                        >
                          <span className="text-[10px]">{isIncome ? '↑' : '↓'}</span>
                          {isIncome ? 'Income' : 'Expense'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium">
                        {formatDate(item.date || item.transactionDate)}
                      </td>
                      <td className="px-6 py-4 text-slate-500 uppercase text-xs font-semibold">
                        {item.paymentMethod || 'card'}
                      </td>
                      <td className="px-6 py-4 font-bold">
                        <span className={isIncome ? 'text-emerald-600' : 'text-rose-600'}>
                          {isIncome ? '+' : '-'}
                          {formatCurrency(item.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(item)}
                            className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-indigo-600 transition-colors hover:bg-indigo-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteItem(item)}
                            className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                    <p className="font-semibold text-slate-700">No transactions match your filters</p>
                    <p className="mt-1 text-xs text-slate-400">Try adjusting your filters or click "+ Add Transaction".</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-200/80 px-6 py-4 text-sm">
          <p className="text-slate-500 font-medium text-xs">
            Showing Page <span className="font-bold text-slate-900">{pagination.page}</span> of{' '}
            <span className="font-bold text-slate-900">{pagination.pages || 1}</span> ({pagination.total} total transactions)
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })}
              disabled={filters.page === 1}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40"
            >
              ← Previous
            </button>
            <button
              onClick={() => setFilters({ ...filters, page: Math.min(pagination.pages, filters.page + 1) })}
              disabled={filters.page >= pagination.pages}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      </section>

      {/* Modal with Form (Transparent blurred frosted background) */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingId ? 'Edit Transaction' : 'Record New Transaction'}
                </h2>
                <p className="mt-0.5 text-xs text-slate-400">Fill in transaction details below</p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitForm} className="space-y-4">
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Flow Type
                </label>
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: 'expense' })}
                    className={`rounded-lg py-2 text-xs font-bold transition-all ${
                      form.type === 'expense'
                        ? 'bg-white text-rose-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ↓ Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: 'income' })}
                    className={`rounded-lg py-2 text-xs font-bold transition-all ${
                      form.type === 'income'
                        ? 'bg-white text-emerald-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ↑ Income
                  </button>
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label htmlFor="title" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Title
                </label>
                <input
                  id="title"
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="e.g. Supermarket Groceries"
                />
              </div>

              {/* Amount & Date Grid */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="amount" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Amount (₹)
                  </label>
                  <input
                    id="amount"
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    required
                    min="0"
                    step="0.01"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label htmlFor="transactionDate" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Date
                  </label>
                  <input
                    id="transactionDate"
                    type="date"
                    value={form.transactionDate}
                    onChange={(e) => setForm({ ...form, transactionDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {/* Category & Payment Method Grid */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="category" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Category
                  </label>
                  <select
                    id="category"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="paymentMethod" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Payment Method
                  </label>
                  <select
                    id="paymentMethod"
                    value={form.paymentMethod}
                    onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {paymentMethods.map((method) => (
                      <option key={method} value={method}>
                        {method.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Notes / Description (Optional)
                </label>
                <textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Additional transaction context..."
                />
              </div>

              {/* Submit Buttons */}
              <div className="mt-6 flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50 transition-all"
                >
                  {loading ? 'Saving...' : editingId ? 'Update Record' : 'Save Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Transactions