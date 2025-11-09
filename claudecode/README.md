# SherpaTech Multi-Agent System

A scalable, modular multi-agent business automation system built with TypeScript, integrating Notion, HubSpot, and Stripe for comprehensive business operations.

## Overview

This system coordinates 6 specialized agents that work together to automate and optimize business processes:

1. **CEO Orchestrator** - Strategic coordination and decision-making
2. **Sales Engine** - Lead tracking and deal management via HubSpot
3. **Operations Manager** - Project and workflow management
4. **Finance Tracker** - Payment and financial monitoring via Stripe
5. **Consulting Knowledge** - Knowledge base management via Notion
6. **Content Orchestrator** - Content creation and distribution

## Architecture

```
claudecode/
├── src/
│   ├── agents/              # Individual agent implementations
│   │   ├── ceo/            # CEO Orchestrator
│   │   ├── sales/          # Sales Engine
│   │   ├── operations/     # Operations Manager
│   │   ├── finance/        # Finance Tracker
│   │   ├── consulting/     # Consulting Knowledge
│   │   └── content/        # Content Orchestrator
│   ├── shared/             # Shared infrastructure
│   │   ├── config/         # Environment configuration
│   │   ├── database/       # PostgreSQL utilities
│   │   ├── integrations/   # Notion, HubSpot, Stripe clients
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Logging, errors, base agent
│   └── index.ts            # Main entry point
├── tests/                  # Test suites
├── logs/                   # Application logs
└── dist/                   # Compiled JavaScript
```

## Features

### Shared Infrastructure
- **TypeScript** - Type-safe development
- **PostgreSQL** - Centralized data storage
- **Environment-based Configuration** - Flexible deployment
- **Comprehensive Logging** - Winston-based logging system
- **Error Handling** - Custom error classes and handlers
- **Base Agent Class** - Reusable agent foundation

### Integration Clients
- **Notion Client** - Database queries, page management, search
- **HubSpot Client** - Contact/deal CRM operations
- **Stripe Client** - Payment, customer, subscription management

### Database Schema
- Agent tasks and state management
- Inter-agent messaging
- Integration sync logs
- Knowledge base storage
- Customer data cache

## Prerequisites

- Node.js 18+
- PostgreSQL 12+
- API keys for:
  - Notion
  - HubSpot
  - Stripe

## Installation

1. Clone the repository:
```bash
cd claudecode
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your actual credentials
```

4. Set up the database:
```bash
npm run migrate
```

## Configuration

Edit `.env` file with your credentials:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/sherpatech_agents

# Notion
NOTION_API_KEY=your_notion_api_key
NOTION_DATABASE_ID=your_database_id

# HubSpot
HUBSPOT_API_KEY=your_hubspot_api_key

# Stripe
STRIPE_API_KEY=your_stripe_secret_key

# Agent Configuration
CEO_AGENT_ENABLED=true
SALES_AGENT_ENABLED=true
# ... etc
```

## Usage

### Development Mode
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Running Tests
```bash
npm test                  # All tests
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
```

### Database Migration
```bash
npm run migrate
```

## Agent Development

### Creating a New Agent

Extend the `BaseAgent` class:

```typescript
import { BaseAgent, appConfig } from '../../shared';
import type { AgentTask, AgentResult } from '../../shared/types';

export class MyAgent extends BaseAgent {
  constructor() {
    super('my_agent', true);
  }

  protected async onInitialize(): Promise<void> {
    // Initialization logic
  }

  protected async processTask<T>(task: AgentTask): Promise<AgentResult<T>> {
    // Task processing logic
    switch (task.type) {
      case 'my_task':
        return await this.handleMyTask(task);
      default:
        return { success: false, error: 'Unknown task' };
    }
  }

  protected async onShutdown(): Promise<void> {
    // Cleanup logic
  }
}
```

### Working with Tasks

```typescript
// Create a task
const task = await agent.createTask('task_type', { data: 'value' }, 'high');

// Execute a task
const result = await agent.executeTask(task);

// Get pending tasks
const pendingTasks = await agent.getPendingTasks(10);
```

### Inter-Agent Communication

```typescript
// Send message to another agent
await agent.sendMessage('target_agent_id', 'message_type', { payload: 'data' });

// Receive messages
const messages = await agent.getPendingMessages(50);
```

### Agent State Management

```typescript
// Save state
await agent.saveState({ key: 'value', lastRun: new Date() });

// Load state
const state = await agent.loadState();
```

## Integration Usage

### Notion Client

```typescript
import { notionClient } from './shared';

// Query database
const pages = await notionClient.queryDatabase('database_id', filter);

// Create page
const page = await notionClient.createPage('database_id', properties);

// Search
const results = await notionClient.search('query string');
```

### HubSpot Client

```typescript
import { hubspotClient } from './shared';

// Get contact
const contact = await hubspotClient.getContactByEmail('email@example.com');

// Create deal
const deal = await hubspotClient.createDeal({ dealname: 'New Deal' });

// Associate contact with deal
await hubspotClient.associateContactWithDeal(contactId, dealId);
```

### Stripe Client

```typescript
import { stripeClient } from './shared';

// Get customer
const customer = await stripeClient.getCustomer('customer_id');

// Create payment intent
const payment = await stripeClient.createPaymentIntent({
  amount: 5000,
  currency: 'usd',
});

// Get customer payments
const payments = await stripeClient.getCustomerPayments('customer_id');
```

## Database Schema

### Tables

- **agent_tasks** - Task queue and history
- **agent_events** - Event log
- **agent_state** - Persistent agent state
- **integration_sync_logs** - Integration sync tracking
- **knowledge_base** - Shared knowledge repository
- **customer_cache** - Aggregated customer data
- **agent_messages** - Inter-agent communication

## Error Handling

Custom error classes for different scenarios:

```typescript
import {
  ValidationError,
  NotFoundError,
  IntegrationError,
  DatabaseError,
  AgentError
} from './shared';

throw new IntegrationError('Notion', 'Connection failed');
throw new AgentError('sales', 'Task processing failed');
```

## Logging

```typescript
import { Logger } from './shared';

const logger = new Logger('MyComponent');

logger.info('Operation completed', { data: 'value' });
logger.error('Operation failed', error, { context: 'info' });
logger.debug('Debug information', { details: 'here' });
```

## Testing

Tests are organized in [tests/](tests/) directory:

```
tests/
├── unit/           # Unit tests for individual components
└── integration/    # Integration tests for full workflows
```

## Deployment

1. Build the project:
```bash
npm run build
```

2. Set environment variables on your server

3. Run database migrations:
```bash
npm run migrate
```

4. Start the application:
```bash
npm start
```

## Monitoring

- Application logs are written to [logs/](logs/) directory
- Database pool status available via `db.getPoolStatus()`
- Agent status via `agent.getStatus()`

## Security

- Never commit `.env` file
- Store API keys securely
- Use environment variables for all credentials
- Enable SSL for production database connections

## Contributing

1. Create a feature branch
2. Make your changes
3. Add tests for new functionality
4. Run tests and ensure they pass
5. Submit a pull request

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.

---

Built with TypeScript, Node.js, PostgreSQL, Notion, HubSpot, and Stripe.
