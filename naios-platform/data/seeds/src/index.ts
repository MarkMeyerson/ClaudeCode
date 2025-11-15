/**
 * NAIOS Platform - Comprehensive Seed Data Generator
 *
 * Generates realistic test data for all database schemas:
 * - Assessment Engine
 * - Donor Management
 * - Financial Hub
 * - Volunteer Coordinator
 * - Grant Intelligence
 * - Impact Analytics
 */

import { faker } from '@faker-js/faker';
import { Pool, PoolClient } from 'pg';

// ============================================================================
// TYPES AND CONFIGURATION
// ============================================================================

export type DataSize = 'small' | 'medium' | 'large';
export type SchemaType = 'assessment' | 'donor' | 'financial' | 'volunteer' | 'grant' | 'impact';

export interface SeedConfig {
  size: DataSize;
  schemas: SchemaType[];
  clean: boolean;
}

export const DATA_VOLUMES: Record<DataSize, Record<string, number>> = {
  small: {
    organizations: 10,
    assessments: 20,
    donors: 50,
    donations: 200,
    accounts: 30,
    transactions: 500,
    volunteers: 40,
    opportunities: 15,
    grants: 25,
    programs: 15,
    beneficiaries: 100,
    services: 500,
  },
  medium: {
    organizations: 50,
    assessments: 150,
    donors: 500,
    donations: 2000,
    accounts: 100,
    transactions: 5000,
    volunteers: 300,
    opportunities: 75,
    grants: 150,
    programs: 50,
    beneficiaries: 1000,
    services: 5000,
  },
  large: {
    organizations: 200,
    assessments: 1000,
    donors: 5000,
    donations: 20000,
    accounts: 500,
    transactions: 50000,
    volunteers: 2000,
    opportunities: 300,
    grants: 1000,
    programs: 200,
    beneficiaries: 10000,
    services: 50000,
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, array.length));
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomBool(probability: number = 0.5): boolean {
  return Math.random() < probability;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDecimal(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

// ============================================================================
// ASSESSMENT ENGINE SEED DATA
// ============================================================================

export async function seedAssessmentEngine(client: PoolClient, config: SeedConfig): Promise<void> {
  console.log('Seeding Assessment Engine data...');

  const volume = DATA_VOLUMES[config.size];
  const organizationIds: string[] = [];
  const assessmentIds: string[] = [];

  // Create organizations
  console.log(`Creating ${volume.organizations} organizations...`);
  for (let i = 0; i < volume.organizations; i++) {
    const result = await client.query(`
      INSERT INTO organizations (
        org_name, org_type, org_category, ein, mission_statement,
        primary_cause_area, year_founded, annual_budget,
        number_of_employees, number_of_volunteers, number_of_board_members,
        website, primary_email, primary_phone,
        address_line1, city, state, zip, country,
        created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
      ) RETURNING org_id
    `, [
      faker.company.name() + ' Foundation',
      randomElement(['Non-Profit', 'Charity', 'Foundation', 'Social Enterprise']),
      randomElement(['501c3', '501c4', '501c6', 'B-Corp']),
      faker.string.numeric(9),
      faker.company.catchPhrase(),
      randomElement(['Education', 'Healthcare', 'Environment', 'Poverty Alleviation', 'Animal Welfare', 'Arts & Culture']),
      randomInt(1950, 2020),
      randomDecimal(50000, 10000000, 2),
      randomInt(5, 500),
      randomInt(10, 1000),
      randomInt(5, 25),
      faker.internet.url(),
      faker.internet.email(),
      faker.phone.number(),
      faker.location.streetAddress(),
      faker.location.city(),
      faker.location.state({ abbreviated: true }),
      faker.location.zipCode(),
      'USA',
      randomDate(new Date('2020-01-01'), new Date()),
    ]);

    organizationIds.push(result.rows[0].org_id);
  }

  // Create assessments
  console.log(`Creating ${volume.assessments} assessments...`);
  for (let i = 0; i < volume.assessments; i++) {
    const result = await client.query(`
      INSERT INTO assessments (
        org_id, assessment_name, assessment_type, status,
        overall_score, maturity_level,
        ai_readiness_score, data_infrastructure_score, talent_score,
        governance_score, ethics_score, innovation_score,
        assessment_date, assessor_name, assessor_email,
        key_findings, strategic_recommendations
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
      ) RETURNING assessment_id
    `, [
      randomElement(organizationIds),
      'AI Readiness Assessment ' + faker.string.alphanumeric(6),
      randomElement(['Initial', 'Follow-up', 'Comprehensive', 'Quick Scan']),
      randomElement(['Draft', 'In Progress', 'Completed', 'Published']),
      randomDecimal(1, 5, 2),
      randomElement(['Beginner', 'Developing', 'Advancing', 'Leading']),
      randomDecimal(1, 5, 2),
      randomDecimal(1, 5, 2),
      randomDecimal(1, 5, 2),
      randomDecimal(1, 5, 2),
      randomDecimal(1, 5, 2),
      randomDecimal(1, 5, 2),
      randomDate(new Date('2023-01-01'), new Date()),
      faker.person.fullName(),
      faker.internet.email(),
      Array.from({ length: 3 }, () => faker.lorem.sentence()).join('; '),
      Array.from({ length: 3 }, () => faker.lorem.sentence()).join('; '),
    ]);

    assessmentIds.push(result.rows[0].assessment_id);
  }

  // Create assessment dimensions
  console.log('Creating assessment dimensions...');
  const dimensions = [
    'Data Infrastructure', 'AI/ML Capabilities', 'Talent & Skills',
    'Governance & Ethics', 'Innovation Culture', 'Technology Adoption'
  ];

  for (const assessmentId of assessmentIds) {
    for (const dimension of dimensions) {
      await client.query(`
        INSERT INTO assessment_dimensions (
          assessment_id, dimension_name, score, weight,
          criteria_met, total_criteria, strengths, weaknesses
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8
        )
      `, [
        assessmentId,
        dimension,
        randomDecimal(1, 5, 2),
        randomDecimal(0.1, 0.3, 2),
        randomInt(3, 10),
        randomInt(10, 15),
        Array.from({ length: 2 }, () => faker.lorem.sentence()).join('; '),
        Array.from({ length: 2 }, () => faker.lorem.sentence()).join('; '),
      ]);
    }
  }

  console.log('Assessment Engine data seeded successfully!');
}

// ============================================================================
// DONOR MANAGEMENT SEED DATA
// ============================================================================

export async function seedDonorManagement(client: PoolClient, config: SeedConfig): Promise<void> {
  console.log('Seeding Donor Management data...');

  const volume = DATA_VOLUMES[config.size];
  const donorIds: string[] = [];

  // Create donors
  console.log(`Creating ${volume.donors} donors...`);
  for (let i = 0; i < volume.donors; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName });

    const result = await client.query(`
      INSERT INTO donors (
        donor_type, first_name, last_name, full_name, email, phone,
        address_line1, city, state, zip, country,
        donor_status, donor_level, lifetime_value,
        first_gift_date, last_gift_date, largest_gift_amount,
        preferred_contact_method, email_opt_in, mail_opt_in,
        interests, engagement_score
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
      ) RETURNING donor_id
    `, [
      randomElement(['Individual', 'Corporate', 'Foundation']),
      firstName,
      lastName,
      `${firstName} ${lastName}`,
      email,
      faker.phone.number(),
      faker.location.streetAddress(),
      faker.location.city(),
      faker.location.state({ abbreviated: true }),
      faker.location.zipCode(),
      'USA',
      randomElement(['Active', 'Lapsed', 'LYBUNT', 'SYBUNT', 'Major Donor']),
      randomElement(['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond']),
      randomDecimal(100, 100000, 2),
      randomDate(new Date('2020-01-01'), new Date('2022-12-31')),
      randomDate(new Date('2023-01-01'), new Date()),
      randomDecimal(100, 50000, 2),
      randomElement(['Email', 'Phone', 'Mail']),
      randomBool(0.8),
      randomBool(0.6),
      randomElements(['Education', 'Healthcare', 'Environment', 'Arts', 'Social Justice'], 2),
      randomDecimal(0, 100, 1),
    ]);

    donorIds.push(result.rows[0].donor_id);
  }

  // Create campaigns
  console.log('Creating donation campaigns...');
  const campaignIds: string[] = [];
  const campaigns = [
    'Annual Fund 2024', 'Spring Gala', 'End of Year Appeal',
    'Capital Campaign', 'Emergency Relief Fund', 'Scholarship Drive'
  ];

  for (const campaignName of campaigns) {
    const result = await client.query(`
      INSERT INTO campaigns (
        campaign_name, campaign_type, status,
        start_date, end_date, goal_amount, amount_raised,
        number_of_donations, average_donation
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      ) RETURNING campaign_id
    `, [
      campaignName,
      randomElement(['Annual Fund', 'Capital', 'Special Event', 'Emergency']),
      randomElement(['Planning', 'Active', 'Completed']),
      randomDate(new Date('2024-01-01'), new Date('2024-06-01')),
      randomDate(new Date('2024-06-01'), new Date('2024-12-31')),
      randomDecimal(50000, 1000000, 2),
      randomDecimal(10000, 800000, 2),
      randomInt(50, 500),
      randomDecimal(100, 5000, 2),
    ]);

    campaignIds.push(result.rows[0].campaign_id);
  }

  // Create donations
  console.log(`Creating ${volume.donations} donations...`);
  for (let i = 0; i < volume.donations; i++) {
    await client.query(`
      INSERT INTO donations (
        donor_id, campaign_id, donation_type, donation_method,
        amount, currency, donation_date, status,
        is_recurring, recurring_frequency, tax_deductible_amount,
        designation, fund_name, tribute_type, tribute_name
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
      )
    `, [
      randomElement(donorIds),
      randomBool(0.7) ? randomElement(campaignIds) : null,
      randomElement(['One-Time', 'Recurring', 'Pledge', 'In-Kind']),
      randomElement(['Credit Card', 'Check', 'Bank Transfer', 'PayPal', 'Cryptocurrency']),
      randomDecimal(25, 10000, 2),
      'USD',
      randomDate(new Date('2023-01-01'), new Date()),
      randomElement(['Completed', 'Pending', 'Failed', 'Refunded']),
      randomBool(0.2),
      randomBool(0.2) ? randomElement(['Monthly', 'Quarterly', 'Annually']) : null,
      randomDecimal(25, 10000, 2),
      randomElement(['General Fund', 'Scholarship', 'Building Fund', 'Program Support']),
      randomElement(['General', 'Education', 'Healthcare', 'Arts']),
      randomBool(0.1) ? randomElement(['In Honor Of', 'In Memory Of']) : null,
      randomBool(0.1) ? faker.person.fullName() : null,
    ]);
  }

  console.log('Donor Management data seeded successfully!');
}

