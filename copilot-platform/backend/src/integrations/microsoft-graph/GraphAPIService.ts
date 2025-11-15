// ============================================================================
// MICROSOFT GRAPH API INTEGRATION SERVICE
// Microsoft Copilot Onboarding & ROI Platform
// ============================================================================

import { Pool } from 'pg';
import axios, { AxiosInstance } from 'axios';

interface GraphConfig {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  authority?: string;
}

export class GraphAPIService {
  private db: Pool;
  private axiosInstance: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(database: Pool, private config: GraphConfig) {
    this.db = database;
    this.axiosInstance = axios.create({
      baseURL: 'https://graph.microsoft.com/v1.0',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add request interceptor to include token
    this.axiosInstance.interceptors.request.use(async (config) => {
      const token = await this.getAccessToken();
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
  }

  /**
   * Get OAuth access token
   */
  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    // Request new token
    const tokenEndpoint = `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/token`;

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials'
    });

    try {
      const response = await axios.post(tokenEndpoint, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      this.accessToken = response.data.access_token;
      // Set expiry to 5 minutes before actual expiry for safety
      const expiresIn = response.data.expires_in - 300;
      this.tokenExpiry = new Date(Date.now() + expiresIn * 1000);

      return this.accessToken;
    } catch (error: any) {
      await this.logIntegrationError('token_request', error);
      throw new Error(`Failed to get access token: ${error.message}`);
    }
  }

  /**
   * Sync users from Microsoft 365
   */
  async syncUsers(organization_id: string, tenant_id: string): Promise<any> {
    const startTime = Date.now();
    const correlationId = this.generateCorrelationId();

    try {
      await this.logIntegrationStart(tenant_id, 'sync_users', correlationId);

      // Fetch users from Graph API
      const users = await this.fetchAllUsers();

      let succeeded = 0;
      let failed = 0;

      // Insert or update users in database
      for (const graphUser of users) {
        try {
          await this.upsertUser(organization_id, tenant_id, graphUser);
          succeeded++;
        } catch (error) {
          failed++;
          console.error(`Failed to sync user ${graphUser.userPrincipalName}:`, error);
        }
      }

      const executionTime = Date.now() - startTime;

      await this.logIntegrationSuccess(
        tenant_id,
        'sync_users',
        correlationId,
        users.length,
        succeeded,
        failed,
        executionTime
      );

      return {
        success: true,
        total: users.length,
        succeeded,
        failed,
        execution_time_ms: executionTime
      };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      await this.logIntegrationError('sync_users', error, correlationId);
      throw error;
    }
  }

  /**
   * Fetch all users from Microsoft Graph
   */
  private async fetchAllUsers(): Promise<any[]> {
    const users: any[] = [];
    let nextLink: string | null = '/users?$select=id,userPrincipalName,displayName,givenName,surname,mail,jobTitle,department,officeLocation,mobilePhone,businessPhones,city,country,usageLocation';

    while (nextLink) {
      const response = await this.axiosInstance.get(nextLink);
      users.push(...response.data.value);
      nextLink = response.data['@odata.nextLink'] || null;
    }

    return users;
  }

  /**
   * Sync licenses from Microsoft 365
   */
  async syncLicenses(organization_id: string, tenant_id: string): Promise<any> {
    const startTime = Date.now();
    const correlationId = this.generateCorrelationId();

    try {
      await this.logIntegrationStart(tenant_id, 'sync_licenses', correlationId);

      // Fetch subscribed SKUs
      const response = await this.axiosInstance.get('/subscribedSkus');
      const skus = response.data.value;

      let succeeded = 0;
      let failed = 0;

      for (const sku of skus) {
        try {
          await this.upsertLicense(organization_id, tenant_id, sku);
          succeeded++;
        } catch (error) {
          failed++;
          console.error(`Failed to sync license ${sku.skuPartNumber}:`, error);
        }
      }

      const executionTime = Date.now() - startTime;

      await this.logIntegrationSuccess(
        tenant_id,
        'sync_licenses',
        correlationId,
        skus.length,
        succeeded,
        failed,
        executionTime
      );

      return {
        success: true,
        total: skus.length,
        succeeded,
        failed,
        execution_time_ms: executionTime
      };
    } catch (error: any) {
      await this.logIntegrationError('sync_licenses', error, correlationId);
      throw error;
    }
  }

  /**
   * Sync user license assignments
   */
  async syncUserLicenseAssignments(
    organization_id: string,
    tenant_id: string,
    user_id: string
  ): Promise<any> {
    try {
      // Get user's Graph ID
      const userQuery = 'SELECT azure_ad_id FROM users WHERE user_id = $1';
      const userResult = await this.db.query(userQuery, [user_id]);

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const azure_ad_id = userResult.rows[0].azure_ad_id;

      // Fetch license details from Graph API
      const response = await this.axiosInstance.get(`/users/${azure_ad_id}/licenseDetails`);
      const licenses = response.data.value;

      // Update license assignments in database
      for (const license of licenses) {
        await this.upsertUserLicenseAssignment(user_id, tenant_id, license);
      }

      return {
        success: true,
        licenses_synced: licenses.length
      };
    } catch (error: any) {
      await this.logIntegrationError('sync_user_licenses', error);
      throw error;
    }
  }

  /**
   * Fetch usage reports
   */
  async fetchUsageReports(
    organization_id: string,
    tenant_id: string,
    period: number = 7
  ): Promise<any> {
    const startTime = Date.now();
    const correlationId = this.generateCorrelationId();

    try {
      await this.logIntegrationStart(tenant_id, 'fetch_usage_reports', correlationId);

      // Fetch Microsoft 365 activity reports
      const reports = await Promise.all([
        this.fetchUserActivityReport(period),
        this.fetchAppUsageReport(period),
        this.fetchTeamsActivityReport(period)
      ]);

      const [userActivity, appUsage, teamsActivity] = reports;

      // Process and store usage data
      await this.processUsageData(organization_id, userActivity, appUsage, teamsActivity);

      const executionTime = Date.now() - startTime;

      await this.logIntegrationSuccess(
        tenant_id,
        'fetch_usage_reports',
        correlationId,
        reports.length,
        reports.length,
        0,
        executionTime
      );

      return {
        success: true,
        reports_fetched: reports.length,
        execution_time_ms: executionTime
      };
    } catch (error: any) {
      await this.logIntegrationError('fetch_usage_reports', error, correlationId);
      throw error;
    }
  }

  /**
   * Fetch user activity report
   */
  private async fetchUserActivityReport(period: number): Promise<any> {
    const endpoint = `/reports/getOffice365ActiveUserDetail(period='D${period}')`;
    const response = await this.axiosInstance.get(endpoint);
    return this.parseCSVReport(response.data);
  }

  /**
   * Fetch app usage report
   */
  private async fetchAppUsageReport(period: number): Promise<any> {
    const endpoint = `/reports/getOffice365ServicesUserCounts(period='D${period}')`;
    const response = await this.axiosInstance.get(endpoint);
    return this.parseCSVReport(response.data);
  }

  /**
   * Fetch Teams activity report
   */
  private async fetchTeamsActivityReport(period: number): Promise<any> {
    const endpoint = `/reports/getTeamsUserActivityUserDetail(period='D${period}')`;
    const response = await this.axiosInstance.get(endpoint);
    return this.parseCSVReport(response.data);
  }

  /**
   * Parse CSV report data
   */
  private parseCSVReport(csvData: string): any[] {
    const lines = csvData.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const data: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const row: any = {};

      headers.forEach((header, index) => {
        row[header] = values[index]?.trim() || '';
      });

      data.push(row);
    }

    return data;
  }

  // ============================================================================
  // DATABASE OPERATIONS
  // ============================================================================

  private async upsertUser(
    organization_id: string,
    tenant_id: string,
    graphUser: any
  ): Promise<void> {
    const query = `
      INSERT INTO users (
        organization_id,
        user_email,
        user_name,
        display_name,
        department,
        job_title,
        office_location,
        country,
        azure_ad_id,
        m365_user_principal_name,
        microsoft_tenant_id,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (organization_id, user_email)
      DO UPDATE SET
        display_name = EXCLUDED.display_name,
        department = EXCLUDED.department,
        job_title = EXCLUDED.job_title,
        office_location = EXCLUDED.office_location,
        country = EXCLUDED.country,
        azure_ad_id = EXCLUDED.azure_ad_id,
        updated_at = CURRENT_TIMESTAMP
    `;

    const values = [
      organization_id,
      graphUser.mail || graphUser.userPrincipalName,
      graphUser.givenName && graphUser.surname ? `${graphUser.givenName} ${graphUser.surname}` : graphUser.displayName,
      graphUser.displayName,
      graphUser.department,
      graphUser.jobTitle,
      graphUser.officeLocation,
      graphUser.country,
      graphUser.id,
      graphUser.userPrincipalName,
      this.config.tenantId,
      'active'
    ];

    await this.db.query(query, values);
  }

  private async upsertLicense(
    organization_id: string,
    tenant_id: string,
    sku: any
  ): Promise<void> {
    const query = `
      INSERT INTO microsoft_licenses (
        tenant_id,
        organization_id,
        sku_id,
        sku_part_number,
        product_name,
        total_licenses,
        consumed_licenses,
        available_licenses,
        is_copilot_license
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (tenant_id, sku_id)
      DO UPDATE SET
        total_licenses = EXCLUDED.total_licenses,
        consumed_licenses = EXCLUDED.consumed_licenses,
        available_licenses = EXCLUDED.available_licenses,
        updated_at = CURRENT_TIMESTAMP
    `;

    const isCopilotLicense = this.isCopilotSKU(sku.skuPartNumber);

    const values = [
      tenant_id,
      organization_id,
      sku.skuId,
      sku.skuPartNumber,
      sku.skuPartNumber, // Map to friendly name in production
      sku.prepaidUnits?.enabled || 0,
      sku.consumedUnits || 0,
      (sku.prepaidUnits?.enabled || 0) - (sku.consumedUnits || 0),
      isCopilotLicense
    ];

    await this.db.query(query, values);
  }

  private async upsertUserLicenseAssignment(
    user_id: string,
    tenant_id: string,
    license: any
  ): Promise<void> {
    // Get license_id from microsoft_licenses table
    const licenseQuery = 'SELECT license_id FROM microsoft_licenses WHERE tenant_id = $1 AND sku_id = $2';
    const licenseResult = await this.db.query(licenseQuery, [tenant_id, license.skuId]);

    if (licenseResult.rows.length === 0) {
      console.warn(`License SKU ${license.skuId} not found in database`);
      return;
    }

    const license_id = licenseResult.rows[0].license_id;

    const query = `
      INSERT INTO user_license_assignments (
        user_id,
        tenant_id,
        license_id,
        assigned_date,
        status,
        is_active
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id, license_id)
      DO UPDATE SET
        status = EXCLUDED.status,
        is_active = EXCLUDED.is_active,
        updated_at = CURRENT_TIMESTAMP
    `;

    const values = [
      user_id,
      tenant_id,
      license_id,
      new Date(),
      'active',
      true
    ];

    await this.db.query(query, values);
  }

  private async processUsageData(
    organization_id: string,
    userActivity: any[],
    appUsage: any[],
    teamsActivity: any[]
  ): Promise<void> {
    // Process and insert productivity metrics
    for (const activity of userActivity) {
      // Map Graph API fields to productivity_metrics table
      // This is simplified - production would have detailed mapping
      const metrics = {
        organization_id,
        date: new Date(),
        copilot_interactions: parseInt(activity['Copilot Interactions'] || '0'),
        word_documents_enhanced: parseInt(activity['Word Files'] || '0'),
        excel_analyses_accelerated: parseInt(activity['Excel Files'] || '0'),
        powerpoint_presentations_created: parseInt(activity['PowerPoint Files'] || '0'),
        outlook_emails_drafted: parseInt(activity['Email Count'] || '0'),
        teams_meetings_summarized: parseInt(activity['Teams Meetings'] || '0')
      };

      // Insert into productivity_metrics table
      // (Implementation would be more detailed in production)
    }
  }

  // ============================================================================
  // LOGGING
  // ============================================================================

  private async logIntegrationStart(
    tenant_id: string,
    operation: string,
    correlation_id: string
  ): Promise<void> {
    const query = `
      INSERT INTO integration_logs (
        tenant_id,
        integration_type,
        operation,
        status,
        correlation_id,
        execution_start_time
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `;

    await this.db.query(query, [
      tenant_id,
      'graph_api',
      operation,
      'in_progress',
      correlation_id,
      new Date()
    ]);
  }

  private async logIntegrationSuccess(
    tenant_id: string,
    operation: string,
    correlation_id: string,
    total: number,
    succeeded: number,
    failed: number,
    execution_time_ms: number
  ): Promise<void> {
    const query = `
      INSERT INTO integration_logs (
        tenant_id,
        integration_type,
        operation,
        status,
        correlation_id,
        records_processed,
        records_succeeded,
        records_failed,
        execution_time_ms
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;

    await this.db.query(query, [
      tenant_id,
      'graph_api',
      operation,
      'success',
      correlation_id,
      total,
      succeeded,
      failed,
      execution_time_ms
    ]);
  }

  private async logIntegrationError(
    operation: string,
    error: any,
    correlation_id?: string
  ): Promise<void> {
    const query = `
      INSERT INTO integration_logs (
        integration_type,
        operation,
        status,
        correlation_id,
        error_details
      ) VALUES ($1, $2, $3, $4, $5)
    `;

    await this.db.query(query, [
      'graph_api',
      operation,
      'failed',
      correlation_id || this.generateCorrelationId(),
      JSON.stringify({
        message: error.message,
        stack: error.stack
      })
    ]);
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private isCopilotSKU(skuPartNumber: string): boolean {
    const copilotSKUs = [
      'Microsoft_365_Copilot',
      'M365_COPILOT',
      'MICROSOFT_365_COPILOT'
    ];

    return copilotSKUs.some(sku =>
      skuPartNumber.toUpperCase().includes(sku.toUpperCase())
    );
  }

  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
