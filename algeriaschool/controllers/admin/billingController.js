const FeeStructure = require('../../models/FeeStructure');
const Invoice = require('../../models/Invoice');
const Payment = require('../../models/Payment');
const Student = require('../../models/Student');
const Class = require('../../models/Class');
const { generateInvoicePdf } = require('../../services/pdfService');
const moment = require('moment');

let invoiceCounter = 1000;

exports.index = async (req, res) => {
  const { status, studentId } = req.query;
  const filter = { school: req.user.school };
  if (status) filter.status = status;
  if (studentId) filter.student = studentId;
  const [invoices, stats] = await Promise.all([
    Invoice.find(filter).populate('student', 'firstName lastName studentId').sort({ createdAt: -1 }).limit(50).lean(),
    Invoice.aggregate([
      { $match: { school: req.user.school } },
      { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$total' } } },
    ]),
  ]);
  const statsMap = {};
  stats.forEach(s => { statsMap[s._id] = s; });
  res.render('admin/billing/index', { title: 'Facturation', invoices, statsMap, status: status || '', layout: 'admin' });
};

exports.feeStructures = async (req, res) => {
  const [feeStructures, classes] = await Promise.all([
    FeeStructure.find({ school: req.user.school, isActive: true }).populate('applicableClasses', 'name').lean(),
    Class.find({ school: req.user.school, isActive: true }).lean(),
  ]);
  res.render('admin/billing/fee-structures', { title: 'Structures tarifaires', feeStructures, classes, layout: 'admin' });
};

exports.storeFeeStructure = async (req, res) => {
  const { name, type, amount, billingPeriod, applicableClasses, academicYear, lateFeeAmount, lateFeeAfterDays } = req.body;
  await FeeStructure.create({
    school: req.user.school, name, type, amount, billingPeriod,
    applicableClasses: applicableClasses ? (Array.isArray(applicableClasses) ? applicableClasses : [applicableClasses]) : [],
    academicYear, lateFeeAmount: lateFeeAmount || 0, lateFeeAfterDays: lateFeeAfterDays || 30,
  });
  req.flash('success', 'Structure tarifaire créée');
  res.redirect('/admin/billing/fee-structures');
};

exports.generateForm = async (req, res) => {
  const [feeStructures, students, classes] = await Promise.all([
    FeeStructure.find({ school: req.user.school, isActive: true }).lean(),
    Student.find({ school: req.user.school, status: 'active' }).populate('currentClass', 'name').lean(),
    Class.find({ school: req.user.school, isActive: true }).lean(),
  ]);
  res.render('admin/billing/generate', { title: 'Générer des factures', feeStructures, students, classes, layout: 'admin' });
};

exports.generateInvoices = async (req, res) => {
  const { feeStructureId, classId, period, academicYear, dueDate } = req.body;
  const feeStructure = await FeeStructure.findOne({ _id: feeStructureId, school: req.user.school }).lean();
  if (!feeStructure) return res.status(404).render('errors/404', { title: 'Not Found' });
  const studentFilter = { school: req.user.school, status: 'active' };
  if (classId) studentFilter.currentClass = classId;
  const students = await Student.find(studentFilter).lean();
  let created = 0;
  for (const student of students) {
    invoiceCounter++;
    const total = feeStructure.amount;
    await Invoice.create({
      school: req.user.school,
      invoiceNumber: `INV-${Date.now()}-${invoiceCounter}`,
      student: student._id,
      items: [{ description: feeStructure.name, feeStructure: feeStructure._id, amount: feeStructure.amount, quantity: 1 }],
      subtotal: total, total, balance: total,
      status: 'pending',
      dueDate: dueDate ? new Date(dueDate) : moment().add(30, 'days').toDate(),
      period, academicYear,
    });
    created++;
  }
  req.flash('success', `${created} facture(s) générée(s)`);
  res.redirect('/admin/billing');
};

exports.showInvoice = async (req, res) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, school: req.user.school })
    .populate('student', 'firstName lastName studentId currentClass')
    .populate('items.feeStructure', 'name').lean();
  if (!invoice) return res.status(404).render('errors/404', { title: 'Not Found' });
  const payments = await Payment.find({ invoice: invoice._id }).populate('receivedBy', 'firstName lastName').lean();
  res.render('admin/billing/invoice', { title: `Facture ${invoice.invoiceNumber}`, invoice, payments, layout: 'admin' });
};

exports.invoicePdf = async (req, res) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, school: req.user.school })
    .populate('student', 'firstName lastName studentId').populate('items.feeStructure', 'name').lean();
  if (!invoice) return res.status(404).render('errors/404', { title: 'Not Found' });
  const pdfBuffer = await generateInvoicePdf(invoice, req.school);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);
  res.send(pdfBuffer);
};

exports.recordPayment = async (req, res) => {
  const { invoiceId, amount, method, reference, notes } = req.body;
  const invoice = await Invoice.findOne({ _id: invoiceId, school: req.user.school });
  if (!invoice) return res.status(404).render('errors/404', { title: 'Not Found' });
  await Payment.create({
    school: req.user.school, invoice: invoiceId, student: invoice.student,
    amount: parseFloat(amount), method, reference, notes,
    receivedBy: req.user._id, paymentDate: new Date(),
  });
  invoice.amountPaid = (invoice.amountPaid || 0) + parseFloat(amount);
  invoice.balance = invoice.total - invoice.amountPaid;
  invoice.status = invoice.balance <= 0 ? 'paid' : invoice.amountPaid > 0 ? 'partial' : 'pending';
  await invoice.save();
  req.flash('success', 'Paiement enregistré');
  res.redirect(`/admin/billing/invoices/${invoiceId}`);
};
