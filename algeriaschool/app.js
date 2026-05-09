require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const compression = require('compression');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');

const { handle: i18nHandle } = require('./config/i18n');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const setLocals = require('./middleware/setLocals');
const { createLogger } = require('./config/logger');
const logger = createLogger('app');

const app = express();

// Security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'cdn.jsdelivr.net', 'cdnjs.cloudflare.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net', 'cdnjs.cloudflare.com', 'fonts.googleapis.com'],
      fontSrc: ["'self'", 'fonts.gstatic.com', 'cdnjs.cloudflare.com'],
      imgSrc: ["'self'", 'data:', 'blob:', '*'],
      connectSrc: ["'self'"],
    },
  },
}));
app.use(cors({ origin: process.env.APP_URL, credentials: true }));
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(methodOverride('_method'));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Session
function buildSessionStore() {
  if (mongoose.connection.readyState === 1) {
    return MongoStore.create({ mongoUrl: mongoose.connection.client.s.url || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/algeriaschool' });
  }
  return undefined;
}

app.use((req, res, next) => {
  session({
    secret: process.env.SESSION_SECRET || 'changeme_session',
    resave: false,
    saveUninitialized: false,
    store: mongoose.connection.readyState === 1
      ? MongoStore.create({ client: mongoose.connection.getClient() })
      : undefined,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000,
    },
  })(req, res, next);
});

app.use(flash());

// i18n
app.use(i18nHandle);

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Set locals for all views
app.use(setLocals);

// Routes
app.use('/', require('./routes/public.routes'));
app.use('/auth', require('./routes/auth.routes'));
app.use('/admin', require('./routes/admin/index'));
app.use('/teacher', require('./routes/teacher/index'));
app.use('/student', require('./routes/student/index'));
app.use('/parent', require('./routes/parent/index'));
app.use('/super', require('./routes/super/index'));

// Dashboard redirect
app.get('/dashboard', (req, res) => {
  if (!req.cookies?.accessToken) return res.redirect('/auth/login');
  res.redirect('/admin/dashboard');
});

// Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
