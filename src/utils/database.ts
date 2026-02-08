import 'dotenv/config';
import { Sequelize } from 'sequelize';

// small helper to fail fast if env is missing
function env(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export const sequelize = new Sequelize(
  env('DB_NAME'),
  env('DB_USER'),
  env('DB_PASSWORD'),
  {
    host: env('DB_HOST'),
    port: Number(process.env.DB_PORT) || 3306,
    dialect: 'mysql',

    logging: false,

    pool: {
      max: 10,
      min: 0,
      acquire: 30_000,
      idle: 10_000
    },

    timezone: '+00:00'
  }
);

// connection test
export async function connectDB(): Promise<void> {
  try {
    await sequelize.authenticate();
  } catch (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }
}
