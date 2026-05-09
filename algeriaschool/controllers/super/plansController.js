const Plan = require('../../models/Plan');
const Subscription = require('../../models/Subscription');

exports.index = async (req, res) => {
  try {
    const plans = await Plan.find().sort({ 'prices.monthly': 1 }).lean();

    // Usage counts per plan
    const usage = await Subscription.aggregate([
      { $match: { status: { $in: ['active', 'trial'] } } },
      { $group: { _id: '$plan', count: { $sum: 1 } } },
    ]);
    const usageMap = {};
    usage.forEach(u => { usageMap[u._id.toString()] = u.count; });

    res.render('super/plans/index', {
      title: 'Plans tarifaires',
      plans,
      usageMap,
      layout: 'super',
    });
  } catch (err) {
    next(err);
  }
};

exports.store = async (req, res) => {
  try {
    const { name, code, studentLimit, monthly, quarterly, semestrial, biannual, yearly, features, isActive } = req.body;
    const featureList = features
      ? features.split('\n').map(f => f.trim()).filter(Boolean)
      : [];
    await Plan.create({
      name,
      code: code.toUpperCase(),
      studentLimit: parseInt(studentLimit),
      prices: {
        monthly: parseFloat(monthly),
        quarterly: quarterly ? parseFloat(quarterly) : undefined,
        semestrial: semestrial ? parseFloat(semestrial) : undefined,
        biannual: biannual ? parseFloat(biannual) : undefined,
        yearly: yearly ? parseFloat(yearly) : undefined,
      },
      features: featureList,
      isActive: isActive === 'on',
    });
    req.flash('success', 'Plan créé avec succès');
    res.redirect('/super/plans');
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res) => {
  try {
    const { name, studentLimit, monthly, quarterly, semestrial, biannual, yearly, features, isActive } = req.body;
    const featureList = features
      ? features.split('\n').map(f => f.trim()).filter(Boolean)
      : [];
    await Plan.findByIdAndUpdate(req.params.id, {
      name,
      studentLimit: parseInt(studentLimit),
      prices: {
        monthly: parseFloat(monthly),
        quarterly: quarterly ? parseFloat(quarterly) : undefined,
        semestrial: semestrial ? parseFloat(semestrial) : undefined,
        biannual: biannual ? parseFloat(biannual) : undefined,
        yearly: yearly ? parseFloat(yearly) : undefined,
      },
      features: featureList,
      isActive: isActive === 'on',
    });
    req.flash('success', 'Plan mis à jour avec succès');
    res.redirect('/super/plans');
  } catch (err) {
    next(err);
  }
};
