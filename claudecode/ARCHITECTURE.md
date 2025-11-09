# Multi-Agent System Architecture

## System Overview

The SherpaTech Multi-Agent System is designed as a modular, scalable platform where specialized agents collaborate to automate business operations. Each agent focuses on a specific domain while sharing common infrastructure.

## Core Principles

1. **Modularity** - Each agent is self-contained with clear responsibilities
2. **Shared Infrastructure** - Common utilities for database, logging, and integrations
3. **Event-Driven** - Agents communicate via events and messages
4. **Type Safety** - Full TypeScript implementation with strict typing
5. **Scalability** - Database-backed task queues and state management

## Agent Architecture

### Base Agent Class

All agents extend `BaseAgent` which provides:
- Task lifecycle management (create, execute, complete)
- State persistence and recovery
- Inter-agent messaging
- Event emission and handling
- Graceful initialization and shutdown

### Agent Lifecycle

```
Initialize → Load State → Process Tasks → Save State → Shutdown
     ↓            ↓              ↓            ↓           ↓
  onInitialize  loadState   processTask   saveState  onShutdown
```

### Task Processing Flow

```
1. Task Created → Stored in database (status: pending)
2. Agent Picks Up Task → Status updated to in_progress
3. Task Processed → Agent-specific logic executed
4. Result Generated → Task status updated (completed/failed)
5. Event Emitted → Other agents notified if needed
```

## Data Flow

### Integration Data Flow

```
External API (Notion/HubSpot/Stripe)
         ↓
Integration Client (with error handling)
         ↓
Agent Processing Layer
         ↓
Database (cache/state/tasks)
         ↓
Other Agents (via messages)
```

### Inter-Agent Communication

```
Agent A creates message → Database table: agent_messages
         ↓
Agent B polls for messages → Retrieves pending messages
         ↓
Agent B processes message → Updates message status
         ↓
Agent B takes action → Creates tasks/updates state
```

## Database Schema Design

### Core Tables

1. **agent_tasks** - Central task queue for all agents
   - Enables async processing
   - Priority-based execution
   - Audit trail of all operations

2. **agent_state** - Persistent agent state
   - Recovery after restarts
   - Stateful agent behavior
   - Last active tracking

3. **agent_events** - Event log
   - Debugging and monitoring
   - Audit trail
   - Analytics data

4. **agent_messages** - Inter-agent communication
   - Decoupled agent interaction
   - Asynchronous messaging
   - Message delivery tracking

5. **customer_cache** - Unified customer view
   - Aggregates data from all integrations
   - Fast lookups
   - Single source of truth

6. **knowledge_base** - Shared knowledge
   - Accessible by all agents
   - Tagged and categorized
   - Searchable content

## Integration Layer

### Design Principles

- **Abstraction** - Hide API complexity behind clean interfaces
- **Error Handling** - Wrap all calls with try/catch and custom errors
- **Logging** - Log all operations for debugging
- **Type Safety** - Define clear input/output types

### Client Structure

```typescript
class IntegrationClient {
  private client: ExternalSDK;
  private logger: Logger;

  constructor() {
    // Initialize with config
  }

  async operation(params): Promise<Result> {
    try {
      // Log operation
      // Make API call
      // Transform response
      // Return typed result
    } catch (error) {
      // Log error
      // Throw IntegrationError
    }
  }
}
```

## Error Handling Strategy

### Error Hierarchy

```
Error (base)
  ↓
AppError (operational errors)
  ├── ValidationError (400)
  ├── NotFoundError (404)
  ├── UnauthorizedError (401)
  ├── IntegrationError (502)
  ├── DatabaseError (500)
  └── AgentError (500)
```

### Error Flow

```
Error Occurs → Logged with context → Wrapped in specific error type
     ↓                ↓                       ↓
Task marked    Stored in logs      Returned to caller
as failed         table            with error info
```

## Logging Architecture

### Log Levels

- **error** - Critical issues requiring attention
- **warn** - Important but not critical issues
- **info** - General operational information
- **debug** - Detailed debugging information

### Log Destinations

1. Console (colored, formatted for development)
2. File: error.log (errors only)
3. File: combined.log (all levels)

### Log Structure

```typescript
{
  timestamp: "2024-01-15 10:30:45",
  level: "info",
  message: "Task completed",
  agentId: "sales",
  context: { taskId: "123", type: "sync_contacts" }
}
```

