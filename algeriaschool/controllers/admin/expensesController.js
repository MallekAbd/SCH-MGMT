const Expense = require('../../models/Expense');
const moment = require('moment');

exports.index = async (req, res) => {
  const { category, from, to } = req.query;
  const filter = { school: req.user.school };
  if (category) filter.category = category;
  if (from && to) filter.date = { $gte: new Date(from), $lte: new Date(to) };
  const [expenses, summary] = await Promise.all([
    Expense.find(filter).sort({ date: -1 }).limit(50).lean(),
    Expense.aggregate([
      { $match: { school: req.user.school, date: { $gte: moment().startOf('month').toDate() } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
    ]),
  ]);
  const summaryMap = {};
  summary.forEach(s => { summaryMap[s._id] = s.total; });
  res.render('admin/expenses/index', { title: 'Dépenses', expenses, summaryMap, category: category || '', from: from || '', to: to || '', layout: 'admin' });
};

exports.create = (req, res) => {
  res.render('admin/expenses/form', { title: 'Nouvelle dépense', expense: null, layout: 'admin' });
};

exports.store = async (req, res) => {
  const { category, description, vendor, amount, date, notes } = req.body;
  await Expense.create({
    school: req.user.school, category, description, vendor,
    amount: parseFloat(amount), date: new Date(date), notes,
    attachment: req.file ? req.file.filename : null,
    recordedBy: req.user._id,
  });
  req.flash('success', 'Dépense enregistrée');
  res.redirect('/admin/expenses');
};

exports.edit = async (req, res) => {
  const expense = await Expense.findOne({ _id: req.params.id, school: req.user.school }).lean();
  if (!expense) return res.status(404).render('errors/404', { title: 'Not Found' });
  res.render('admin/expenses/form', { title: 'Modifier dépense', expense, layout: 'admin' });
};

exports.update = async (req, res) => {
  const { category, description, vendor, amount, date, notes } = req.body;
  await Expense.findOneAndUpdate(
    { _id: req.params.id, school: req.user.school },
    { category, description, vendor, amount: parseFloat(amount), date: new Date(date), notes }
  );
  req.flash('success', 'Dépense modifiée');
  res.redirect('/admin/expenses');
};

exports.destroy = async (req, res) => {
  await Expense.findOneAndDelete({ _id: req.params.id, school: req.user.school });
  req.flash('success', 'Dépense supprimée');
  res.redirect('/admin/expenses');
};
