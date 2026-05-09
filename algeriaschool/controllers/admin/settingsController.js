const School = require('../../models/School');

exports.index = async (req, res) => {
  const school = await School.findById(req.user.school).lean();
  res.render('admin/settings/index', { title: 'Paramètres', school, layout: 'admin' });
};

exports.update = async (req, res) => {
  const { name, nameAr, phone, email, website, city, wilaya, gradeScale, academicYear, defaultLang, twoFactorEnabled } = req.body;
  await School.findByIdAndUpdate(req.user.school, {
    name, nameAr, phone, email, website,
    'address.city': city, 'address.wilaya': wilaya,
    'settings.gradeScale': gradeScale || 20,
    'settings.academicYear': academicYear,
    'settings.defaultLang': defaultLang || 'fr',
    'settings.twoFactorEnabled': twoFactorEnabled === 'on',
  });
  req.flash('success', 'Paramètres mis à jour');
  res.redirect('/admin/settings');
};
