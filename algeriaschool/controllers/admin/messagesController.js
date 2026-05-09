const Message = require('../../models/Message');
const User = require('../../models/User');

exports.inbox = async (req, res) => {
  const messages = await Message.find({ school: req.user.school, recipient: req.user._id })
    .populate('sender', 'firstName lastName role').sort({ createdAt: -1 }).lean();
  res.render('admin/messages/inbox', { title: 'Messages', messages, layout: 'admin' });
};

exports.compose = async (req, res) => {
  const users = await User.find({ school: req.user.school, _id: { $ne: req.user._id } }).lean();
  res.render('admin/messages/compose', { title: 'Nouveau message', users, layout: 'admin' });
};

exports.send = async (req, res) => {
  const { recipient, subject, body } = req.body;
  await Message.create({
    school: req.user.school,
    sender: req.user._id,
    recipient, subject, body,
  });
  req.flash('success', 'Message envoyé');
  res.redirect('/admin/messages');
};

exports.show = async (req, res) => {
  const message = await Message.findOne({ _id: req.params.id, school: req.user.school })
    .populate('sender', 'firstName lastName role').lean();
  if (!message) return res.status(404).render('errors/404', { title: 'Not Found' });
  if (message.recipient.toString() === req.user._id.toString() && !message.isRead) {
    await Message.findByIdAndUpdate(message._id, { isRead: true, readAt: new Date() });
  }
  res.render('admin/messages/show', { title: message.subject || 'Message', message, layout: 'admin' });
};
