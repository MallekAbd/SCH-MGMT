const Invoice = require('../models/Invoice');
const Student = require('../models/Student');
const Parent = require('../models/Parent');
const User = require('../models/User');
const { sendMail } = require('../config/mailer');
const moment = require('moment');

async function sendBillingReminders() {
  const overdue = await Invoice.find({
    status: { $in: ['pending', 'partial'] },
    dueDate: { $lt: new Date() },
  }).populate('student');

  for (const inv of overdue) {
    if (!inv.student) continue;
    const parents = await Parent.find({ students: inv.student._id }).populate('user', 'email firstName');
    for (const parent of parents) {
      if (parent.user?.email) {
        await sendMail({
          to: parent.user.email,
          subject: `Rappel: Facture en retard - ${inv.invoiceNumber}`,
          html: `<p>Cher(e) ${parent.user.firstName},</p>
                 <p>La facture <strong>${inv.invoiceNumber}</strong> de ${inv.student.firstName} ${inv.student.lastName} est en retard.</p>
                 <p>Montant dû: <strong>${inv.balance || inv.total} DA</strong></p>
                 <p>Échéance: ${moment(inv.dueDate).format('DD/MM/YYYY')}</p>`,
        });
      }
    }
    if (inv.status === 'pending' || inv.status === 'partial') {
      inv.status = 'overdue';
      await inv.save();
    }
  }
}

module.exports = { sendBillingReminders };
