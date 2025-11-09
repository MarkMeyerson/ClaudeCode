/**
 * Configuration Test Script
 * Tests that environment variables are properly loaded
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env
const envPath = path.resolve(__dirname, '.env');
console.log('Loading .env from:', envPath);

const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('❌ ERROR: Failed to load .env file');
  console.error('Error:', result.error.message);
  process.exit(1);
}

console.log('✓ .env file loaded successfully\n');

// Import config after dotenv is loaded
import { config, printConfig } from './shared/utils/config';

console.log('Testing configuration...\n');

try {
  // This will validate and throw if env vars are missing
  printConfig(config);

  console.log('\n✓ Configuration validation passed!');
  console.log('\n=== Environment Variables Check ===');
  console.log('DATABASE_HOST:', process.env.DATABASE_HOST ? '✓ Set' : '❌ Missing');
  console.log('DATABASE_PORT:', process.env.DATABASE_PORT ? '✓ Set' : '❌ Missing');
  console.log('DATABASE_NAME:', process.env.DATABASE_NAME ? '✓ Set' : '❌ Missing');
  console.log('DATABASE_USER:', process.env.DATABASE_USER ? '✓ Set' : '❌ Missing');
  console.log('DATABASE_PASSWORD:', process.env.DATABASE_PASSWORD ? '✓ Set' : '❌ Missing');
  console.log('STRIPE_API_KEY:', process.env.STRIPE_API_KEY ? '✓ Set' : '❌ Missing');

  console.log('\n=== Loaded Config Values ===');
  console.log('Database Host:', config.database.host);
  console.log('Database Port:', config.database.port);
  console.log('Database Name:', config.database.database);
  console.log('Database User:', config.database.user);

  if (config.database.host === 'localhost') {
    console.log('\n⚠️  WARNING: Database host is set to localhost');
    console.log('Expected Supabase host: db.woyiceldsaqpmsruzauh.supabase.co');
    console.log('Check your .env file!');
  } else if (config.database.host.includes('supabase.co')) {
    console.log('\n✓ Supabase connection configured correctly!');
  }

  process.exit(0);
} catch (error: any) {
  console.error('\n❌ Configuration Error:', error.message);
  process.exit(1);
}
