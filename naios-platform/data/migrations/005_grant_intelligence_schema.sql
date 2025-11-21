-- ============================================================================
-- NAIOS Platform - Grant Intelligence Database Schema
-- Version: 1.0.0
-- Description: Complete schema for grant management and AI-powered writing
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ============================================================================
-- GRANT_OPPORTUNITIES TABLE
-- Searchable grant opportunities database
-- ============================================================================
CREATE TABLE grant_opportunities (
    -- Primary identification
    opportunity_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_number VARCHAR(50) UNIQUE NOT NULL,

    -- Funder information
    funder_id UUID,
    funder_name VARCHAR(255) NOT NULL,
    funder_type VARCHAR(100) CHECK (funder_type IN (
        'Federal Government', 'State Government', 'Local Government',
        'Private Foundation', 'Corporate Foundation', 'Community Foundation',
        'Corporate Giving Program', 'International', 'Other'
    )),

    -- Grant details
    grant_name VARCHAR(500) NOT NULL,
    grant_type VARCHAR(100) CHECK (grant_type IN (
        'Project Grant', 'Operating Grant', 'Capital Grant',
        'Endowment Grant', 'Planning Grant', 'Research Grant',
        'Demonstration Grant', 'Technical Assistance', 'Other'
    )),
    program_area VARCHAR(255),
    focus_areas TEXT[],
    keywords TEXT[],

    -- Funding information
    funding_range_min DECIMAL(15, 2),
    funding_range_max DECIMAL(15, 2),
    average_award DECIMAL(15, 2),
    total_available DECIMAL(15, 2),
    number_of_awards INTEGER,

    -- Eligibility
    eligible_organizations TEXT[],
    eligible_entity_types TEXT[],
    geographic_restrictions TEXT[],
    geographic_focus TEXT[],
    service_area_requirements TEXT,
    budget_size_requirements VARCHAR(255),

    -- Requirements and restrictions
    matching_requirements BOOLEAN DEFAULT FALSE,
    match_ratio VARCHAR(20),
    match_type VARCHAR(100),
    indirect_cost_allowed BOOLEAN DEFAULT TRUE,
    indirect_cost_rate DECIMAL(5, 2),
    overhead_allowed BOOLEAN DEFAULT TRUE,
    multi_year_eligible BOOLEAN DEFAULT FALSE,
    collaboration_required BOOLEAN DEFAULT FALSE,

    -- Important dates
    announcement_date DATE,
    application_deadline DATE,
    deadline_type VARCHAR(50) CHECK (deadline_type IN (
        'Rolling', 'Fixed', 'Multiple Deadlines', 'Until Funds Exhausted'
    )),
    next_deadline DATE,
    notification_date DATE,
    award_date DATE,
    grant_period_start DATE,
    grant_period_end DATE,
    grant_duration_months INTEGER,

    -- Application process
    application_process TEXT,
    application_method VARCHAR(100) CHECK (application_method IN (
        'Online Portal', 'Email', 'Mail', 'Grants.gov', 'Foundation Website', 'Other'
    )),
    portal_url VARCHAR(500),
    application_fee DECIMAL(10, 2) DEFAULT 0,
    letter_of_inquiry_required BOOLEAN DEFAULT FALSE,
    pre_proposal_required BOOLEAN DEFAULT FALSE,
    full_proposal_required BOOLEAN DEFAULT TRUE,

    -- Required documents
    required_documents TEXT[],
    optional_documents TEXT[],
    page_limits JSONB,
    formatting_requirements TEXT,
    submission_format VARCHAR(100),

    -- Evaluation criteria
    evaluation_criteria TEXT[],
    scoring_rubric JSONB,
    review_process TEXT,
    success_rate DECIMAL(5, 2),
    competitiveness_rating VARCHAR(20) CHECK (competitiveness_rating IN (
        'Very Low', 'Low', 'Medium', 'High', 'Very High'
    )),

    -- Historical data
    previous_recipients TEXT[],
    previous_award_amounts DECIMAL(15, 2)[],
    funding_history JSONB,

    -- Reporting requirements
    reporting_requirements TEXT[],
    reporting_frequency VARCHAR(100),
    interim_reports_required BOOLEAN DEFAULT FALSE,
    final_report_required BOOLEAN DEFAULT TRUE,
    financial_reporting_required BOOLEAN DEFAULT TRUE,
    site_visits_expected BOOLEAN DEFAULT FALSE,

    -- Payment information
    payment_schedule VARCHAR(255),
    reimbursement_basis BOOLEAN DEFAULT FALSE,
    advance_payment_available BOOLEAN DEFAULT TRUE,

    -- Renewal and continuation
    renewal_eligible BOOLEAN DEFAULT FALSE,
    renewal_process TEXT,
    renewal_rate DECIMAL(5, 2),

    -- Internal tracking
    discovery_date DATE DEFAULT CURRENT_DATE,
    discovered_by UUID,
    discovery_source VARCHAR(255),

    -- Fit assessment
    alignment_score DECIMAL(5, 2) CHECK (alignment_score BETWEEN 0 AND 100),
    strategic_fit BOOLEAN DEFAULT FALSE,
    priority_level VARCHAR(20) CHECK (priority_level IN (
        'Critical', 'High', 'Medium', 'Low'
    )),
    effort_estimate VARCHAR(50) CHECK (effort_estimate IN (
        'Low', 'Medium', 'High', 'Very High'
    )),
    probability_assessment DECIMAL(5, 2) CHECK (probability_assessment BETWEEN 0 AND 100),
    roi_projection DECIMAL(15, 2),

    -- Decision tracking
    go_decision BOOLEAN,
    decision_date DATE,
    decision_maker UUID,
    decision_rationale TEXT,
    decline_reason TEXT,

    -- Assignment
    assigned_writer UUID,
    writing_team UUID[],
    subject_matter_experts UUID[],
    project_lead UUID,

    -- Status
    opportunity_status VARCHAR(50) DEFAULT 'Open' CHECK (opportunity_status IN (
        'Prospect', 'Reviewing', 'Planning', 'In Progress',
        'Submitted', 'Awarded', 'Declined', 'Withdrawn', 'Archived'
    )),

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,

    -- Additional data
    custom_fields JSONB,
    notes TEXT,
    tags TEXT[],
    archived BOOLEAN DEFAULT FALSE
);

