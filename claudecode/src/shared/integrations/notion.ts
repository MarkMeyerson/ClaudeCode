import { Client } from '@notionhq/client';
import { appConfig } from '../config';
import { Logger } from '../utils/logger';
import { IntegrationError } from '../utils/errors';
import type { NotionPage, NotionDatabase } from '../types';

export class NotionClient {
  private client: Client;
  private logger: Logger;

  constructor() {
    this.client = new Client({
      auth: appConfig.integrations.notion.apiKey,
    });
    this.logger = new Logger('NotionClient');
  }

  /**
   * Get a database by ID
   */
  async getDatabase(databaseId: string): Promise<NotionDatabase> {
    try {
      this.logger.debug('Fetching database', { databaseId });
      const response = await this.client.databases.retrieve({
        database_id: databaseId,
      });

      return {
        id: response.id,
        title: 'title' in response && Array.isArray(response.title)
          ? response.title[0]?.plain_text || ''
          : '',
        properties: response.properties,
      };
    } catch (error) {
      this.logger.error('Failed to get database', error as Error, { databaseId });
      throw new IntegrationError('Notion', 'Failed to get database', error as Error);
    }
  }

  /**
   * Query a database with filters
   */
  async queryDatabase(
    databaseId: string,
    filter?: any,
    sorts?: any[]
  ): Promise<NotionPage[]> {
    try {
      this.logger.debug('Querying database', { databaseId, filter, sorts });
      const response = await this.client.databases.query({
        database_id: databaseId,
        filter,
        sorts,
      });

      return response.results.map((page: any) => ({
        id: page.id,
        properties: page.properties,
        url: page.url,
        createdTime: page.created_time,
        lastEditedTime: page.last_edited_time,
      }));
    } catch (error) {
      this.logger.error('Failed to query database', error as Error, { databaseId });
      throw new IntegrationError('Notion', 'Failed to query database', error as Error);
    }
  }

  /**
   * Get a page by ID
   */
  async getPage(pageId: string): Promise<NotionPage> {
    try {
      this.logger.debug('Fetching page', { pageId });
      const response = await this.client.pages.retrieve({
        page_id: pageId,
      });

      return {
        id: response.id,
        properties: 'properties' in response ? response.properties : {},
        url: response.url,
        createdTime: response.created_time,
        lastEditedTime: response.last_edited_time,
      };
    } catch (error) {
      this.logger.error('Failed to get page', error as Error, { pageId });
      throw new IntegrationError('Notion', 'Failed to get page', error as Error);
    }
  }

  /**
   * Create a new page in a database
   */
  async createPage(databaseId: string, properties: Record<string, any>): Promise<NotionPage> {
    try {
      this.logger.debug('Creating page', { databaseId, properties });
      const response = await this.client.pages.create({
        parent: { database_id: databaseId },
        properties,
      });

      return {
        id: response.id,
        properties: 'properties' in response ? response.properties : {},
        url: response.url,
        createdTime: response.created_time,
        lastEditedTime: response.last_edited_time,
      };
    } catch (error) {
      this.logger.error('Failed to create page', error as Error, { databaseId });
      throw new IntegrationError('Notion', 'Failed to create page', error as Error);
    }
  }

  /**
   * Update a page
   */
  async updatePage(pageId: string, properties: Record<string, any>): Promise<NotionPage> {
    try {
      this.logger.debug('Updating page', { pageId, properties });
      const response = await this.client.pages.update({
        page_id: pageId,
        properties,
      });

      return {
        id: response.id,
        properties: 'properties' in response ? response.properties : {},
        url: response.url,
        createdTime: response.created_time,
        lastEditedTime: response.last_edited_time,
      };
    } catch (error) {
      this.logger.error('Failed to update page', error as Error, { pageId });
      throw new IntegrationError('Notion', 'Failed to update page', error as Error);
    }
  }

  /**
   * Archive (delete) a page
   */
  async archivePage(pageId: string): Promise<void> {
    try {
      this.logger.debug('Archiving page', { pageId });
      await this.client.pages.update({
        page_id: pageId,
        archived: true,
      });
      this.logger.info('Page archived successfully', { pageId });
    } catch (error) {
      this.logger.error('Failed to archive page', error as Error, { pageId });
      throw new IntegrationError('Notion', 'Failed to archive page', error as Error);
    }
  }

  /**
   * Get page content (blocks)
   */
  async getPageContent(pageId: string): Promise<any[]> {
    try {
      this.logger.debug('Fetching page content', { pageId });
      const response = await this.client.blocks.children.list({
        block_id: pageId,
      });

      return response.results;
    } catch (error) {
      this.logger.error('Failed to get page content', error as Error, { pageId });
      throw new IntegrationError('Notion', 'Failed to get page content', error as Error);
    }
  }

  /**
   * Search Notion
   */
  async search(query: string, filter?: { property: string; value: string }): Promise<NotionPage[]> {
    try {
      this.logger.debug('Searching Notion', { query, filter });
      const response = await this.client.search({
        query,
        filter: filter ? { property: filter.property, value: filter.value } : undefined,
      });

      return response.results
        .filter((result: any) => result.object === 'page')
        .map((page: any) => ({
          id: page.id,
          properties: page.properties || {},
          url: page.url,
          createdTime: page.created_time,
          lastEditedTime: page.last_edited_time,
        }));
    } catch (error) {
      this.logger.error('Failed to search Notion', error as Error, { query });
      throw new IntegrationError('Notion', 'Failed to search', error as Error);
    }
  }
}

export const notionClient = new NotionClient();
export default NotionClient;
