const Message = require('../../models/Message');
const User = require('../../models/User');

exports.inbox = async (req, res) => {
  try {
    const messages = await Message.find({ recipient: req.user._id, school: req.user.school })
      .populate('sender', 'firstName lastName role')
      .sort({ createdAt: -1 })
      .lean();
    const unreadCount = messages.filter(m => !m.isRead).length;
    res.render('student/messages/inbox', {
      title: 'Messages',
      messages,
      unreadCount,
      layout: 'student',
    });
  } catch (err) {
    next(err);
  }
};

exports.send = async (req, res) => {
  try {
    const { recipientId, subject, body, parentMessageId } = req.body;
    const recipient = await User.findOne({ _id: recipientId, school: req.user.school });
    if (!recipient) {
      req.flash('error', 'Destinataire introuvable');
      return res.redirect('/student/messages');
    }
    await Message.create({
      school: req.user.school,
      sender: req.user._id,
      recipient: recipientId,
      subject,
      body,
      parentMessage: parentMessageId || null,
    });
    req.flash('success', 'Message envoyé');
    res.redirect('/student/messages');
  } catch (err) {
    next(err);
  }
};

exports.show = async (req, res) => {
  try {
    const message = await Message.findOne({
      _id: req.params.id,
      school: req.user.school,
      $or: [{ recipient: req.user._id }, { sender: req.user._id }],
    })
      .populate('sender', 'firstName lastName role')
      .populate('recipient', 'firstName lastName role')
      .lean();
    if (!message) return res.status(404).render('errors/404', { title: 'Not Found' });

    if (!message.isRead && message.recipient._id.toString() === req.user._id.toString()) {
      await Message.findByIdAndUpdate(message._id, { isRead: true, readAt: new Date() });
    }

    const replies = await Message.find({ parentMessage: message._id, school: req.user.school })
      .populate('sender', 'firstName lastName role')
      .sort({ createdAt: 1 })
      .lean();

    const teachers = await User.find({
      school: req.user.school,
      role: 'teacher',
      isActive: true,
    })
      .select('firstName lastName role')
      .lean();

    res.render('student/messages/show', {
      title: message.subject || 'Message',
      message,
      replies,
      teachers,
      layout: 'student',
    });
  } catch (err) {
    next(err);
  }
};
