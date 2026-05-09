const Announcement = require('../../models/Announcement');

exports.index = async (req, res) => {
  const announcements = await Announcement.find({ school: req.user.school })
    .populate('author', 'firstName lastName').sort({ createdAt: -1 }).lean();
  res.render('admin/announcements/index', { title: 'Annonces', announcements, layout: 'admin' });
};

exports.create = (req, res) => {
  res.render('admin/announcements/form', { title: 'Nouvelle annonce', announcement: null, layout: 'admin' });
};

exports.store = async (req, res) => {
  const { title, content, targetRoles, isPinned, expiresAt } = req.body;
  await Announcement.create({
    school: req.user.school,
    title, content,
    author: req.user._id,
    targetRoles: targetRoles ? (Array.isArray(targetRoles) ? targetRoles : [targetRoles]) : ['all'],
    isPinned: isPinned === 'on',
    expiresAt: expiresAt || null,
  });
  req.flash('success', 'Annonce publiée');
  res.redirect('/admin/announcements');
};

exports.edit = async (req, res) => {
  const announcement = await Announcement.findOne({ _id: req.params.id, school: req.user.school }).lean();
  if (!announcement) return res.status(404).render('errors/404', { title: 'Not Found' });
  res.render('admin/announcements/form', { title: 'Modifier annonce', announcement, layout: 'admin' });
};

exports.update = async (req, res) => {
  const { title, content, targetRoles, isPinned, expiresAt } = req.body;
  await Announcement.findOneAndUpdate(
    { _id: req.params.id, school: req.user.school },
    {
      title, content,
      targetRoles: targetRoles ? (Array.isArray(targetRoles) ? targetRoles : [targetRoles]) : ['all'],
      isPinned: isPinned === 'on',
      expiresAt: expiresAt || null,
    }
  );
  req.flash('success', 'Annonce modifiée');
  res.redirect('/admin/announcements');
};

exports.destroy = async (req, res) => {
  await Announcement.findOneAndDelete({ _id: req.params.id, school: req.user.school });
  req.flash('success', 'Annonce supprimée');
  res.redirect('/admin/announcements');
};
