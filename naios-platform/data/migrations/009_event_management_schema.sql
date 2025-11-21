-- ============================================================================
-- NAIOS Platform - Event Management Schema
-- Version: 2.0.0
-- Description: Complete event management with registration, ticketing, fundraising,
--              and attendee management
-- ============================================================================

-- ============================================================================
-- EVENTS
-- ============================================================================
CREATE TABLE events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,

    -- Basic Information
    event_name VARCHAR(255) NOT NULL,
    event_code VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(255),

    -- Type & Category
    event_type VARCHAR(100) CHECK (event_type IN (
        'Fundraising Gala', 'Auction', 'Golf Tournament', 'Run/Walk',
        'Conference', 'Workshop', 'Training', 'Volunteer Event',
        'Board Meeting', 'Community Event', 'Virtual Event', 'Hybrid Event', 'Other'
    )),
    category VARCHAR(100),

    -- Description
    short_description TEXT,
    full_description TEXT,
    internal_notes TEXT,

    -- Date & Time
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    registration_opens_at TIMESTAMP WITH TIME ZONE,
    registration_closes_at TIMESTAMP WITH TIME ZONE,
    early_bird_ends_at TIMESTAMP WITH TIME ZONE,

    timezone VARCHAR(50) DEFAULT 'America/New_York',

    -- Location
    location_type VARCHAR(50) CHECK (location_type IN (
        'In-Person', 'Virtual', 'Hybrid'
    )),

    venue_name VARCHAR(255),
    venue_address_line1 VARCHAR(255),
    venue_address_line2 VARCHAR(255),
    venue_city VARCHAR(100),
    venue_state VARCHAR(50),
    venue_zip VARCHAR(20),
    venue_country VARCHAR(100),

    venue_capacity INTEGER,
    venue_layout VARCHAR(100),
    venue_accessibility_notes TEXT,

    -- Virtual Details
    virtual_platform VARCHAR(100), -- Zoom, Teams, etc.
    virtual_meeting_url VARCHAR(500),
    virtual_meeting_id VARCHAR(255),
    virtual_meeting_password VARCHAR(255),
    virtual_streaming_url VARCHAR(500),

    -- Status
    status VARCHAR(50) DEFAULT 'Draft' CHECK (status IN (
        'Draft', 'Published', 'Registration Open', 'Registration Closed',
        'Sold Out', 'In Progress', 'Completed', 'Cancelled', 'Postponed'
    )),

    -- Visibility
    is_public BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    requires_approval BOOLEAN DEFAULT FALSE,

    -- Capacity & Limits
    capacity INTEGER,
    waitlist_enabled BOOLEAN DEFAULT FALSE,
    waitlist_capacity INTEGER,
    current_registrations INTEGER DEFAULT 0,
    current_waitlist INTEGER DEFAULT 0,

    registration_limit_per_person INTEGER,
    min_registrations INTEGER, -- Minimum to proceed
    max_registrations INTEGER,

    -- Financial Goals
    fundraising_goal DECIMAL(15, 2),
    budget DECIMAL(15, 2),
    expected_attendance INTEGER,

    -- Revenue Tracking
    total_revenue DECIMAL(15, 2) DEFAULT 0,
    total_ticket_revenue DECIMAL(15, 2) DEFAULT 0,
    total_donation_revenue DECIMAL(15, 2) DEFAULT 0,
    total_sponsorship_revenue DECIMAL(15, 2) DEFAULT 0,

    -- Expenses Tracking
    total_expenses DECIMAL(15, 2) DEFAULT 0,
    venue_cost DECIMAL(15, 2),
    catering_cost DECIMAL(15, 2),
    entertainment_cost DECIMAL(15, 2),
    marketing_cost DECIMAL(15, 2),
    other_expenses DECIMAL(15, 2),

    -- Campaign Integration
    campaign_id UUID REFERENCES campaigns(campaign_id),
    fund_id UUID,

    -- Images & Media
    featured_image_url VARCHAR(500),
    gallery_images JSONB,
    video_url VARCHAR(500),

    -- SEO
    meta_title VARCHAR(255),
    meta_description TEXT,
    og_image_url VARCHAR(500),

    -- Registration Settings
    confirmation_email_template_id UUID,
    reminder_email_template_id UUID,
    thank_you_email_template_id UUID,

    collect_dietary_restrictions BOOLEAN DEFAULT FALSE,
    collect_accessibility_needs BOOLEAN DEFAULT FALSE,
    collect_tshirt_size BOOLEAN DEFAULT FALSE,

    custom_registration_fields JSONB,

    -- Check-in
    check_in_enabled BOOLEAN DEFAULT FALSE,
    check_in_starts_at TIMESTAMP WITH TIME ZONE,
    checked_in_count INTEGER DEFAULT 0,

    -- Fundraising Features
    allow_donations BOOLEAN DEFAULT FALSE,
    suggested_donation_amounts DECIMAL(10, 2)[],
    peer_to_peer_enabled BOOLEAN DEFAULT FALSE,
    team_fundraising_enabled BOOLEAN DEFAULT FALSE,

    -- Sponsorship
    accepting_sponsorships BOOLEAN DEFAULT FALSE,
    sponsorship_levels JSONB,

    -- Auction (if applicable)
    has_auction BOOLEAN DEFAULT FALSE,
    auction_type VARCHAR(50), -- Silent, Live, Online
    auction_opens_at TIMESTAMP WITH TIME ZONE,
    auction_closes_at TIMESTAMP WITH TIME ZONE,

    -- Team & Staff
    event_manager_id UUID REFERENCES users(user_id),
    event_coordinators UUID[],
    volunteer_coordinators UUID[],

    -- Communications
    communications_sent INTEGER DEFAULT 0,
    last_communication_sent_at TIMESTAMP WITH TIME ZONE,

    -- Evaluation
    post_event_survey_url VARCHAR(500),
    survey_responses_count INTEGER DEFAULT 0,
    nps_score DECIMAL(5, 2),

    -- Custom Fields
    custom_fields JSONB DEFAULT '{}'::jsonb,

    -- Tags
    tags TEXT[],

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(user_id),
    updated_by UUID REFERENCES users(user_id),

    -- Soft Delete
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID
);

