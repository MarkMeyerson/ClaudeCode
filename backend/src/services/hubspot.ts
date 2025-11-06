import axios from 'axios';

export interface HubSpotContactData {
  email: string;
  firstname: string;
  lastname: string;
  phone?: string;
  company: string;
  industry?: string;

  // Custom properties for assessment
  ai_readiness_score?: number;
  ai_readiness_phase?: string;
  strategic_clarity_score?: number;
  governance_readiness_score?: number;
  team_capability_score?: number;
  technical_infrastructure_score?: number;
  executive_alignment_score?: number;
  assessment_completed_date?: string;
}

export class HubSpotService {
  private apiKey: string;
  private baseUrl = 'https://api.hubapi.com';

  constructor() {
    this.apiKey = process.env.HUBSPOT_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️  HubSpot API key not configured. HubSpot integration will be disabled.');
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async createOrUpdateContact(contactData: HubSpotContactData): Promise<string | null> {
    if (!this.isConfigured()) {
      console.log('HubSpot not configured, skipping contact sync');
      return null;
    }

    try {
      // Split name into first and last
      const nameParts = contactData.firstname.split(' ');
      const firstname = nameParts[0] || contactData.firstname;
      const lastname = nameParts.slice(1).join(' ') || contactData.lastname || '';

      const properties = {
        email: contactData.email,
        firstname,
        lastname,
        phone: contactData.phone || '',
        company: contactData.company,
        industry: contactData.industry || '',

        // Custom properties - these need to be created in HubSpot first
        ai_readiness_score: contactData.ai_readiness_score?.toString() || '0',
        ai_readiness_phase: contactData.ai_readiness_phase || '',
        strategic_clarity_score: contactData.strategic_clarity_score?.toString() || '0',
        governance_readiness_score: contactData.governance_readiness_score?.toString() || '0',
        team_capability_score: contactData.team_capability_score?.toString() || '0',
        technical_infrastructure_score: contactData.technical_infrastructure_score?.toString() || '0',
        executive_alignment_score: contactData.executive_alignment_score?.toString() || '0',
        assessment_completed_date: contactData.assessment_completed_date || new Date().toISOString()
      };

      // Try to create or update contact
      const response = await axios.post(
        `${this.baseUrl}/crm/v3/objects/contacts`,
        {
          properties
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Contact synced to HubSpot:', response.data.id);
      return response.data.id;

    } catch (error: any) {
      if (error.response?.status === 409) {
        // Contact exists, try to update
        try {
          return await this.updateExistingContact(contactData);
        } catch (updateError) {
          console.error('❌ Error updating HubSpot contact:', updateError);
          return null;
        }
      }

      console.error('❌ Error creating HubSpot contact:', error.response?.data || error.message);
      return null;
    }
  }

  private async updateExistingContact(contactData: HubSpotContactData): Promise<string | null> {
    try {
      // First, search for the contact by email
      const searchResponse = await axios.post(
        `${this.baseUrl}/crm/v3/objects/contacts/search`,
        {
          filterGroups: [
            {
              filters: [
                {
                  propertyName: 'email',
                  operator: 'EQ',
                  value: contactData.email
                }
              ]
            }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (searchResponse.data.results.length === 0) {
        console.log('Contact not found for update');
        return null;
      }

      const contactId = searchResponse.data.results[0].id;

      // Update the contact
      const nameParts = contactData.firstname.split(' ');
      const firstname = nameParts[0] || contactData.firstname;
      const lastname = nameParts.slice(1).join(' ') || contactData.lastname || '';

      const properties = {
        firstname,
        lastname,
        phone: contactData.phone || '',
        company: contactData.company,
        industry: contactData.industry || '',
        ai_readiness_score: contactData.ai_readiness_score?.toString() || '0',
        ai_readiness_phase: contactData.ai_readiness_phase || '',
        strategic_clarity_score: contactData.strategic_clarity_score?.toString() || '0',
        governance_readiness_score: contactData.governance_readiness_score?.toString() || '0',
        team_capability_score: contactData.team_capability_score?.toString() || '0',
        technical_infrastructure_score: contactData.technical_infrastructure_score?.toString() || '0',
        executive_alignment_score: contactData.executive_alignment_score?.toString() || '0',
        assessment_completed_date: contactData.assessment_completed_date || new Date().toISOString()
      };

      await axios.patch(
        `${this.baseUrl}/crm/v3/objects/contacts/${contactId}`,
        { properties },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Contact updated in HubSpot:', contactId);
      return contactId;

    } catch (error: any) {
      console.error('❌ Error in updateExistingContact:', error.response?.data || error.message);
      return null;
    }
  }

  async addNote(contactId: string, note: string): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      await axios.post(
        `${this.baseUrl}/crm/v3/objects/notes`,
        {
          properties: {
            hs_note_body: note,
            hs_timestamp: new Date().getTime()
          },
          associations: [
            {
              to: { id: contactId },
              types: [
                {
                  associationCategory: 'HUBSPOT_DEFINED',
                  associationTypeId: 202 // Note to Contact
                }
              ]
            }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Note added to HubSpot contact');
      return true;

    } catch (error: any) {
      console.error('❌ Error adding note to HubSpot:', error.response?.data || error.message);
      return false;
    }
  }
}

export default new HubSpotService();
