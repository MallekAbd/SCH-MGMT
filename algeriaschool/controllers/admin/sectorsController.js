const Sector = require('../../models/Sector');

exports.index = async (req, res) => {
  const sectors = await Sector.find({ school: req.user.school }).sort({ name: 1 }).lean();
  res.render('admin/sectors/index', { title: 'Secteurs', sectors, layout: 'admin' });
};

exports.create = (req, res) => {
  res.render('admin/sectors/form', { title: 'Nouveau secteur', sector: null, layout: 'admin' });
};

exports.store = async (req, res) => {
  const { name, nameAr, code, description } = req.body;
  await Sector.create({ school: req.user.school, name, nameAr, code, description });
  req.flash('success', 'Secteur créé avec succès');
  res.redirect('/admin/sectors');
};

exports.edit = async (req, res) => {
  const sector = await Sector.findOne({ _id: req.params.id, school: req.user.school }).lean();
  if (!sector) return res.status(404).render('errors/404', { title: 'Not Found' });
  res.render('admin/sectors/form', { title: 'Modifier secteur', sector, layout: 'admin' });
};

exports.update = async (req, res) => {
  const { name, nameAr, code, description, isActive } = req.body;
  await Sector.findOneAndUpdate(
    { _id: req.params.id, school: req.user.school },
    { name, nameAr, code, description, isActive: isActive === 'on' }
  );
  req.flash('success', 'Secteur modifié avec succès');
  res.redirect('/admin/sectors');
};

exports.destroy = async (req, res) => {
  await Sector.findOneAndDelete({ _id: req.params.id, school: req.user.school });
  req.flash('success', 'Secteur supprimé');
  res.redirect('/admin/sectors');
};
