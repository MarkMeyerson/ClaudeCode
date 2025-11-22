-- ============================================================================
-- NAIOS Platform - Enterprise Donor Management Schema
-- Version: 2.0.0
-- Description: Complete donor management with wealth screening, engagement tracking,
--              and AI-powered insights
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ============================================================================
-- DONORS (Enhanced with wealth screening)
-- ============================================================================
CREATE TABLE donors (
    donor_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,

    -- Identification
    donor_number VARCHAR(50) UNIQUE NOT NULL,
    donor_type VARCHAR(50) NOT NULL CHECK (donor_type IN (
        'Individual', 'Household', 'Corporate', 'Foundation', 'Trust',
        'Government', 'Community Group', 'Anonymous'
    )),

    -- Primary Contact (for organizations) or Individual
    salutation VARCHAR(20),
    first_name VARCHAR(100),
    middle_name VARCHAR(100),
    last_name VARCHAR(100),
    suffix VARCHAR(20),
    preferred_name VARCHAR(100),
    full_name VARCHAR(255),

    -- Organization details (for non-individuals)
    organization_name VARCHAR(255),
    organization_type VARCHAR(100),
    duns_number VARCHAR(20), -- D&B number for corporations
    ein VARCHAR(20),

    -- Contact Information
    email VARCHAR(255),
    email_verified BOOLEAN DEFAULT FALSE,
    secondary_email VARCHAR(255),
    phone VARCHAR(20),
    mobile VARCHAR(20),
    work_phone VARCHAR(20),
    fax VARCHAR(20),

    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip VARCHAR(20),
    country VARCHAR(100) DEFAULT 'USA',
    address_type VARCHAR(50),
    address_validated BOOLEAN DEFAULT FALSE,

    -- Demographics (for individuals)
    date_of_birth DATE,
    gender VARCHAR(50),
    marital_status VARCHAR(50),
    occupation VARCHAR(100),
    employer VARCHAR(255),
    education_level VARCHAR(100),

    -- Spouse/Partner (for household giving)
    spouse_id UUID REFERENCES donors(donor_id),
    spouse_name VARCHAR(255),
    spouse_email VARCHAR(255),
    spouse_phone VARCHAR(20),

    -- Donor Classification
    donor_status VARCHAR(50) DEFAULT 'Active' CHECK (donor_status IN (
        'Prospect', 'Active', 'Lapsed', 'LYBUNT', 'SYBUNT',
        'Major Donor', 'Planned Giving', 'Deceased', 'Do Not Contact'
    )),
    donor_level VARCHAR(50), -- Bronze, Silver, Gold, etc.
    donor_segment VARCHAR(100), -- Custom segmentation
    giving_capacity VARCHAR(50) CHECK (giving_capacity IN (
        'Unknown', 'Low', 'Medium', 'High', 'Very High', 'Ultra High'
    )),

    -- Giving History
    first_gift_date DATE,
    last_gift_date DATE,
    largest_gift_amount DECIMAL(15, 2),
    smallest_gift_amount DECIMAL(15, 2),
    average_gift_amount DECIMAL(15, 2),
    lifetime_value DECIMAL(15, 2) DEFAULT 0,
    total_donations_count INTEGER DEFAULT 0,

    -- Giving patterns
    giving_frequency VARCHAR(50), -- Monthly, Quarterly, Annual, Irregular
    preferred_giving_method VARCHAR(50),
    recurring_donor BOOLEAN DEFAULT FALSE,
    matching_gift_eligible BOOLEAN DEFAULT FALSE,
    matching_gift_company VARCHAR(255),
    matching_gift_ratio DECIMAL(5, 2),

    -- Wealth Screening Data
    wealth_screening_status VARCHAR(50) CHECK (wealth_screening_status IN (
        'Not Screened', 'Pending', 'Completed', 'Failed', 'Needs Update'
    )),
    wealth_screening_date DATE,
    wealth_screening_provider VARCHAR(100),
    wealth_screening_score DECIMAL(5, 2),

    estimated_net_worth DECIMAL(15, 2),
    estimated_net_worth_range VARCHAR(50),
    estimated_annual_income DECIMAL(15, 2),
    estimated_income_range VARCHAR(50),

    real_estate_value DECIMAL(15, 2),
    real_estate_count INTEGER,
    real_estate_details JSONB,

    stock_holdings_value DECIMAL(15, 2),
    stock_holdings JSONB,

    business_affiliations JSONB,
    board_affiliations JSONB,

    political_donations JSONB,
    charitable_donations_other JSONB,

    wealth_indicators JSONB, -- Cars, boats, planes, art collections, etc.

    -- Propensity Scores (AI/ML predictions)
    propensity_to_give DECIMAL(5, 4), -- 0-1 score
    predicted_next_gift_date DATE,
    predicted_next_gift_amount DECIMAL(15, 2),
    churn_risk_score DECIMAL(5, 4), -- 0-1 score
    major_gift_likelihood DECIMAL(5, 4),
    planned_giving_likelihood DECIMAL(5, 4),

    -- Interests & Affinities
    interests TEXT[],
    cause_affinities TEXT[],
    program_interests TEXT[],
    communication_interests TEXT[],

    -- Engagement
    engagement_score DECIMAL(5, 2), -- 0-100
    engagement_level VARCHAR(50),
    last_engagement_date DATE,
    last_engagement_type VARCHAR(100),

    email_engagement_score DECIMAL(5, 2),
    event_attendance_score DECIMAL(5, 2),
    volunteer_engagement_score DECIMAL(5, 2),

    -- Communication Preferences
    preferred_contact_method VARCHAR(50),
    preferred_contact_time VARCHAR(50),
    email_opt_in BOOLEAN DEFAULT TRUE,
    mail_opt_in BOOLEAN DEFAULT TRUE,
    phone_opt_in BOOLEAN DEFAULT TRUE,
    sms_opt_in BOOLEAN DEFAULT FALSE,
    do_not_call BOOLEAN DEFAULT FALSE,
    do_not_email BOOLEAN DEFAULT FALSE,
    do_not_mail BOOLEAN DEFAULT FALSE,

    communication_frequency_preference VARCHAR(50),
    annual_report_opt_in BOOLEAN DEFAULT TRUE,
    newsletter_opt_in BOOLEAN DEFAULT TRUE,
    event_invitations_opt_in BOOLEAN DEFAULT TRUE,

    -- Attribution & Source
    source VARCHAR(255), -- How they were acquired
    source_campaign_id UUID,
    referral_source VARCHAR(255),
    referred_by_donor_id UUID REFERENCES donors(donor_id),

    -- Relationships
    relationship_manager_id UUID REFERENCES users(user_id),
    assigned_fundraiser_id UUID REFERENCES users(user_id),

    -- Social Media
    linkedin_url VARCHAR(500),
    facebook_url VARCHAR(500),
    twitter_handle VARCHAR(100),
    instagram_handle VARCHAR(100),
    social_media_connections JSONB,

    -- Recognition & Stewardship
    recognition_name VARCHAR(255), -- How they want to be recognized
    anonymous_giving BOOLEAN DEFAULT FALSE,
    recognition_level VARCHAR(100),
    stewardship_plan VARCHAR(100),
    next_stewardship_action DATE,
    last_thank_you_date DATE,

    -- Planned Giving
    planned_giving_prospect BOOLEAN DEFAULT FALSE,
    estate_plan_status VARCHAR(50),
    bequest_amount_estimated DECIMAL(15, 2),
    bequest_documentation_date DATE,
    life_insurance_beneficiary BOOLEAN DEFAULT FALSE,

    -- Special Designations
    board_member BOOLEAN DEFAULT FALSE,
    volunteer BOOLEAN DEFAULT FALSE,
    event_sponsor BOOLEAN DEFAULT FALSE,
    corporate_partner BOOLEAN DEFAULT FALSE,

    -- Tax Information
    tax_deductible BOOLEAN DEFAULT TRUE,
    tax_id_number VARCHAR(50),
    tax_exempt_status VARCHAR(50),

    -- Important Dates
    important_dates JSONB, -- Birthdays, anniversaries, etc.

    -- Custom Fields
    custom_fields JSONB DEFAULT '{}'::jsonb,

    -- Tags
    tags TEXT[],

    -- Notes & History
    notes TEXT,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(user_id),
    updated_by UUID REFERENCES users(user_id),

    -- Soft Delete
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID
);

