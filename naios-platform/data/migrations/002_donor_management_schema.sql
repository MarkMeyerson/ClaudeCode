-- ============================================================================
-- NAIOS Platform - Donor Management Database Schema
-- Version: 1.0.0
-- Description: Complete database schema for donor management and fundraising
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ============================================================================
-- DONORS TABLE
-- Comprehensive donor information and engagement tracking
-- ============================================================================
CREATE TABLE donors (
    -- Primary identification
    donor_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donor_number VARCHAR(50) UNIQUE NOT NULL,

    -- Donor type and classification
    donor_type VARCHAR(50) NOT NULL CHECK (donor_type IN (
        'Individual', 'Family', 'Corporation', 'Foundation',
        'Trust', 'Estate', 'Government', 'Other'
    )),

    -- Personal information (Individual donors)
    first_name VARCHAR(100),
    middle_name VARCHAR(100),
    last_name VARCHAR(100),
    preferred_name VARCHAR(100),
    suffix VARCHAR(20),
    title VARCHAR(50),
    gender VARCHAR(20),
    date_of_birth DATE,

    -- Organization information (Corporate/Foundation donors)
    organization_name VARCHAR(255),
    organization_type VARCHAR(100),
    ein VARCHAR(20),

    -- Contact information
    email_primary VARCHAR(255),
    email_secondary VARCHAR(255),
    email_work VARCHAR(255),
    phone_primary VARCHAR(20),
    phone_secondary VARCHAR(20),
    phone_mobile VARCHAR(20),
    phone_work VARCHAR(20),

    -- Address information
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip VARCHAR(20),
    country VARCHAR(3) DEFAULT 'USA',
    address_type VARCHAR(50) CHECK (address_type IN ('Home', 'Work', 'Seasonal', 'Other')),

    -- Additional addresses (stored as JSONB for flexibility)
    additional_addresses JSONB,

    -- Communication preferences
    preferred_contact_method VARCHAR(50) CHECK (preferred_contact_method IN (
        'Email', 'Phone', 'Mail', 'Text', 'In-Person'
    )),
    preferred_contact_time VARCHAR(50),
    language_preference VARCHAR(50) DEFAULT 'English',
    communication_restrictions TEXT[],

    -- Giving history and metrics
    donor_level VARCHAR(50) CHECK (donor_level IN (
        'Legacy Circle', 'Major Donor', 'Leadership',
        'Sustainer', 'Contributor', 'Friend', 'Prospect'
    )),
    lifetime_giving DECIMAL(15, 2) DEFAULT 0,
    first_gift_date DATE,
    last_gift_date DATE,
    largest_gift_amount DECIMAL(15, 2) DEFAULT 0,
    average_gift_amount DECIMAL(15, 2) DEFAULT 0,
    total_gifts INTEGER DEFAULT 0,

    -- Giving patterns
    giving_frequency VARCHAR(50) CHECK (giving_frequency IN (
        'Weekly', 'Monthly', 'Quarterly', 'Semi-Annual',
        'Annual', 'Irregular', 'One-Time', 'Lapsed'
    )),
    typical_giving_month INTEGER CHECK (typical_giving_month BETWEEN 1 AND 12),
    typical_giving_day INTEGER CHECK (typical_giving_day BETWEEN 1 AND 31),

    -- Capacity and propensity scoring
    giving_capacity_rating VARCHAR(20) CHECK (giving_capacity_rating IN (
        'Ultra High', 'Very High', 'High', 'Medium-High',
        'Medium', 'Medium-Low', 'Low', 'Unknown'
    )),
    wealth_screening_score DECIMAL(5, 2),
    wealth_screening_date DATE,
    wealth_screening_source VARCHAR(100),
    estimated_capacity DECIMAL(15, 2),

    -- Engagement metrics
    engagement_score DECIMAL(5, 2) CHECK (engagement_score >= 0 AND engagement_score <= 100),
    engagement_level VARCHAR(50) CHECK (engagement_level IN (
        'Highly Engaged', 'Engaged', 'Moderately Engaged',
        'Minimally Engaged', 'Disengaged', 'Unknown'
    )),
    last_engagement_date DATE,
    touchpoints_last_year INTEGER DEFAULT 0,
    events_attended_count INTEGER DEFAULT 0,

    -- Retention and risk
    retention_risk_score DECIMAL(5, 2) CHECK (retention_risk_score >= 0 AND retention_risk_score <= 100),
    retention_probability DECIMAL(5, 2),
    lapsed_indicator BOOLEAN DEFAULT FALSE,
    lapse_date DATE,
    lapse_reason TEXT,

    -- Upgrade potential
    upgrade_potential_score DECIMAL(5, 2) CHECK (upgrade_potential_score >= 0 AND upgrade_potential_score <= 100),
    upgrade_indicators TEXT[],
    next_ask_amount DECIMAL(15, 2),
    next_ask_date DATE,

    -- Special designations
    planned_giving_prospect BOOLEAN DEFAULT FALSE,
    planned_giving_interest VARCHAR(100),
    planned_giving_notes TEXT,
    major_gift_prospect BOOLEAN DEFAULT FALSE,
    major_gift_capacity DECIMAL(15, 2),
    major_gift_stage VARCHAR(50) CHECK (major_gift_stage IN (
        'Identification', 'Qualification', 'Cultivation',
        'Solicitation', 'Stewardship', 'Not Qualified'
    )),

    -- Organization types
    grant_maker BOOLEAN DEFAULT FALSE,
    corporate_sponsor BOOLEAN DEFAULT FALSE,
    foundation_contact VARCHAR(255),
    foundation_relationship TEXT,

    -- Volunteer and board engagement
    volunteer_status BOOLEAN DEFAULT FALSE,
    volunteer_hours_total DECIMAL(10, 2) DEFAULT 0,
    board_member BOOLEAN DEFAULT FALSE,
    board_member_since DATE,
    board_member_until DATE,
    committee_memberships TEXT[],

    -- Legacy and recognition
    legacy_society_member BOOLEAN DEFAULT FALSE,
    legacy_society_since DATE,
    recognition_name VARCHAR(255),
    recognition_level VARCHAR(100),
    recognition_preferences JSONB,
    anonymous_giving BOOLEAN DEFAULT FALSE,

    -- Relationship information
    spouse_partner_name VARCHAR(255),
    spouse_partner_donor_id UUID REFERENCES donors(donor_id),
    household_id UUID,
    related_donors UUID[],
    relationship_manager_id UUID,
    solicitor_id UUID,

    -- Interests and affinities
    interests TEXT[],
    program_affinities TEXT[],
    cause_affinities TEXT[],
    motivations TEXT[],

    -- Employment and professional information
    employer VARCHAR(255),
    job_title VARCHAR(100),
    industry VARCHAR(100),
    professional_affiliations TEXT[],

    -- Social connections
    social_media_handles JSONB,
    linkedin_url VARCHAR(500),
    network_connections TEXT[],

    -- Tax information
    tax_deductible_eligible BOOLEAN DEFAULT TRUE,
    tax_id_on_file BOOLEAN DEFAULT FALSE,

    -- Acknowledgment preferences
    acknowledgment_preference VARCHAR(100),
    thank_you_preference VARCHAR(100),
    receipt_preference VARCHAR(50) CHECK (receipt_preference IN ('Email', 'Mail', 'Both', 'None')),

    -- Data quality and source
    data_quality_score DECIMAL(5, 2),
    data_source VARCHAR(100),
    source_code VARCHAR(50),
    referral_source VARCHAR(255),
    acquired_date DATE,

    -- Flags and indicators
    do_not_contact BOOLEAN DEFAULT FALSE,
    do_not_email BOOLEAN DEFAULT FALSE,
    do_not_call BOOLEAN DEFAULT FALSE,
    do_not_mail BOOLEAN DEFAULT FALSE,
    deceased BOOLEAN DEFAULT FALSE,
    deceased_date DATE,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    last_modified_by UUID,

    -- Additional data
    custom_fields JSONB,
    attributes JSONB,
    notes TEXT,
    tags TEXT[],

    -- Soft delete
    is_active BOOLEAN DEFAULT TRUE,
    archived_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for donors table
CREATE INDEX idx_donors_donor_number ON donors(donor_number);
CREATE INDEX idx_donors_email ON donors(email_primary);
CREATE INDEX idx_donors_name ON donors(last_name, first_name);
CREATE INDEX idx_donors_org_name ON donors USING gin(organization_name gin_trgm_ops);
CREATE INDEX idx_donors_type ON donors(donor_type);
CREATE INDEX idx_donors_level ON donors(donor_level);
CREATE INDEX idx_donors_lifetime_giving ON donors(lifetime_giving DESC);
CREATE INDEX idx_donors_last_gift_date ON donors(last_gift_date DESC);
CREATE INDEX idx_donors_engagement ON donors(engagement_score DESC);
CREATE INDEX idx_donors_retention_risk ON donors(retention_risk_score DESC);
CREATE INDEX idx_donors_major_gift_prospect ON donors(major_gift_prospect) WHERE major_gift_prospect = TRUE;
CREATE INDEX idx_donors_planned_giving ON donors(planned_giving_prospect) WHERE planned_giving_prospect = TRUE;
CREATE INDEX idx_donors_tags ON donors USING gin(tags);
CREATE INDEX idx_donors_active ON donors(is_active) WHERE is_active = TRUE;

-- Full-text search index
CREATE INDEX idx_donors_fulltext ON donors USING gin(
    to_tsvector('english',
        COALESCE(first_name, '') || ' ' ||
        COALESCE(last_name, '') || ' ' ||
        COALESCE(organization_name, '') || ' ' ||
        COALESCE(notes, '')
    )
);

-- ============================================================================
-- DONATIONS TABLE
-- Individual donation transactions
-- ============================================================================
CREATE TABLE donations (
    -- Primary identification
    donation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donation_number VARCHAR(50) UNIQUE NOT NULL,
    donor_id UUID NOT NULL REFERENCES donors(donor_id) ON DELETE RESTRICT,

    -- Related campaigns and appeals
    campaign_id UUID,
    appeal_id UUID,
    solicitation_id UUID,

    -- Financial details
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'USD',
    exchange_rate DECIMAL(10, 4) DEFAULT 1.0000,
    amount_usd DECIMAL(15, 2) GENERATED ALWAYS AS (amount * exchange_rate) STORED,

    -- Date and timing
    donation_date DATE NOT NULL,
    received_date DATE,
    posted_date DATE,
    fiscal_year INTEGER,
    fiscal_quarter INTEGER CHECK (fiscal_quarter BETWEEN 1 AND 4),

    -- Payment information
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN (
        'Credit Card', 'Debit Card', 'ACH', 'Check', 'Cash',
        'Wire Transfer', 'Stock', 'Cryptocurrency', 'In-Kind',
        'Pledge Payment', 'DAF', 'Other'
    )),
    payment_processor VARCHAR(100),
    payment_processor_id VARCHAR(255),
    transaction_id VARCHAR(255),
    authorization_code VARCHAR(100),

    -- Payment fees
    processing_fee DECIMAL(15, 2) DEFAULT 0,
    processing_fee_percentage DECIMAL(5, 2),
    net_amount DECIMAL(15, 2) GENERATED ALWAYS AS (amount - COALESCE(processing_fee, 0)) STORED,

    -- Allocation and designation
    designation VARCHAR(255),
    fund_id UUID,
    program_id UUID,
    campaign_designation VARCHAR(255),

    -- Restriction information
    restriction_type VARCHAR(50) CHECK (restriction_type IN (
        'Unrestricted', 'Temporarily Restricted', 'Permanently Restricted',
        'Program Restricted', 'Time Restricted'
    )),
    restriction_description TEXT,
    restriction_end_date DATE,

    -- Tribute and memorial gifts
    tribute_type VARCHAR(50) CHECK (tribute_type IN ('In Honor Of', 'In Memory Of', 'In Celebration Of', 'None')),
    tribute_honoree VARCHAR(255),
    tribute_notification_name VARCHAR(255),
    tribute_notification_address TEXT,
    tribute_notification_sent BOOLEAN DEFAULT FALSE,
    tribute_notification_date DATE,

    -- Acknowledgment and receipts
    acknowledgment_required BOOLEAN DEFAULT TRUE,
    acknowledgment_sent BOOLEAN DEFAULT FALSE,
    acknowledgment_date DATE,
    acknowledgment_method VARCHAR(50),
    thank_you_sent BOOLEAN DEFAULT FALSE,
    thank_you_date DATE,
    thank_you_method VARCHAR(50),
    thank_you_signer VARCHAR(255),
    receipt_number VARCHAR(100),
    receipt_sent BOOLEAN DEFAULT FALSE,
    receipt_date DATE,

    -- Tax information
    tax_deductible BOOLEAN DEFAULT TRUE,
    tax_deductible_amount DECIMAL(15, 2),
    fair_market_value DECIMAL(15, 2),
    goods_services_value DECIMAL(15, 2),
    irs_form_required VARCHAR(50),

    -- Recurring donation linkage
    recurring_donation_id UUID,
    is_recurring_payment BOOLEAN DEFAULT FALSE,
    recurring_sequence_number INTEGER,

    -- Pledge linkage
    pledge_id UUID,
    is_pledge_payment BOOLEAN DEFAULT FALSE,
    pledge_balance_remaining DECIMAL(15, 2),

    -- Matching gifts
    matching_gift_eligible BOOLEAN DEFAULT FALSE,
    matching_gift_company VARCHAR(255),
    matching_gift_requested BOOLEAN DEFAULT FALSE,
    matching_gift_received BOOLEAN DEFAULT FALSE,
    matched_amount DECIMAL(15, 2),
    employer_match_id UUID,
    match_ratio VARCHAR(20),

    -- Soft credits
    soft_credit_donors JSONB,
    soft_credit_total DECIMAL(15, 2),

    -- Campaign tracking
    appeal_code VARCHAR(50),
    source_code VARCHAR(50),
    tracking_code VARCHAR(100),
    channel VARCHAR(50) CHECK (channel IN (
        'Direct Mail', 'Email', 'Website', 'Phone', 'Event',
        'Social Media', 'Mobile App', 'In-Person', 'Peer-to-Peer', 'Other'
    )),

    -- In-kind donations
    is_in_kind BOOLEAN DEFAULT FALSE,
    in_kind_description TEXT,
    in_kind_category VARCHAR(100),
    appraised_value DECIMAL(15, 2),
    appraisal_date DATE,
    appraiser_name VARCHAR(255),

    -- Stock donations
    is_stock_gift BOOLEAN DEFAULT FALSE,
    stock_symbol VARCHAR(10),
    stock_shares DECIMAL(15, 4),
    stock_price_per_share DECIMAL(15, 2),
    stock_transfer_date DATE,

    -- Grant information
    is_grant BOOLEAN DEFAULT FALSE,
    grant_reference_number VARCHAR(100),
    grant_period_start DATE,
    grant_period_end DATE,

    -- Donor advised fund
    is_daf_gift BOOLEAN DEFAULT FALSE,
    daf_sponsor VARCHAR(255),
    daf_account_number VARCHAR(100),

    -- Processing status
    status VARCHAR(50) DEFAULT 'Completed' CHECK (status IN (
        'Pending', 'Processing', 'Completed', 'Failed',
        'Refunded', 'Cancelled', 'Disputed'
    )),
    processing_notes TEXT,

    -- Refund information
    refund_date DATE,
    refund_amount DECIMAL(15, 2),
    refund_reason TEXT,
    refunded_by UUID,

    -- Data quality
    data_entry_method VARCHAR(50) CHECK (data_entry_method IN (
        'Manual', 'Import', 'API', 'Integration', 'Website', 'Mobile App'
    )),
    imported_from VARCHAR(100),
    import_batch_id UUID,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    posted_by UUID,

    -- Additional data
    custom_fields JSONB,
    metadata JSONB,
    notes TEXT,
    tags TEXT[],

    -- Attachments
    receipt_file_url VARCHAR(500),
    thank_you_letter_url VARCHAR(500),
    supporting_documents JSONB
);

