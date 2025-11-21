/**
 * NAIOS Platform - HubSpot CRM Integration
 *
 * Complete HubSpot integration for donor management, campaign tracking,
 * and marketing automation
 *
 * @version 1.0.0
 */

import axios, { AxiosInstance } from 'axios';
import { logger } from '@naios/shared/utils/logger';
import dotenv from 'dotenv';

dotenv.config();

// ============================================================================
// HUBSPOT CLIENT CONFIGURATION
// ============================================================================

class HubSpotClient {
  private client: AxiosInstance;
  private apiKey: string;
  private baseURL: string = 'https://api.hubapi.com';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.HUBSPOT_API_KEY || '';

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      timeout: 30000
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug('HubSpot API request', {
          method: config.method,
          url: config.url,
          params: config.params
        });
        return config;
      },
      (error) => {
        logger.error('HubSpot request error', { error });
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        logger.debug('HubSpot API response', {
          status: response.status,
          url: response.config.url
        });
        return response;
      },
      (error) => {
        logger.error('HubSpot response error', {
          status: error.response?.status,
          message: error.response?.data?.message,
          url: error.config?.url
        });
        return Promise.reject(error);
      }
    );
  }

  // ========================================================================
  // CONTACT MANAGEMENT
  // ========================================================================

  /**
   * Create a contact in HubSpot
   *
   * @param contactData - Contact properties
   * @returns Created contact
   */
  async createContact(contactData: {
    email: string;
    firstname?: string;
    lastname?: string;
    phone?: string;
    company?: string;
    website?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    lifecyclestage?: string;
    donor_level?: string;
    lifetime_value?: number;
    last_donation_date?: string;
    [key: string]: any;
  }): Promise<any> {
    try {
      logger.info('Creating HubSpot contact', { email: contactData.email });

      const response = await this.client.post('/crm/v3/objects/contacts', {
        properties: contactData
      });

      logger.info('HubSpot contact created', {
        contact_id: response.data.id,
        email: contactData.email
      });

      return response.data;
    } catch (error: any) {
      // Handle duplicate contact
      if (error.response?.status === 409) {
        logger.warn('Contact already exists, updating instead', {
          email: contactData.email
        });

        // Get existing contact by email
        const existing = await this.searchContactsByEmail(contactData.email);
        if (existing.length > 0) {
          return await this.updateContact(existing[0].id, contactData);
        }
      }

      logger.error('Failed to create HubSpot contact', {
        email: contactData.email,
        error
      });
      throw error;
    }
  }

  /**
   * Update a contact in HubSpot
   *
   * @param contactId - HubSpot contact ID
   * @param updates - Properties to update
   * @returns Updated contact
   */
  async updateContact(contactId: string, updates: Record<string, any>): Promise<any> {
    try {
      logger.info('Updating HubSpot contact', { contact_id: contactId });

      const response = await this.client.patch(
        `/crm/v3/objects/contacts/${contactId}`,
        { properties: updates }
      );

      logger.info('HubSpot contact updated', { contact_id: contactId });

      return response.data;
    } catch (error) {
      logger.error('Failed to update HubSpot contact', { contact_id: contactId, error });
      throw error;
    }
  }

  /**
   * Get a contact from HubSpot
   *
   * @param contactId - HubSpot contact ID
   * @param properties - Properties to retrieve
   * @returns Contact data
   */
  async getContact(contactId: string, properties?: string[]): Promise<any> {
    try {
      const params: any = {};
      if (properties) {
        params.properties = properties.join(',');
      }

      const response = await this.client.get(
        `/crm/v3/objects/contacts/${contactId}`,
        { params }
      );

      return response.data;
    } catch (error) {
      logger.error('Failed to get HubSpot contact', { contact_id: contactId, error });
      throw error;
    }
  }

  /**
   * Search contacts by email
   *
   * @param email - Email address to search
   * @returns Array of matching contacts
   */
  async searchContactsByEmail(email: string): Promise<any[]> {
    try {
      const response = await this.client.post('/crm/v3/objects/contacts/search', {
        filterGroups: [
          {
            filters: [
              {
                propertyName: 'email',
                operator: 'EQ',
                value: email
              }
            ]
          }
        ]
      });

      return response.data.results || [];
    } catch (error) {
      logger.error('Failed to search HubSpot contacts', { email, error });
      throw error;
    }
  }

  /**
   * Batch create or update contacts
   *
   * @param contacts - Array of contact data
   * @returns Batch operation results
   */
  async batchUpsertContacts(contacts: any[]): Promise<any> {
    try {
      logger.info('Batch upserting HubSpot contacts', { count: contacts.length });

      const response = await this.client.post('/crm/v3/objects/contacts/batch/upsert', {
        inputs: contacts.map(contact => ({
          properties: contact,
          id: contact.email,
          idProperty: 'email'
        }))
      });

      logger.info('Batch upsert completed', {
        status: response.data.status,
        num_processed: response.data.numProcessed
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to batch upsert contacts', { error });
      throw error;
    }
  }

  // ========================================================================
  // DEAL MANAGEMENT
  // ========================================================================

  /**
   * Create a deal (for major gifts, campaigns, etc.)
   *
   * @param dealData - Deal properties
   * @returns Created deal
   */
  async createDeal(dealData: {
    dealname: string;
    amount?: number;
    closedate?: string;
    dealstage: string;
    pipeline?: string;
    hubspot_owner_id?: string;
    [key: string]: any;
  }): Promise<any> {
    try {
      logger.info('Creating HubSpot deal', { dealname: dealData.dealname });

      const response = await this.client.post('/crm/v3/objects/deals', {
        properties: dealData
      });

      logger.info('HubSpot deal created', {
        deal_id: response.data.id,
        dealname: dealData.dealname
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to create HubSpot deal', { error });
      throw error;
    }
  }

  /**
   * Update a deal
   *
   * @param dealId - HubSpot deal ID
   * @param updates - Properties to update
   * @returns Updated deal
   */
  async updateDeal(dealId: string, updates: Record<string, any>): Promise<any> {
    try {
      const response = await this.client.patch(
        `/crm/v3/objects/deals/${dealId}`,
        { properties: updates }
      );

      logger.info('HubSpot deal updated', { deal_id: dealId });

      return response.data;
    } catch (error) {
      logger.error('Failed to update HubSpot deal', { deal_id: dealId, error });
      throw error;
    }
  }

  /**
   * Associate a contact with a deal
   *
   * @param contactId - Contact ID
   * @param dealId - Deal ID
   * @returns Association result
   */
  async associateContactToDeal(contactId: string, dealId: string): Promise<any> {
    try {
      const response = await this.client.put(
        `/crm/v3/objects/contacts/${contactId}/associations/deals/${dealId}/3`
      );

      logger.info('Contact associated to deal', { contact_id: contactId, deal_id: dealId });

      return response.data;
    } catch (error) {
      logger.error('Failed to associate contact to deal', { error });
      throw error;
    }
  }

  // ========================================================================
  // COMPANY MANAGEMENT
  // ========================================================================

  /**
   * Create a company
   *
   * @param companyData - Company properties
   * @returns Created company
   */
  async createCompany(companyData: {
    name: string;
    domain?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    industry?: string;
    [key: string]: any;
  }): Promise<any> {
    try {
      logger.info('Creating HubSpot company', { name: companyData.name });

      const response = await this.client.post('/crm/v3/objects/companies', {
        properties: companyData
      });

      logger.info('HubSpot company created', {
        company_id: response.data.id,
        name: companyData.name
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to create HubSpot company', { error });
      throw error;
    }
  }

  /**
   * Associate a contact with a company
   *
   * @param contactId - Contact ID
   * @param companyId - Company ID
   * @returns Association result
   */
  async associateContactToCompany(contactId: string, companyId: string): Promise<any> {
    try {
      const response = await this.client.put(
        `/crm/v3/objects/contacts/${contactId}/associations/companies/${companyId}/1`
      );

      logger.info('Contact associated to company', {
        contact_id: contactId,
        company_id: companyId
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to associate contact to company', { error });
      throw error;
    }
  }

  // ========================================================================
  // EMAIL MARKETING
  // ========================================================================

  /**
   * Subscribe contact to email list
   *
   * @param email - Contact email
   * @param listId - HubSpot list ID
   * @returns Subscription result
   */
  async subscribeToList(email: string, listId: string): Promise<any> {
    try {
      logger.info('Subscribing contact to list', { email, list_id: listId });

      const response = await this.client.put(
        `/contacts/v1/lists/${listId}/add`,
        { emails: [email] }
      );

      logger.info('Contact subscribed to list', { email, list_id: listId });

      return response.data;
    } catch (error) {
      logger.error('Failed to subscribe to list', { email, list_id: listId, error });
      throw error;
    }
  }

  /**
   * Send transactional email
   *
   * @param emailData - Email configuration
   * @returns Send result
   */
  async sendTransactionalEmail(emailData: {
    emailId: number;
    message: {
      to: string;
      from?: string;
      cc?: string[];
      bcc?: string[];
      sendId?: string;
    };
    contactProperties?: Record<string, any>;
    customProperties?: Record<string, any>;
  }): Promise<any> {
    try {
      logger.info('Sending transactional email', {
        email_id: emailData.emailId,
        to: emailData.message.to
      });

      const response = await this.client.post(
        '/marketing/v3/transactional/single-email/send',
        emailData
      );

      logger.info('Transactional email sent', {
        status: response.data.statusId,
        to: emailData.message.to
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to send transactional email', { error });
      throw error;
    }
  }

  // ========================================================================
  // ANALYTICS AND REPORTING
  // ========================================================================

  /**
   * Get contact analytics
   *
   * @param contactId - Contact ID
   * @returns Analytics data
   */
  async getContactAnalytics(contactId: string): Promise<any> {
    try {
      const response = await this.client.get(
        `/contacts/v1/contact/vid/${contactId}/profile`
      );

      return {
        pageViews: response.data['num-page-views'],
        lastEngagement: response.data['hs_analytics_last_timestamp'],
        source: response.data['hs_analytics_source'],
        interactions: response.data['num-associated-deals']
      };
    } catch (error) {
      logger.error('Failed to get contact analytics', { contact_id: contactId, error });
      throw error;
    }
  }

  /**
   * Get campaign performance metrics
   *
   * @param campaignId - Campaign ID
   * @returns Campaign metrics
   */
  async getCampaignMetrics(campaignId: string): Promise<any> {
    try {
      const response = await this.client.get(
        `/marketing/v3/campaigns/${campaignId}`
      );

      return {
        campaignId: response.data.id,
        name: response.data.name,
        counters: response.data.counters,
        lastProcessingStateChangeAt: response.data.lastProcessingStateChangeAt,
        numIncluded: response.data.numIncluded,
        numQueued: response.data.numQueued
      };
    } catch (error) {
      logger.error('Failed to get campaign metrics', { campaign_id: campaignId, error });
      throw error;
    }
  }

  // ========================================================================
  // CUSTOM OBJECTS
  // ========================================================================

  /**
   * Create custom object instance
   *
   * @param objectType - Custom object type
   * @param properties - Object properties
   * @returns Created object
   */
  async createCustomObject(objectType: string, properties: Record<string, any>): Promise<any> {
    try {
      const response = await this.client.post(
        `/crm/v3/objects/${objectType}`,
        { properties }
      );

      logger.info('Custom object created', {
        object_type: objectType,
        object_id: response.data.id
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to create custom object', { object_type: objectType, error });
      throw error;
    }
  }

  // ========================================================================
  // WEBHOOKS
  // ========================================================================

  /**
   * Handle HubSpot webhook
   *
   * @param payload - Webhook payload
   * @returns Processing result
   */
  async handleWebhook(payload: any): Promise<void> {
    try {
      logger.info('Received HubSpot webhook', {
        subscription_type: payload[0]?.subscriptionType,
        object_type: payload[0]?.objectType
      });

      for (const event of payload) {
        switch (event.subscriptionType) {
          case 'contact.creation':
            await this.handleContactCreation(event);
            break;

          case 'contact.propertyChange':
            await this.handleContactUpdate(event);
            break;

          case 'contact.deletion':
            await this.handleContactDeletion(event);
            break;

          case 'deal.creation':
            await this.handleDealCreation(event);
            break;

          case 'deal.propertyChange':
            await this.handleDealUpdate(event);
            break;

          default:
            logger.info('Unhandled webhook event type', {
              type: event.subscriptionType
            });
        }
      }
    } catch (error) {
      logger.error('Failed to handle HubSpot webhook', { error });
      throw error;
    }
  }

  private async handleContactCreation(event: any): Promise<void> {
    logger.info('Handling contact creation', { object_id: event.objectId });
    // TODO: Sync to NAIOS database
  }

  private async handleContactUpdate(event: any): Promise<void> {
    logger.info('Handling contact update', { object_id: event.objectId });
    // TODO: Update NAIOS database
  }

  private async handleContactDeletion(event: any): Promise<void> {
    logger.info('Handling contact deletion', { object_id: event.objectId });
    // TODO: Mark as deleted in NAIOS database
  }

  private async handleDealCreation(event: any): Promise<void> {
    logger.info('Handling deal creation', { object_id: event.objectId });
    // TODO: Sync to NAIOS database
  }

  private async handleDealUpdate(event: any): Promise<void> {
    logger.info('Handling deal update', { object_id: event.objectId });
    // TODO: Update NAIOS database
  }
}

// ============================================================================
// DONOR SYNC UTILITIES
// ============================================================================

/**
 * Sync donor from NAIOS to HubSpot
 *
 * @param donor - Donor data from NAIOS
 * @param client - HubSpot client instance
 * @returns Sync result
 */
export async function syncDonorToHubSpot(donor: any, client?: HubSpotClient): Promise<any> {
  const hubspot = client || new HubSpotClient();

  try {
    const contactData: any = {
      email: donor.email_primary,
      firstname: donor.first_name,
      lastname: donor.last_name,
      phone: donor.phone_primary,
      address: donor.address_line1,
      city: donor.city,
      state: donor.state,
      zip: donor.zip,
      lifecyclestage: mapDonorLevelToLifecycleStage(donor.donor_level),
      donor_level: donor.donor_level,
      lifetime_value: parseFloat(donor.lifetime_giving || '0'),
      last_donation_date: donor.last_gift_date,
      donor_since: donor.first_gift_date,
      total_donations: donor.total_gifts,
      engagement_score: donor.engagement_score
    };

    // Add organization name if corporate donor
    if (donor.donor_type === 'Corporation' || donor.donor_type === 'Foundation') {
      contactData.company = donor.organization_name;
    }

    return await hubspot.createContact(contactData);
  } catch (error) {
    logger.error('Failed to sync donor to HubSpot', { donor_id: donor.donor_id, error });
    throw error;
  }
}

/**
 * Map NAIOS donor level to HubSpot lifecycle stage
 */
function mapDonorLevelToLifecycleStage(donorLevel: string): string {
  const mapping: Record<string, string> = {
    'Legacy Circle': 'customer',
    'Major Donor': 'customer',
    'Leadership': 'customer',
    'Sustainer': 'customer',
    'Contributor': 'customer',
    'Friend': 'lead',
    'Prospect': 'lead'
  };

  return mapping[donorLevel] || 'lead';
}

// ============================================================================
// EXPORT
// ============================================================================

export default HubSpotClient;
export {
  HubSpotClient,
  syncDonorToHubSpot
};
