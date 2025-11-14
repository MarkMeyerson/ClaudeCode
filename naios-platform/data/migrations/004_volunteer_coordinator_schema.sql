-- ============================================================================
-- NAIOS Platform - Volunteer Coordinator Database Schema
-- Version: 1.0.0
-- Description: Complete schema for volunteer management and coordination
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- VOLUNTEERS TABLE
-- Comprehensive volunteer information and engagement tracking
-- ============================================================================
CREATE TABLE volunteers (
    -- Primary identification
    volunteer_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    volunteer_number VARCHAR(50) UNIQUE NOT NULL,

    -- Personal information
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    preferred_name VARCHAR(100),
    date_of_birth DATE,
    gender VARCHAR(20),

    -- Contact information
    email VARCHAR(255) NOT NULL,
    email_secondary VARCHAR(255),
    phone_primary VARCHAR(20),
    phone_secondary VARCHAR(20),
    phone_mobile VARCHAR(20),

    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip VARCHAR(20),
    country VARCHAR(3) DEFAULT 'USA',

    -- Emergency contact
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(100),
    medical_information TEXT,

    -- Skills and interests
    skills_list TEXT[],
    skill_categories VARCHAR(100)[],
    interests_list TEXT[],
    certifications TEXT[],
    languages_spoken VARCHAR(50)[],
    professional_background TEXT,

    -- Availability
    availability_json JSONB,
    preferred_schedule VARCHAR(100),
    flexible_hours BOOLEAN DEFAULT FALSE,
    remote_capable BOOLEAN DEFAULT FALSE,
    distance_willing_to_travel INTEGER, -- in miles

    -- Preferences
    preferred_roles TEXT[],
    role_interests TEXT[],
    experience_level VARCHAR(50) CHECK (experience_level IN (
        'Beginner', 'Intermediate', 'Advanced', 'Expert'
    )),
    group_preference VARCHAR(50) CHECK (group_preference IN (
        'Solo', 'Small Group', 'Large Group', 'No Preference'
    )),

    -- Engagement tracking
    start_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Active' CHECK (status IN (
        'Prospect', 'Active', 'Inactive', 'On Hold', 'Retired', 'Terminated'
    )),
    total_hours DECIMAL(10, 2) DEFAULT 0,
    total_events INTEGER DEFAULT 0,
    last_activity_date DATE,
    last_shift_date DATE,

    -- Background check and compliance
    background_check_status VARCHAR(50) CHECK (background_check_status IN (
        'Not Required', 'Pending', 'In Progress', 'Completed', 'Failed', 'Expired'
    )),
    background_check_date DATE,
    background_check_expiry DATE,
    background_check_provider VARCHAR(100),
    background_check_reference VARCHAR(100),

    -- Training and orientation
    orientation_completed BOOLEAN DEFAULT FALSE,
    orientation_date DATE,
    orientation_type VARCHAR(100),
    required_training_completed BOOLEAN DEFAULT FALSE,
    training_records JSONB,

    -- Organizational context
    referred_by VARCHAR(255),
    referral_source VARCHAR(100),
    how_heard_about_us TEXT,
    motivation TEXT,
    why_volunteer TEXT,

    -- Transportation and logistics
    transportation_available BOOLEAN DEFAULT TRUE,
    vehicle_type VARCHAR(100),
    drivers_license_valid BOOLEAN DEFAULT FALSE,
    drivers_license_state VARCHAR(2),
    drivers_license_expiry DATE,

    -- Corporate and group volunteering
    corporate_volunteer BOOLEAN DEFAULT FALSE,
    company_name VARCHAR(255),
    group_leader BOOLEAN DEFAULT FALSE,
    group_size INTEGER,

    -- Social and networking
    social_media_handles JSONB,
    linkedin_url VARCHAR(500),
    willing_to_network BOOLEAN DEFAULT TRUE,

    -- Communication preferences
    preferred_contact_method VARCHAR(50) CHECK (preferred_contact_method IN (
        'Email', 'Phone', 'Text', 'In-Person'
    )),
    email_opt_in BOOLEAN DEFAULT TRUE,
    sms_opt_in BOOLEAN DEFAULT FALSE,
    newsletter_subscription BOOLEAN DEFAULT TRUE,

    -- Performance and feedback
    performance_rating DECIMAL(3, 2) CHECK (performance_rating BETWEEN 0 AND 5),
    reliability_score DECIMAL(5, 2),
    punctuality_score DECIMAL(5, 2),
    quality_score DECIMAL(5, 2),
    teamwork_score DECIMAL(5, 2),
    feedback_count INTEGER DEFAULT 0,
    commendations INTEGER DEFAULT 0,
    warnings INTEGER DEFAULT 0,

    -- Recognition and rewards
    recognition_points INTEGER DEFAULT 0,
    achievement_badges TEXT[],
    awards_received TEXT[],
    milestone_achievements JSONB,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,

    -- Additional data
    custom_fields JSONB,
    notes TEXT,
    tags TEXT[],

    -- Soft delete
    is_active BOOLEAN DEFAULT TRUE,
    archived_at TIMESTAMP WITH TIME ZONE,
    archived_reason TEXT
);