CREATE INDEX idx_events_tenant ON events(tenant_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_is_public ON events(is_public) WHERE is_public = TRUE;
CREATE INDEX idx_events_slug ON events(slug);

-- ============================================================================
-- TICKET_TYPES
-- ============================================================================
CREATE TABLE ticket_types (
    ticket_type_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,

    -- Basic Info
    ticket_name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Pricing
    price DECIMAL(10, 2) NOT NULL,
    early_bird_price DECIMAL(10, 2),
    group_discount_enabled BOOLEAN DEFAULT FALSE,
    group_size_min INTEGER,
    group_discount_percentage DECIMAL(5, 2),

    -- Tax & Fees
    is_taxable BOOLEAN DEFAULT FALSE,
    tax_rate DECIMAL(5, 4),
    service_fee DECIMAL(10, 2),
    service_fee_percentage DECIMAL(5, 2),

    -- Tax Deductibility
    tax_deductible_amount DECIMAL(10, 2),
    fair_market_value DECIMAL(10, 2),

    -- Availability
    quantity_available INTEGER,
    quantity_sold INTEGER DEFAULT 0,
    quantity_reserved INTEGER DEFAULT 0,
    min_per_order INTEGER DEFAULT 1,
    max_per_order INTEGER,

    -- Timing
    sales_start_date TIMESTAMP WITH TIME ZONE,
    sales_end_date TIMESTAMP WITH TIME ZONE,

    -- Visibility & Status
    is_active BOOLEAN DEFAULT TRUE,
    is_hidden BOOLEAN DEFAULT FALSE,
    requires_code BOOLEAN DEFAULT FALSE,
    promo_code VARCHAR(100),

    -- Access Level
    access_level VARCHAR(100), -- General, VIP, Staff, Board Member, etc.
    includes_features TEXT[],

    -- Sort Order
    sort_order INTEGER DEFAULT 0,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ticket_types_event ON ticket_types(event_id);
CREATE INDEX idx_ticket_types_active ON ticket_types(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- REGISTRATIONS
-- ============================================================================
CREATE TABLE registrations (
    registration_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(event_id) ON DELETE RESTRICT,

    -- Registration Number
    registration_number VARCHAR(50) UNIQUE NOT NULL,
    confirmation_code VARCHAR(20) UNIQUE NOT NULL,

    -- Registrant
    donor_id UUID REFERENCES donors(donor_id),
    user_id UUID REFERENCES users(user_id),

    -- Contact Information (for non-donors/non-users)
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),

    organization VARCHAR(255),
    job_title VARCHAR(100),

    -- Status
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN (
        'Pending', 'Confirmed', 'Waitlisted', 'Cancelled', 'Refunded', 'No Show'
    )),

    -- Payment
    payment_status VARCHAR(50) DEFAULT 'Unpaid' CHECK (payment_status IN (
        'Unpaid', 'Partial', 'Paid', 'Refunded', 'Comp'
    )),

    total_amount DECIMAL(10, 2) NOT NULL,
    amount_paid DECIMAL(10, 2) DEFAULT 0,
    amount_due DECIMAL(10, 2),

    -- Additional Donation
    donation_amount DECIMAL(10, 2) DEFAULT 0,

    -- Tickets
    ticket_quantity INTEGER DEFAULT 1,

    -- Group Registration
    is_group_registration BOOLEAN DEFAULT FALSE,
    group_name VARCHAR(255),
    group_size INTEGER,
    is_group_leader BOOLEAN DEFAULT FALSE,
    group_leader_registration_id UUID REFERENCES registrations(registration_id),

    -- Team (for peer-to-peer)
    team_id UUID,
    team_name VARCHAR(255),
    fundraising_goal DECIMAL(10, 2),
    amount_raised DECIMAL(10, 2) DEFAULT 0,

    -- Preferences & Requirements
    dietary_restrictions TEXT,
    accessibility_needs TEXT,
    tshirt_size VARCHAR(10),
    special_requests TEXT,

    custom_responses JSONB,

    -- Check-in
    checked_in BOOLEAN DEFAULT FALSE,
    checked_in_at TIMESTAMP WITH TIME ZONE,
    checked_in_by UUID REFERENCES users(user_id),

    -- Badge/Ticket
    badge_printed BOOLEAN DEFAULT FALSE,
    badge_number VARCHAR(50),
    qr_code VARCHAR(500),

    -- Communications
    confirmation_sent BOOLEAN DEFAULT FALSE,
    confirmation_sent_at TIMESTAMP WITH TIME ZONE,
    reminder_sent_count INTEGER DEFAULT 0,
    last_reminder_sent_at TIMESTAMP WITH TIME ZONE,

    -- Source
    referral_source VARCHAR(255),
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),

    -- Notes
    notes TEXT,
    internal_notes TEXT,

    -- Metadata
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT
);

