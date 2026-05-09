const Parent = require('../../models/Parent');
const Invoice = require('../../models/Invoice');
const Payment = require('../../models/Payment');

exports.index = async (req, res) => {
  try {
    const parent = await Parent.findOne({ user: req.user._id, school: req.user.school })
      .populate('students', 'firstName lastName studentId')
      .lean();
    if (!parent) return res.status(404).render('errors/404', { title: 'Not Found' });

    const studentIds = parent.students.map(s => s._id);
    const { studentId, status } = req.query;
    const filter = {
      school: req.user.school,
      student: studentId ? studentId : { $in: studentIds },
    };
    if (status) filter.status = status;

    const invoices = await Invoice.find(filter)
      .populate('student', 'firstName lastName studentId')
      .populate('items.feeStructure', 'name type')
      .sort({ createdAt: -1 })
      .lean();

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

    res.render('parent/invoices/index', {
      title: 'Factures',
      invoices: invoicesWithPayments,
      children: parent.students,
      summary,
      studentId: studentId || '',
      status: status || '',
      layout: 'parent',
    });
  } catch (err) {
    next(err);
  }
};
