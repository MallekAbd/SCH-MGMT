const School = require('../../models/School');
const User = require('../../models/User');
const Student = require('../../models/Student');
const Teacher = require('../../models/Teacher');
const Subscription = require('../../models/Subscription');

exports.index = async (req, res) => {
  try {
    const { search, status, type } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (status === 'active') { filter.isActive = true; filter.isLocked = false; }
    if (status === 'locked') filter.isLocked = true;
    if (status === 'inactive') filter.isActive = false;
    if (search) filter.name = new RegExp(search, 'i');

    const schools = await School.find(filter)
      .populate('subscription')
      .sort({ createdAt: -1 })
      .lean();

    res.render('super/schools/index', {
      title: 'Établissements',
      schools,
      search: search || '',
      status: status || '',
      type: type || '',
      layout: 'super',
    });
  } catch (err) {
    next(err);
  }
};

exports.show = async (req, res) => {
  try {
    const school = await School.findById(req.params.id)
      .populate({ path: 'subscription', populate: { path: 'plan', select: 'name code' } })
      .lean();
    if (!school) return res.status(404).render('errors/404', { title: 'Not Found' });

    const [adminUser, totalStudents, totalTeachers, subscriptionHistory] = await Promise.all([
      User.findOne({ school: school._id, role: 'school_admin' })
        .select('firstName lastName email lastLogin')
        .lean(),
      Student.countDocuments({ school: school._id }),
      Teacher.countDocuments({ school: school._id }),
      Subscription.find({ school: school._id })
        .populate('plan', 'name code')
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    res.render('super/schools/show', {
      title: school.name,
      school,
      adminUser,
      totalStudents,
      totalTeachers,
      subscriptionHistory,
      layout: 'super',
    });
  } catch (err) {
    next(err);
  }
};

exports.lock = async (req, res) => {
  try {
    await School.findByIdAndUpdate(req.params.id, { isLocked: true });
    req.flash('success', 'Établissement verrouillé');
    res.redirect(`/super/schools/${req.params.id}`);
  } catch (err) {
    next(err);
  }
};

exports.unlock = async (req, res) => {
  try {
    await School.findByIdAndUpdate(req.params.id, { isLocked: false });
    req.flash('success', 'Établissement déverrouillé');
    res.redirect(`/super/schools/${req.params.id}`);
  } catch (err) {
    next(err);
  }
};
