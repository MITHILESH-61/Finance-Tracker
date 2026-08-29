import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import { getMonthRange, summarizeTransactions } from '../services/financeAnalyzer.js';

export const getDashboardSummary = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.userId }).sort({ transactionDate: -1 });
    const budget = await Budget.findOne({ userId: req.userId });
    const { start, end } = getMonthRange();
    const monthTransactions = transactions.filter((item) => {
      const date = new Date(item.transactionDate);
      return date >= start && date < end;
    });

    const monthSummary = summarizeTransactions(monthTransactions, budget);
    const overallSummary = summarizeTransactions(transactions, budget);

    res.status(200).json({
      success: true,
      data: {
        totalIncome: monthSummary.totalIncome,
        totalExpense: monthSummary.totalExpense,
        totalSavings: monthSummary.savings,
        savings: monthSummary.savings,
        remainingBudget: monthSummary.budgetRemaining,
        budgetRemaining: monthSummary.budgetRemaining,
        monthlyBudget: monthSummary.monthlyBudget,
        hasBudget: !!(budget && budget.monthlyBudget > 0),
        monthlyTrend: overallSummary.monthlyTrend,
        categoryBreakdown: monthSummary.categoryBreakdown,
        recentTransactions: transactions.slice(0, 5)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};