// ============================================================================
// FINANCIAL HUB SEED DATA
// ============================================================================

export async function seedFinancialHub(client: PoolClient, config: SeedConfig): Promise<void> {
  console.log('Seeding Financial Hub data...');

  const volume = DATA_VOLUMES[config.size];
  const accountIds: string[] = [];

  // Create accounts (Chart of Accounts)
  console.log(`Creating ${volume.accounts} accounts...`);
  const accountTypes = [
    { type: 'Asset', subtype: 'Cash' },
    { type: 'Asset', subtype: 'Accounts Receivable' },
    { type: 'Asset', subtype: 'Investments' },
    { type: 'Liability', subtype: 'Accounts Payable' },
    { type: 'Liability', subtype: 'Credit Card' },
    { type: 'Equity', subtype: 'Net Assets' },
    { type: 'Revenue', subtype: 'Donations' },
    { type: 'Revenue', subtype: 'Grants' },
    { type: 'Expense', subtype: 'Program Services' },
    { type: 'Expense', subtype: 'Administrative' },
    { type: 'Expense', subtype: 'Fundraising' },
  ];

  for (let i = 0; i < volume.accounts; i++) {
    const accountType = randomElement(accountTypes);
    const result = await client.query(`
      INSERT INTO accounts (
        account_number, account_name, account_type, account_subtype,
        normal_balance, is_active, is_bank_account, is_restricted,
        fund_type, description, parent_account_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
      ) RETURNING account_id
    `, [
      `${1000 + i}`,
      `${accountType.subtype} - ${faker.company.buzzNoun()}`,
      accountType.type,
      accountType.subtype,
      ['Asset', 'Expense'].includes(accountType.type) ? 'Debit' : 'Credit',
      randomBool(0.95),
      accountType.subtype === 'Cash',
      randomBool(0.2),
      randomElement(['Unrestricted', 'Temporarily Restricted', 'Permanently Restricted']),
      faker.lorem.sentence(),
      null,
    ]);

    accountIds.push(result.rows[0].account_id);
  }

  // Create transactions
  console.log(`Creating ${volume.transactions} transactions...`);
  for (let i = 0; i < volume.transactions; i++) {
    const isDebit = randomBool();
    const amount = randomDecimal(10, 50000, 2);

    await client.query(`
      INSERT INTO transactions (
        transaction_number, transaction_date, transaction_type,
        account_id, debit_amount, credit_amount,
        description, reference_number, posted_by, posted_date
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
      )
    `, [
      `TXN-${faker.string.alphanumeric(8).toUpperCase()}`,
      randomDate(new Date('2024-01-01'), new Date()),
      randomElement(['Journal Entry', 'Payment', 'Receipt', 'Transfer', 'Adjustment']),
      randomElement(accountIds),
      isDebit ? amount : 0,
      isDebit ? 0 : amount,
      faker.lorem.sentence(),
      `REF-${faker.string.alphanumeric(6)}`,
      faker.person.fullName(),
      randomDate(new Date('2024-01-01'), new Date()),
    ]);
  }

  // Create budgets
  console.log('Creating budgets...');
  for (const accountId of accountIds.slice(0, 20)) {
    await client.query(`
      INSERT INTO budgets (
        account_id, fiscal_year, budget_period,
        budget_amount, actual_amount, variance,
        budget_type, fund_type
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8
      )
    `, [
      accountId,
      2024,
      randomElement(['Annual', 'Q1', 'Q2', 'Q3', 'Q4', 'Monthly']),
      randomDecimal(10000, 500000, 2),
      randomDecimal(5000, 400000, 2),
      randomDecimal(-100000, 100000, 2),
      randomElement(['Operating', 'Capital', 'Program', 'Fundraising']),
      randomElement(['Unrestricted', 'Temporarily Restricted', 'Permanently Restricted']),
    ]);
  }

  console.log('Financial Hub data seeded successfully!');
}

