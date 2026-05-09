const LibraryItem = require('../../models/LibraryItem');
const Course = require('../../models/Course');
const Class = require('../../models/Class');
const Teacher = require('../../models/Teacher');

exports.index = async (req, res) => {
  try {
    const { search, type } = req.query;
    const filter = { school: req.user.school, isActive: true };
    if (type) filter.type = type;
    if (search) filter.$or = [
      { title: new RegExp(search, 'i') },
      { tags: new RegExp(search, 'i') },
    ];

    const items = await LibraryItem.find(filter)
      .populate('course', 'name')
      .populate('class', 'name')
      .sort({ createdAt: -1 })
      .lean();

    res.render('teacher/library/index', {
      title: 'Bibliothèque',
      items,
      search: search || '',
      type: type || '',
      layout: 'teacher',
    });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ user: req.user._id, school: req.user.school }).lean();
    const [courses, classes] = await Promise.all([
      Course.find({ school: req.user.school, isActive: true, _id: { $in: teacher?.courses || [] } }).lean(),
      Class.find({ school: req.user.school, isActive: true, _id: { $in: teacher?.classes || [] } }).lean(),
    ]);
    res.render('teacher/library/form', {
      title: 'Ajouter un document',
      item: null,
      courses,
      classes,
      layout: 'teacher',
    });
  } catch (err) {
    next(err);
  }
};

exports.store = async (req, res) => {
  try {
    const { title, type, videoUrl, course, classId, tags, description } = req.body;
    await LibraryItem.create({
      school: req.user.school,
      title,
      type,
      filePath: req.file ? req.file.filename : null,
      videoUrl: videoUrl || null,
      course: course || null,
      class: classId || null,
      uploadedBy: req.user._id,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      description,
    });
    req.flash('success', 'Document ajouté avec succès');
    res.redirect('/teacher/library');
  } catch (err) {
    next(err);
  }
};
