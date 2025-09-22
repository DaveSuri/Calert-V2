import request from 'supertest';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

// Mock @google/genai to avoid real API calls
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: vi.fn().mockResolvedValue({
          output_text: '### Summary\nMocked summary',
          text: '### Summary\nMocked summary'
        })
      }
    }))
  };
});

// Mock Firebase admin to avoid real DB calls
vi.mock('../server/firebaseAdmin', () => ({
  db: {
    collection: vi.fn().mockReturnValue({
      doc: vi.fn().mockReturnValue({
        collection: vi.fn().mockReturnValue({
          doc: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({ exists: false }),
            set: vi.fn().mockResolvedValue({})
          })
        })
      })
    })
  }
}));

// Import the app after mocking
const appModule = await import('../server.js');
const app = appModule.default;

describe('/api/briefing', () => {
  const OLD_ENV = process.env;
  beforeAll(() => {
    process.env = { ...OLD_ENV, API_KEY: 'test-key', APP_TOKEN: 'secret' };
  });
  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('returns 401 without X-App-Token', async () => {
    const res = await request(app)
      .post('/api/briefing')
      .send({ title: 't', description: 'd' });
    expect(res.status).toBe(401);
  });

  it('validates input', async () => {
    const res = await request(app)
      .post('/api/briefing')
      .set('X-App-Token', 'secret')
      .send({ title: '', description: '' });
    expect(res.status).toBe(400);
  });

  it.skip('returns mocked content on success', async () => {
    // TODO: Fix Gemini API mocking in tests
    // const res = await request(app)
    //   .post('/api/briefing')
    //   .set('X-App-Token', 'secret')
    //   .send({ title: 'Title', description: 'Desc' });
    // expect(res.status).toBe(200);
    // expect(res.text).toContain('Mocked summary');
  });
});
