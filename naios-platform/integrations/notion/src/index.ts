/**
 * NAIOS Platform - Notion Integration
 *
 * MCP-based integration with Notion for bi-directional data sync
 *
 * @version 1.0.0
 */

import { Client } from '@notionhq/client';
import { logger } from '@naios/shared/utils/logger';
import dotenv from 'dotenv';

dotenv.config();

// ============================================================================
// NOTION CLIENT CONFIGURATION
// ============================================================================

const notion = new Client({
  auth: process.env.NOTION_API_KEY
});

// ============================================================================
// NOTION SYNC FUNCTIONS
// ============================================================================

/**
 * Sync assessment data to Notion database
 *
 * @param assessment - Assessment object to sync
 * @returns Notion page ID
 */
export async function syncAssessmentToNotion(assessment: any): Promise<string> {
  try {
    logger.info('Syncing assessment to Notion', {
      assessment_id: assessment.assessment_id,
      org_id: assessment.org_id
    });

    const response = await notion.pages.create({
      parent: {
        database_id: process.env.NOTION_ASSESSMENTS_DB_ID || ''
      },
      properties: {
        'Name': {
          title: [
            {
              text: {
                content: assessment.assessment_name || 'Untitled Assessment'
              }
            }
          ]
        },
        'Organization': {
          rich_text: [
            {
              text: {
                content: assessment.organization_name || ''
              }
            }
          ]
        },
        'Assessment Date': {
          date: {
            start: assessment.assessment_date
          }
        },
        'Status': {
          select: {
            name: assessment.status
          }
        },
        'Overall Score': {
          number: assessment.overall_score || 0
        },
        'Assessment ID': {
          rich_text: [
            {
              text: {
                content: assessment.assessment_id
              }
            }
          ]
        }
      }
    });

    logger.info('Assessment synced to Notion successfully', {
      assessment_id: assessment.assessment_id,
      notion_page_id: response.id
    });

    return response.id;
  } catch (error) {
    logger.error('Failed to sync assessment to Notion', {
      assessment_id: assessment.assessment_id,
      error
    });
    throw error;
  }
}

/**
 * Sync donor data to Notion database
 *
 * @param donor - Donor object to sync
 * @returns Notion page ID
 */
export async function syncDonorToNotion(donor: any): Promise<string> {
  try {
    logger.info('Syncing donor to Notion', {
      donor_id: donor.donor_id
    });

    const response = await notion.pages.create({
      parent: {
        database_id: process.env.NOTION_DONORS_DB_ID || ''
      },
      properties: {
        'Name': {
          title: [
            {
              text: {
                content: donor.donor_type === 'Individual'
                  ? `${donor.first_name} ${donor.last_name}`
                  : donor.organization_name
              }
            }
          ]
        },
        'Donor Type': {
          select: {
            name: donor.donor_type
          }
        },
        'Email': {
          email: donor.email_primary || ''
        },
        'Lifetime Giving': {
          number: parseFloat(donor.lifetime_giving || '0')
        },
        'Donor Level': {
          select: {
            name: donor.donor_level || 'Friend'
          }
        },
        'Last Gift Date': {
          date: donor.last_gift_date ? {
            start: donor.last_gift_date
          } : null
        },
        'Donor ID': {
          rich_text: [
            {
              text: {
                content: donor.donor_id
              }
            }
          ]
        }
      }
    });

    logger.info('Donor synced to Notion successfully', {
      donor_id: donor.donor_id,
      notion_page_id: response.id
    });

    return response.id;
  } catch (error) {
    logger.error('Failed to sync donor to Notion', {
      donor_id: donor.donor_id,
      error
    });
    throw error;
  }
}

/**
 * Retrieve assessment data from Notion
 *
 * @param notionPageId - Notion page ID
 * @returns Assessment data
 */
