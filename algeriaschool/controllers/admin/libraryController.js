const LibraryItem = require('../../models/LibraryItem');
const Course = require('../../models/Course');
const Class = require('../../models/Class');

exports.index = async (req, res) => {
  const { search, type } = req.query;
  const filter = { school: req.user.school, isActive: true };
  if (type) filter.type = type;
  if (search) filter.$or = [{ title: new RegExp(search, 'i') }, { tags: new RegExp(search, 'i') }];
  const items = await LibraryItem.find(filter).populate('course', 'name').populate('class', 'name').sort({ createdAt: -1 }).lean();
  res.render('admin/library/index', { title: 'Bibliothèque', items, search: search || '', type: type || '', layout: 'admin' });
};

exports.create = async (req, res) => {
  const [courses, classes] = await Promise.all([
    Course.find({ school: req.user.school, isActive: true }).lean(),
    Class.find({ school: req.user.school, isActive: true }).lean(),
  ]);
  res.render('admin/library/form', { title: 'Nouveau document', item: null, courses, classes, layout: 'admin' });
};

exports.store = async (req, res) => {
  const { title, type, videoUrl, isbn, author, copies, course, classId, tags, description } = req.body;
  await LibraryItem.create({
    school: req.user.school,
    title, type,
    filePath: req.file ? req.file.filename : null,
    videoUrl, isbn, author,
    copies: copies || 1, availableCopies: copies || 1,
    course: course || null, class: classId || null,
    uploadedBy: req.user._id,
    tags: tags ? tags.split(',').map(t => t.trim()) : [],
    description,
  });
  req.flash('success', 'Document ajouté avec succès');
  res.redirect('/admin/library');
};

exports.show = async (req, res) => {
  const item = await LibraryItem.findOne({ _id: req.params.id, school: req.user.school }).lean();
  if (!item) return res.status(404).render('errors/404', { title: 'Not Found' });
  res.render('admin/library/show', { title: item.title, item, layout: 'admin' });
};

exports.destroy = async (req, res) => {
  await LibraryItem.findOneAndUpdate({ _id: req.params.id, school: req.user.school }, { isActive: false });
  req.flash('success', 'Document supprimé');
  res.redirect('/admin/library');
};
