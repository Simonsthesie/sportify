process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'mysql://test:test@localhost:3306/test';
process.env.CORS_ORIGIN = 'http://localhost:5173';
