import Budget from '../models/Budget.js';
import Transaction from '../models/Transaction.js';
import { getMonthRange } from '../services/financeAnalyzer.js';

const serializeBudget = async (userId, budget) => {
  const monthlyBudget = budget?.monthlyBudget || 0;
  const { start, end } = getMonthRange();
  const expenses = await Transaction.find({
    userId,
    type: 'expense',
    transactionDate: { $gte: start, $lt: end }
  });
  const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);

  return {
    monthlyBudget,
    categoryBudgets: budget?.categoryBudgets || [],
    remaining: monthlyBudget - totalExpense
  };
};

export const setBudget = async (req, res) => {
  try {
    const { monthlyBudget, categoryBudgets } = req.body;

    if (monthlyBudget === undefined || monthlyBudget === null || monthlyBudget === '' || Number(monthlyBudget) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid monthly budget'
      });
    }

    const validCategories = (categoryBudgets || []).filter(
      (item) => item?.category && Number(item.limit) >= 0
    );

    const budget = await Budget.findOneAndUpdate(
      { userId: req.userId },
      {
        monthlyBudget: Number(monthlyBudget),
        categoryBudgets: validCategories,
        updatedAt: new Date()
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Budget saved successfully',
      data: await serializeBudget(req.userId, budget)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getBudget = async (req, res) => {
  try {
    const budget = await Budget.findOne({ userId: req.userId });

    res.status(200).json({
      success: true,
      data: await serializeBudget(req.userId, budget)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const updateBudget = async (req, res) => {
  try {
    const { monthlyBudget, categoryBudgets } = req.body;

    if (monthlyBudget === undefined || monthlyBudget === null || monthlyBudget === '' || Number(monthlyBudget) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid monthly budget'
      });
    }

    const budget = await Budget.findOneAndUpdate(
      { userId: req.userId },
      {
        monthlyBudget: Number(monthlyBudget),
        categoryBudgets,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Budget updated successfully',
      data: await serializeBudget(req.userId, budget)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};