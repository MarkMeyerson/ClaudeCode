/**
 * Notion Integration Layer
 * Handles all interactions with Notion Business Tracker database
 * @module NotionIntegration
 */

import { Client } from '@notionhq/client';
import {
  BusinessCheckin,
  EnergyTrend,
  FounderMood,
  Briefing,
} from '../types';

/**
 * Notion Integration Client
 *
 * Provides methods to read/write from Notion Business Tracker database
 */
export class NotionIntegration {
  private client: Client;
  private businessTrackerDbId: string;

  /**
   * Initialize Notion client
   *
   * @param apiKey - Notion API key (integration token)
   * @param businessTrackerDbId - Database ID for Business Tracker
   */
  constructor(apiKey: string, businessTrackerDbId: string) {
    this.client = new Client({ auth: apiKey });
    this.businessTrackerDbId = businessTrackerDbId;
  }

  /**
   * Get the most recent check-in from Business Tracker
   *
   * @returns Latest business check-in data
   *
   * @example
   * ```typescript
   * const notion = new NotionIntegration(apiKey, dbId);
   * const checkin = await notion.getLatestCheckin();
   * console.log(`Energy: ${checkin.energy}/10`);
   * ```
   */
  async getLatestCheckin(): Promise<BusinessCheckin> {
    try {
      const response = await this.client.databases.query({
        database_id: this.businessTrackerDbId,
        sorts: [
          {
            property: 'Date',
            direction: 'descending',
          },
        ],
        page_size: 1,
      });

      if (response.results.length === 0) {
        // Return default checkin if none exists
        return this.getDefaultCheckin();
      }

      const page: any = response.results[0];
      return this.parseCheckinPage(page);
    } catch (error) {
      console.error('Error fetching latest check-in from Notion:', error);
      return this.getDefaultCheckin();
    }
  }

