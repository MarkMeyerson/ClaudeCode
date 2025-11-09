import { Client } from '@hubspot/api-client';
import { appConfig } from '../config';
import { Logger } from '../utils/logger';
import { IntegrationError } from '../utils/errors';
import type { HubSpotContact, HubSpotDeal } from '../types';

export class HubSpotClient {
  private client: Client;
  private logger: Logger;

  constructor() {
    this.client = new Client({
      accessToken: appConfig.integrations.hubspot.apiKey,
    });
    this.logger = new Logger('HubSpotClient');
  }

  // Contact Operations
  /**
   * Get a contact by ID
   */
  async getContact(contactId: string): Promise<HubSpotContact> {
    try {
      this.logger.debug('Fetching contact', { contactId });
      const response = await this.client.crm.contacts.basicApi.getById(contactId);

      return {
        id: response.id,
        properties: response.properties,
      };
    } catch (error) {
      this.logger.error('Failed to get contact', error as Error, { contactId });
      throw new IntegrationError('HubSpot', 'Failed to get contact', error as Error);
    }
  }

  /**
   * Get contact by email
   */
  async getContactByEmail(email: string): Promise<HubSpotContact | null> {
    try {
      this.logger.debug('Searching contact by email', { email });
      const response = await this.client.crm.contacts.searchApi.doSearch({
        filterGroups: [
          {
            filters: [
              {
                propertyName: 'email',
                operator: 'EQ',
                value: email,
              },
            ],
          },
        ],
      });

      if (response.results.length === 0) {
        return null;
      }

      const contact = response.results[0];
      return {
        id: contact.id,
        properties: contact.properties,
      };
    } catch (error) {
      this.logger.error('Failed to search contact by email', error as Error, { email });
      throw new IntegrationError('HubSpot', 'Failed to search contact', error as Error);
    }
  }

  /**
   * Create a new contact
   */
  async createContact(properties: HubSpotContact['properties']): Promise<HubSpotContact> {
    try {
      this.logger.debug('Creating contact', { properties });
      const response = await this.client.crm.contacts.basicApi.create({
        properties,
      });

      return {
        id: response.id,
        properties: response.properties,
      };
    } catch (error) {
      this.logger.error('Failed to create contact', error as Error, { properties });
      throw new IntegrationError('HubSpot', 'Failed to create contact', error as Error);
    }
  }

  /**
   * Update a contact
   */
  async updateContact(contactId: string, properties: Partial<HubSpotContact['properties']>): Promise<HubSpotContact> {
    try {
      this.logger.debug('Updating contact', { contactId, properties });
      const response = await this.client.crm.contacts.basicApi.update(contactId, {
        properties,
      });

      return {
        id: response.id,
        properties: response.properties,
      };
    } catch (error) {
      this.logger.error('Failed to update contact', error as Error, { contactId });
      throw new IntegrationError('HubSpot', 'Failed to update contact', error as Error);
    }
  }

  /**
   * Delete a contact
   */
  async deleteContact(contactId: string): Promise<void> {
    try {
      this.logger.debug('Deleting contact', { contactId });
      await this.client.crm.contacts.basicApi.archive(contactId);
      this.logger.info('Contact deleted successfully', { contactId });
    } catch (error) {
      this.logger.error('Failed to delete contact', error as Error, { contactId });
      throw new IntegrationError('HubSpot', 'Failed to delete contact', error as Error);
    }
  }

  // Deal Operations
  /**
   * Get a deal by ID
   */
  async getDeal(dealId: string): Promise<HubSpotDeal> {
    try {
      this.logger.debug('Fetching deal', { dealId });
      const response = await this.client.crm.deals.basicApi.getById(dealId);

      return {
        id: response.id,
        properties: response.properties,
      };
    } catch (error) {
      this.logger.error('Failed to get deal', error as Error, { dealId });
      throw new IntegrationError('HubSpot', 'Failed to get deal', error as Error);
    }
  }

  /**
   * Create a new deal
   */
  async createDeal(properties: HubSpotDeal['properties']): Promise<HubSpotDeal> {
    try {
      this.logger.debug('Creating deal', { properties });
      const response = await this.client.crm.deals.basicApi.create({
        properties,
      });

      return {
        id: response.id,
        properties: response.properties,
      };
    } catch (error) {
      this.logger.error('Failed to create deal', error as Error, { properties });
      throw new IntegrationError('HubSpot', 'Failed to create deal', error as Error);
    }
  }

  /**
   * Update a deal
   */
  async updateDeal(dealId: string, properties: Partial<HubSpotDeal['properties']>): Promise<HubSpotDeal> {
    try {
      this.logger.debug('Updating deal', { dealId, properties });
      const response = await this.client.crm.deals.basicApi.update(dealId, {
        properties,
      });

      return {
        id: response.id,
        properties: response.properties,
      };
    } catch (error) {
      this.logger.error('Failed to update deal', error as Error, { dealId });
      throw new IntegrationError('HubSpot', 'Failed to update deal', error as Error);
    }
  }

  /**
   * Associate a contact with a deal
   */
  async associateContactWithDeal(contactId: string, dealId: string): Promise<void> {
    try {
      this.logger.debug('Associating contact with deal', { contactId, dealId });
      await this.client.crm.deals.associationsApi.create(
        dealId,
        'contacts',
        contactId,
        'deal_to_contact'
      );
      this.logger.info('Contact associated with deal', { contactId, dealId });
    } catch (error) {
      this.logger.error('Failed to associate contact with deal', error as Error, { contactId, dealId });
      throw new IntegrationError('HubSpot', 'Failed to associate contact with deal', error as Error);
    }
  }

  /**
   * Search deals
   */
  async searchDeals(filters: any[]): Promise<HubSpotDeal[]> {
    try {
      this.logger.debug('Searching deals', { filters });
      const response = await this.client.crm.deals.searchApi.doSearch({
        filterGroups: [{ filters }],
      });

      return response.results.map((deal) => ({
        id: deal.id,
        properties: deal.properties,
      }));
    } catch (error) {
      this.logger.error('Failed to search deals', error as Error);
      throw new IntegrationError('HubSpot', 'Failed to search deals', error as Error);
    }
  }

  /**
   * Get all contacts with pagination
   */
  async getAllContacts(limit: number = 100): Promise<HubSpotContact[]> {
    try {
      this.logger.debug('Fetching all contacts', { limit });
      const response = await this.client.crm.contacts.basicApi.getPage(limit);

      return response.results.map((contact) => ({
        id: contact.id,
        properties: contact.properties,
      }));
    } catch (error) {
      this.logger.error('Failed to get all contacts', error as Error);
      throw new IntegrationError('HubSpot', 'Failed to get all contacts', error as Error);
    }
  }
}

export const hubspotClient = new HubSpotClient();
export default HubSpotClient;
