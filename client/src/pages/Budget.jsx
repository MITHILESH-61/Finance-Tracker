import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchBudget, saveBudget } from '../redux/slices/budgetSlice'
import { getDashboardSummary } from '../services/dashboardService'
import { categories, formatCurrency } from '../utils/format'

function Budget() {
  const dispatch = useDispatch()
  const budget = useSelector((state) => state.budget)
  const getCachedBudget = () => {
    try {
      const cached = localStorage.getItem('fintrack_saved_budget')
      return cached ? JSON.parse(cached) : null
    } catch {
      return null
    }
  }

  const cached = getCachedBudget()
  const [monthlyBudget, setMonthlyBudget] = useState(cached?.monthlyBudget ?? 0)
  const [categoryBudgets, setCategoryBudgets] = useState(cached?.categoryBudgets ?? [])
  const [summary, setSummary] = useState({ totalExpense: 0, categoryBreakdown: {} })
  const [message, setMessage] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // "Add to budget" input field that returns to zero after adding
  const [addBudgetAmount, setAddBudgetAmount] = useState('')

  // New category inputs that return to empty/zero after adding
  const [newCat, setNewCat] = useState({ category: '', limit: '' })

  const updateSummaryFromResponse = (data) => {
    const categoryTotals = Array.isArray(data.categoryBreakdown)
      ? data.categoryBreakdown.reduce((acc, item) => {
          acc[item.category || item.name] = item.amount ?? item.value ?? 0
          return acc
        }, {})
      : data.categoryBreakdown || {}
    setSummary({
      totalExpense: data.totalExpense || 0,
      categoryBreakdown: categoryTotals
    })
  }

  // Load dashboard summary for user action refreshes
  const loadSummary = async () => {
    try {
      const response = await getDashboardSummary()
      updateSummaryFromResponse(response.data.data || { totalExpense: 0, categoryBreakdown: [] })
    } catch (error) {
      console.error('Failed to load summary:', error)
    }
  }

  // Unified auto-persist function: saves immediately to Redux, MongoDB, and caches in localStorage
  const persistBudget = async (newMonthlyBudget, newCategoryBudgets) => {
    const budgetToSave = {
      monthlyBudget: Number(newMonthlyBudget) || 0,
      categoryBudgets: (newCategoryBudgets || []).filter((item) => item?.category)
    }

    setMonthlyBudget(budgetToSave.monthlyBudget)
    setCategoryBudgets(budgetToSave.categoryBudgets)
    try {
      localStorage.setItem('fintrack_saved_budget', JSON.stringify(budgetToSave))
    } catch {
      // ignore in environments with restricted localStorage
    }

    try {
      await dispatch(saveBudget(budgetToSave)).unwrap()
      await loadSummary()
      return true
    } catch (err) {
      console.error('Failed to persist budget:', err)
      setErrorMsg(typeof err === 'string' ? err : 'Failed to save budget configuration')
      return false
    }
  }

  useEffect(() => {
    let ignore = false
    dispatch(fetchBudget())
      .unwrap()
      .then((data) => {
        if (!ignore && data) {
          const fetchedMonthly = data.monthlyBudget || 0
          const fetchedCategories = data.categoryBudgets || []
          setMonthlyBudget(fetchedMonthly)
          setCategoryBudgets(fetchedCategories)
          try {
            localStorage.setItem(
              'fintrack_saved_budget',
              JSON.stringify({ monthlyBudget: fetchedMonthly, categoryBudgets: fetchedCategories })
            )
          } catch {
            // ignore
          }
        }
      })
      .catch(() => {})

    getDashboardSummary()
      .then((response) => {
        if (!ignore && response.data?.data) {
          updateSummaryFromResponse(response.data.data)
        }
      })
      .catch((error) => {
        console.error('Failed to load summary:', error)
      })

    return () => {
      ignore = true
    }
  }, [dispatch])

  // Handler: Add to monthly budget, save to database immediately, and return input field to empty
  const handleAddToBudget = async (e) => {
    e?.preventDefault()
    const amount = Number(addBudgetAmount)
    if (isNaN(amount) || amount <= 0) {
      setErrorMsg('Please enter a valid amount to add.')
      return
    }
    setErrorMsg('')
    const newTotal = (Number(monthlyBudget) || 0) + amount
    setAddBudgetAmount('')
    const success = await persistBudget(newTotal, categoryBudgets)
    if (success) {
      setMessage(`Added ${formatCurrency(amount)}! Total monthly budget is now ${formatCurrency(newTotal)}.`)
      setTimeout(() => setMessage(''), 3500)
    }
  }

  // Handler: Quick add preset amounts and auto-save
  const handleQuickAdd = async (amount) => {
    const newTotal = (Number(monthlyBudget) || 0) + amount
    const success = await persistBudget(newTotal, categoryBudgets)
    if (success) {
      setMessage(`Added ${formatCurrency(amount)}! Total budget is now ${formatCurrency(newTotal)}.`)
      setTimeout(() => setMessage(''), 3500)
    }
  }

  // Handler: Reset monthly budget to zero and auto-save
  const handleResetToZero = async () => {
    setAddBudgetAmount('')
    const success = await persistBudget(0, categoryBudgets)
    if (success) {
      setMessage('Monthly budget reset to ₹0.')
      setTimeout(() => setMessage(''), 3500)
    }
  }

  // Handler: Add a category, auto-save to database, and return input fields to empty/zero
  const handleAddCategorySubmit = async (e) => {
    e.preventDefault()
    if (!newCat.category) {
      setErrorMsg('Please select a category')
      return
    }
    const limitNum = Number(newCat.limit)
    if (isNaN(limitNum) || limitNum < 0) {
      setErrorMsg('Please specify a non-negative limit')
      return
    }
    setErrorMsg('')

    let updated
    const existingIndex = categoryBudgets.findIndex((c) => c.category === newCat.category)
    if (existingIndex !== -1) {
      updated = [...categoryBudgets]
      updated[existingIndex] = { ...updated[existingIndex], limit: limitNum }
    } else {
      updated = [...categoryBudgets, { category: newCat.category, limit: limitNum }]
    }

    const targetCategory = newCat.category
    setNewCat({ category: '', limit: '' })
    const success = await persistBudget(monthlyBudget, updated)
    if (success) {
      setMessage(`Saved ${targetCategory} budget cap of ${formatCurrency(limitNum)}!`)
      setTimeout(() => setMessage(''), 3500)
    }
  }

  // Update existing category in list
  const updateCategory = (i, field, value) => {
    const updated = [...categoryBudgets]
    updated[i] = { ...updated[i], [field]: value }
    setCategoryBudgets(updated)
  }

  // Remove category from list and auto-save
  const removeCategory = async (i) => {
    const catName = categoryBudgets[i]?.category
    const updated = categoryBudgets.filter((_, idx) => idx !== i)
    const success = await persistBudget(monthlyBudget, updated)
    if (success && catName) {
      setMessage(`Removed ${catName} budget cap.`)
      setTimeout(() => setMessage(''), 3000)
    }
  }

  // Manual save trigger for the Save button
  const save = async (event) => {
    event?.preventDefault()
    setErrorMsg('')
    const success = await persistBudget(monthlyBudget, categoryBudgets)
    if (success) {
      setMessage('Budget configuration saved successfully!')
      setTimeout(() => setMessage(''), 4000)
    }
  }

  // Derived values
  const totalExpense = summary.totalExpense || 0
  const remaining = (Number(monthlyBudget) || 0) - totalExpense
  const usedPercent =
    Number(monthlyBudget) > 0 ? Math.min((totalExpense / Number(monthlyBudget)) * 100, 100) : 0
  const isOverBudget = Number(monthlyBudget) > 0 && remaining < 0

  return (
    <div className="mx-auto max-w-[1440px] space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
              Budget Controls
            </span>
            <span className="text-xs font-medium text-slate-400">Monthly Billing Cycle</span>
          </div>
          <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Budget Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Set global and category spending caps to prevent overspending and grow savings.
          </p>
        </div>

        <button
          onClick={save}
          disabled={budget.loading}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition-all hover:bg-indigo-700 hover:shadow-md disabled:opacity-50"
        >
          {budget.loading ? 'Saving Changes...' : 'Save Configuration'}
        </button>
      </div>

      {/* Notifications */}
      {message && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-sm font-semibold text-emerald-800 shadow-sm">
          ✓ {message}
        </div>
      )}

      {(errorMsg || budget.error) && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-sm font-medium text-rose-800 shadow-sm">
          ⚠️ {errorMsg || budget.error}
        </div>
      )}

      <div className="grid gap-7 xl:grid-cols-3">
        {/* Left Column: Form & Management */}
        <div className="space-y-6 xl:col-span-2">
          {/* Card 1: Monthly Overall Budget Configuration */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Total Monthly Budget</h3>
                <p className="text-xs text-slate-500">Global spending allowance across all categories</p>
              </div>
              <button
                type="button"
                onClick={handleResetToZero}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50"
              >
                Reset to ₹0
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {/* Monthly Budget Limit Display (Locked from direct editing) */}
              <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50/80 to-white p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700">
                      🔒 Fixed Limit
                    </span>
                    <p className="mt-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Monthly Budget Limit
                    </p>
                    <p className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
                      {formatCurrency(monthlyBudget)}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-2xl text-indigo-600 shadow-xs border border-indigo-100">
                    🎯
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-400 flex items-center gap-1.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Monthly budget cannot be typed directly — use "Add to Budget" below to add funds.
                </p>
              </div>

              {/* Add to Budget Form (Returns to zero after adding) */}
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-5">
                <label htmlFor="addBudgetAmount" className="block text-xs font-bold uppercase tracking-wider text-indigo-950 mb-1">
                  Add to Budget
                </label>
                <p className="text-xs text-slate-500 mb-3.5">
                  Enter an amount to increment your monthly budget limit. The input will automatically reset to zero after adding.
                </p>
                <form onSubmit={handleAddToBudget} className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₹</span>
                    <input
                      id="addBudgetAmount"
                      type="number"
                      min="0"
                      value={addBudgetAmount}
                      onChange={(e) => setAddBudgetAmount(e.target.value)}
                      placeholder="Enter amount to add (e.g. 5000)"
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-8 pr-3 text-sm font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <button
                    type="submit"
                    className="shrink-0 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-indigo-700 active:scale-95"
                  >
                    + Add to Budget
                  </button>
                </form>

                {/* Quick Add Presets */}
                <div className="mt-3.5 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-400 font-medium">Quick Top-Up:</span>
                  {[1000, 5000, 10000, 20000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleQuickAdd(preset)}
                      className="rounded-lg border border-indigo-200/80 bg-white px-2.5 py-1 font-semibold text-indigo-700 hover:bg-indigo-50 transition-colors"
                    >
                      +{formatCurrency(preset)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Card 2: Category Budget Caps */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900">Category Budgets</h3>
              <p className="text-xs text-slate-500">Allocate individual limits for specific spending areas</p>
            </div>

            {/* Add Category Row (Inputs return to zero/empty after adding) */}
            <form onSubmit={handleAddCategorySubmit} className="mt-5 rounded-xl border border-slate-200/70 bg-slate-50/50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                Add / Update Category Cap
              </p>
              <div className="grid gap-3 sm:grid-cols-5">
                <div className="sm:col-span-2">
                  <select
                    value={newCat.category}
                    onChange={(e) => setNewCat({ ...newCat, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={newCat.limit}
                      onChange={(e) => setNewCat({ ...newCat, limit: e.target.value })}
                      placeholder="Limit (e.g. 8000)"
                      className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-7 pr-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-slate-800"
                >
                  + Add Cap
                </button>
              </div>
            </form>

            {/* List of Configured Categories */}
            <div className="mt-5 space-y-3">
              {categoryBudgets.length > 0 ? (
                categoryBudgets.map((item, i) => {
                  const spent = summary.categoryBreakdown?.[item.category] || 0
                  const percent = item.limit > 0 ? (spent / item.limit) * 100 : 0
                  const isOver = percent >= 100

                  return (
                    <div
                      key={i}
                      className="rounded-xl border border-slate-200/70 bg-white p-4 transition-all hover:border-slate-300"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-700">
                            🏷️
                          </span>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{item.category}</p>
                            <p className="text-xs text-slate-500">
                              Spent: <span className="font-semibold text-slate-700">{formatCurrency(spent)}</span> /{' '}
                              Cap: <span className="font-semibold text-slate-700">{formatCurrency(item.limit)}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="relative w-32">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                            <input
                              type="number"
                              value={item.limit}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) =>
                                updateCategory(i, 'limit', e.target.value === '' ? '' : Number(e.target.value))
                              }
                              onBlur={() => persistBudget(monthlyBudget, categoryBudgets)}
                              className="w-full rounded-lg border border-slate-200 py-1.5 pl-6 pr-2 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:outline-none"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => removeCategory(i)}
                            className="rounded-lg p-1.5 text-xs text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                            title="Remove category limit"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1">
                          <span>{percent.toFixed(1)}% utilized</span>
                          <span className={isOver ? 'text-rose-600 font-bold' : 'text-emerald-600'}>
                            {isOver ? `Over by ${formatCurrency(spent - item.limit)}` : `${formatCurrency(item.limit - spent)} remaining`}
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isOver ? 'bg-rose-500' : percent >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(percent, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-slate-400">
                  <p className="text-sm font-semibold">No category budgets established</p>
                  <p className="mt-0.5 text-xs">Use the selector above to set spending caps for categories like Food, Rent, etc.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Progress & Insights Widget */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900">Monthly Progress</h3>
            <p className="text-xs text-slate-500">Live pacing for the active month</p>

            <div className="mt-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-semibold text-slate-500">Total Spent</span>
                <span className="text-lg font-bold text-slate-900">{formatCurrency(totalExpense)}</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-semibold text-slate-500">Monthly Allowance</span>
                <span className="text-lg font-bold text-slate-900">{formatCurrency(monthlyBudget)}</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-semibold text-slate-500">Remaining Budget</span>
                <span className={`text-lg font-bold ${isOverBudget ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {formatCurrency(remaining)}
                </span>
              </div>

              {/* Progress Visual */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
                  <span>Usage Pacing</span>
                  <span>{usedPercent.toFixed(1)}%</span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isOverBudget ? 'bg-rose-500' : usedPercent >= 80 ? 'bg-amber-500' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${usedPercent}%` }}
                  />
                </div>
              </div>

              {isOverBudget && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
                  <p className="font-bold">⚠️ Budget Exceeded</p>
                  <p className="mt-1">
                    You have exceeded your monthly limit by {formatCurrency(Math.abs(remaining))}. Consider trimming flexible categories.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default Budget