CREATE INDEX idx_donors_tenant ON donors(tenant_id);
CREATE INDEX idx_donors_donor_type ON donors(donor_type);
CREATE INDEX idx_donors_donor_status ON donors(donor_status);
CREATE INDEX idx_donors_donor_level ON donors(donor_level);
CREATE INDEX idx_donors_name ON donors(last_name, first_name);
CREATE INDEX idx_donors_full_name_trgm ON donors USING gin (full_name gin_trgm_ops);
CREATE INDEX idx_donors_organization_name_trgm ON donors USING gin (organization_name gin_trgm_ops);
CREATE INDEX idx_donors_email ON donors(email);
CREATE INDEX idx_donors_lifetime_value ON donors(lifetime_value DESC);
CREATE INDEX idx_donors_last_gift_date ON donors(last_gift_date DESC);
CREATE INDEX idx_donors_wealth_screening ON donors(wealth_screening_status);
CREATE INDEX idx_donors_propensity ON donors(propensity_to_give DESC);
CREATE INDEX idx_donors_engagement ON donors(engagement_score DESC);
CREATE INDEX idx_donors_relationship_manager ON donors(relationship_manager_id);
CREATE INDEX idx_donors_tags ON donors USING gin(tags);
CREATE INDEX idx_donors_deleted ON donors(deleted_at) WHERE deleted_at IS NULL;