CREATE INDEX idx_registrations_tenant ON registrations(tenant_id);
CREATE INDEX idx_registrations_event ON registrations(event_id);
CREATE INDEX idx_registrations_donor ON registrations(donor_id);
CREATE INDEX idx_registrations_status ON registrations(status);
CREATE INDEX idx_registrations_payment_status ON registrations(payment_status);
CREATE INDEX idx_registrations_email ON registrations(email);
CREATE INDEX idx_registrations_confirmation_code ON registrations(confirmation_code);

-- ============================================================================
-- REGISTRATION_TICKETS
-- ============================================================================
CREATE TABLE registration_tickets (
    registration_ticket_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registration_id UUID NOT NULL REFERENCES registrations(registration_id) ON DELETE CASCADE,
    ticket_type_id UUID NOT NULL REFERENCES ticket_types(ticket_type_id),

    -- Attendee (if different from registrant)
    attendee_first_name VARCHAR(100),
    attendee_last_name VARCHAR(100),
    attendee_email VARCHAR(255),

    -- Pricing
    original_price DECIMAL(10, 2),
    final_price DECIMAL(10, 2),
    discount_applied DECIMAL(10, 2),
    promo_code VARCHAR(100),

    -- Status
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN (
        'Active', 'Cancelled', 'Refunded', 'Transferred'
    )),

    -- Transfer
    transferred_to_registration_id UUID REFERENCES registrations(registration_id),
    transferred_at TIMESTAMP WITH TIME ZONE,

    -- Check-in
    checked_in BOOLEAN DEFAULT FALSE,
    checked_in_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_registration_tickets_registration ON registration_tickets(registration_id);
CREATE INDEX idx_registration_tickets_type ON registration_tickets(ticket_type_id);

-- ============================================================================
-- EVENT_PAYMENTS
-- ============================================================================
CREATE TABLE event_payments (
    payment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    registration_id UUID NOT NULL REFERENCES registrations(registration_id) ON DELETE RESTRICT,

    -- Amount
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',

    -- Payment Method
    payment_method VARCHAR(50),
    payment_processor VARCHAR(100),
    transaction_id VARCHAR(255),

    -- Status
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN (
        'Pending', 'Processing', 'Completed', 'Failed', 'Refunded', 'Cancelled'
    )),

    -- Fees
    processing_fee DECIMAL(10, 2),
    platform_fee DECIMAL(10, 2),
    net_amount DECIMAL(10, 2),

    -- Refund
    refunded_amount DECIMAL(10, 2),
    refund_reason TEXT,
    refunded_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_event_payments_tenant ON event_payments(tenant_id);
CREATE INDEX idx_event_payments_registration ON event_payments(registration_id);
CREATE INDEX idx_event_payments_status ON event_payments(status);

