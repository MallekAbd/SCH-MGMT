const Student = require('../../models/Student');
const Invoice = require('../../models/Invoice');
const Payment = require('../../models/Payment');

exports.index = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id, school: req.user.school }).lean();
    if (!student) return res.status(404).render('errors/404', { title: 'Not Found' });

    const { status } = req.query;
    const filter = { school: req.user.school, student: student._id };
    if (status) filter.status = status;

    const invoices = await Invoice.find(filter)
      .populate('items.feeStructure', 'name type')
      .sort({ createdAt: -1 })
      .lean();

    // Attach payment records
    const invoiceIds = invoices.map(i => i._id);
    const payments = await Payment.find({ invoice: { $in: invoiceIds } })
      .sort({ paymentDate: -1 })
      .lean();
    const paymentsMap = {};
    payments.forEach(p => {
      const key = p.invoice.toString();
      if (!paymentsMap[key]) paymentsMap[key] = [];
      paymentsMap[key].push(p);
    });

    const invoicesWithPayments = invoices.map(inv => ({
      ...inv,
      payments: paymentsMap[inv._id.toString()] || [],
    }));

    const summary = {
      total: invoices.reduce((s, i) => s + (i.total || 0), 0),
      paid: invoices.reduce((s, i) => s + (i.amountPaid || 0), 0),
      balance: invoices.reduce((s, i) => s + (i.balance || 0), 0),
    };

    res.render('student/invoices/index', {
      title: 'Mes factures',
      invoices: invoicesWithPayments,
      summary,
      status: status || '',
      layout: 'student',
    });
  } catch (err) {
    next(err);
  }
};
