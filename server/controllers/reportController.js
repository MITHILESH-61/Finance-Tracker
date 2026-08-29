import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import PDFDocument from 'pdfkit';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const getMonthBounds = (month, year) => ({
  startDate: new Date(Number(year), Number(month) - 1, 1),
  endDate: new Date(Number(year), Number(month), 1)
});

const buildMonthlySummary = async (userId, month, year) => {
  const { startDate, endDate } = getMonthBounds(month, year);
  const transactions = await Transaction.find({
    userId,
    transactionDate: { $gte: startDate, $lt: endDate }
  }).sort({ transactionDate: -1 });

  let totalIncome = 0;
  let totalExpense = 0;
  const categoryTotals = {};

  transactions.forEach((txn) => {
    if (txn.type === 'income') {
      totalIncome += txn.amount;
    } else {
      totalExpense += txn.amount;
      categoryTotals[txn.category] = (categoryTotals[txn.category] || 0) + txn.amount;
    }
  });

  const budget = await Budget.findOne({ userId });
  const remainingBudget = (budget?.monthlyBudget || 0) - totalExpense;

  return {
    transactions,
    totalIncome,
    totalExpense,
    remainingBudget,
    monthlyBudget: budget?.monthlyBudget || 0,
    categoryBreakdown: Object.entries(categoryTotals).map(([category, amount]) => ({
      category,
      amount
    }))
  };
};

export const getMonthlyReport = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required'
      });
    }

    const summary = await buildMonthlySummary(req.userId, month, year);

    res.status(200).json({
      success: true,
      data: {
        month,
        year,
        totalIncome: summary.totalIncome,
        totalExpense: summary.totalExpense,
        savings: summary.totalIncome - summary.totalExpense,
        remainingBudget: summary.remainingBudget,
        budgetRemaining: summary.remainingBudget,
        categoryBreakdown: summary.categoryBreakdown,
        transactions: summary.transactions.map((txn) => ({
          _id: txn._id,
          title: txn.title,
          amount: txn.amount,
          category: txn.category,
          date: txn.transactionDate,
          transactionDate: txn.transactionDate,
          type: txn.type,
          paymentMethod: txn.paymentMethod
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const downloadMonthlyReport = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required'
      });
    }

    const summary = await buildMonthlySummary(req.userId, month, year);
    const monthName = MONTH_NAMES[Number(month) - 1] || month;
    const savings = summary.totalIncome - summary.totalExpense;
    const fmt = (v) => `Rs. ${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="finance-report-${year}-${String(month).padStart(2, '0')}.pdf"`
    );
    doc.pipe(res);

    // ── Header ──────────────────────────────────────────────────────────────
    doc.fontSize(22).font('Helvetica-Bold').text('FinTrack – Monthly Financial Report', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(13).font('Helvetica').fillColor('#555555')
       .text(`${monthName} ${year}`, { align: 'center' });
    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#cccccc').stroke();
    doc.moveDown(1);

    // ── Summary ──────────────────────────────────────────────────────────────
    doc.fillColor('#000000').fontSize(14).font('Helvetica-Bold').text('Summary');
    doc.moveDown(0.5);

    const summaryRows = [
      ['Total Income', fmt(summary.totalIncome), '#16a34a'],
      ['Total Expense', fmt(summary.totalExpense), '#dc2626'],
      ['Net Savings', fmt(savings), savings >= 0 ? '#2563eb' : '#dc2626'],
      ...(summary.monthlyBudget > 0
        ? [['Monthly Budget', fmt(summary.monthlyBudget), '#000000'],
           ['Remaining Budget', fmt(summary.remainingBudget), summary.remainingBudget >= 0 ? '#16a34a' : '#dc2626']]
        : [])
    ];

    summaryRows.forEach(([label, value, color]) => {
      const y = doc.y;
      doc.fontSize(11).font('Helvetica').fillColor('#333333').text(label, 50, y);
      doc.fontSize(11).font('Helvetica-Bold').fillColor(color).text(value, 300, y, { align: 'left' });
      doc.moveDown(0.6);
    });

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#cccccc').stroke();
    doc.moveDown(1);

    // ── Category Breakdown ───────────────────────────────────────────────────
    if (summary.categoryBreakdown.length > 0) {
      doc.fillColor('#000000').fontSize(14).font('Helvetica-Bold').text('Category Breakdown');
      doc.moveDown(0.5);

      // Header row
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#ffffff');
      doc.rect(50, doc.y, 495, 20).fill('#334155');
      const hdrY = doc.y - 20 + 5;
      doc.fillColor('#ffffff').text('Category', 55, hdrY).text('Amount', 350, hdrY);
      doc.moveDown(0.3);

      summary.categoryBreakdown
        .sort((a, b) => b.amount - a.amount)
        .forEach((item, idx) => {
          const rowY = doc.y;
          if (idx % 2 === 0) doc.rect(50, rowY, 495, 18).fill('#f8fafc');
          doc.fillColor('#111827').fontSize(10).font('Helvetica')
             .text(item.category, 55, rowY + 3)
             .text(fmt(item.amount), 350, rowY + 3);
          doc.moveDown(0.35);
        });

      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#cccccc').stroke();
      doc.moveDown(1);
    }

    // ── Transactions ─────────────────────────────────────────────────────────
    doc.fillColor('#000000').fontSize(14).font('Helvetica-Bold')
       .text(`Transactions (${summary.transactions.length})`);
    doc.moveDown(0.5);

    if (summary.transactions.length === 0) {
      doc.fontSize(11).font('Helvetica').fillColor('#888888').text('No transactions for this period.');
    } else {
      // Header
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff');
      doc.rect(50, doc.y, 495, 18).fill('#334155');
      const txHdrY = doc.y - 18 + 4;
      doc.fillColor('#ffffff')
         .text('Date', 55, txHdrY)
         .text('Title', 120, txHdrY)
         .text('Category', 290, txHdrY)
         .text('Amount', 420, txHdrY);
      doc.moveDown(0.25);

      summary.transactions.forEach((txn, idx) => {
        // Add a new page if near the bottom
        if (doc.y > 720) doc.addPage();
        const rowY = doc.y;
        if (idx % 2 === 0) doc.rect(50, rowY, 495, 17).fill('#f8fafc');
        const amtColor = txn.type === 'income' ? '#16a34a' : '#dc2626';
        const amtPrefix = txn.type === 'income' ? '+' : '-';
        doc.fontSize(9).font('Helvetica').fillColor('#111827')
           .text(new Date(txn.transactionDate).toLocaleDateString('en-IN'), 55, rowY + 3)
           .text(txn.title.length > 22 ? txn.title.slice(0, 22) + '…' : txn.title, 120, rowY + 3)
           .text(txn.category, 290, rowY + 3);
        doc.fillColor(amtColor)
           .text(`${amtPrefix}${fmt(txn.amount).replace('Rs. ', '₹')}`, 415, rowY + 3);
        doc.moveDown(0.3);
      });
    }

    // ── Footer ────────────────────────────────────────────────────────────────
    doc.moveDown(2);
    doc.fontSize(9).font('Helvetica').fillColor('#aaaaaa')
       .text(`Generated by FinTrack on ${new Date().toLocaleDateString('en-IN')}`, { align: 'center' });

    doc.end();
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
