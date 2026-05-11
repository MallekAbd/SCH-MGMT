process.env.NODE_ENV = 'test';
process.env.USE_MEMORY_DB = 'true';
process.env.JWT_SECRET = 'test_jwt_secret_for_testing_purposes_min32';
process.env.SESSION_SECRET = 'test_session_secret_for_testing_purposes';
process.env.MAIL_LOG_ONLY = 'true';

const request = require('supertest');
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');
const app = require('../app');
const User = require('../models/User');
const School = require('../models/School');
const Plan = require('../models/Plan');

beforeAll(async () => {
  await connectDB();
  // Seed minimal data
  await Plan.create({ name: 'BASE', code: 'BASE', studentLimit: 100, prices: { monthly: 4000 } });
});

afterAll(async () => {
  await disconnectDB();
});

beforeEach(async () => {
  await User.deleteMany({});
  await School.deleteMany({});
});

describe('Auth: registration', () => {
  test('renders register page', async () => {
    const res = await request(app).get('/auth/register');
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/inscri|register|compte/i);
  });

  test('creates a school + admin user on registration', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        firstName: 'Test', lastName: 'Owner',
        email: 'test.owner@example.com',
        password: 'Test@1234',
        schoolName: 'Test School',
        schoolType: 'private',
      });
    expect([200, 302]).toContain(res.status);
    const user = await User.findOne({ email: 'test.owner@example.com' });
    expect(user).toBeTruthy();
    expect(user.role).toBe('school_admin');
  });
});

describe('Auth: login', () => {
  test('renders login page', async () => {
    const res = await request(app).get('/auth/login');
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/connexion|login|email/i);
  });

  test('rejects invalid credentials', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'no@one.com', password: 'wrong' });
    expect([302, 401]).toContain(res.status);
  });

  test('logs in valid user', async () => {
    const school = await School.create({ name: 'TS', type: 'private' });
    await User.create({
      firstName: 'A', lastName: 'B',
      email: 'login@test.com',
      password: 'Pass@1234',
      role: 'school_admin', school: school._id,
    });
    const res = await request(app).post('/auth/login').send({ email: 'login@test.com', password: 'Pass@1234' });
    expect(res.status).toBe(302);
    const cookies = res.headers['set-cookie'] || [];
    expect(cookies.some((c) => c.includes('accessToken'))).toBe(true);
  });
});

describe('Public pages', () => {
  test('homepage loads', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/MadrastekDz/);
  });

  test('contact page loads', async () => {
    const res = await request(app).get('/contact');
    expect(res.status).toBe(200);
  });

  test('404 for unknown route', async () => {
    const res = await request(app).get('/this-does-not-exist');
    expect(res.status).toBe(404);
  });
});