## Configuration Management

### Environment-Based Config

- Development: Loose validation, verbose logging
- Production: Strict validation, minimal logging, SSL enabled
- Test: Mock integrations, in-memory database

### Validation Strategy

Using Zod for runtime validation:
1. Define schema for all environment variables
2. Parse on application startup
3. Fail fast if configuration is invalid
4. Type-safe config object throughout application

## Security Considerations

1. **API Keys** - Stored in environment variables, never committed
2. **Database** - SSL in production, connection pooling with limits
3. **Input Validation** - All external inputs validated
4. **Error Messages** - No sensitive data in error responses
5. **Logging** - Sensitive data redacted from logs

## Scalability Considerations

### Current Design

- Single process with multiple agents
- Shared database connection pool
- Async task processing

### Future Scaling Options

1. **Horizontal Scaling**
   - Deploy multiple instances
   - Shared database for coordination
   - Task locking to prevent duplicates

2. **Agent Isolation**
   - Run each agent as separate process
   - Message queue (Redis/RabbitMQ) for communication
   - Dedicated database connections

3. **Caching Layer**
   - Redis for frequently accessed data
   - Reduce database load
   - Faster response times

## Monitoring & Observability

### Key Metrics to Track

1. **Agent Health**
   - Last active timestamp
   - Task success/failure rate
   - Average task duration

2. **Integration Health**
   - API call success rate
   - Response times
   - Rate limit usage

3. **Database Health**
   - Connection pool utilization
   - Query performance
   - Table sizes

4. **System Health**
   - Memory usage
   - CPU usage
   - Error rates

## Testing Strategy

### Unit Tests

- Test individual functions and methods
- Mock external dependencies
- Fast execution
- High coverage of business logic

### Integration Tests

- Test full workflows
- Real database (test instance)
- Real API calls (test accounts)
- Slower but comprehensive

### Test Organization

```
tests/
├── unit/
│   ├── agents/          # Agent logic tests
│   ├── integrations/    # Integration client tests
│   └── utils/          # Utility function tests
└── integration/
    ├── workflows/      # End-to-end workflows
    └── api/           # API integration tests
```

## Deployment Architecture

### Recommended Setup

```
Application Layer
├── Node.js Process (Multi-Agent System)
├── Environment Variables (API keys, config)
└── Log Directory

Database Layer
└── PostgreSQL (with connection pooling)

External Services
├── Notion API
├── HubSpot API
└── Stripe API
```

### Deployment Checklist

1. Set up PostgreSQL database
2. Run database migrations
3. Configure environment variables
4. Install dependencies
5. Build TypeScript
6. Start application
7. Monitor logs for successful startup
8. Verify database connections
9. Test integration connectivity

## Future Enhancements

### Phase 2 Features

1. **Web Dashboard**
   - Monitor agent status
   - View task queues
   - Trigger manual tasks

2. **Webhook Endpoints**
   - Receive external events
   - Trigger agent actions
   - Real-time integrations

3. **Advanced Scheduling**
   - Cron-based task scheduling
   - Recurring tasks
   - Time-based triggers

4. **Machine Learning**
   - Predictive analytics
   - Anomaly detection
   - Intelligent task routing

### Phase 3 Features

1. **Multi-Tenancy**
   - Support multiple customers
   - Isolated data
   - Per-tenant configuration

2. **API Gateway**
   - External API access
   - Authentication/authorization
   - Rate limiting

3. **Advanced Analytics**
   - Business intelligence dashboards
   - Custom reports
   - Data exports

## Contributing Guidelines

### Code Standards

1. Follow TypeScript best practices
2. Use ESLint and Prettier
3. Write tests for new features
4. Document public APIs
5. Use meaningful commit messages

### Adding a New Agent

1. Create directory in `src/agents/[name]`
2. Extend `BaseAgent` class
3. Implement required methods
4. Add agent configuration
5. Update environment variables
6. Write tests
7. Update documentation

### Adding a New Integration

1. Create client in `src/shared/integrations/[name].ts`
2. Define types in `src/shared/types/index.ts`
3. Add configuration to `.env.example`
4. Implement error handling
5. Add logging
6. Write tests
7. Document usage

---

This architecture is designed to be flexible, maintainable, and scalable as the system grows and evolves.
