const LibraryItem = require('../../models/LibraryItem');
const Student = require('../../models/Student');
const path = require('path');
const fs = require('fs');

exports.index = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id, school: req.user.school })
      .populate('currentClass')
      .lean();
    if (!student) return res.status(404).render('errors/404', { title: 'Not Found' });

    const { search, type } = req.query;
    const filter = {
      school: req.user.school,
      isActive: true,
      $or: [
        { class: null },
        { class: student.currentClass?._id },
      ],
    };
    if (type) filter.type = type;
    if (search) filter.$and = [
      filter.$or ? { $or: filter.$or } : {},
      { $or: [{ title: new RegExp(search, 'i') }, { tags: new RegExp(search, 'i') }] },
    ];
    if (search) {
      delete filter.$or;
      filter.$and = [
        { $or: [{ class: null }, { class: student.currentClass?._id }] },
        { $or: [{ title: new RegExp(search, 'i') }, { tags: new RegExp(search, 'i') }] },
      ];
    }

    const items = await LibraryItem.find(filter)
      .populate('course', 'name')
      .sort({ createdAt: -1 })
      .lean();

    res.render('student/library/index', {
      title: 'Bibliothèque',
      items,
      search: search || '',
      type: type || '',
      layout: 'student',
    });
  } catch (err) {
    next(err);
  }
};

exports.download = async (req, res) => {
  try {
    const item = await LibraryItem.findOne({ _id: req.params.id, school: req.user.school, isActive: true }).lean();
    if (!item) return res.status(404).render('errors/404', { title: 'Not Found' });

    if (item.type === 'video_link') {
      return res.redirect(item.videoUrl);
    }

    if (!item.filePath) {
      req.flash('error', 'Fichier non disponible');
      return res.redirect('/student/library');
    }

    const uploadPath = process.env.UPLOAD_PATH || 'public/uploads';
    const filePath = path.join(__dirname, '../../', uploadPath, 'library', item.filePath);
    if (!fs.existsSync(filePath)) {
      req.flash('error', 'Fichier introuvable sur le serveur');
      return res.redirect('/student/library');
    }

    // Increment download count
    await LibraryItem.findByIdAndUpdate(item._id, { $inc: { downloads: 1 } });

    res.download(filePath, item.title + path.extname(item.filePath));
  } catch (err) {
    next(err);
  }
};
