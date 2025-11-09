import { appConfig, db, globalLogger } from './shared';

async function main() {
  globalLogger.info('Starting SherpaTech Multi-Agent System');
  globalLogger.info('Environment:', { env: appConfig.env });

  try {
    // Test database connection
    const dbConnected = await db.testConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }

    globalLogger.info('Database connected successfully');

    // Log enabled agents
    const enabledAgents = Object.entries(appConfig.agents)
      .filter(([_, config]) => config.enabled)
      .map(([key, config]) => config.name);

    globalLogger.info('Enabled agents:', { agents: enabledAgents });

    // TODO: Initialize and start agents
    // This will be implemented when individual agents are created

    globalLogger.info('Multi-Agent System initialized successfully');

    // Keep the process running
    process.on('SIGINT', async () => {
      globalLogger.info('Shutting down gracefully...');
      await db.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      globalLogger.info('Shutting down gracefully...');
      await db.close();
      process.exit(0);
    });
  } catch (error) {
    globalLogger.error('Failed to start Multi-Agent System', error as Error);
    process.exit(1);
  }
}

main();
