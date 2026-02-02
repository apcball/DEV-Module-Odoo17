const request = require('supertest');
const app = require('../app');

describe('API Health Check', () => {
  test('GET /api/v1/health should return status OK', async () => {
    const response = await request(app)
      .get('/api/v1/health')
      .expect(200);
    
    expect(response.body.status).toBe('OK');
    expect(response.body.timestamp).toBeDefined();
  });
});

describe('Auth Endpoints', () => {
  test('POST /api/v1/auth/login - should validate email format', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'invalid-email', password: 'password' })
      .expect(400);
    
    expect(response.body.success).toBe(false);
  });

  test('POST /api/v1/auth/register - should validate required fields', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'test@test.com' })
      .expect(400);
    
    expect(response.body.success).toBe(false);
  });
});

describe('Protected Routes', () => {
  test('GET /api/v1/tickets without token should return 401', async () => {
    const response = await request(app)
      .get('/api/v1/tickets')
      .expect(401);
    
    expect(response.body.success).toBe(false);
  });
});