-- ============================================================================
-- EVENT_SPONSORS
-- ============================================================================
CREATE TABLE event_sponsors (
    sponsor_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    donor_id UUID REFERENCES donors(donor_id),

    -- Sponsor Details
    sponsor_name VARCHAR(255) NOT NULL,
    sponsor_level VARCHAR(100), -- Platinum, Gold, Silver, Bronze, etc.
    sponsorship_amount DECIMAL(10, 2) NOT NULL,

    -- Benefits
    benefits_received JSONB,
    table_seats INTEGER,
    logo_placement VARCHAR(100),

    -- Display
    logo_url VARCHAR(500),
    website_url VARCHAR(500),
    display_order INTEGER DEFAULT 0,

    -- Status
    status VARCHAR(50) DEFAULT 'Confirmed' CHECK (status IN (
        'Prospective', 'Confirmed', 'Paid', 'Delivered', 'Completed'
    )),

    -- Invoice
    invoice_sent BOOLEAN DEFAULT FALSE,
    invoice_sent_date DATE,
    payment_received BOOLEAN DEFAULT FALSE,
    payment_received_date DATE,

    -- Recognition
    public_recognition BOOLEAN DEFAULT TRUE,
    recognition_text TEXT,

    -- Notes
    notes TEXT,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_event_sponsors_event ON event_sponsors(event_id);
CREATE INDEX idx_event_sponsors_donor ON event_sponsors(donor_id);

-- ============================================================================
-- EVENT_VOLUNTEERS
-- ============================================================================
CREATE TABLE event_volunteers (
    event_volunteer_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    volunteer_id UUID,
    user_id UUID REFERENCES users(user_id),

    -- Contact (if not in system)
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),

    -- Assignment
    role VARCHAR(100) NOT NULL,
    shift_start TIMESTAMP WITH TIME ZONE,
    shift_end TIMESTAMP WITH TIME ZONE,
    hours DECIMAL(5, 2),

    -- Status
    status VARCHAR(50) DEFAULT 'Confirmed' CHECK (status IN (
        'Invited', 'Confirmed', 'Declined', 'No Show', 'Completed'
    )),

    -- Check-in
    checked_in BOOLEAN DEFAULT FALSE,
    checked_in_at TIMESTAMP WITH TIME ZONE,
    checked_out_at TIMESTAMP WITH TIME ZONE,

    -- Notes
    notes TEXT,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_event_volunteers_event ON event_volunteers(event_id);
CREATE INDEX idx_event_volunteers_volunteer ON event_volunteers(volunteer_id);

-- ============================================================================
-- EVENT_SESSIONS (For multi-session events)
-- ============================================================================
CREATE TABLE event_sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,

    -- Session Details
    session_name VARCHAR(255) NOT NULL,
    description TEXT,
    session_type VARCHAR(100),

    -- Timing
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER,

    -- Location
    room VARCHAR(100),
    virtual_url VARCHAR(500),

    -- Capacity
    capacity INTEGER,
    registered_count INTEGER DEFAULT 0,

    -- Speakers
    speakers JSONB,

    -- Materials
    materials_url VARCHAR(500),
    recording_url VARCHAR(500),

    -- Status
    status VARCHAR(50) DEFAULT 'Scheduled',

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_event_sessions_event ON event_sessions(event_id);
CREATE INDEX idx_event_sessions_start_time ON event_sessions(start_time);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ticket_types_updated_at BEFORE UPDATE ON ticket_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_registrations_updated_at BEFORE UPDATE ON registrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_sponsors_updated_at BEFORE UPDATE ON event_sponsors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_volunteers_updated_at BEFORE UPDATE ON event_volunteers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_sessions_updated_at BEFORE UPDATE ON event_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MATERIALIZED VIEWS
-- ============================================================================

-- Event summary for dashboards
CREATE MATERIALIZED VIEW mv_event_summary AS
SELECT
    e.event_id,
    e.tenant_id,
    e.event_name,
    e.event_type,
    e.start_date,
    e.status,
    COUNT(DISTINCT r.registration_id) AS total_registrations,
    COUNT(DISTINCT CASE WHEN r.status = 'Confirmed' THEN r.registration_id END) AS confirmed_registrations,
    COUNT(DISTINCT CASE WHEN r.checked_in = TRUE THEN r.registration_id END) AS checked_in_count,
    SUM(r.total_amount) AS total_revenue,
    SUM(r.amount_paid) AS revenue_collected,
    COUNT(DISTINCT s.sponsor_id) AS sponsor_count,
    SUM(s.sponsorship_amount) AS sponsorship_revenue
FROM events e
LEFT JOIN registrations r ON e.event_id = r.event_id AND r.deleted_at IS NULL
LEFT JOIN event_sponsors s ON e.event_id = s.event_id
WHERE e.deleted_at IS NULL
GROUP BY e.event_id, e.tenant_id, e.event_name, e.event_type, e.start_date, e.status;

CREATE UNIQUE INDEX ON mv_event_summary (event_id);
CREATE INDEX ON mv_event_summary (tenant_id);
CREATE INDEX ON mv_event_summary (start_date DESC);

-- ============================================================================
-- END OF EVENT MANAGEMENT SCHEMA
-- ============================================================================
