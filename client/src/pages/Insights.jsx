import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchInsights, fetchPrediction } from '../redux/slices/insightSlice'
import { formatCurrency } from '../utils/format'

function Insights() {
  // redux: dispatch, { insights, predictions, provider, loading, error } from state.insights
  const dispatch = useDispatch()
  const { insights, predictions, provider, loading, error } = useSelector((state) => state.insights)

  // useEffect (on mount) → dispatch(fetchInsights()) and dispatch(fetchPrediction())
  useEffect(() => {
    dispatch(fetchInsights())
    dispatch(fetchPrediction())
  }, [dispatch])

  // refresh handler → re-dispatch fetchInsights and fetchPrediction (used by Refresh button)
  const handleRefresh = () => {
    dispatch(fetchInsights())
    dispatch(fetchPrediction())
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Insights</h1>
          <p className="text-gray-600">Get personalized spending recommendations and predictions powered by AI</p>
        </div>
        {/* Refresh Insights button → re-dispatches fetchInsights and fetchPrediction */}
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Refreshing...' : '🔄 Refresh Insights'}
        </button>
      </div>

      {/* if error → error banner */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          Error: {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-lg border bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recommendations</h3>
            {/* provider badge (fallback: "heuristic") */}
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
              {provider || 'heuristic'}
            </span>
          </div>
          {/* if loading → "Generating insights..." text
              else → list of insight cards, or "Add transactions to generate insights." if empty */}
          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-500">
              Generating insights...
            </div>
          ) : insights && insights.length > 0 ? (
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <div key={index} className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <p className="font-medium text-blue-900">{insight.title || insight}</p>
                  {typeof insight === 'object' && insight.description && (
                    <p className="mt-2 text-sm text-blue-800">{insight.description}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12 text-gray-500">
              Add transactions to generate insights.
            </div>
          )}
        </section>

        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">Spending Prediction</h3>
          <div className="mt-5 space-y-4">
            <div>
              <p className="text-sm text-gray-600">Predicted Expense</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(predictions?.predictedExpense || 0)}
              </p>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">Confidence</p>
                <p className="text-sm font-medium text-gray-900">{predictions?.confidence || 0}%</p>
              </div>
              {/* progress bar (width = predictions.confidence%) */}
              <div className="mt-2 h-2 rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{ width: `${predictions?.confidence || 0}%` }}
                />
              </div>
            </div>
            {/* if predictions.budgetRisk → amber alert */}
            {predictions?.budgetRisk && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm font-medium text-amber-800">
                  ⚠️ Predicted spending is above your monthly budget.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default Insights