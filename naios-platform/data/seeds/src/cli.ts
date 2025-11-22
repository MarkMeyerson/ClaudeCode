#!/usr/bin/env node
/**
 * NAIOS Platform - Seed Data CLI
 *
 * Command-line interface for generating seed data
 */

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import dotenv from 'dotenv';
import { seedDatabase, DataSize, SchemaType, SeedConfig } from './index';

dotenv.config();

const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 [options]')
  .option('size', {
    alias: 's',
    type: 'string',
    description: 'Data size (small, medium, large)',
    choices: ['small', 'medium', 'large'],
    default: 'small',
  })
  .option('schema', {
    type: 'string',
    description: 'Specific schema to seed',
    choices: ['assessment', 'donor', 'financial', 'volunteer', 'grant', 'impact'],
  })
  .option('all', {
    alias: 'a',
    type: 'boolean',
    description: 'Seed all schemas',
    default: false,
  })
  .option('clean', {
    alias: 'c',
    type: 'boolean',
    description: 'Clean existing data before seeding',
    default: false,
  })
  .example('$0 --size=small', 'Seed all schemas with small dataset')
  .example('$0 --schema=donor --size=medium', 'Seed only donor schema with medium dataset')
  .example('$0 --all --clean', 'Clean and reseed all schemas')
  .help('h')
  .alias('h', 'help')
  .version('1.0.0')
  .alias('v', 'version')
  .parseSync();

async function main() {
  try {
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║         NAIOS Platform - Seed Data Generator             ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('');

    const size = argv.size as DataSize;
    let schemas: SchemaType[];

    if (argv.all) {
      schemas = ['assessment', 'donor', 'financial', 'volunteer', 'grant', 'impact'];
    } else if (argv.schema) {
      schemas = [argv.schema as SchemaType];
    } else {
      schemas = ['assessment', 'donor', 'financial', 'volunteer', 'grant', 'impact'];
    }

    const config: SeedConfig = {
      size,
      schemas,
      clean: argv.clean || false,
    };

    if (argv.clean) {
      console.log('⚠️  WARNING: This will delete all existing data!');
      console.log('Press Ctrl+C within 5 seconds to cancel...\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    await seedDatabase(config);

    console.log('\n📊 Seeding Statistics:');
    console.log('───────────────────────────────────────────────────────────');
    console.log(`Data Size: ${size}`);
    console.log(`Schemas Seeded: ${schemas.join(', ')}`);
    console.log(`Clean Mode: ${argv.clean ? 'Yes' : 'No'}`);
    console.log('───────────────────────────────────────────────────────────\n');

  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

main();