// ============================================================================
// VOLUNTEER COORDINATOR SEED DATA
// ============================================================================

export async function seedVolunteerCoordinator(client: PoolClient, config: SeedConfig): Promise<void> {
  console.log('Seeding Volunteer Coordinator data...');

  const volume = DATA_VOLUMES[config.size];
  const volunteerIds: string[] = [];
  const opportunityIds: string[] = [];

  // Create volunteers
  console.log(`Creating ${volume.volunteers} volunteers...`);
  for (let i = 0; i < volume.volunteers; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    const result = await client.query(`
      INSERT INTO volunteers (
        first_name, last_name, email, phone, date_of_birth,
        address_line1, city, state, zip,
        volunteer_status, start_date, total_hours_served,
        emergency_contact_name, emergency_contact_phone,
        has_background_check, background_check_date, background_check_status,
        skills, interests, availability_days, availability_times,
        motivation, volunteer_level
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
      ) RETURNING volunteer_id
    `, [
      firstName,
      lastName,
      faker.internet.email({ firstName, lastName }),
      faker.phone.number(),
      randomDate(new Date('1960-01-01'), new Date('2005-12-31')),
      faker.location.streetAddress(),
      faker.location.city(),
      faker.location.state({ abbreviated: true }),
      faker.location.zipCode(),
      randomElement(['Active', 'Inactive', 'On Leave', 'Suspended']),
      randomDate(new Date('2020-01-01'), new Date()),
      randomDecimal(0, 500, 1),
      faker.person.fullName(),
      faker.phone.number(),
      randomBool(0.8),
      randomBool(0.8) ? randomDate(new Date('2023-01-01'), new Date()) : null,
      randomBool(0.8) ? randomElement(['Clear', 'Pending', 'Flagged']) : null,
      randomElements(['Marketing', 'IT', 'Teaching', 'Cooking', 'Driving', 'Mentoring'], 3),
      randomElements(['Education', 'Environment', 'Elderly Care', 'Youth Programs'], 2),
      randomElements(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], 3),
      randomElements(['Morning', 'Afternoon', 'Evening', 'Weekend'], 2),
      faker.lorem.paragraph(),
      randomElement(['New', 'Regular', 'Core', 'Leader']),
    ]);

    volunteerIds.push(result.rows[0].volunteer_id);
  }

  // Create volunteer opportunities
  console.log(`Creating ${volume.opportunities} volunteer opportunities...`);
  const opportunityTitles = [
    'Food Bank Assistant', 'Tutor for Kids', 'Event Coordinator',
    'Grant Writer', 'Social Media Manager', 'Gardening Helper',
    'Animal Shelter Care', 'Meal Delivery Driver', 'Fundraising Committee',
    'Youth Mentor', 'Senior Companion', 'Tech Support'
  ];

  for (const title of opportunityTitles) {
    const result = await client.query(`
      INSERT INTO volunteer_opportunities (
        opportunity_title, opportunity_type, description,
        required_skills, preferred_skills, time_commitment,
        start_date, end_date, status, spots_available, spots_filled,
        location_type, address_line1, city, state,
        contact_person_name, contact_person_email, contact_person_phone,
        requires_background_check, minimum_age, training_required
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
      ) RETURNING opportunity_id
    `, [
      title,
      randomElement(['One-Time Event', 'Ongoing', 'Seasonal', 'Project-Based']),
      faker.lorem.paragraph(),
      randomElements(['Communication', 'Organization', 'Reliability'], 2),
      randomElements(['Microsoft Office', 'Social Media', 'First Aid'], 1),
      randomElement(['2-4 hours/week', '4-8 hours/week', 'Flexible', '1 day/week']),
      randomDate(new Date(), new Date('2025-12-31')),
      randomDate(new Date('2025-01-01'), new Date('2025-12-31')),
      randomElement(['Open', 'Full', 'In Progress', 'Completed']),
      randomInt(5, 30),
      randomInt(0, 20),
      randomElement(['On-site', 'Remote', 'Hybrid']),
      faker.location.streetAddress(),
      faker.location.city(),
      faker.location.state({ abbreviated: true }),
      faker.person.fullName(),
      faker.internet.email(),
      faker.phone.number(),
      randomBool(0.3),
      randomElement([16, 18, 21]),
      randomBool(0.4),
    ]);

    opportunityIds.push(result.rows[0].opportunity_id);
  }

  // Create volunteer assignments
  console.log('Creating volunteer assignments...');
  for (let i = 0; i < volunteerIds.length; i++) {
    const numAssignments = randomInt(1, 5);
    for (let j = 0; j < numAssignments; j++) {
      await client.query(`
        INSERT INTO volunteer_assignments (
          volunteer_id, opportunity_id, assignment_status,
          start_date, end_date, role, notes
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7
        )
      `, [
        volunteerIds[i],
        randomElement(opportunityIds),
        randomElement(['Pending', 'Active', 'Completed', 'Cancelled']),
        randomDate(new Date('2024-01-01'), new Date()),
        randomBool(0.5) ? randomDate(new Date(), new Date('2025-12-31')) : null,
        randomElement(['Volunteer', 'Team Lead', 'Coordinator']),
        faker.lorem.sentence(),
      ]);
    }
  }

  console.log('Volunteer Coordinator data seeded successfully!');
}

