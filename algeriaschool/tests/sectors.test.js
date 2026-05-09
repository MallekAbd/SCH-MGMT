process.env.NODE_ENV = 'test';
process.env.USE_MEMORY_DB = 'true';
process.env.JWT_SECRET = 'test_jwt_secret_for_testing_purposes_min32';
process.env.SESSION_SECRET = 'test_session_secret_for_testing_purposes';
process.env.MAIL_LOG_ONLY = 'true';

const request = require('supertest');
const { connectDB, disconnectDB } = require('../config/db');
const app = require('../app');
const User = require('../models/User');
const School = require('../models/School');
const Sector = require('../models/Sector');

let agent;
let school;

beforeAll(async () => {
  await connectDB();
  school = await School.create({ name: 'Sec Test', type: 'private' });
  await User.create({
    firstName: 'Sec', lastName: 'Admin',
    email: 'sec@test.com', password: 'Pass@1234',
    role: 'school_admin', school: school._id,
  });
  agent = request.agent(app);
  await agent.post('/auth/login').send({ email: 'sec@test.com', password: 'Pass@1234' });
});

afterAll(async () => {
  await disconnectDB();
});

beforeEach(async () => {
  await Sector.deleteMany({ school: school._id });
});

describe('Sectors module CRUD (admin)', () => {
  test('lists sectors (empty initially)', async () => {
    const res = await agent.get('/admin/sectors');
    expect(res.status).toBe(200);
  });

  test('creates a sector', async () => {
    const res = await agent.post('/admin/sectors').send({ name: 'Sciences', code: 'SCI', description: 'Math + Phys' });
    expect([200, 302]).toContain(res.status);
    const s = await Sector.findOne({ name: 'Sciences', school: school._id });
    expect(s).toBeTruthy();
    expect(s.code).toBe('SCI');
  });

  test('multi-tenant: cannot read other school\'s sectors', async () => {
    const otherSchool = await School.create({ name: 'Other', type: 'private' });
    await Sector.create({ school: otherSchool._id, name: 'OtherSector', code: 'OTH' });
    const res = await agent.get('/admin/sectors');
    expect(res.text).not.toContain('OtherSector');
  });
});
