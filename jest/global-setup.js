// jest/global-setup.js

process.env.DATABASE_NAME = process.env.DATABASE_NAME || 'crm_db';
process.env.USER_NAME = process.env.USER_NAME || 'postgres';
process.env.PASSWORD = process.env.PASSWORD || 'root123';
process.env.HOST = process.env.HOST || 'localhost';
process.env.DILECT = process.env.DILECT || 'postgres';

export default async () => {
    console.log('Global setup: Initialize database or other setup tasks.');
  };
  