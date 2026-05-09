require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');

const Plan = require('../models/Plan');
const School = require('../models/School');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const Sector = require('../models/Sector');
const Course = require('../models/Course');
const Class = require('../models/Class');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Parent = require('../models/Parent');
const Enrollment = require('../models/Enrollment');
const Exam = require('../models/Exam');
const Grade = require('../models/Grade');
const Attendance = require('../models/Attendance');
const FeeStructure = require('../models/FeeStructure');
const Invoice = require('../models/Invoice');
const Announcement = require('../models/Announcement');
const Application = require('../models/Application');

async function seed() {
  await connectDB();
  console.log('🧹 Cleaning database...');
  await Promise.all([
    Plan.deleteMany({}), School.deleteMany({}), Subscription.deleteMany({}),
    User.deleteMany({}), Sector.deleteMany({}), Course.deleteMany({}),
    Class.deleteMany({}), Teacher.deleteMany({}), Student.deleteMany({}),
    Parent.deleteMany({}), Enrollment.deleteMany({}), Exam.deleteMany({}),
    Grade.deleteMany({}), Attendance.deleteMany({}), FeeStructure.deleteMany({}),
    Invoice.deleteMany({}), Announcement.deleteMany({}), Application.deleteMany({}),
  ]);

  console.log('📦 Creating plans...');
  const planBase = await Plan.create({
    name: 'BASE', code: 'BASE', studentLimit: 100,
    prices: { monthly: 4000, quarterly: 11400, semestrial: 21600, biannual: 20400, yearly: 36000 },
    features: ['Tous les modules', 'Support email'],
  });
  const planPlus = await Plan.create({
    name: 'PLUS', code: 'PLUS', studentLimit: 300,
    prices: { monthly: 8000, quarterly: 22800, semestrial: 43200, biannual: 40800, yearly: 72000 },
    features: ['Tous les modules', 'Support prioritaire'],
  });
  const planUltra = await Plan.create({
    name: 'ULTRA', code: 'ULTRA', studentLimit: 1000,
    prices: { monthly: 16000, quarterly: 45600, semestrial: 86400, biannual: 81600, yearly: 144000 },
    features: ['Tous les modules', 'Support prioritaire', 'Formation incluse'],
  });

  console.log('👑 Creating super admin...');
  await User.create({
    firstName: 'Super', lastName: 'Admin',
    email: 'super@algeriaschool.test', password: 'Admin@123',
    role: 'super_admin',
  });

  console.log('🏫 Creating demo school...');
  const school = await School.create({
    name: 'École Démo Alger',
    nameAr: 'مدرسة الجزائر التجريبية',
    type: 'private',
    email: 'contact@demo-alger.dz',
    phone: '+213 21 00 00 00',
    address: { city: 'Alger', wilaya: 'Alger', street: 'Rue Didouche Mourad' },
    settings: { gradeScale: 20, academicYear: '2024-2025', currency: 'DA', defaultLang: 'fr' },
  });

  const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  const subscription = await Subscription.create({
    school: school._id, plan: planPlus._id, period: 'yearly',
    amount: 72000, status: 'active',
    startDate: new Date(), endDate: oneYearFromNow,
    paymentMethod: 'ccp', paymentRef: 'DEMO-001',
  });
  school.subscription = subscription._id;
  await school.save();

  console.log('👤 Creating school admin & users...');
  const admin = await User.create({
    firstName: 'Karim', lastName: 'Admin',
    email: 'admin@demo.test', password: 'Admin@123',
    phone: '+213 555 11 11 11',
    role: 'school_admin', school: school._id,
  });

  console.log('📚 Creating sectors & courses...');
  const sectorSci = await Sector.create({ school: school._id, name: 'Sciences', nameAr: 'علوم', code: 'SCI' });
  const sectorLit = await Sector.create({ school: school._id, name: 'Littérature', nameAr: 'أدب', code: 'LIT' });

  const mathCourse = await Course.create({ school: school._id, sector: sectorSci._id, code: 'MATH', name: 'Mathématiques', credits: 4, hoursPerWeek: 6, level: 'Lycée' });
  const physCourse = await Course.create({ school: school._id, sector: sectorSci._id, code: 'PHYS', name: 'Physique', credits: 3, hoursPerWeek: 4, level: 'Lycée' });
  const arabCourse = await Course.create({ school: school._id, sector: sectorLit._id, code: 'ARAB', name: 'Langue arabe', credits: 3, hoursPerWeek: 5, level: 'Lycée' });
  const frenCourse = await Course.create({ school: school._id, sector: sectorLit._id, code: 'FREN', name: 'Français', credits: 3, hoursPerWeek: 4, level: 'Lycée' });

  console.log('🏛️  Creating classes...');
  const class1 = await Class.create({ school: school._id, name: '3ème Sciences A', level: 'Lycée', academicYear: '2024-2025', capacity: 30, room: 'A101', courses: [mathCourse._id, physCourse._id, arabCourse._id] });
  const class2 = await Class.create({ school: school._id, name: '2nde Lettres B', level: 'Lycée', academicYear: '2024-2025', capacity: 28, room: 'A102', courses: [arabCourse._id, frenCourse._id] });
  const class3 = await Class.create({ school: school._id, name: '1ère Sciences', level: 'Lycée', academicYear: '2024-2025', capacity: 25, room: 'B201', courses: [mathCourse._id, physCourse._id] });

  console.log('👨‍🏫 Creating teachers...');
  const teacherUsers = [];
  const teacherSpecs = [
    { fn: 'Ahmed', ln: 'Benali', email: 'ahmed.benali@demo.test', spec: 'Mathématiques', courses: [mathCourse._id], classes: [class1._id, class3._id] },
    { fn: 'Fatima', ln: 'Cherif', email: 'fatima.cherif@demo.test', spec: 'Physique', courses: [physCourse._id], classes: [class1._id, class3._id] },
    { fn: 'Mohamed', ln: 'Saidi', email: 'mohamed.saidi@demo.test', spec: 'Lettres', courses: [arabCourse._id, frenCourse._id], classes: [class2._id] },
  ];
  const teachers = [];
  for (const t of teacherSpecs) {
    const u = await User.create({ firstName: t.fn, lastName: t.ln, email: t.email, password: 'Teacher@123', role: 'teacher', school: school._id });
    teacherUsers.push(u);
    const teacher = await Teacher.create({
      school: school._id, user: u._id,
      specialization: t.spec,
      qualifications: ['Master en ' + t.spec],
      contractType: 'permanent', salaryBase: 80000, hoursPerWeek: 18,
      courses: t.courses, classes: t.classes,
      joinDate: new Date('2020-09-01'), isActive: true,
    });
    teachers.push(teacher);
  }
  class1.homeTeacher = teachers[0]._id;
  await class1.save();

  console.log('🧑‍🎓 Creating students...');
  const studentSpecs = [
    { fn: 'Yacine', ln: 'Hamidi', class: class1, gender: 'male' },
    { fn: 'Sara', ln: 'Boudjema', class: class1, gender: 'female' },
    { fn: 'Riad', ln: 'Belkacem', class: class1, gender: 'male' },
    { fn: 'Lina', ln: 'Mansouri', class: class2, gender: 'female' },
    { fn: 'Anis', ln: 'Tahir', class: class3, gender: 'male' },
  ];
  const students = [];
  let studentCounter = 1000;
  for (const s of studentSpecs) {
    studentCounter++;
    const u = await User.create({ firstName: s.fn, lastName: s.ln, email: `${s.fn.toLowerCase()}.${s.ln.toLowerCase()}@demo.test`, password: 'Student@123', role: 'student', school: school._id });
    const student = await Student.create({
      school: school._id, user: u._id,
      studentId: 'STU-' + studentCounter,
      firstName: s.fn, lastName: s.ln,
      gender: s.gender,
      dateOfBirth: new Date('2008-05-15'),
      wilaya: 'Alger',
      currentClass: s.class._id,
      admissionDate: new Date('2024-09-01'),
      status: 'active',
    });
    await Enrollment.create({ school: school._id, student: student._id, class: s.class._id, academicYear: '2024-2025' });
    students.push(student);
  }

  console.log('👨‍👩‍👦 Creating parents...');
  for (let i = 0; i < students.length; i++) {
    const s = students[i];
    const u = await User.create({
      firstName: 'Parent', lastName: s.lastName,
      email: `parent.${s.firstName.toLowerCase()}@demo.test`, password: 'Parent@123',
      phone: `+213 555 ${String(i).padStart(2, '0')} ${i}${i} ${i}${i}`,
      role: 'parent', school: school._id,
    });
    const parent = await Parent.create({
      school: school._id, user: u._id,
      relationship: 'father',
      profession: 'Ingénieur',
      students: [s._id],
    });
    s.parents = [u._id];
    await s.save();
  }

  console.log('📝 Creating exams & grades...');
  const exam1 = await Exam.create({ school: school._id, name: 'Devoir Maths T1', type: 'midterm', course: mathCourse._id, class: class1._id, teacher: teachers[0]._id, date: new Date('2024-11-15'), maxScore: 20, weight: 1, term: 'T1', academicYear: '2024-2025' });
  const exam2 = await Exam.create({ school: school._id, name: 'Examen Physique T1', type: 'final', course: physCourse._id, class: class1._id, teacher: teachers[1]._id, date: new Date('2024-12-01'), maxScore: 20, weight: 2, term: 'T1', academicYear: '2024-2025' });

  for (const s of students.filter(st => st.currentClass.toString() === class1._id.toString())) {
    await Grade.create({ school: school._id, student: s._id, exam: exam1._id, course: mathCourse._id, class: class1._id, score: 12 + Math.random() * 7, maxScore: 20, enteredBy: admin._id });
    await Grade.create({ school: school._id, student: s._id, exam: exam2._id, course: physCourse._id, class: class1._id, score: 11 + Math.random() * 7, maxScore: 20, enteredBy: admin._id });
  }

  console.log('💰 Creating fee structure & invoices...');
  const tuitionFee = await FeeStructure.create({
    school: school._id, name: 'Frais de scolarité - Trimestre 1',
    type: 'tuition', amount: 25000, billingPeriod: 'quarterly',
    academicYear: '2024-2025', lateFeeAmount: 1000, lateFeeAfterDays: 30,
  });

  let invoiceCounter = 0;
  for (const s of students) {
    invoiceCounter++;
    await Invoice.create({
      school: school._id,
      invoiceNumber: 'INV-2024-' + String(invoiceCounter).padStart(4, '0'),
      student: s._id,
      items: [{ description: tuitionFee.name, feeStructure: tuitionFee._id, amount: tuitionFee.amount, quantity: 1 }],
      subtotal: tuitionFee.amount, total: tuitionFee.amount, balance: tuitionFee.amount,
      status: invoiceCounter % 2 === 0 ? 'paid' : 'pending',
      amountPaid: invoiceCounter % 2 === 0 ? tuitionFee.amount : 0,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      period: 'Trimestre 1', academicYear: '2024-2025',
    });
  }

  console.log('📢 Creating announcements...');
  await Announcement.create({
    school: school._id,
    title: 'Bienvenue pour la rentrée 2024-2025 !',
    content: "Chers élèves et parents, nous vous souhaitons une excellente année scolaire. Les cours commencent le 15 septembre.",
    author: admin._id,
    targetRoles: ['all'],
    isPinned: true,
  });
  await Announcement.create({
    school: school._id,
    title: 'Réunion parents-enseignants',
    content: 'Une réunion est prévue le samedi 20 octobre à 14h dans la salle polyvalente.',
    author: admin._id,
    targetRoles: ['parent'],
  });

  console.log('📋 Creating sample admission application...');
  await Application.create({
    school: school._id,
    firstName: 'Nouveau', lastName: 'Candidat',
    dateOfBirth: new Date('2010-03-12'), gender: 'male',
    wilaya: 'Alger',
    parentName: 'Père Candidat', parentPhone: '+213 555 99 99 99',
    parentEmail: 'parent.candidat@example.com', parentRelationship: 'father',
    applyingForClass: '3ème Sciences', academicYear: '2025-2026',
    status: 'pending',
  });

  console.log('\n✅ Seeding complete!\n');
  console.log('═══════════════════════════════════════════════');
  console.log('  🔐 IDENTIFIANTS DE DÉMONSTRATION');
  console.log('═══════════════════════════════════════════════');
  console.log('  Super Admin    : super@algeriaschool.test / Admin@123');
  console.log('  School Admin   : admin@demo.test           / Admin@123');
  console.log('  Teacher        : ahmed.benali@demo.test    / Teacher@123');
  console.log('  Student        : yacine.hamidi@demo.test   / Student@123');
  console.log('  Parent         : parent.yacine@demo.test   / Parent@123');
  console.log('═══════════════════════════════════════════════');
  console.log(`  📊 ${students.length} élèves · ${teachers.length} enseignants · 3 classes`);
  console.log(`  💰 ${invoiceCounter} factures · 2 examens · 2 annonces\n`);

  await disconnectDB();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