-- Indexes for volunteers
CREATE INDEX idx_volunteers_email ON volunteers(email);
CREATE INDEX idx_volunteers_name ON volunteers(last_name, first_name);
CREATE INDEX idx_volunteers_status ON volunteers(status);
CREATE INDEX idx_volunteers_skills ON volunteers USING gin(skills_list);
CREATE INDEX idx_volunteers_total_hours ON volunteers(total_hours DESC);
CREATE INDEX idx_volunteers_last_activity ON volunteers(last_activity_date DESC);
CREATE INDEX idx_volunteers_performance ON volunteers(performance_rating DESC);
CREATE INDEX idx_volunteers_tags ON volunteers USING gin(tags);
CREATE INDEX idx_volunteers_active ON volunteers(is_active) WHERE is_active = TRUE;

-- Full-text search
CREATE INDEX idx_volunteers_fulltext ON volunteers USING gin(
    to_tsvector('english',
        COALESCE(first_name, '') || ' ' ||
        COALESCE(last_name, '') || ' ' ||
        COALESCE(notes, '')
    )
);

-- ============================================================================
-- VOLUNTEER_OPPORTUNITIES TABLE
-- Available volunteer opportunities and roles
-- ============================================================================
CREATE TABLE volunteer_opportunities (
    -- Primary identification
    opportunity_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_code VARCHAR(50) UNIQUE NOT NULL,

    -- Opportunity details
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    short_description VARCHAR(500),
    opportunity_type VARCHAR(100) CHECK (opportunity_type IN (
        'One-Time Event', 'Recurring', 'Ongoing', 'Project-Based',
        'Skills-Based', 'Virtual', 'In-Person', 'Hybrid'
    )),

    -- Program and category
    program_id UUID,
    program_name VARCHAR(255),
    category VARCHAR(100),
    subcategory VARCHAR(100),

    -- Location
    location_type VARCHAR(50) CHECK (location_type IN (
        'On-Site', 'Remote', 'Hybrid', 'Multiple Locations'
    )),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip VARCHAR(20),
    virtual_meeting_link VARCHAR(500),

    -- Timing
    start_date DATE,
    end_date DATE,
    is_ongoing BOOLEAN DEFAULT FALSE,
    time_commitment VARCHAR(100),
    estimated_hours DECIMAL(10, 2),
    flexible_schedule BOOLEAN DEFAULT FALSE,

    -- Requirements
    required_skills TEXT[],
    preferred_skills TEXT[],
    experience_required VARCHAR(50),
    age_minimum INTEGER,
    age_maximum INTEGER,
    background_check_required BOOLEAN DEFAULT FALSE,
    orientation_required BOOLEAN DEFAULT FALSE,
    training_required BOOLEAN DEFAULT FALSE,
    certifications_required TEXT[],
    physical_requirements TEXT,

    -- Capacity and recruitment
    total_positions INTEGER,
    filled_positions INTEGER DEFAULT 0,
    available_positions INTEGER GENERATED ALWAYS AS (total_positions - filled_positions) STORED,
    waitlist_count INTEGER DEFAULT 0,
    recruitment_status VARCHAR(50) CHECK (recruitment_status IN (
        'Open', 'Limited Openings', 'Full', 'Closed', 'On Hold', 'Cancelled'
    )),

    -- Impact and benefits
    impact_description TEXT,
    volunteer_benefits TEXT[],
    learning_opportunities TEXT[],
    networking_opportunities BOOLEAN DEFAULT FALSE,
    reference_available BOOLEAN DEFAULT TRUE,

    -- Coordinator information
    coordinator_id UUID,
    coordinator_name VARCHAR(255),
    coordinator_email VARCHAR(255),
    coordinator_phone VARCHAR(20),

    -- Visibility and publishing
    published BOOLEAN DEFAULT FALSE,
    published_date DATE,
    featured BOOLEAN DEFAULT FALSE,
    internal_only BOOLEAN DEFAULT FALSE,
    recruitment_channels TEXT[],

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,

    -- Additional data
    custom_fields JSONB,
    notes TEXT,
    tags TEXT[]
);

