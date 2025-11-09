import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment schema validation
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().optional(),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().transform(Number).default('5432'),
  DB_NAME: z.string().default('sherpatech_agents'),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),

  // Notion
  NOTION_API_KEY: z.string(),
  NOTION_DATABASE_ID: z.string().optional(),

  // HubSpot
  HUBSPOT_API_KEY: z.string(),
  HUBSPOT_PORTAL_ID: z.string().optional(),

  // Stripe
  STRIPE_API_KEY: z.string(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  PORT: z.string().transform(Number).default('3000'),

  // Agents
  CEO_AGENT_ENABLED: z.string().transform(val => val === 'true').default('true'),
  SALES_AGENT_ENABLED: z.string().transform(val => val === 'true').default('true'),
  OPERATIONS_AGENT_ENABLED: z.string().transform(val => val === 'true').default('true'),
  FINANCE_AGENT_ENABLED: z.string().transform(val => val === 'true').default('true'),
  CONSULTING_AGENT_ENABLED: z.string().transform(val => val === 'true').default('true'),
  CONTENT_AGENT_ENABLED: z.string().transform(val => val === 'true').default('true'),
});

type Env = z.infer<typeof envSchema>;

let config: Env;

try {
  config = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('Environment validation failed:');
    console.error(error.errors);
    process.exit(1);
  }
  throw error;
}

export const appConfig = {
  env: config.NODE_ENV,
  port: config.PORT,
  logLevel: config.LOG_LEVEL,

  database: {
    url: config.DATABASE_URL || `postgresql://${config.DB_USER}:${config.DB_PASSWORD}@${config.DB_HOST}:${config.DB_PORT}/${config.DB_NAME}`,
    host: config.DB_HOST,
    port: config.DB_PORT,
    database: config.DB_NAME,
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    ssl: config.NODE_ENV === 'production',
  },

  integrations: {
    notion: {
      apiKey: config.NOTION_API_KEY,
      databaseId: config.NOTION_DATABASE_ID,
    },
    hubspot: {
      apiKey: config.HUBSPOT_API_KEY,
      portalId: config.HUBSPOT_PORTAL_ID,
    },
    stripe: {
      apiKey: config.STRIPE_API_KEY,
      webhookSecret: config.STRIPE_WEBHOOK_SECRET,
    },
  },

  agents: {
    ceo: { name: 'CEO Orchestrator', enabled: config.CEO_AGENT_ENABLED },
    sales: { name: 'Sales Engine', enabled: config.SALES_AGENT_ENABLED },
    operations: { name: 'Operations Manager', enabled: config.OPERATIONS_AGENT_ENABLED },
    finance: { name: 'Finance Tracker', enabled: config.FINANCE_AGENT_ENABLED },
    consulting: { name: 'Consulting Knowledge', enabled: config.CONSULTING_AGENT_ENABLED },
    content: { name: 'Content Orchestrator', enabled: config.CONTENT_AGENT_ENABLED },
  },
};

export default appConfig;