-- Indexes for donations table
CREATE INDEX idx_donations_donor ON donations(donor_id);
CREATE INDEX idx_donations_date ON donations(donation_date DESC);
CREATE INDEX idx_donations_amount ON donations(amount DESC);
CREATE INDEX idx_donations_campaign ON donations(campaign_id);
CREATE INDEX idx_donations_fund ON donations(fund_id);
CREATE INDEX idx_donations_program ON donations(program_id);
CREATE INDEX idx_donations_method ON donations(payment_method);
CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_donations_fiscal_year ON donations(fiscal_year, fiscal_quarter);
CREATE INDEX idx_donations_recurring ON donations(recurring_donation_id) WHERE is_recurring_payment = TRUE;
CREATE INDEX idx_donations_pledge ON donations(pledge_id) WHERE is_pledge_payment = TRUE;
CREATE INDEX idx_donations_matching ON donations(matching_gift_eligible) WHERE matching_gift_eligible = TRUE;
CREATE INDEX idx_donations_transaction_id ON donations(transaction_id);

-- ============================================================================
-- CAMPAIGNS TABLE
-- Fundraising campaigns and appeals
-- ============================================================================
CREATE TABLE campaigns (
    -- Primary identification
    campaign_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_code VARCHAR(50) UNIQUE NOT NULL,

    -- Campaign details
    campaign_name VARCHAR(255) NOT NULL,
    campaign_type VARCHAR(100) NOT NULL CHECK (campaign_type IN (
        'Annual Fund', 'Capital Campaign', 'Special Appeal',
        'Peer-to-Peer', 'Endowment', 'Emergency', 'Program',
        'Event', 'Membership', 'Recurring Giving', 'Major Gifts'
    )),
    description TEXT,
    long_description TEXT,

    -- Timeline
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration_days INTEGER GENERATED ALWAYS AS (end_date - start_date) STORED,
    fiscal_year INTEGER,

    -- Financial goals
    goal_amount DECIMAL(15, 2) NOT NULL,
    stretch_goal DECIMAL(15, 2),
    minimum_goal DECIMAL(15, 2),
    raised_amount DECIMAL(15, 2) DEFAULT 0,
    pledged_amount DECIMAL(15, 2) DEFAULT 0,
    goal_percentage DECIMAL(5, 2) GENERATED ALWAYS AS (
        CASE WHEN goal_amount > 0 THEN (raised_amount / goal_amount * 100) ELSE 0 END
    ) STORED,

    -- Participation metrics
    donor_count INTEGER DEFAULT 0,
    new_donor_count INTEGER DEFAULT 0,
    returning_donor_count INTEGER DEFAULT 0,
    lapsed_donor_count INTEGER DEFAULT 0,
    donor_goal INTEGER,

    -- Gift metrics
    average_gift DECIMAL(15, 2),
    median_gift DECIMAL(15, 2),
    largest_gift DECIMAL(15, 2),
    smallest_gift DECIMAL(15, 2),
    participation_rate DECIMAL(5, 2),

    -- Financial efficiency
    cost_to_raise DECIMAL(15, 2) DEFAULT 0,
    roi DECIMAL(10, 2),
    cost_per_dollar_raised DECIMAL(10, 4),
    net_revenue DECIMAL(15, 2) GENERATED ALWAYS AS (raised_amount - cost_to_raise) STORED,

    -- Campaign strategy
    theme VARCHAR(255),
    messaging TEXT,
    case_statement TEXT,
    value_proposition TEXT,

    -- Target audience
    target_audience TEXT[],
    target_donor_segments UUID[],
    excluded_segments UUID[],
    geographic_targets TEXT[],

    -- Marketing and outreach
    channels_used TEXT[],
    marketing_materials JSONB,
    marketing_budget DECIMAL(15, 2),
    marketing_spend DECIMAL(15, 2),

    -- Communication plan
    communication_plan JSONB,
    email_sends INTEGER DEFAULT 0,
    mail_pieces INTEGER DEFAULT 0,
    phone_calls INTEGER DEFAULT 0,
    social_posts INTEGER DEFAULT 0,

    -- Success metrics
    success_metrics JSONB,
    kpis JSONB,
    benchmarks JSONB,

    -- Lessons learned and outcomes
    lessons_learned TEXT,
    what_worked TEXT,
    what_didnt_work TEXT,
    recommendations TEXT,

    -- Follow-up and stewardship
    follow_up_strategy TEXT,
    stewardship_plan JSONB,

    -- Gift-specific goals
    recurring_gift_goal INTEGER,
    recurring_gifts_secured INTEGER DEFAULT 0,
    major_gift_goal INTEGER,
    major_gifts_secured INTEGER DEFAULT 0,
    planned_gift_goal INTEGER,
    planned_gifts_secured INTEGER DEFAULT 0,
    corporate_goal DECIMAL(15, 2),
    corporate_raised DECIMAL(15, 2) DEFAULT 0,
    foundation_goal DECIMAL(15, 2),
    foundation_raised DECIMAL(15, 2) DEFAULT 0,

    -- Leadership and team
    campaign_manager UUID,
    campaign_team UUID[],
    steering_committee UUID[],
    volunteer_solicitors UUID[],

    -- Integration and tracking
    website_url VARCHAR(500),
    donation_page_url VARCHAR(500),
    social_media_hashtags TEXT[],
    tracking_parameters JSONB,

    -- Status and phases
    status VARCHAR(50) DEFAULT 'Planning' CHECK (status IN (
        'Planning', 'Active', 'On Hold', 'Extended',
        'Completed', 'Cancelled', 'Archived'
    )),
    current_phase VARCHAR(100),
    phases JSONB,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    completed_at TIMESTAMP WITH TIME ZONE,
    archived BOOLEAN DEFAULT FALSE,

    -- Additional data
    custom_fields JSONB,
    attachments JSONB,
    notes TEXT,
    tags TEXT[]
);

-- Indexes for campaigns
CREATE INDEX idx_campaigns_code ON campaigns(campaign_code);
CREATE INDEX idx_campaigns_type ON campaigns(campaign_type);
CREATE INDEX idx_campaigns_dates ON campaigns(start_date, end_date);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_fiscal_year ON campaigns(fiscal_year);
CREATE INDEX idx_campaigns_manager ON campaigns(campaign_manager);
CREATE INDEX idx_campaigns_active ON campaigns(status) WHERE status = 'Active';

-- Additional tables continued in next file due to size...
-- This migration continues with PLEDGES, RECURRING_DONATIONS, DONOR_SEGMENTS,
-- COMMUNICATION_PREFERENCES, ACKNOWLEDGMENTS, DONOR_JOURNEYS, and MAJOR_GIFT_PIPELINE tables

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_donors_updated_at BEFORE UPDATE ON donors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_donations_updated_at BEFORE UPDATE ON donations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- END OF DONOR MANAGEMENT SCHEMA (Part 1)
-- ============================================================================