-- Indexes for volunteer_opportunities
CREATE INDEX idx_opportunities_status ON volunteer_opportunities(recruitment_status);
CREATE INDEX idx_opportunities_dates ON volunteer_opportunities(start_date, end_date);
CREATE INDEX idx_opportunities_program ON volunteer_opportunities(program_id);
CREATE INDEX idx_opportunities_published ON volunteer_opportunities(published) WHERE published = TRUE;
CREATE INDEX idx_opportunities_featured ON volunteer_opportunities(featured) WHERE featured = TRUE;
CREATE INDEX idx_opportunities_skills ON volunteer_opportunities USING gin(required_skills);

-- ============================================================================
-- VOLUNTEER_ASSIGNMENTS TABLE
-- Volunteer assignments to opportunities
-- ============================================================================
CREATE TABLE volunteer_assignments (
    -- Primary identification
    assignment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- References
    volunteer_id UUID NOT NULL REFERENCES volunteers(volunteer_id) ON DELETE CASCADE,
    opportunity_id UUID NOT NULL REFERENCES volunteer_opportunities(opportunity_id) ON DELETE RESTRICT,

    -- Assignment details
    role VARCHAR(255),
    responsibilities TEXT[],
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'Active' CHECK (status IN (
        'Pending', 'Confirmed', 'Active', 'Completed',
        'Cancelled', 'No Show', 'On Hold'
    )),

    -- Schedule
    schedule_json JSONB,
    shift_pattern VARCHAR(100),
    hours_expected DECIMAL(10, 2),
    hours_completed DECIMAL(10, 2) DEFAULT 0,

    -- Preparation
    orientation_completed BOOLEAN DEFAULT FALSE,
    orientation_date DATE,
    training_completed BOOLEAN DEFAULT FALSE,
    training_dates DATE[],
    materials_provided BOOLEAN DEFAULT FALSE,
    equipment_issued JSONB,

    -- Supervision
    supervisor_id UUID,
    supervisor_name VARCHAR(255),
    team_members UUID[],
    team_lead BOOLEAN DEFAULT FALSE,

    -- Performance
    performance_rating DECIMAL(3, 2) CHECK (performance_rating BETWEEN 0 AND 5),
    attendance_rate DECIMAL(5, 2),
    quality_rating DECIMAL(3, 2) CHECK (quality_rating BETWEEN 0 AND 5),
    feedback_received TEXT[],
    commendations TEXT[],
    issues_noted TEXT[],

    -- Recognition
    recognition_given JSONB,
    certificate_issued BOOLEAN DEFAULT FALSE,
    certificate_date DATE,
    reference_provided BOOLEAN DEFAULT FALSE,

    -- Impact tracking
    beneficiaries_served INTEGER,
    outcomes_achieved JSONB,
    impact_notes TEXT,

    -- Completion
    completion_status VARCHAR(50),
    completion_date DATE,
    exit_interview_completed BOOLEAN DEFAULT FALSE,
    continuation_interest BOOLEAN,
    rehire_eligible BOOLEAN DEFAULT TRUE,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,

    -- Additional data
    custom_fields JSONB,
    notes TEXT
);

-- Indexes for volunteer_assignments
CREATE INDEX idx_assignments_volunteer ON volunteer_assignments(volunteer_id);
CREATE INDEX idx_assignments_opportunity ON volunteer_assignments(opportunity_id);
CREATE INDEX idx_assignments_status ON volunteer_assignments(status);
CREATE INDEX idx_assignments_dates ON volunteer_assignments(start_date, end_date);
CREATE INDEX idx_assignments_supervisor ON volunteer_assignments(supervisor_id);

-- ============================================================================
-- HOURS_TRACKING TABLE
-- Detailed tracking of volunteer hours
-- ============================================================================
CREATE TABLE hours_tracking (
    -- Primary identification
    tracking_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- References
    volunteer_id UUID NOT NULL REFERENCES volunteers(volunteer_id) ON DELETE CASCADE,
    assignment_id UUID REFERENCES volunteer_assignments(assignment_id) ON DELETE SET NULL,
    opportunity_id UUID REFERENCES volunteer_opportunities(opportunity_id) ON DELETE SET NULL,

    -- Date and time
    service_date DATE NOT NULL,
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    total_hours DECIMAL(10, 2) NOT NULL CHECK (total_hours >= 0),
    break_time DECIMAL(10, 2) DEFAULT 0,
    net_hours DECIMAL(10, 2) GENERATED ALWAYS AS (total_hours - break_time) STORED,

    -- Location and activity
    location VARCHAR(255),
    activity_description TEXT,
    tasks_completed TEXT[],

    -- Impact
    beneficiaries_served INTEGER DEFAULT 0,
    items_completed INTEGER DEFAULT 0,
    services_delivered TEXT[],

    -- Approval workflow
    submitted_by UUID,
    submitted_date TIMESTAMP WITH TIME ZONE,
    approval_status VARCHAR(50) DEFAULT 'Pending' CHECK (approval_status IN (
        'Pending', 'Approved', 'Rejected', 'Disputed'
    )),
    approved_by UUID,
    approval_date TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,

    -- Verification
    verification_method VARCHAR(50) CHECK (verification_method IN (
        'Self-Reported', 'Supervisor Verified', 'System Tracked', 'QR Code', 'Biometric'
    )),
    verified_by UUID,
    verification_date TIMESTAMP WITH TIME ZONE,

    -- Modification tracking
    modification_history JSONB,
    original_hours DECIMAL(10, 2),
    modified_reason TEXT,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Additional data
    custom_fields JSONB,
    notes TEXT
);

