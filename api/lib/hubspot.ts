/**
 * HubSpot CRM Integration
 * Captures leads from AI assessment completions
 */

interface LeadData {
  email: string;
  name: string;
  organization?: string;
  phone?: string;
  scores: {
    strategicClarity: number;
    teamCapability: number;
    governanceReadiness: number;
    technicalInfrastructure: number;
    executiveAlignment: number;
    overall: number;
  };
  readinessPhase?: string;
}

/**
 * Send lead data to HubSpot
 */
export async function sendToHubSpot(data: LeadData): Promise<void> {
  const apiKey = process.env.HUBSPOT_API_KEY;

  if (!apiKey) {
    console.log('HubSpot API key not configured, skipping lead capture');
    return;
  }

  try {
    // Split name into first and last
    const nameParts = data.name?.split(' ') || [];
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // First, try to find existing contact by email
    const searchResponse = await fetch(
      'https://api.hubapi.com/crm/v3/objects/contacts/search',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filterGroups: [
            {
              filters: [
                {
                  propertyName: 'email',
                  operator: 'EQ',
                  value: data.email,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!searchResponse.ok) {
      throw new Error(
        `HubSpot search failed: ${searchResponse.status} ${searchResponse.statusText}`
      );
    }

    const searchResult: any = await searchResponse.json();
    const existingContact = searchResult.results?.[0];

    // Prepare contact properties
    const contactProperties: any = {
      email: data.email,
      firstname: firstName,
      lastname: lastName,
      phone: data.phone || '',
      company: data.organization || '',
      // Custom properties - these need to be created in HubSpot first
      ai_assessment_score: data.scores.overall.toString(),
      ai_assessment_strategic_clarity: data.scores.strategicClarity.toString(),
      ai_assessment_team_capability: data.scores.teamCapability.toString(),
      ai_assessment_governance_readiness: data.scores.governanceReadiness.toString(),
      ai_assessment_technical_infrastructure: data.scores.technicalInfrastructure.toString(),
      ai_assessment_executive_alignment: data.scores.executiveAlignment.toString(),
      ai_assessment_date: new Date().toISOString().split('T')[0],
      lifecyclestage: 'lead',
      hs_lead_status: 'NEW',
      leadsource: 'AI Assessment Bot',
    };

    // Add readiness phase if available
    if (data.readinessPhase) {
      contactProperties.ai_readiness_phase = data.readinessPhase;
    }

    if (existingContact) {
      // Update existing contact
      const updateResponse = await fetch(
        `https://api.hubapi.com/crm/v3/objects/contacts/${existingContact.id}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ properties: contactProperties }),
        }
      );

      if (!updateResponse.ok) {
        throw new Error(
          `HubSpot update failed: ${updateResponse.status} ${updateResponse.statusText}`
        );
      }

      console.log(`Updated existing HubSpot contact: ${existingContact.id}`);
    } else {
      // Create new contact
      const createResponse = await fetch(
        'https://api.hubapi.com/crm/v3/objects/contacts',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ properties: contactProperties }),
        }
      );

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        throw new Error(
          `HubSpot create failed: ${createResponse.status} ${createResponse.statusText} - ${errorText}`
        );
      }

      const newContact: any = await createResponse.json();
      console.log(`Created new HubSpot contact: ${newContact.id}`);
    }
  } catch (error: any) {
    // Log but don't throw - we don't want HubSpot failures to break the assessment
    console.error('HubSpot integration error:', error);
    console.error('Error details:', error.message);
  }
}

/**
 * Custom properties that need to be created in HubSpot:
 *
 * 1. ai_assessment_score (Number)
 * 2. ai_assessment_strategic_clarity (Number)
 * 3. ai_assessment_team_capability (Number)
 * 4. ai_assessment_governance_readiness (Number)
 * 5. ai_assessment_technical_infrastructure (Number)
 * 6. ai_assessment_executive_alignment (Number)
 * 7. ai_assessment_date (Date)
 * 8. ai_readiness_phase (Single-line text or Dropdown)
 * 9. leadsource (Single-line text or Dropdown)
 *
 * Note: Some properties like 'lifecyclestage', 'hs_lead_status' are standard HubSpot properties
 */