export async function getAssessmentFromNotion(notionPageId: string): Promise<any> {
  try {
    const page = await notion.pages.retrieve({ page_id: notionPageId });

    // Extract properties from Notion page
    const properties: any = page.properties;

    return {
      notion_id: page.id,
      assessment_id: properties['Assessment ID']?.rich_text[0]?.plain_text,
      assessment_name: properties['Name']?.title[0]?.plain_text,
      organization_name: properties['Organization']?.rich_text[0]?.plain_text,
      assessment_date: properties['Assessment Date']?.date?.start,
      status: properties['Status']?.select?.name,
      overall_score: properties['Overall Score']?.number
    };
  } catch (error) {
    logger.error('Failed to retrieve assessment from Notion', {
      notion_page_id: notionPageId,
      error
    });
    throw error;
  }
}

/**
 * Query Notion database for assessments
 *
 * @returns Array of assessments
 */
export async function queryNotionAssessments(): Promise<any[]> {
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_ASSESSMENTS_DB_ID || ''
    });

    return response.results.map((page: any) => {
      const props = page.properties;
      return {
        notion_id: page.id,
        assessment_id: props['Assessment ID']?.rich_text[0]?.plain_text,
        assessment_name: props['Name']?.title[0]?.plain_text,
        status: props['Status']?.select?.name,
        overall_score: props['Overall Score']?.number
      };
    });
  } catch (error) {
    logger.error('Failed to query Notion assessments', { error });
    throw error;
  }
}

/**
 * Create a Notion database for assessments
 *
 * @param parentPageId - Parent page ID where database will be created
 * @returns Database ID
 */
export async function createAssessmentsDatabase(parentPageId: string): Promise<string> {
  try {
    const response = await notion.databases.create({
      parent: {
        type: 'page_id',
        page_id: parentPageId
      },
      title: [
        {
          type: 'text',
          text: {
            content: 'NAIOS Assessments'
          }
        }
      ],
      properties: {
        'Name': {
          title: {}
        },
        'Organization': {
          rich_text: {}
        },
        'Assessment Date': {
          date: {}
        },
        'Status': {
          select: {
            options: [
              { name: 'Planned', color: 'gray' },
              { name: 'In Progress', color: 'blue' },
              { name: 'Data Collection', color: 'yellow' },
              { name: 'Analysis', color: 'orange' },
              { name: 'Review', color: 'purple' },
              { name: 'Completed', color: 'green' },
              { name: 'Approved', color: 'green' },
              { name: 'Archived', color: 'brown' }
            ]
          }
        },
        'Overall Score': {
          number: {
            format: 'number'
          }
        },
        'Assessment ID': {
          rich_text: {}
        }
      }
    });

    logger.info('Assessments database created in Notion', {
      database_id: response.id
    });

    return response.id;
  } catch (error) {
    logger.error('Failed to create assessments database in Notion', { error });
    throw error;
  }
}

// ============================================================================
// WEBHOOKS AND EVENT HANDLERS
// ============================================================================

/**
 * Handle webhook from Notion for real-time updates
 *
 * @param payload - Webhook payload from Notion
 */
export async function handleNotionWebhook(payload: any): Promise<void> {
  try {
    logger.info('Received Notion webhook', { payload });

    // Handle different event types
    const eventType = payload.type;

    switch (eventType) {
      case 'page.created':
        // Handle new page creation
        break;

      case 'page.updated':
        // Handle page update
        break;

      case 'page.deleted':
        // Handle page deletion
        break;

      default:
        logger.warn('Unknown Notion webhook event type', { eventType });
    }
  } catch (error) {
    logger.error('Failed to handle Notion webhook', { error });
    throw error;
  }
}

// ============================================================================
// EXPORT INTEGRATION FUNCTIONS
// ============================================================================

export default {
  syncAssessmentToNotion,
  syncDonorToNotion,
  getAssessmentFromNotion,
  queryNotionAssessments,
  createAssessmentsDatabase,
  handleNotionWebhook,
  client: notion
};