// ============================================================================
// GRANT INTELLIGENCE SEED DATA
// ============================================================================

export async function seedGrantIntelligence(client: PoolClient, config: SeedConfig): Promise<void> {
  console.log('Seeding Grant Intelligence data...');

  const volume = DATA_VOLUMES[config.size];
  const grantOpportunityIds: string[] = [];
  const funderIds: string[] = [];

  // Create funders
  console.log('Creating grant funders...');
  for (let i = 0; i < 20; i++) {
    const result = await client.query(`
      INSERT INTO funders (
        funder_name, funder_type, website, description,
        focus_areas, geographic_focus, typical_grant_size_min, typical_grant_size_max,
        application_method, contact_email, contact_phone
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
      ) RETURNING funder_id
    `, [
      faker.company.name() + ' Foundation',
      randomElement(['Private Foundation', 'Corporate Foundation', 'Community Foundation', 'Government']),
      faker.internet.url(),
      faker.lorem.paragraph(),
      randomElements(['Education', 'Healthcare', 'Environment', 'Arts', 'Social Justice'], 3),
      randomElements(['National', 'Regional', 'State', 'Local'], 2),
      randomDecimal(5000, 50000, 2),
      randomDecimal(100000, 1000000, 2),
      randomElement(['Online Portal', 'Email', 'Mail']),
      faker.internet.email(),
      faker.phone.number(),
    ]);

    funderIds.push(result.rows[0].funder_id);
  }

  // Create grant opportunities
  console.log(`Creating ${volume.grants} grant opportunities...`);
  for (let i = 0; i < volume.grants; i++) {
    const result = await client.query(`
      INSERT INTO grant_opportunities (
        grant_name, funder_id, grant_type, focus_area,
        description, eligibility_criteria, geographic_restrictions,
        amount_min, amount_max, application_deadline,
        award_date, grant_period_start, grant_period_end,
        status, website_url, application_method, match_score
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
      ) RETURNING opportunity_id
    `, [
      faker.lorem.words(4),
      randomElement(funderIds),
      randomElement(['Program', 'Capital', 'Operating', 'Research', 'Capacity Building']),
      randomElement(['Education', 'Healthcare', 'Environment', 'Arts', 'Social Services']),
      faker.lorem.paragraph(),
      faker.lorem.sentence(),
      randomElements(['California', 'New York', 'Texas', 'National'], 2),
      randomDecimal(10000, 100000, 2),
      randomDecimal(200000, 2000000, 2),
      randomDate(new Date(), new Date('2025-12-31')),
      randomDate(new Date('2025-01-01'), new Date('2025-12-31')),
      randomDate(new Date('2025-01-01'), new Date('2025-06-30')),
      randomDate(new Date('2025-06-30'), new Date('2026-12-31')),
      randomElement(['Open', 'Closed', 'Pending', 'Awarded']),
      faker.internet.url(),
      randomElement(['Online Portal', 'Email', 'Mail']),
      randomDecimal(60, 100, 1),
    ]);

    grantOpportunityIds.push(result.rows[0].opportunity_id);
  }

  // Create grant applications
  console.log('Creating grant applications...');
  for (const opportunityId of grantOpportunityIds.slice(0, Math.floor(grantOpportunityIds.length * 0.7))) {
    await client.query(`
      INSERT INTO grant_applications (
        opportunity_id, application_status, submission_date,
        requested_amount, proposal_title, proposal_summary,
        project_start_date, project_end_date,
        budget_personnel, budget_operations, budget_equipment, budget_total,
        key_personnel, success_metrics
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
      )
    `, [
      opportunityId,
      randomElement(['Draft', 'Submitted', 'Under Review', 'Awarded', 'Declined']),
      randomDate(new Date('2024-01-01'), new Date()),
      randomDecimal(50000, 500000, 2),
      faker.lorem.sentence(),
      faker.lorem.paragraph(),
      randomDate(new Date('2025-01-01'), new Date('2025-06-30')),
      randomDate(new Date('2025-06-30'), new Date('2026-12-31')),
      randomDecimal(50000, 200000, 2),
      randomDecimal(20000, 100000, 2),
      randomDecimal(10000, 50000, 2),
      randomDecimal(100000, 400000, 2),
      [faker.person.fullName(), faker.person.fullName()],
      Array.from({ length: 3 }, () => faker.lorem.sentence()),
    ]);
  }

  console.log('Grant Intelligence data seeded successfully!');
}