-- ============================================================================
-- DONATIONS (Enhanced)
-- ============================================================================
CREATE TABLE donations (
    donation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    donor_id UUID NOT NULL REFERENCES donors(donor_id) ON DELETE RESTRICT,

    -- Transaction Details
    donation_number VARCHAR(50) UNIQUE NOT NULL,
    donation_date DATE NOT NULL,
    received_date DATE,

    -- Amount
    amount DECIMAL(15, 2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(3) DEFAULT 'USD',
    exchange_rate DECIMAL(10, 6),
    amount_usd DECIMAL(15, 2),

    -- Type & Method
    donation_type VARCHAR(50) NOT NULL CHECK (donation_type IN (
        'One-Time', 'Recurring', 'Pledge', 'In-Kind', 'Stock', 'Real Estate',
        'Cryptocurrency', 'Bequest', 'DAF', 'Grant'
    )),

    donation_method VARCHAR(50) CHECK (donation_method IN (
        'Credit Card', 'ACH', 'Check', 'Cash', 'Wire Transfer', 'Stock Transfer',
        'PayPal', 'Venmo', 'Cryptocurrency', 'Mobile Wallet', 'DAF', 'Other'
    )),

    -- Payment Processing
    payment_processor VARCHAR(100),
    transaction_id VARCHAR(255),
    payment_status VARCHAR(50) DEFAULT 'Completed' CHECK (payment_status IN (
        'Pending', 'Processing', 'Completed', 'Failed', 'Refunded',
        'Partially Refunded', 'Cancelled', 'Disputed'
    )),

    -- Fees
    processing_fee DECIMAL(10, 2),
    platform_fee DECIMAL(10, 2),
    net_amount DECIMAL(15, 2),

    -- Recurring Details
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_frequency VARCHAR(50), -- Monthly, Quarterly, Annually
    recurring_day_of_month INTEGER,
    recurring_start_date DATE,
    recurring_end_date DATE,
    parent_donation_id UUID REFERENCES donations(donation_id),
    installment_number INTEGER,
    total_installments INTEGER,

    -- Pledge Details
    is_pledge BOOLEAN DEFAULT FALSE,
    pledge_amount DECIMAL(15, 2),
    pledge_balance DECIMAL(15, 2),
    pledge_paid_amount DECIMAL(15, 2),
    pledge_due_date DATE,

    -- Designation & Restrictions
    fund_id UUID,
    fund_name VARCHAR(255),
    campaign_id UUID,
    appeal_id UUID,
    program_id UUID,
    designation TEXT,
    restriction_type VARCHAR(50) CHECK (restriction_type IN (
        'Unrestricted', 'Temporarily Restricted', 'Permanently Restricted'
    )),

    -- In-Kind Details
    in_kind_description TEXT,
    in_kind_value DECIMAL(15, 2),
    in_kind_appraised BOOLEAN,
    in_kind_appraiser VARCHAR(255),

    -- Stock/Securities Details
    stock_symbol VARCHAR(10),
    stock_shares DECIMAL(15, 4),
    stock_price_per_share DECIMAL(10, 2),
    stock_broker VARCHAR(255),
    stock_transfer_date DATE,

    -- Cryptocurrency Details
    crypto_currency VARCHAR(50),
    crypto_amount DECIMAL(20, 8),
    crypto_wallet_address VARCHAR(255),
    crypto_transaction_hash VARCHAR(255),

    -- Attribution
    source VARCHAR(255),
    source_code VARCHAR(100),
    solicitor_id UUID REFERENCES users(user_id),

    -- Matching Gift
    matching_gift_eligible BOOLEAN DEFAULT FALSE,
    matching_gift_company VARCHAR(255),
    matching_gift_ratio DECIMAL(5, 2),
    matching_gift_status VARCHAR(50),
    matching_gift_amount DECIMAL(15, 2),
    matching_gift_received BOOLEAN DEFAULT FALSE,

    -- Tribute/Memorial
    tribute_type VARCHAR(50), -- In Honor Of, In Memory Of
    tribute_name VARCHAR(255),
    tribute_notify_name VARCHAR(255),
    tribute_notify_address TEXT,
    tribute_notify_email VARCHAR(255),
    tribute_notification_sent BOOLEAN DEFAULT FALSE,

    -- Tax Information
    tax_deductible BOOLEAN DEFAULT TRUE,
    tax_deductible_amount DECIMAL(15, 2),
    goods_services_value DECIMAL(15, 2),
    tax_receipt_number VARCHAR(100),
    tax_receipt_sent BOOLEAN DEFAULT FALSE,
    tax_receipt_sent_date DATE,

    -- Acknowledgment
    acknowledgment_sent BOOLEAN DEFAULT FALSE,
    acknowledgment_sent_date DATE,
    acknowledgment_type VARCHAR(50),

    -- Anonymous
    anonymous BOOLEAN DEFAULT FALSE,
    public_acknowledgment_name VARCHAR(255),

    -- Soft Credits (for joint gifts, household giving, etc.)
    soft_credit_donors UUID[],
    soft_credit_amounts JSONB,

    -- GL Posting
    gl_posted BOOLEAN DEFAULT FALSE,
    gl_posted_date DATE,
    gl_batch_id UUID,

    -- Custom Fields
    custom_fields JSONB DEFAULT '{}'::jsonb,

    -- Notes
    notes TEXT,
    internal_notes TEXT,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(user_id),
    updated_by UUID REFERENCES users(user_id),

    -- Soft Delete
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID
);

CREATE INDEX idx_donations_tenant ON donations(tenant_id);
CREATE INDEX idx_donations_donor ON donations(donor_id);
CREATE INDEX idx_donations_date ON donations(donation_date DESC);
CREATE INDEX idx_donations_amount ON donations(amount DESC);
CREATE INDEX idx_donations_type ON donations(donation_type);
CREATE INDEX idx_donations_status ON donations(payment_status);
CREATE INDEX idx_donations_recurring ON donations(is_recurring) WHERE is_recurring = TRUE;
CREATE INDEX idx_donations_campaign ON donations(campaign_id);
CREATE INDEX idx_donations_fund ON donations(fund_id);
CREATE INDEX idx_donations_deleted ON donations(deleted_at) WHERE deleted_at IS NULL;

-- ============================================================================
-- DONOR_INTERACTIONS (Engagement tracking)
-- ============================================================================
CREATE TABLE donor_interactions (
    interaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    donor_id UUID NOT NULL REFERENCES donors(donor_id) ON DELETE CASCADE,

    -- Interaction Details
    interaction_type VARCHAR(100) NOT NULL, -- Email, Call, Meeting, Event, Mail, etc.
    interaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER,

    -- Content
    subject VARCHAR(500),
    description TEXT,
    outcome VARCHAR(255),

    -- Participants
    user_id UUID REFERENCES users(user_id),
    participants JSONB, -- Other people involved

    -- Follow-up
    requires_follow_up BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    follow_up_completed BOOLEAN DEFAULT FALSE,

    -- Sentiment
    sentiment VARCHAR(50), -- Positive, Neutral, Negative
    sentiment_score DECIMAL(5, 4),

    -- Related Records
    related_donation_id UUID REFERENCES donations(donation_id),
    related_event_id UUID,
    related_campaign_id UUID,

    -- Attachments
    attachments JSONB,

    -- Custom Fields
    custom_fields JSONB DEFAULT '{}'::jsonb,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(user_id)
);

CREATE INDEX idx_donor_interactions_tenant ON donor_interactions(tenant_id);
CREATE INDEX idx_donor_interactions_donor ON donor_interactions(donor_id);
CREATE INDEX idx_donor_interactions_date ON donor_interactions(interaction_date DESC);
CREATE INDEX idx_donor_interactions_type ON donor_interactions(interaction_type);
CREATE INDEX idx_donor_interactions_user ON donor_interactions(user_id);

-- ============================================================================
-- CAMPAIGNS
-- ============================================================================
CREATE TABLE campaigns (
    campaign_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,

    -- Campaign Details
    campaign_name VARCHAR(255) NOT NULL,
    campaign_code VARCHAR(100) UNIQUE NOT NULL,
    campaign_type VARCHAR(100) CHECK (campaign_type IN (
        'Annual Fund', 'Capital', 'Major Gifts', 'Planned Giving',
        'Special Event', 'Emergency', 'Peer-to-Peer', 'Crowdfunding', 'Other'
    )),

    -- Description
    description TEXT,
    internal_description TEXT,

    -- Timing
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'Planning' CHECK (status IN (
        'Planning', 'Active', 'Paused', 'Completed', 'Cancelled'
    )),

    -- Goals
    goal_amount DECIMAL(15, 2),
    goal_donor_count INTEGER,
    stretch_goal_amount DECIMAL(15, 2),

    -- Performance
    amount_raised DECIMAL(15, 2) DEFAULT 0,
    donor_count INTEGER DEFAULT 0,
    donation_count INTEGER DEFAULT 0,
    average_donation DECIMAL(15, 2),

    -- Fund Designation
    fund_id UUID,
    default_designation TEXT,

    -- Team
    campaign_manager_id UUID REFERENCES users(user_id),
    team_members UUID[],

    -- Segmentation
    target_segments JSONB,

    -- Custom Fields
    custom_fields JSONB DEFAULT '{}'::jsonb,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(user_id)
);

CREATE INDEX idx_campaigns_tenant ON campaigns(tenant_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_dates ON campaigns(start_date, end_date);

-- ============================================================================
-- DONOR_SEGMENTS (For targeted outreach)
-- ============================================================================
CREATE TABLE donor_segments (
    segment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,

    -- Segment Details
    segment_name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Type
    segment_type VARCHAR(50) CHECK (segment_type IN (
        'Static', 'Dynamic'
    )),

    -- Criteria (for dynamic segments)
    criteria JSONB, -- Query builder JSON

    -- Static member list (for static segments)
    donor_ids UUID[],

    -- Stats
    member_count INTEGER DEFAULT 0,
    total_lifetime_value DECIMAL(15, 2),
    average_gift_amount DECIMAL(15, 2),

    -- Usage
    last_used_date DATE,
    use_count INTEGER DEFAULT 0,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(user_id)
);

CREATE INDEX idx_donor_segments_tenant ON donor_segments(tenant_id);
CREATE INDEX idx_donor_segments_type ON donor_segments(segment_type);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_donors_updated_at BEFORE UPDATE ON donors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_donations_updated_at BEFORE UPDATE ON donations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_donor_segments_updated_at BEFORE UPDATE ON donor_segments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MATERIALIZED VIEWS
-- ============================================================================

-- Donor summary view for fast reporting
CREATE MATERIALIZED VIEW mv_donor_summary AS
SELECT
    d.donor_id,
    d.tenant_id,
    d.full_name,
    d.donor_type,
    d.donor_status,
    d.donor_level,
    COUNT(DISTINCT don.donation_id) AS total_donations,
    SUM(don.amount) AS lifetime_value,
    AVG(don.amount) AS average_gift,
    MAX(don.donation_date) AS last_gift_date,
    MIN(don.donation_date) AS first_gift_date,
    MAX(don.amount) AS largest_gift,
    COUNT(DISTINCT CASE WHEN don.donation_date >= CURRENT_DATE - INTERVAL '12 months'
          THEN don.donation_id END) AS gifts_last_12_months,
    SUM(CASE WHEN don.donation_date >= CURRENT_DATE - INTERVAL '12 months'
        THEN don.amount ELSE 0 END) AS amount_last_12_months
FROM donors d
LEFT JOIN donations don ON d.donor_id = don.donor_id AND don.deleted_at IS NULL
WHERE d.deleted_at IS NULL
GROUP BY d.donor_id, d.tenant_id, d.full_name, d.donor_type, d.donor_status, d.donor_level;

CREATE UNIQUE INDEX ON mv_donor_summary (donor_id);
CREATE INDEX ON mv_donor_summary (tenant_id);
CREATE INDEX ON mv_donor_summary (lifetime_value DESC);

-- ============================================================================
-- END OF DONOR MANAGEMENT SCHEMA
-- ============================================================================
