/**
 * Shared Claude API Client
 * Provides methods to interact with Claude for AI-powered analysis
 */

import Anthropic from '@anthropic-ai/sdk';
import { config } from '../utils/config';
import { logger } from '../utils/logger';

let claudeClient: Anthropic | null = null;

/**
 * Initialize Claude client
 */
export function initClaudeClient(): Anthropic {
  if (claudeClient) {
    return claudeClient;
  }

  if (!config.claudeApiKey) {
    throw new Error('CLAUDE_API_KEY or ANTHROPIC_API_KEY is required but not configured');
  }

  claudeClient = new Anthropic({
    apiKey: config.claudeApiKey,
  });

  logger.info('Claude client initialized');

  return claudeClient;
}

/**
 * Get Claude client instance
 */
export function getClaudeClient(): Anthropic {
  if (!claudeClient) {
    return initClaudeClient();
  }
  return claudeClient;
}

/**
 * Send a message to Claude and get a response
 */
export async function sendMessage(
  systemPrompt: string,
  userMessage: string,
  model: string = 'claude-3-5-sonnet-20241022',
  maxTokens: number = 4096
): Promise<string> {
  const client = getClaudeClient();

  try {
    logger.debug('Sending message to Claude', {
      model,
      messageLength: userMessage.length,
    });

    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    logger.debug('Received response from Claude', {
      responseLength: content.text.length,
      usage: response.usage,
    });

    return content.text;
  } catch (error: any) {
    logger.error('Failed to get response from Claude', {
      error: error.message,
    });
    throw error;
  }
}

/**
 * Analyze financial data with Claude
 */
export async function analyzeFinancialData(
  data: Record<string, any>,
  analysisType: string
): Promise<string> {
  const systemPrompt = `You are a financial analyst AI assistant for SherpaTech.AI.
You provide accurate, actionable financial insights based on the data provided.
You are data-driven, precise, and proactive. You surface problems before they become critical.`;

  const userMessage = `Analyze the following financial data for ${analysisType}:

${JSON.stringify(data, null, 2)}

Provide:
1. Key insights
2. Trends and patterns
3. Risks or concerns
4. Actionable recommendations

Format your response as structured JSON with these fields:
{
  "insights": ["insight 1", "insight 2", ...],
  "trends": ["trend 1", "trend 2", ...],
  "risks": ["risk 1", "risk 2", ...],
  "recommendations": ["recommendation 1", "recommendation 2", ...]
}`;

  return await sendMessage(systemPrompt, userMessage);
}

/**
 * Generate financial forecast with Claude
 */
export async function generateForecast(
  historicalData: Record<string, any>,
  forecastPeriod: string
): Promise<string> {
  const systemPrompt = `You are a financial forecasting AI assistant for SherpaTech.AI.
You analyze historical financial data and generate realistic forecasts based on trends, seasonality, and business context.`;

  const userMessage = `Generate a financial forecast for ${forecastPeriod} based on this historical data:

${JSON.stringify(historicalData, null, 2)}

Provide a structured forecast with:
1. Revenue projections
2. Expense projections
3. Cash flow projections
4. Confidence levels
5. Key assumptions

Format your response as structured JSON.`;

  return await sendMessage(systemPrompt, userMessage);
}

export default {
  initClaudeClient,
  getClaudeClient,
  sendMessage,
  analyzeFinancialData,
  generateForecast,
};
