const express = require('express');
const router = express.Router();
const Plan = require('../models/Plan');
const Application = require('../models/Application');
const { sendMail } = require('../config/mailer');

router.get('/', async (req, res) => {
  const plans = await Plan.find({ isActive: true }).sort({ 'prices.monthly': 1 });
  res.render('public/home', { title: 'MadrastekDz - Gérez votre école', plans });
});

router.get('/fonctionnalites', (req, res) => {
  res.render('public/features', { title: 'Fonctionnalités' });
});

router.get('/tarifs', async (req, res) => {
  const plans = await Plan.find({ isActive: true }).sort({ 'prices.monthly': 1 });
  res.render('public/pricing', { title: 'Tarifs', plans });
});

router.get('/contact', (req, res) => {
  res.render('public/contact', { title: 'Contact' });
});

router.post('/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;
  await sendMail({
    to: 'contact@madrastekdz.com',
    subject: `Contact: ${subject}`,
    html: `<p>De: ${name} &lt;${email}&gt;</p><p>${message}</p>`,
  });
  req.flash('success', 'Message envoyé avec succès !');
  res.redirect('/contact');
});

router.get('/admission/:schoolId', async (req, res) => {
  const School = require('../models/School');
  const school = await School.findById(req.params.schoolId);
  if (!school) return res.status(404).render('errors/404', { title: 'École non trouvée' });
  res.render('public/admission', { title: `Admission - ${school.name}`, school });
});

router.post('/admission/:schoolId', async (req, res) => {
  const { firstName, lastName, dateOfBirth, gender, wilaya, parentName, parentPhone, parentEmail, parentRelationship, applyingForClass, academicYear } = req.body;
  await Application.create({
    school: req.params.schoolId,
    firstName, lastName, dateOfBirth, gender, wilaya,
    parentName, parentPhone, parentEmail, parentRelationship,
    applyingForClass, academicYear,
  });
  req.flash('success', 'Votre demande a été soumise avec succès !');
  res.redirect(`/admission/${req.params.schoolId}?submitted=1`);
});

router.post('/newsletter', async (req, res) => {
  req.flash('success', 'Merci pour votre inscription !');
  res.redirect('/#newsletter');
});

module.exports = router;