-- Indexes for hours_tracking
CREATE INDEX idx_hours_volunteer ON hours_tracking(volunteer_id);
CREATE INDEX idx_hours_assignment ON hours_tracking(assignment_id);
CREATE INDEX idx_hours_date ON hours_tracking(service_date DESC);
CREATE INDEX idx_hours_approval ON hours_tracking(approval_status);
CREATE INDEX idx_hours_total ON hours_tracking(total_hours DESC);

-- ============================================================================
-- VOLUNTEER_SKILLS TABLE
-- Detailed skill inventory
-- ============================================================================
CREATE TABLE volunteer_skills (
    skill_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    skill_name VARCHAR(255) NOT NULL UNIQUE,
    skill_category VARCHAR(100),
    skill_description TEXT,
    proficiency_levels VARCHAR(50)[] DEFAULT ARRAY['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    certification_available BOOLEAN DEFAULT FALSE,
    certification_provider VARCHAR(255),
    training_available BOOLEAN DEFAULT FALSE,
    training_duration_hours DECIMAL(10, 2),
    demand_level VARCHAR(20) CHECK (demand_level IN ('Low', 'Medium', 'High', 'Critical')),
    volunteer_count INTEGER DEFAULT 0,
    related_skills TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_skills_category ON volunteer_skills(skill_category);
CREATE INDEX idx_skills_demand ON volunteer_skills(demand_level);

-- ============================================================================
-- VOLUNTEER_RECOGNITION TABLE
-- Recognition and rewards tracking
-- ============================================================================
CREATE TABLE volunteer_recognition (
    recognition_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    volunteer_id UUID NOT NULL REFERENCES volunteers(volunteer_id) ON DELETE CASCADE,
    recognition_type VARCHAR(100) CHECK (recognition_type IN (
        'Badge', 'Certificate', 'Award', 'Points', 'Milestone',
        'Public Acknowledgment', 'Letter', 'Gift', 'Event Invitation'
    )),
    recognition_name VARCHAR(255) NOT NULL,
    description TEXT,
    points_awarded INTEGER DEFAULT 0,
    achievement_date DATE NOT NULL,
    awarded_by UUID,
    public_display BOOLEAN DEFAULT TRUE,
    social_media_share BOOLEAN DEFAULT FALSE,
    certificate_url VARCHAR(500),
    badge_image_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

CREATE INDEX idx_recognition_volunteer ON volunteer_recognition(volunteer_id);
CREATE INDEX idx_recognition_date ON volunteer_recognition(achievement_date DESC);
CREATE INDEX idx_recognition_type ON volunteer_recognition(recognition_type);

-- ============================================================================
-- TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_volunteers_updated_at BEFORE UPDATE ON volunteers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_volunteer_opportunities_updated_at BEFORE UPDATE ON volunteer_opportunities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_volunteer_assignments_updated_at BEFORE UPDATE ON volunteer_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hours_tracking_updated_at BEFORE UPDATE ON hours_tracking
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Active volunteers with stats
CREATE VIEW v_active_volunteers AS
SELECT
    v.volunteer_id,
    v.volunteer_number,
    v.first_name,
    v.last_name,
    v.email,
    v.status,
    v.total_hours,
    v.total_events,
    v.last_activity_date,
    v.performance_rating,
    COUNT(DISTINCT va.assignment_id) AS active_assignments,
    SUM(CASE WHEN va.status = 'Active' THEN 1 ELSE 0 END) AS current_active_assignments
FROM volunteers v
LEFT JOIN volunteer_assignments va ON v.volunteer_id = va.volunteer_id
WHERE v.is_active = TRUE AND v.status = 'Active'
GROUP BY v.volunteer_id;

-- ============================================================================
-- END OF VOLUNTEER COORDINATOR SCHEMA
-- ============================================================================