-- Indexes for grant_opportunities
CREATE INDEX idx_grant_opportunities_funder ON grant_opportunities(funder_id);
CREATE INDEX idx_grant_opportunities_deadline ON grant_opportunities(application_deadline);
CREATE INDEX idx_grant_opportunities_status ON grant_opportunities(opportunity_status);
CREATE INDEX idx_grant_opportunities_amount ON grant_opportunities(funding_range_max DESC);
CREATE INDEX idx_grant_opportunities_focus ON grant_opportunities USING gin(focus_areas);
CREATE INDEX idx_grant_opportunities_keywords ON grant_opportunities USING gin(keywords);
CREATE INDEX idx_grant_opportunities_tags ON grant_opportunities USING gin(tags);

-- Full-text search
CREATE INDEX idx_grant_opportunities_fulltext ON grant_opportunities USING gin(
    to_tsvector('english',
        COALESCE(grant_name, '') || ' ' ||
        COALESCE(funder_name, '') || ' ' ||
        COALESCE(program_area, '') || ' ' ||
        COALESCE(array_to_string(focus_areas, ' '), '') || ' ' ||
        COALESCE(notes, '')
    )
);

-- ============================================================================
-- GRANT_APPLICATIONS TABLE
-- Grant application tracking
-- ============================================================================
CREATE TABLE grant_applications (
    -- Primary identification
    application_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_number VARCHAR(50) UNIQUE NOT NULL,

    -- Reference
    opportunity_id UUID NOT NULL REFERENCES grant_opportunities(opportunity_id) ON DELETE RESTRICT,
    funder_name VARCHAR(255) NOT NULL,
    grant_name VARCHAR(500) NOT NULL,

    -- Team
    lead_writer UUID NOT NULL,
    writing_team UUID[],
    reviewers UUID[],
    approvers UUID[],
    project_director UUID,
    fiscal_contact UUID,

    -- Timeline
    start_date DATE NOT NULL,
    submission_deadline DATE NOT NULL,
    internal_deadline DATE,
    actual_submission_date DATE,

    -- Status and workflow
    status VARCHAR(50) NOT NULL DEFAULT 'Planning' CHECK (status IN (
        'Planning', 'Drafting', 'Internal Review', 'Revision',
        'Final Review', 'Approval', 'Ready to Submit', 'Submitted',
        'Under Review', 'Site Visit Scheduled', 'Decision Pending',
        'Awarded', 'Declined', 'Withdrawn'
    )),
    workflow_stage VARCHAR(100),
    completeness_percentage INTEGER DEFAULT 0 CHECK (completeness_percentage BETWEEN 0 AND 100),

    -- Proposal content
    project_title VARCHAR(500),
    project_period_start DATE,
    project_period_end DATE,
    project_duration_months INTEGER,

    -- Narrative sections
    executive_summary TEXT,
    problem_statement TEXT,
    project_description TEXT,
    goals_objectives JSONB,
    methods_approach TEXT,
    timeline JSONB,
    evaluation_plan TEXT,
    sustainability_plan TEXT,
    dissemination_plan TEXT,

    -- Organizational information
    organizational_capacity TEXT,
    past_performance TEXT,
    key_personnel JSONB,
    organizational_chart_url VARCHAR(500),

    -- Budget
    budget_total DECIMAL(15, 2),
    budget_requested DECIMAL(15, 2),
    budget_match DECIMAL(15, 2),
    budget_in_kind DECIMAL(15, 2),
    budget_other_sources DECIMAL(15, 2),
    budget_narrative TEXT,
    budget_justification TEXT,
    budget_by_category JSONB,
    budget_by_year JSONB,
    indirect_costs DECIMAL(15, 2),
    indirect_rate DECIMAL(5, 2),

    -- Supporting materials
    letters_of_support INTEGER DEFAULT 0,
    letters_of_support_files JSONB,
    attachments_list JSONB,
    required_forms_completed BOOLEAN DEFAULT FALSE,
    certifications_signed BOOLEAN DEFAULT FALSE,

    -- Review and quality
    internal_review_status VARCHAR(50),
    reviewer_feedback JSONB,
    quality_score DECIMAL(5, 2) CHECK (quality_score BETWEEN 0 AND 100),
    readability_score DECIMAL(5, 2),
    compliance_check_passed BOOLEAN DEFAULT FALSE,
    final_approval_received BOOLEAN DEFAULT FALSE,

    -- Submission
    submission_method VARCHAR(100),
    submission_confirmation_number VARCHAR(255),
    submission_receipt_url VARCHAR(500),
    submitted_by UUID,

    -- Post-submission
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_notes TEXT,
    site_visit_scheduled BOOLEAN DEFAULT FALSE,
    site_visit_date DATE,
    presentation_required BOOLEAN DEFAULT FALSE,
    presentation_date DATE,

    -- Outcome
    award_notification_date DATE,
    award_status VARCHAR(50) CHECK (award_status IN (
        'Pending', 'Awarded', 'Partially Awarded', 'Declined', 'Waitlisted'
    )),
    award_amount DECIMAL(15, 2),
    award_period_start DATE,
    award_period_end DATE,
    award_modifications JSONB,

    -- Decline handling
    decline_reason TEXT,
    reviewer_comments TEXT,
    score_received DECIMAL(10, 2),
    ranking_received INTEGER,
    resubmission_eligible BOOLEAN,
    resubmission_planned BOOLEAN DEFAULT FALSE,
    feedback_received JSONB,

    -- Post-award
    contract_negotiation_required BOOLEAN DEFAULT FALSE,
    contract_signed BOOLEAN DEFAULT FALSE,
    contract_date DATE,
    special_conditions TEXT[],
    reporting_schedule JSONB,
    payment_schedule JSONB,

    -- Lessons learned
    lessons_learned TEXT,
    what_worked_well TEXT[],
    what_to_improve TEXT[],
    template_worthy BOOLEAN DEFAULT FALSE,

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

-- Indexes for grant_applications
CREATE INDEX idx_grant_applications_opportunity ON grant_applications(opportunity_id);
CREATE INDEX idx_grant_applications_status ON grant_applications(status);
CREATE INDEX idx_grant_applications_deadline ON grant_applications(submission_deadline);
CREATE INDEX idx_grant_applications_lead_writer ON grant_applications(lead_writer);
CREATE INDEX idx_grant_applications_award_status ON grant_applications(award_status);

-- ============================================================================
-- AWARDED_GRANTS TABLE
-- Management of awarded grants
-- ============================================================================
CREATE TABLE awarded_grants (
    -- Primary identification
    grant_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grant_number VARCHAR(50) UNIQUE NOT NULL,

    -- References
    application_id UUID REFERENCES grant_applications(application_id) ON DELETE SET NULL,
    opportunity_id UUID REFERENCES grant_opportunities(opportunity_id) ON DELETE SET NULL,

    -- Grant information
    funder_name VARCHAR(255) NOT NULL,
    grant_title VARCHAR(500) NOT NULL,
    grant_type VARCHAR(100),
    program_area VARCHAR(255),

    -- Award details
    award_date DATE NOT NULL,
    award_amount DECIMAL(15, 2) NOT NULL,
    performance_period_start DATE NOT NULL,
    performance_period_end DATE NOT NULL,
    extension_possible BOOLEAN DEFAULT FALSE,
    current_period_end DATE,

    -- Budget tracking
    total_budget DECIMAL(15, 2),
    budget_spent DECIMAL(15, 2) DEFAULT 0,
    budget_committed DECIMAL(15, 2) DEFAULT 0,
    budget_available DECIMAL(15, 2) GENERATED ALWAYS AS (
        total_budget - budget_spent - budget_committed
    ) STORED,
    budget_by_category JSONB,
    rebudget_requests JSONB,

    -- Payment tracking
    payment_schedule JSONB,
    payments_received JSONB,
    total_received DECIMAL(15, 2) DEFAULT 0,
    balance_due DECIMAL(15, 2) GENERATED ALWAYS AS (
        award_amount - total_received
    ) STORED,
    next_payment_date DATE,
    next_payment_amount DECIMAL(15, 2),

    -- Management
    project_director UUID NOT NULL,
    fiscal_contact UUID NOT NULL,
    programmatic_contact UUID,
    grant_manager UUID,

    -- Compliance
    compliance_status VARCHAR(50) CHECK (compliance_status IN (
        'Compliant', 'At Risk', 'Non-Compliant', 'Under Review'
    )),
    compliance_issues TEXT[],
    corrective_actions TEXT[],
    audit_required BOOLEAN DEFAULT FALSE,
    audit_date DATE,
    audit_findings TEXT,

    -- Reporting
    reporting_schedule JSONB,
    reports_submitted JSONB,
    next_report_due DATE,
    next_report_type VARCHAR(100),
    overdue_reports INTEGER DEFAULT 0,

    -- Deliverables
    deliverables JSONB,
    deliverables_met INTEGER DEFAULT 0,
    deliverables_pending INTEGER,
    milestones JSONB,
    milestones_completed INTEGER DEFAULT 0,

    -- Performance
    outcomes_target JSONB,
    outcomes_achieved JSONB,
    impact_metrics JSONB,
    performance_rating VARCHAR(20) CHECK (performance_rating IN (
        'Exceeds Expectations', 'Meets Expectations', 'Below Expectations', 'At Risk'
    )),

    -- Modifications
    amendments JSONB,
    extensions JSONB,
    scope_changes TEXT[],
    budget_modifications JSONB,

    -- Renewal
    renewal_possible BOOLEAN DEFAULT FALSE,
    renewal_date DATE,
    renewal_application_due DATE,
    renewal_status VARCHAR(50),

    -- Closeout
    closeout_status VARCHAR(50) CHECK (closeout_status IN (
        'Active', 'Pending Closeout', 'Closeout Initiated',
        'Final Report Submitted', 'Closed', 'Cancelled'
    )),
    final_report_due DATE,
    final_report_submitted DATE,
    final_payment_received BOOLEAN DEFAULT FALSE,
    closeout_date DATE,
    success_rating DECIMAL(3, 2) CHECK (success_rating BETWEEN 0 AND 5),

    -- Relationship management
    funder_relationship_quality VARCHAR(20) CHECK (funder_relationship_quality IN (
        'Excellent', 'Good', 'Fair', 'Poor'
    )),
    stewardship_actions JSONB,
    thank_you_sent BOOLEAN DEFAULT FALSE,
    impact_reports_sent INTEGER DEFAULT 0,

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

-- Indexes for awarded_grants
CREATE INDEX idx_awarded_grants_application ON awarded_grants(application_id);
CREATE INDEX idx_awarded_grants_funder ON awarded_grants(funder_name);
CREATE INDEX idx_awarded_grants_dates ON awarded_grants(performance_period_start, performance_period_end);
CREATE INDEX idx_awarded_grants_project_director ON awarded_grants(project_director);
CREATE INDEX idx_awarded_grants_compliance ON awarded_grants(compliance_status);
CREATE INDEX idx_awarded_grants_closeout ON awarded_grants(closeout_status);

-- ============================================================================
-- GRANT_REPORTS TABLE
-- Grant reporting tracking
-- ============================================================================
CREATE TABLE grant_reports (
    report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grant_id UUID NOT NULL REFERENCES awarded_grants(grant_id) ON DELETE CASCADE,
    report_type VARCHAR(100) NOT NULL CHECK (report_type IN (
        'Progress Report', 'Financial Report', 'Interim Report',
        'Final Report', 'Impact Report', 'Special Report'
    )),
    reporting_period_start DATE NOT NULL,
    reporting_period_end DATE NOT NULL,
    due_date DATE NOT NULL,
    submitted_date DATE,
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN (
        'Not Started', 'In Progress', 'Review', 'Submitted',
        'Accepted', 'Revision Requested', 'Overdue'
    )),
    narrative_content TEXT,
    financial_data JSONB,
    outcomes_data JSONB,
    metrics_reported JSONB,
    submitted_by UUID,
    reviewed_by UUID,
    funder_feedback TEXT,
    revision_required BOOLEAN DEFAULT FALSE,
    revision_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_grant_reports_grant ON grant_reports(grant_id);
CREATE INDEX idx_grant_reports_due_date ON grant_reports(due_date);
CREATE INDEX idx_grant_reports_status ON grant_reports(status);

-- ============================================================================
-- FUNDERS TABLE
-- Funder organization profiles
-- ============================================================================
CREATE TABLE funders (
    funder_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    funder_name VARCHAR(255) NOT NULL UNIQUE,
    funder_type VARCHAR(100),
    ein VARCHAR(20),
    website VARCHAR(500),
    total_assets DECIMAL(15, 2),
    annual_giving DECIMAL(15, 2),
    average_grant_size DECIMAL(15, 2),
    number_of_grants INTEGER,
    focus_areas TEXT[],
    geographic_focus TEXT[],
    application_process TEXT,
    deadlines JSONB,
    contact_info JSONB,
    relationship_manager UUID,
    relationship_status VARCHAR(50),
    last_interaction DATE,
    next_step TEXT,
    cultivation_strategy TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_funders_name ON funders USING gin(funder_name gin_trgm_ops);
CREATE INDEX idx_funders_type ON funders(funder_type);
CREATE INDEX idx_funders_focus ON funders USING gin(focus_areas);

-- ============================================================================
-- TRIGGERS
-- ============================================================================
CREATE TRIGGER update_grant_opportunities_updated_at BEFORE UPDATE ON grant_opportunities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grant_applications_updated_at BEFORE UPDATE ON grant_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_awarded_grants_updated_at BEFORE UPDATE ON awarded_grants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grant_reports_updated_at BEFORE UPDATE ON grant_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_funders_updated_at BEFORE UPDATE ON funders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- END OF GRANT INTELLIGENCE SCHEMA
-- ============================================================================
