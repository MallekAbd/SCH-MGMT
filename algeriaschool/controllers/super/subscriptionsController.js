const Subscription = require('../../models/Subscription');
const School = require('../../models/School');
const Plan = require('../../models/Plan');
const moment = require('moment');

const periodMonths = {
  monthly: 1,
  quarterly: 3,
  semestrial: 6,
  biannual: 6,
  yearly: 12,
};

exports.index = async (req, res) => {
  try {
    const { status, schoolId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (schoolId) filter.school = schoolId;

    const subscriptions = await Subscription.find(filter)
      .populate('school', 'name type')
      .populate('plan', 'name code')
      .populate('confirmedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .lean();

    const schools = await School.find().select('name').sort({ name: 1 }).lean();

    res.render('super/subscriptions/index', {
      title: 'Abonnements',
      subscriptions,
      schools,
      status: status || '',
      schoolId: schoolId || '',
      layout: 'super',
    });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res) => {
  try {
    const { schoolId, planId, period, amount, paymentMethod, paymentRef, notes, startDate } = req.body;

    const plan = await Plan.findById(planId);
    const school = await School.findById(schoolId);
    if (!plan || !school) {
      req.flash('error', 'École ou plan introuvable');
      return res.redirect('/super/subscriptions');
    }

    const months = periodMonths[period] || 1;
    const start = startDate ? new Date(startDate) : new Date();
    const end = moment(start).add(months, 'months').toDate();
    const resolvedAmount = amount || plan.prices[period] || plan.prices.monthly;

    const subscription = await Subscription.create({
      school: schoolId,
      plan: planId,
      period,
      amount: resolvedAmount,
      status: 'active',
      startDate: start,
      endDate: end,
      paymentMethod,
      paymentRef,
      confirmedBy: req.user._id,
      confirmedAt: new Date(),
      notes,
    });

    await School.findByIdAndUpdate(schoolId, {
      subscription: subscription._id,
      isLocked: false,
      isActive: true,
    });

    req.flash('success', 'Abonnement créé avec succès');
    res.redirect('/super/subscriptions');
  } catch (err) {
    next(err);
  }
};

exports.confirm = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) return res.status(404).render('errors/404', { title: 'Not Found' });

    const { paymentMethod, paymentRef, amount, notes } = req.body;

    subscription.status = 'active';
    subscription.confirmedBy = req.user._id;
    subscription.confirmedAt = new Date();
    if (paymentMethod) subscription.paymentMethod = paymentMethod;
    if (paymentRef) subscription.paymentRef = paymentRef;
    if (amount) subscription.amount = parseFloat(amount);
    if (notes) subscription.notes = notes;
    await subscription.save();

    await School.findByIdAndUpdate(subscription.school, {
      subscription: subscription._id,
      isLocked: false,
    });

    req.flash('success', 'Abonnement confirmé');
    res.redirect('/super/subscriptions');
  } catch (err) {
    next(err);
  }
};