  /**
   * Get check-ins for the past N days
   *
   * @param days - Number of days to look back
   * @returns Array of check-ins
   */
  async getCheckinsForDays(days: number): Promise<BusinessCheckin[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const response = await this.client.databases.query({
        database_id: this.businessTrackerDbId,
        filter: {
          property: 'Date',
          date: {
            on_or_after: startDate.toISOString(),
          },
        },
        sorts: [
          {
            property: 'Date',
            direction: 'descending',
          },
        ],
      });

      return response.results.map((page: any) => this.parseCheckinPage(page));
    } catch (error) {
      console.error('Error fetching check-ins from Notion:', error);
      return [];
    }
  }

  /**
   * Calculate energy trend over time
   *
   * @param days - Number of days to analyze
   * @returns Energy trend analysis
   *
   * @example
   * ```typescript
   * const trend = await notion.getEnergyTrend(7);
   * console.log(`Average energy: ${trend.average}/10`);
   * console.log(`Trend: ${trend.trend}`);
   * ```
   */
  async getEnergyTrend(days: number = 7): Promise<EnergyTrend> {
    const checkins = await this.getCheckinsForDays(days);

    if (checkins.length === 0) {
      return {
        average: 5,
        min: 5,
        max: 5,
        trend: 'stable',
        dataPoints: [],
      };
    }

    const energies = checkins.map(c => c.energy);
    const average = energies.reduce((sum, e) => sum + e, 0) / energies.length;
    const min = Math.min(...energies);
    const max = Math.max(...energies);

    // Calculate trend (compare first half vs second half)
    const midPoint = Math.floor(checkins.length / 2);
    const firstHalf = checkins.slice(0, midPoint);
    const secondHalf = checkins.slice(midPoint);

    const firstHalfAvg = firstHalf.reduce((sum, c) => sum + c.energy, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, c) => sum + c.energy, 0) / secondHalf.length;

    const trend =
      secondHalfAvg > firstHalfAvg + 0.5 ? 'improving' :
      secondHalfAvg < firstHalfAvg - 0.5 ? 'declining' : 'stable';

    const dataPoints = checkins.map(c => ({
      date: c.date,
      energy: c.energy,
    }));

    return { average, min, max, trend, dataPoints };
  }

  /**
   * Create a new briefing page in Notion
   *
   * @param briefing - Briefing object to save
   * @param parentPageId - Optional parent page ID
   * @returns Created page ID
   *
   * @example
   * ```typescript
   * const pageId = await notion.createBriefingPage(briefing);
   * console.log(`Created briefing: ${pageId}`);
   * ```
   */
  async createBriefingPage(
    briefing: Briefing,
    parentPageId?: string
  ): Promise<string> {
    try {
      // Convert markdown to Notion blocks
      const blocks = this.markdownToNotionBlocks(briefing.markdown);

      const page = await this.client.pages.create({
        parent: parentPageId
          ? { page_id: parentPageId }
          : { database_id: this.businessTrackerDbId },
        properties: {
          Title: {
            title: [
              {
                text: {
                  content: `Daily Briefing - ${briefing.date.toLocaleDateString()}`,
                },
              },
            ],
          },
          Date: {
            date: {
              start: briefing.date.toISOString(),
            },
          },
          'Overall Health': {
            number: briefing.healthOverview.overall,
          },
          'Risk Count': {
            number: briefing.risks.length,
          },
        },
        children: blocks,
      });

      return page.id;
    } catch (error) {
      console.error('Error creating briefing page in Notion:', error);
      throw error;
    }
  }

  /**
   * Update today's check-in with calculated priorities
   *
   * @param priorities - Top 3 priorities to set
   */
  async updateTodayPriorities(priorities: string[]): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Find today's check-in
      const response = await this.client.databases.query({
        database_id: this.businessTrackerDbId,
        filter: {
          property: 'Date',
          date: {
            equals: today,
          },
        },
      });

      if (response.results.length === 0) {
        console.warn('No check-in found for today. Cannot update priorities.');
        return;
      }

      const pageId = response.results[0].id;

      // Update priorities field
      await this.client.pages.update({
        page_id: pageId,
        properties: {
          'Top Priorities': {
            rich_text: [
              {
                text: {
                  content: priorities.join('\n'),
                },
              },
            ],
          },
        },
      });
    } catch (error) {
      console.error('Error updating priorities in Notion:', error);
    }
  }

  /**
   * Parse Notion page into BusinessCheckin object
   *
   * @private
   */
  private parseCheckinPage(page: any): BusinessCheckin {
    const properties = page.properties;

    // Extract data from Notion properties
    const date = properties.Date?.date?.start
      ? new Date(properties.Date.date.start)
      : new Date();

    const energy = properties.Energy?.number || 5;

    const moodValue = properties.Mood?.select?.name?.toLowerCase() || 'okay';
    const mood: FounderMood =
      ['great', 'good', 'okay', 'struggling'].includes(moodValue)
        ? (moodValue as FounderMood)
        : 'okay';

    const topPriorities = properties['Top Priorities']?.rich_text?.[0]?.plain_text
      ?.split('\n')
      .filter((p: string) => p.trim()) || [];

    const blockers = properties.Blockers?.rich_text?.[0]?.plain_text
      ?.split('\n')
      .filter((b: string) => b.trim()) || [];

    const wins = properties.Wins?.rich_text?.[0]?.plain_text
      ?.split('\n')
      .filter((w: string) => w.trim()) || [];

    const challenges = properties.Challenges?.rich_text?.[0]?.plain_text
      ?.split('\n')
      .filter((c: string) => c.trim()) || [];

    const notes = properties.Notes?.rich_text?.[0]?.plain_text || '';

    return {
      id: page.id,
      date,
      energy,
      mood,
      topPriorities,
      blockers,
      wins,
      challenges,
      notes,
    };
  }

  /**
   * Get default check-in when none exists
   *
   * @private
   */
  private getDefaultCheckin(): BusinessCheckin {
    return {
      id: 'default',
      date: new Date(),
      energy: 7, // Assume moderate-high energy by default
      mood: 'good',
      topPriorities: [],
      blockers: [],
      wins: [],
      challenges: [],
      notes: '',
    };
  }

  /**
   * Convert markdown to Notion blocks (simplified)
   *
   * @private
   */
  private markdownToNotionBlocks(markdown: string): any[] {
    // This is a simplified conversion
    // For production, use a library like @tryfabric/martian

    const blocks: any[] = [];
    const lines = markdown.split('\n');

    for (const line of lines) {
      if (line.startsWith('# ')) {
        blocks.push({
          object: 'block',
          type: 'heading_1',
          heading_1: {
            rich_text: [{ text: { content: line.substring(2) } }],
          },
        });
      } else if (line.startsWith('## ')) {
        blocks.push({
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ text: { content: line.substring(3) } }],
          },
        });
      } else if (line.startsWith('### ')) {
        blocks.push({
          object: 'block',
          type: 'heading_3',
          heading_3: {
            rich_text: [{ text: { content: line.substring(4) } }],
          },
        });
      } else if (line.trim() === '---') {
        blocks.push({
          object: 'block',
          type: 'divider',
          divider: {},
        });
      } else if (line.trim()) {
        blocks.push({
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ text: { content: line } }],
          },
        });
      }
    }

    return blocks.slice(0, 100); // Notion limits to 100 blocks per request
  }

  /**
   * Health check for Notion integration
   *
   * @returns true if connection is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.databases.retrieve({
        database_id: this.businessTrackerDbId,
      });
      return true;
    } catch (error) {
      console.error('Notion health check failed:', error);
      return false;
    }
  }
}

/**
 * Create Notion integration instance
 *
 * @param apiKey - Notion API key
 * @param businessTrackerDbId - Business Tracker database ID
 * @returns Notion integration instance
 */
export function createNotionIntegration(
  apiKey: string,
  businessTrackerDbId: string
): NotionIntegration {
  return new NotionIntegration(apiKey, businessTrackerDbId);
}

export { NotionIntegration };
export default NotionIntegration;