// ============================================================================
// IMPACT ANALYTICS SEED DATA
// ============================================================================

export async function seedImpactAnalytics(client: PoolClient, config: SeedConfig): Promise<void> {
  console.log('Seeding Impact Analytics data...');

  const volume = DATA_VOLUMES[config.size];
  const programIds: string[] = [];
  const beneficiaryIds: string[] = [];

  // Create programs
  console.log(`Creating ${volume.programs} programs...`);
  for (let i = 0; i < volume.programs; i++) {
    const result = await client.query(`
      INSERT INTO programs (
        program_code, program_name, program_type, description,
        target_population, geographic_area, start_date, status,
        capacity, budget_allocated, staff_count, volunteer_count
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      ) RETURNING program_id
    `, [
      `PRG-${faker.string.alphanumeric(6).toUpperCase()}`,
      faker.lorem.words(3),
      randomElement(['Direct Service', 'Advocacy', 'Research', 'Education']),
      faker.lorem.paragraph(),
      faker.lorem.sentence(),
      randomElements(['Urban', 'Suburban', 'Rural'], 2),
      randomDate(new Date('2020-01-01'), new Date()),
      randomElement(['Planning', 'Active', 'Suspended', 'Completed']),
      randomInt(50, 500),
      randomDecimal(50000, 1000000, 2),
      randomInt(3, 20),
      randomInt(5, 50),
    ]);

    programIds.push(result.rows[0].program_id);
  }

  // Create beneficiaries
  console.log(`Creating ${volume.beneficiaries} beneficiaries...`);
  for (let i = 0; i < volume.beneficiaries; i++) {
    const result = await client.query(`
      INSERT INTO beneficiaries (
        beneficiary_number, first_name, last_name, date_of_birth,
        gender, ethnicity, primary_language,
        contact_phone, contact_email, city, state, zip,
        household_size, household_income, education_level, employment_status,
        referral_source, intake_date, is_active
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
      ) RETURNING beneficiary_id
    `, [
      `BEN-${faker.string.alphanumeric(8).toUpperCase()}`,
      faker.person.firstName(),
      faker.person.lastName(),
      randomDate(new Date('1950-01-01'), new Date('2020-12-31')),
      randomElement(['Male', 'Female', 'Non-binary', 'Prefer not to say']),
      randomElement(['Asian', 'Black', 'Hispanic', 'White', 'Other']),
      randomElement(['English', 'Spanish', 'Chinese', 'Vietnamese', 'Other']),
      faker.phone.number(),
      faker.internet.email(),
      faker.location.city(),
      faker.location.state({ abbreviated: true }),
      faker.location.zipCode(),
      randomInt(1, 6),
      randomDecimal(15000, 80000, 2),
      randomElement(['High School', 'Some College', 'Bachelor', 'Master', 'PhD']),
      randomElement(['Employed Full-Time', 'Employed Part-Time', 'Unemployed', 'Student', 'Retired']),
      randomElement(['Walk-in', 'Referral', 'Website', 'Social Media']),
      randomDate(new Date('2023-01-01'), new Date()),
      randomBool(0.9),
    ]);

    beneficiaryIds.push(result.rows[0].beneficiary_id);
  }

  // Create services delivered
  console.log(`Creating ${volume.services} services delivered...`);
  for (let i = 0; i < volume.services; i++) {
    await client.query(`
      INSERT INTO services_delivered (
        beneficiary_id, program_id, service_type, service_date,
        duration_minutes, delivery_method, units_delivered, cost_per_unit,
        total_cost, quality_rating, beneficiary_satisfaction
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
      )
    `, [
      randomElement(beneficiaryIds),
      randomElement(programIds),
      randomElement(['Counseling', 'Education', 'Food Assistance', 'Job Training', 'Health Screening']),
      randomDate(new Date('2024-01-01'), new Date()),
      randomInt(30, 180),
      randomElement(['In-Person', 'Virtual', 'Phone', 'Home Visit']),
      randomDecimal(1, 10, 1),
      randomDecimal(10, 200, 2),
      randomDecimal(10, 2000, 2),
      randomDecimal(3.0, 5.0, 1),
      randomDecimal(3.0, 5.0, 1),
    ]);
  }

  // Create outcomes
  console.log('Creating outcome measurements...');
  for (const programId of programIds) {
    for (let i = 0; i < randomInt(3, 10); i++) {
      await client.query(`
        INSERT INTO outcomes (
          program_id, outcome_type, outcome_domain, indicator,
          baseline_value, target_value, actual_value,
          measurement_date, goal_achieved, impact_level
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
        )
      `, [
        programId,
        randomElement(['Output', 'Short-term Outcome', 'Long-term Outcome', 'Impact']),
        randomElement(['Health', 'Education', 'Employment', 'Housing', 'Financial Stability']),
        faker.lorem.sentence(),
        randomDecimal(0, 100, 1),
        randomDecimal(70, 100, 1),
        randomDecimal(60, 110, 1),
        randomDate(new Date('2024-01-01'), new Date()),
        randomBool(0.7),
        randomElement(['Transformational', 'Significant', 'Moderate', 'Minimal']),
      ]);
    }
  }

  // Create SROI calculations
  console.log('Creating SROI calculations...');
  for (const programId of programIds.slice(0, Math.floor(programIds.length * 0.5))) {
    await client.query(`
      INSERT INTO sroi_calculations (
        program_id, calculation_name, calculation_date,
        calculation_period_start, calculation_period_end,
        calculation_type, total_investment, total_outcomes_value,
        present_value_outcomes, net_present_value, sroi_ratio
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
      )
    `, [
      programId,
      `SROI Analysis ${new Date().getFullYear()}`,
      new Date(),
      new Date('2024-01-01'),
      new Date('2024-12-31'),
      randomElement(['Evaluative', 'Forecast', 'Hybrid']),
      randomDecimal(100000, 1000000, 2),
      randomDecimal(300000, 5000000, 2),
      randomDecimal(250000, 4500000, 2),
      randomDecimal(150000, 3500000, 2),
      randomDecimal(2.0, 8.0, 2),
    ]);
  }

  console.log('Impact Analytics data seeded successfully!');
}

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

