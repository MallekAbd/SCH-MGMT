const School = require('../../models/School');
const User = require('../../models/User');
const Subscription = require('../../models/Subscription');
const Student = require('../../models/Student');
const moment = require('moment');

exports.index = async (req, res) => {
  try {
    const [
      totalSchools,
      activeSchools,
      lockedSchools,
      totalUsers,
      activeSubscriptions,
      trialSubscriptions,
      expiredSubscriptions,
    ] = await Promise.all([
      School.countDocuments(),
      School.countDocuments({ isActive: true, isLocked: false }),
      School.countDocuments({ isLocked: true }),
      User.countDocuments({ role: { $ne: 'super_admin' } }),
      Subscription.countDocuments({ status: 'active' }),
      Subscription.countDocuments({ status: 'trial' }),
      Subscription.countDocuments({ status: 'expired' }),
    ]);

    // Revenue this month from confirmed subscriptions
    const monthStart = moment().startOf('month').toDate();
    const monthEnd = moment().endOf('month').toDate();
    const revenueAgg = await Subscription.aggregate([
      { $match: { status: 'active', confirmedAt: { $gte: monthStart, $lte: monthEnd } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const monthlyRevenue = revenueAgg[0]?.total || 0;

    // Recent schools
    const recentSchools = await School.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('subscription')
      .lean();

    // Enrollment trend across all schools last 6 months
    const enrollmentTrend = [];
    for (let i = 5; i >= 0; i--) {
      const m = moment().subtract(i, 'months');
      const count = await Student.countDocuments({
        createdAt: { $lte: m.endOf('month').toDate() },
        status: 'active',
      });
      enrollmentTrend.push({ month: m.format('MMM'), count });
    }

    res.render('super/dashboard', {
      title: 'Super Admin Dashboard',
      stats: {
        totalSchools,
        activeSchools,
        lockedSchools,
        totalUsers,
        activeSubscriptions,
        trialSubscriptions,
        expiredSubscriptions,
        monthlyRevenue,
      },
      recentSchools,
      enrollmentTrend: JSON.stringify(enrollmentTrend),
      layout: 'super',
    });
  } catch (err) {
    next(err);
  }
};
