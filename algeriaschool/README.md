# 🎓 AlgeriaSchool — School Management Platform

A complete, production-ready **multi-tenant school management web platform** designed for private schools in Algeria. Built with Node.js, Express, MongoDB, and EJS.

> Manage students, teachers, classes, attendance, grades, library resources, billing (CCP / BaridiBank), expenses, admissions and more — all in one platform with personalized portals for admins, teachers, students and parents.

## ✨ Features

### 14 Core Modules
- 📊 **Dashboard** — KPIs, charts, recent activity
- 🗂️ **Sectors** — Academic specialties (Sciences, Lit., etc.)
- 📚 **Courses** — Course catalog with syllabus
- 🏛️ **Classes** — Class management with timetables
- 🧑‍🎓 **Students** — Registration, ID cards (PDF), CSV import
- 👨‍🏫 **Teachers** — Profiles, qualifications, workload
- 👨‍👩‍👧 **Parents** — Auto-generated credentials, communication
- ✅ **Attendance** — Per-session marking, parent email alerts
- ⭐ **Grades & Exams** — Weighted averages, report cards (PDF)
- 📖 **Library** — Files, video links, physical book inventory
- 💰 **Billing** — Auto invoices, CCP/BaridiBank, receipts (PDF)
- 🧾 **Expenses** — Budget tracking by category
- 🛡️ **Access (RBAC)** — Custom roles + audit log
- 🎓 **Trainings** — Programs, enrollments, certificates (PDF)

### Plus
- 🏫 **Admissions** — Public form → review → enrollment
- 💎 **Subscriptions** — Super-admin billing for schools (BASE/PLUS/ULTRA)
- 🌐 **i18n** — French (default), Arabic (RTL), English
- 🔒 **JWT Auth** — Access (15m) + refresh (7d) tokens, HTTP-only cookies
- 👥 **7 Roles** — Super Admin, School Admin, Sub Admin, Teacher, Student, Parent, Accountant
- 🏢 **Multi-tenant** — Strict data isolation by `schoolId`

### Three Personalized Portals
- 🎓 **Student Portal** — schedule, grades, attendance, library, fees, messages
- 👨‍🏫 **Teacher Portal** — classes, attendance, grades entry, library uploads
- 👨‍👩‍👦 **Parent Portal** — children overview, alerts, payments, messages

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** (LTS recommended)
- **No external database needed** — uses in-memory MongoDB by default

### Setup (3 commands)

```bash
# 1. Install dependencies
npm install

# 2. Copy env config (defaults work out of the box)
cp .env.example .env

# 3. Seed demo data + start server
npm run seed && npm run dev
```

Then open **http://localhost:3000** 🎉

### 🔐 Demo Credentials

After running `npm run seed`:

| Role          | Email                          | Password     | URL                  |
|---------------|--------------------------------|--------------|----------------------|
| Super Admin   | `super@algeriaschool.test`     | `Admin@123`  | `/super/dashboard`   |
| School Admin  | `admin@demo.test`              | `Admin@123`  | `/admin/dashboard`   |
| Teacher       | `ahmed.benali@demo.test`       | `Teacher@123`| `/teacher/dashboard` |
| Student       | `yacine.hamidi@demo.test`      | `Student@123`| `/student/dashboard` |
| Parent        | `parent.yacine@demo.test`      | `Parent@123` | `/parent/dashboard`  |

Demo seed includes: **1 school, 5 students, 3 teachers, 5 parents, 3 classes, 2 sectors, 4 courses, 2 exams with grades, 5 invoices, 2 announcements, 1 pending admission**.

## 📂 Project Structure

```
algeriaschool/
├── server.js          # Entry point + cron jobs
├── app.js             # Express app
├── config/            # db, logger, mailer, i18n, multer
├── models/            # 28 Mongoose schemas
├── controllers/       # admin/, teacher/, student/, parent/, super/, authController
├── routes/            # Mirrors controllers
├── middleware/        # auth, rbac, tenant, validation, errorHandler, setLocals
├── services/          # pdfService (invoices, report cards, ID cards, certificates)
├── views/             # EJS templates per role
├── public/            # CSS, JS, images, uploads
├── locales/           # fr/, ar/, en/ translation files
├── seeds/seed.js      # Demo data
├── scripts/           # Cron jobs (billing reminders, subscription check)
└── tests/             # Jest + supertest
```

## 🛠️ Available Scripts

| Command            | Description                                       |
|--------------------|---------------------------------------------------|
| `npm run dev`      | Start with nodemon (auto-reload)                  |
| `npm start`        | Production start                                  |
| `npm run seed`     | Reset & seed demo data                            |
| `npm test`         | Run Jest tests                                    |
| `npm run lint`     | ESLint check                                      |
| `npm run format`   | Prettier format                                   |

## ⚙️ Configuration

All settings are in `.env`. Key options:

```env
USE_MEMORY_DB=true             # Set to false to use a real MongoDB
MONGODB_URI=mongodb://127.0.0.1:27017/algeriaschool
JWT_SECRET=<32+ char secret>
MAIL_LOG_ONLY=true             # No real SMTP needed; emails saved to /tmp/emails/
DEFAULT_LANG=fr
```

## 💵 Pricing Plans (seeded)

| Plan  | Price (DA / mo) | Student limit |
|-------|-----------------|---------------|
| BASE  | 4,000           | up to 100     |
| PLUS  | 8,000           | up to 300     |
| ULTRA | 16,000          | up to 1,000   |

Period discounts: Quarterly -5%, Semestrial -10%, 6-Month -15%, Yearly -25%.

## 💳 Payment Methods

- **CCP** (Algérie Poste)
- **BaridiBank / BaridiMob**
- Bank transfer
- Cash (admin-confirmed)

All payment confirmation is currently **manual** for local dev (super admin marks paid).

## 🏫 Supported School Types

Preschool · Primary · EMC (Middle) · High School · University · Training Institution · Generic Private School

## 🔒 Security

- Passwords: bcrypt (12 rounds), min 8 chars
- JWT in HTTP-only cookies, 15-min access + 7-day refresh
- Rate-limit: 10 login attempts / 15 min
- Helmet.js, CORS, CSRF-friendly
- Audit log for sensitive actions
- Multi-tenant: every query filtered by `schoolId`

## 🧪 Testing

```bash
npm test              # Run all Jest tests
```

Tests cover: auth (login, register, logout) + sectors CRUD.

## 🚦 Subscription Lifecycle

1. School signs up → 30-day **trial**
2. Super admin records payment → status = **active**
3. End date passes → status = **grace** (7 days read-only warning)
4. Grace expires → status = **locked** (school is fully blocked)
5. Super admin unlocks after payment

A `node-cron` job runs daily at midnight to enforce this.

## 🌍 Languages

Switch via the navbar dropdown or query string `?lang=fr|ar|en`.

- **French** is the default (`DEFAULT_LANG=fr`)
- **Arabic** auto-switches the page to RTL
- All locales in `/locales/{lang}/translation.json`

## 📦 Generated PDFs

- 🧾 Invoices & receipts
- 📜 Report cards (with weighted averages /20)
- 🪪 Student ID cards
- 🏆 Training certificates

All generated via `pdfkit` — no external dependencies.

## 🇩🇿 Made for Algerian schools

- Algerian Dinar (DA) currency throughout
- /20 grading scale (configurable)
- French-language UI as default
- Arabic RTL support
- CCP & BaridiBank payment methods

---

**Built with ❤️ — Open the door of digital school management.**
