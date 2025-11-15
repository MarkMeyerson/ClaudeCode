// ============================================================================
// SALESFORCE CRM INTEGRATION
// Microsoft Copilot Onboarding & ROI Platform
// ============================================================================

import axios, { AxiosInstance } from 'axios';
import { Pool } from 'pg';

interface SalesforceConfig {
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
  securityToken: string;
  instanceUrl: string;
}

interface SalesforceContact {
  Id?: string;
  FirstName: string;
  LastName: string;
  Email: string;
  Phone?: string;
  AccountId?: string;
  Title?: string;
  Department?: string;
}

interface SalesforceOpportunity {
  Id?: string;
  Name: string;
  AccountId: string;
  Amount: number;
  CloseDate: string;
  StageName: string;
  Probability: number;
}

export class SalesforceIntegration {
  private db: Pool;
  private config: SalesforceConfig;
  private accessToken: string | null = null;
  private instanceUrl: string;
  private axiosInstance: AxiosInstance;

  constructor(database: Pool, config: SalesforceConfig) {
    this.db = database;
    this.config = config;
    this.instanceUrl = config.instanceUrl;

    this.axiosInstance = axios.create({
      baseURL: this.instanceUrl,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add request interceptor to include token
    this.axiosInstance.interceptors.request.use(async (config) => {
      if (!this.accessToken) {
        await this.authenticate();
      }
      config.headers.Authorization = `Bearer ${this.accessToken}`;
      return config;
    });
  }

  /**
   * Authenticate with Salesforce
   */
  private async authenticate(): Promise<void> {
    const loginUrl = 'https://login.salesforce.com/services/oauth2/token';

    const params = new URLSearchParams({
      grant_type: 'password',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      username: this.config.username,
      password: this.config.password + this.config.securityToken
    });

    try {
      const response = await axios.post(loginUrl, params);
      this.accessToken = response.data.access_token;
      this.instanceUrl = response.data.instance_url;
      this.axiosInstance.defaults.baseURL = this.instanceUrl;
    } catch (error: any) {
      throw new Error(`Salesforce authentication failed: ${error.message}`);
    }
  }

  /**
   * Create or update contact
   */
  async upsertContact(contact: SalesforceContact): Promise<string> {
    try {
      // Check if contact exists
      const existingContact = await this.findContactByEmail(contact.Email);

      if (existingContact) {
        // Update existing contact
        await this.axiosInstance.patch(
          `/services/data/v58.0/sobjects/Contact/${existingContact.Id}`,
          contact
        );
        return existingContact.Id;
      } else {
        // Create new contact
        const response = await this.axiosInstance.post(
          '/services/data/v58.0/sobjects/Contact',
          contact
        );
        return response.data.id;
      }
    } catch (error: any) {
      throw new Error(`Failed to upsert contact: ${error.message}`);
    }
  }

  /**
   * Find contact by email
   */
  private async findContactByEmail(email: string): Promise<any> {
    const query = `SELECT Id, FirstName, LastName, Email, Phone FROM Contact WHERE Email = '${email}' LIMIT 1`;

    try {
      const response = await this.axiosInstance.get(
        `/services/data/v58.0/query?q=${encodeURIComponent(query)}`
      );

      return response.data.records.length > 0 ? response.data.records[0] : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Create opportunity
   */
  async createOpportunity(opportunity: SalesforceOpportunity): Promise<string> {
    try {
      const response = await this.axiosInstance.post(
        '/services/data/v58.0/sobjects/Opportunity',
        opportunity
      );
      return response.data.id;
    } catch (error: any) {
      throw new Error(`Failed to create opportunity: ${error.message}`);
    }
  }

  /**
   * Update opportunity stage
   */
  async updateOpportunityStage(opportunityId: string, stageName: string, probability: number): Promise<void> {
    try {
      await this.axiosInstance.patch(
        `/services/data/v58.0/sobjects/Opportunity/${opportunityId}`,
        {
          StageName: stageName,
          Probability: probability
        }
      );
    } catch (error: any) {
      throw new Error(`Failed to update opportunity: ${error.message}`);
    }
  }

  /**
   * Get account details
   */
  async getAccount(accountId: string): Promise<any> {
    try {
      const response = await this.axiosInstance.get(
        `/services/data/v58.0/sobjects/Account/${accountId}`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get account: ${error.message}`);
    }
  }

  /**
   * Create custom object record (for Copilot metrics)
   */
  async createCopilotMetrics(organizationId: string, metrics: any): Promise<string> {
    try {
      const customObject = {
        Name: `Copilot Metrics - ${new Date().toISOString().split('T')[0]}`,
        Organization_ID__c: organizationId,
        Total_Users__c: metrics.totalUsers,
        Active_Users__c: metrics.activeUsers,
        Adoption_Rate__c: metrics.adoptionRate,
        ROI_Percentage__c: metrics.roiPercentage,
        Total_Value_Generated__c: metrics.totalValue,
        Productivity_Hours_Saved__c: metrics.hoursSaved
      };

      const response = await this.axiosInstance.post(
        '/services/data/v58.0/sobjects/Copilot_Metrics__c',
        customObject
      );

      return response.data.id;
    } catch (error: any) {
      throw new Error(`Failed to create Copilot metrics: ${error.message}`);
    }
  }

  /**
   * Sync all users to Salesforce
   */
  async syncUsers(organizationId: string): Promise<{ success: number; failed: number }> {
    const query = `
      SELECT user_id, user_name, user_email, department, job_title
      FROM users
      WHERE organization_id = $1 AND status = 'active'
    `;

    const result = await this.db.query(query, [organizationId]);
    const users = result.rows;

    let success = 0;
    let failed = 0;

    for (const user of users) {
      try {
        const [firstName, ...lastNameParts] = user.user_name.split(' ');
        const lastName = lastNameParts.join(' ') || firstName;

        await this.upsertContact({
          FirstName: firstName,
          LastName: lastName,
          Email: user.user_email,
          Title: user.job_title,
          Department: user.department
        });

        success++;
      } catch (error) {
        console.error(`Failed to sync user ${user.user_email}:`, error);
        failed++;
      }
    }

    return { success, failed };
  }

  /**
   * Sync ROI data to Salesforce
   */
  async syncROIData(organizationId: string): Promise<void> {
    const query = `
      SELECT *
      FROM roi_tracking
      WHERE organization_id = $1
      ORDER BY period_end DESC
      LIMIT 1
    `;

    const result = await this.db.query(query, [organizationId]);

    if (result.rows.length === 0) {
      throw new Error('No ROI data found');
    }

    const roi = result.rows[0];

    await this.createCopilotMetrics(organizationId, {
      totalUsers: roi.total_licensed_users,
      activeUsers: roi.active_users,
      adoptionRate: roi.adoption_rate,
      roiPercentage: roi.roi_percentage,
      totalValue: roi.total_value_generated,
      hoursSaved: roi.hours_saved
    });
  }

  /**
   * Query Salesforce with SOQL
   */
  async query(soql: string): Promise<any[]> {
    try {
      const response = await this.axiosInstance.get(
        `/services/data/v58.0/query?q=${encodeURIComponent(soql)}`
      );
      return response.data.records;
    } catch (error: any) {
      throw new Error(`Salesforce query failed: ${error.message}`);
    }
  }

  /**
   * Bulk upsert records
   */
  async bulkUpsert(objectType: string, records: any[], externalIdField: string): Promise<any> {
    try {
      const response = await this.axiosInstance.post(
        `/services/data/v58.0/composite/sobjects/${objectType}/${externalIdField}`,
        {
          allOrNone: false,
          records
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(`Bulk upsert failed: ${error.message}`);
    }
  }

  /**
   * Get Salesforce reports
   */
  async getReport(reportId: string): Promise<any> {
    try {
      const response = await this.axiosInstance.get(
        `/services/data/v58.0/analytics/reports/${reportId}`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get report: ${error.message}`);
    }
  }

  /**
   * Create task/activity
   */
  async createTask(task: any): Promise<string> {
    try {
      const response = await this.axiosInstance.post(
        '/services/data/v58.0/sobjects/Task',
        task
      );
      return response.data.id;
    } catch (error: any) {
      throw new Error(`Failed to create task: ${error.message}`);
    }
  }

  /**
   * Log call/interaction
   */
  async logActivity(whoId: string, whatId: string, subject: string, description: string): Promise<string> {
    return this.createTask({
      WhoId: whoId,
      WhatId: whatId,
      Subject: subject,
      Description: description,
      Status: 'Completed',
      ActivityDate: new Date().toISOString().split('T')[0]
    });
  }
}
