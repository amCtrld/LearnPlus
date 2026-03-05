/**
 * Jest setup file for integration tests
 * Mocks Firebase and other external services
 */

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  firebaseApp: {},
  firestore: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({
          exists: () => false,
          data: () => null,
        })),
        set: jest.fn(() => Promise.resolve()),
        update: jest.fn(() => Promise.resolve()),
      })),
      add: jest.fn(() => Promise.resolve({ id: 'test-id' })),
      where: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({
          empty: true,
          docs: [],
        })),
      })),
    })),
  },
  auth: {
    currentUser: null,
  },
}));

// Mock Firebase Admin
const mockFirestore = {
  collection: jest.fn(() => ({
    doc: jest.fn(() => ({
      get: jest.fn(() => Promise.resolve({
        exists: false,
        data: () => null,
      })),
      set: jest.fn(() => Promise.resolve()),
      update: jest.fn(() => Promise.resolve()),
    })),
    add: jest.fn(() => Promise.resolve({ id: 'test-id' })),
    where: jest.fn(() => ({
      get: jest.fn(() => Promise.resolve({
        empty: true,
        docs: [],
      })),
      orderBy: jest.fn(() => ({
        limit: jest.fn(() => ({
          get: jest.fn(() => Promise.resolve({
            empty: true,
            docs: [],
          })),
        })),
      })),
    })),
  })),
  runTransaction: jest.fn((callback) => callback({
    get: jest.fn(() => Promise.resolve({ exists: false })),
    set: jest.fn(),
    update: jest.fn(),
  })),
};

jest.mock('firebase-admin', () => ({
  apps: [],
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn(),
  },
  firestore: jest.fn(() => mockFirestore),
}));

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(() => mockFirestore),
}));

// Mock OpenAI
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn(() => Promise.resolve({
          choices: [{
            message: {
              content: 'This is a test AI response. Try using the power rule.',
            },
          }],
          usage: {
            prompt_tokens: 50,
            completion_tokens: 20,
            total_tokens: 70,
          },
        })),
      },
    },
  }));
});

// Mock environment variables
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.ADMIN_API_KEY = 'test-admin-key';
process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT = JSON.stringify({
  type: 'service_account',
  project_id: 'test-project',
  private_key_id: 'test-key-id',
  private_key: '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----\n',
  client_email: 'test@test.iam.gserviceaccount.com',
  client_id: 'test-client-id',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/test',
});

// Mock Next.js cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn((name: string) => ({ value: `mock-${name}` })),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}));

// Suppress console errors in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};
