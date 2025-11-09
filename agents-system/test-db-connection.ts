/**
 * Database Connection Test Script
 * Tests the actual connection to Supabase
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env
const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

console.log('✓ Environment loaded\n');

import { initDatabase, testConnection, closeDatabase } from './shared/database/db';
import { config } from './shared/utils/config';

async function testDatabaseConnection() {
  try {
    console.log('=== Testing Database Connection ===\n');
    console.log('Connecting to:');
    console.log('  Host:', config.database.host);
    console.log('  Port:', config.database.port);
    console.log('  Database:', config.database.database);
    console.log('  User:', config.database.user);
    console.log('  SSL: Enabled (required for Supabase)\n');

    console.log('Initializing connection pool...');
    const db = initDatabase();
    console.log('✓ Connection pool created\n');

    console.log('Testing connection with simple query...');
    const connected = await testConnection();

    if (connected) {
      console.log('\n✅ SUCCESS! Database connection working correctly.');
      console.log('✓ Connected to Supabase PostgreSQL database');
    } else {
      console.log('\n❌ FAILED! Could not connect to database.');
      console.log('Check your DATABASE_* credentials in .env file.');
      process.exit(1);
    }

    // Clean up
    await closeDatabase();
    console.log('\n✓ Connection pool closed');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Database Connection Error:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

testDatabaseConnection();
