import winston from 'winston';
import { appConfig } from '../config';
import type { LogLevel, LogEntry } from '../types';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, agentId, context, stack }) => {
    let log = `${timestamp} [${level}]`;
    if (agentId) log += ` [${agentId}]`;
    log += `: ${message}`;
    if (context && Object.keys(context).length > 0) {
      log += ` ${JSON.stringify(context)}`;
    }
    if (stack) log += `\n${stack}`;
    return log;
  })
);

const logger = winston.createLogger({
  level: appConfig.logLevel,
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  ],
});

export class Logger {
  private agentId?: string;

  constructor(agentId?: string) {
    this.agentId = agentId;
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error) {
    logger.log(level, message, {
      agentId: this.agentId,
      context,
      ...(error && { stack: error.stack }),
    });
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    this.log('error', message, context, error);
  }

  warn(message: string, context?: Record<string, any>) {
    this.log('warn', message, context);
  }

  info(message: string, context?: Record<string, any>) {
    this.log('info', message, context);
  }

  debug(message: string, context?: Record<string, any>) {
    this.log('debug', message, context);
  }

  createChildLogger(childAgentId: string): Logger {
    return new Logger(childAgentId);
  }
}

export const globalLogger = new Logger();
export default Logger;
