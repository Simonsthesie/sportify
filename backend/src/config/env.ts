import dotenv from 'dotenv';

dotenv.config();

interface AppConfig {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  corsOrigin: string;
}

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error('Variable d environnement manquante : ' + name);
  }
  return value;
}

export const env: AppConfig = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  databaseUrl: required('DATABASE_URL', 'mysql://sportify:sportify@localhost:3306/sportify'),
  jwtSecret: required('JWT_SECRET', 'change-me-in-production-please'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '2h',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
};