export async function seedDatabase(config: SeedConfig): Promise<void> {
  const pools: Record<string, Pool> = {};

  try {
    // Initialize database connections
    console.log('Initializing database connections...');

    const schemasToSeed = config.schemas;

    for (const schema of schemasToSeed) {
      const envVar = `${schema.toUpperCase()}_DB_URL`;
      const dbUrl = process.env[envVar];

      if (!dbUrl) {
        console.warn(`Warning: ${envVar} not set, skipping ${schema} schema`);
        continue;
      }

      pools[schema] = new Pool({ connectionString: dbUrl });
    }

    // Clean existing data if requested
    if (config.clean) {
      console.log('\nCleaning existing seed data...');

      for (const [schema, pool] of Object.entries(pools)) {
        const client = await pool.connect();
        try {
          console.log(`Cleaning ${schema} schema...`);
          await client.query('BEGIN');

          // Delete in reverse order of dependencies
          // This is a simplified approach - you may need to adjust based on your FK constraints
          const tables = await client.query(`
            SELECT tablename FROM pg_tables
            WHERE schemaname = 'public'
            ORDER BY tablename DESC
          `);

          for (const row of tables.rows) {
            await client.query(`TRUNCATE TABLE ${row.tablename} CASCADE`);
          }

          await client.query('COMMIT');
          console.log(`${schema} schema cleaned successfully!`);
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      }
    }

    // Seed each schema
    console.log('\nSeeding database...');
    console.log(`Data size: ${config.size}`);
    console.log(`Schemas: ${schemasToSeed.join(', ')}\n`);

    for (const [schema, pool] of Object.entries(pools)) {
      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        switch (schema) {
          case 'assessment':
            await seedAssessmentEngine(client, config);
            break;
          case 'donor':
            await seedDonorManagement(client, config);
            break;
          case 'financial':
            await seedFinancialHub(client, config);
            break;
          case 'volunteer':
            await seedVolunteerCoordinator(client, config);
            break;
          case 'grant':
            await seedGrantIntelligence(client, config);
            break;
          case 'impact':
            await seedImpactAnalytics(client, config);
            break;
        }

        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }

    console.log('\n✅ Database seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    // Close all connections
    for (const pool of Object.values(pools)) {
      await pool.end();
    }
  }
}
