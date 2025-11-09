import { readFileSync } from 'fs';
import { join } from 'path';
import { db } from './index';
import { Logger } from '../utils/logger';

const logger = new Logger('Migration');

async function migrate() {
  try {
    logger.info('Starting database migration...');

    // Test connection first
    const connected = await db.testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }

    // Read schema file
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');

    // Execute schema
    logger.info('Executing schema...');
    await db.query(schema);

    logger.info('Database migration completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed', error as Error);
    process.exit(1);
  }
}

migrate();
