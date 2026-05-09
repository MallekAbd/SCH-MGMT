const Subscription = require('../models/Subscription');
const School = require('../models/School');
const moment = require('moment');

async function checkSubscriptions() {
  const now = new Date();
  const expired = await Subscription.find({ status: { $in: ['active', 'trial'] }, endDate: { $lt: now } });
  for (const sub of expired) {
    sub.status = 'grace';
    sub.graceEndsAt = moment(sub.endDate).add(7, 'days').toDate();
    await sub.save();
  }
  const graceExpired = await Subscription.find({ status: 'grace', graceEndsAt: { $lt: now } });
  for (const sub of graceExpired) {
    sub.status = 'locked';
    await sub.save();
    await School.findByIdAndUpdate(sub.school, { isLocked: true });
  }
}

module.exports = { checkSubscriptions };
