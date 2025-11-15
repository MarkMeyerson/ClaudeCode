-- ============================================================================
-- PHASE 5: ADOPTION TRACKING & OPTIMIZATION DATABASE SCHEMA
-- Microsoft Copilot Onboarding & ROI Platform
-- ============================================================================

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,

    -- User Profile
    user_email VARCHAR(255) NOT NULL,
    user_name VARCHAR(255),
    display_name VARCHAR(255),
    department VARCHAR(100),
    role VARCHAR(100),
    job_title VARCHAR(150),
    seniority_level VARCHAR(50), -- entry, mid, senior, executive, c_level
    manager_id UUID REFERENCES users(user_id),

    -- Microsoft Identity
    azure_ad_id VARCHAR(255) UNIQUE,
    m365_user_principal_name VARCHAR(255),
    microsoft_tenant_id VARCHAR(255),

    -- Location
    office_location VARCHAR(100),
    country VARCHAR(100),
    timezone VARCHAR(50),

    -- Status
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, suspended, offboarded
    hire_date DATE,
    termination_date DATE,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_user_email_per_org UNIQUE (organization_id, user_email)
);

-- ============================================================================
-- USER ADOPTION TABLE
-- ============================================================================
CREATE TABLE user_adoption (
    adoption_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,

    -- Adoption Timeline
    copilot_license_assigned_date DATE,
    copilot_enabled_date DATE,
    first_use_date DATE,
    onboarding_started_date DATE,
    onboarding_completed_date DATE,
    training_completed_date DATE,

    -- Status Flags
    onboarding_completed BOOLEAN DEFAULT false,
    training_completed BOOLEAN DEFAULT false,
    assessment_completed BOOLEAN DEFAULT false,
    certification_completed BOOLEAN DEFAULT false,

    -- Usage Metrics (Last 30 Days)
    days_active_last_30 INTEGER DEFAULT 0,
    total_interactions INTEGER DEFAULT 0,
    average_daily_interactions DECIMAL(8,2) DEFAULT 0.00,
    last_activity_date DATE,

    -- Proficiency
    proficiency_level VARCHAR(20) DEFAULT 'beginner', -- beginner, intermediate, advanced, expert
    skill_assessment_score DECIMAL(5,2),
    skill_assessment_date DATE,
    certifications_earned JSONB DEFAULT '[]',

    -- Feature Usage
    features_used JSONB DEFAULT '[]',
    favorite_features JSONB DEFAULT '[]',
    unused_features JSONB DEFAULT '[]',
    feature_usage_count INTEGER DEFAULT 0,

    -- Engagement Metrics
    engagement_score DECIMAL(5,2), -- 0-100 score
    satisfaction_score DECIMAL(5,2), -- 0-10 NPS style
    likelihood_to_recommend INTEGER, -- 0-10 NPS
    nps_category VARCHAR(20), -- promoter, passive, detractor

    -- Support & Learning
    support_tickets_opened INTEGER DEFAULT 0,
    training_sessions_attended INTEGER DEFAULT 0,
    help_articles_viewed INTEGER DEFAULT 0,
    video_tutorials_watched INTEGER DEFAULT 0,
    learning_path_progress DECIMAL(5,2) DEFAULT 0.00,

    -- Champion Metrics
    champion_status VARCHAR(20) DEFAULT 'user', -- user, advocate, champion, super_champion
    champion_score DECIMAL(5,2),
    peer_help_instances INTEGER DEFAULT 0,
    best_practices_shared INTEGER DEFAULT 0,
    community_contributions INTEGER DEFAULT 0,

    -- Adoption Stage
    adoption_stage VARCHAR(30) DEFAULT 'awareness', -- awareness, exploration, adoption, proficiency, mastery
    adoption_stage_date DATE,

    -- Risk Flags
    at_risk BOOLEAN DEFAULT false,
    at_risk_reason TEXT,
    intervention_needed BOOLEAN DEFAULT false,

    -- Notes
    notes TEXT,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- FEATURE CATALOG TABLE
-- ============================================================================
CREATE TABLE feature_catalog (
    feature_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feature_name VARCHAR(255) NOT NULL,
    feature_key VARCHAR(100) NOT NULL UNIQUE,
    application VARCHAR(100) NOT NULL, -- word, excel, powerpoint, outlook, teams, github, bing_chat, etc.

    -- Feature Details
    feature_description TEXT,
    feature_category VARCHAR(100),
    feature_complexity VARCHAR(20), -- basic, intermediate, advanced

    -- Availability
    available_in_plans JSONB DEFAULT '[]', -- Which subscription plans include this feature
    release_date DATE,
    is_preview BOOLEAN DEFAULT false,

    -- Learning Resources
    documentation_url VARCHAR(500),
    tutorial_url VARCHAR(500),
    video_tutorial_url VARCHAR(500),

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- FEATURE USAGE TABLE
-- ============================================================================
CREATE TABLE feature_usage (
    usage_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,
    feature_id UUID NOT NULL REFERENCES feature_catalog(feature_id) ON DELETE CASCADE,

    -- Time Dimension
    date DATE NOT NULL,

    -- Usage Metrics
    total_users_in_org INTEGER,
    unique_users INTEGER DEFAULT 0,
    total_uses INTEGER DEFAULT 0,
    average_uses_per_user DECIMAL(8,2),

    -- Adoption Metrics
    adoption_rate DECIMAL(5,2), -- % of users who used this feature
    new_users_this_period INTEGER DEFAULT 0,
    returning_users INTEGER DEFAULT 0,
    growth_rate DECIMAL(5,2),

    -- Effectiveness Metrics
    success_rate DECIMAL(5,2),
    time_saved_minutes INTEGER DEFAULT 0,
    value_generated DECIMAL(10,2),

    -- Engagement
    average_session_duration_seconds INTEGER,
    completion_rate DECIMAL(5,2),

    -- Feedback
    average_rating DECIMAL(3,2), -- 1-5 star rating
    user_satisfaction DECIMAL(5,2),
    reported_issues INTEGER DEFAULT 0,
    enhancement_requests INTEGER DEFAULT 0,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_org_feature_date UNIQUE (organization_id, feature_id, date)
);

-- ============================================================================
-- DEPARTMENT ADOPTION TABLE
-- ============================================================================
CREATE TABLE department_adoption (
    dept_adoption_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,
    department VARCHAR(100) NOT NULL,

    -- Department Profile
    total_employees INTEGER,
    licensed_users INTEGER,
    active_users INTEGER,

    -- Adoption Metrics
    adoption_rate DECIMAL(5,2),
    activation_rate DECIMAL(5,2), -- % of licensed users who are active
    utilization_rate DECIMAL(5,2),

    -- Engagement
    average_engagement_score DECIMAL(5,2),
    average_satisfaction_score DECIMAL(5,2),
    nps_score DECIMAL(5,2),

    -- Proficiency Distribution
    beginners_count INTEGER DEFAULT 0,
    intermediate_count INTEGER DEFAULT 0,
    advanced_count INTEGER DEFAULT 0,
    experts_count INTEGER DEFAULT 0,

    -- Champions
    department_champions JSONB DEFAULT '[]',
    champion_count INTEGER DEFAULT 0,

    -- Usage Patterns
    top_features_used JSONB DEFAULT '[]',
    most_productive_times JSONB DEFAULT '{}',
    collaboration_score DECIMAL(5,2),

    -- Custom Workflows
    custom_workflows_created INTEGER DEFAULT 0,
    best_practices_documented INTEGER DEFAULT 0,

    -- Period
    measurement_date DATE NOT NULL,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_org_dept_date UNIQUE (organization_id, department, measurement_date)
);

-- ============================================================================
-- ADOPTION INTERVENTIONS TABLE
-- ============================================================================
CREATE TABLE adoption_interventions (
    intervention_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,

    -- Intervention Details
    intervention_type VARCHAR(50) NOT NULL, -- training, communication, support, incentive, gamification, coaching
    intervention_name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Targeting
    target_group VARCHAR(255), -- All users, department, specific cohort
    target_users JSONB DEFAULT '[]', -- Array of user IDs
    target_departments JSONB DEFAULT '[]',
    target_segments JSONB DEFAULT '[]', -- e.g., ["low_adopters", "beginners"]

    -- Target Metrics
    target_metric_name VARCHAR(100),
    target_metric_current_value DECIMAL(10,2),
    target_metric_goal_value DECIMAL(10,2),
    target_metric_improvement_pct DECIMAL(5,2),

    -- Execution
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'planned', -- planned, active, completed, cancelled, paused
    implementation_method TEXT,

    -- Resources
    resources_required JSONB DEFAULT '[]',
    budget_allocated DECIMAL(10,2),
    budget_spent DECIMAL(10,2),
    owner_user_id UUID REFERENCES users(user_id),
    team_members JSONB DEFAULT '[]',

    -- Impact Tracking
    users_reached INTEGER DEFAULT 0,
    users_engaged INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5,2),
    completion_rate DECIMAL(5,2),
    behavior_change_rate DECIMAL(5,2),

    -- Outcomes
    adoption_lift DECIMAL(5,2), -- % increase in adoption
    usage_increase DECIMAL(5,2), -- % increase in usage
    satisfaction_improvement DECIMAL(5,2),
    roi DECIMAL(8,2),
    success_rating DECIMAL(3,2), -- 1-5 rating

    -- Lessons Learned
    success_factors JSONB DEFAULT '[]',
    challenges JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',
    replicable BOOLEAN DEFAULT false,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

-- ============================================================================
-- USER FEEDBACK TABLE
-- ============================================================================
CREATE TABLE user_feedback (
    feedback_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,

    -- Feedback Details
    feedback_type VARCHAR(50), -- bug_report, feature_request, general_feedback, complaint, praise
    feedback_category VARCHAR(100),
    feature_id UUID REFERENCES feature_catalog(feature_id),

    -- Content
    subject VARCHAR(500),
    feedback_text TEXT NOT NULL,
    rating INTEGER, -- 1-5 stars
    sentiment VARCHAR(20), -- positive, neutral, negative

    -- Context
    application VARCHAR(100),
    context_data JSONB DEFAULT '{}',

    -- Status
    status VARCHAR(20) DEFAULT 'new', -- new, acknowledged, in_progress, resolved, closed
    priority VARCHAR(20), -- low, medium, high, critical
    assigned_to UUID,

    -- Resolution
    resolution_notes TEXT,
    resolved_date TIMESTAMP,
    resolution_time_hours DECIMAL(8,2),

    -- Metadata
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ENGAGEMENT EVENTS TABLE
-- ============================================================================
CREATE TABLE engagement_events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,

    -- Event Details
    event_type VARCHAR(100) NOT NULL, -- login, feature_use, training_complete, certification_earned, help_viewed, etc.
    event_category VARCHAR(50),
    event_name VARCHAR(255),
    event_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Context
    application VARCHAR(100),
    feature_id UUID REFERENCES feature_catalog(feature_id),

    -- Event Data
    event_data JSONB DEFAULT '{}',
    session_id VARCHAR(255),
    duration_seconds INTEGER,

    -- Metadata
    user_agent VARCHAR(500),
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- LEARNING PATHS TABLE
-- ============================================================================
CREATE TABLE learning_paths (
    path_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    path_name VARCHAR(255) NOT NULL,
    path_description TEXT,

    -- Path Details
    target_audience VARCHAR(100), -- beginner, intermediate, advanced, all
    difficulty_level VARCHAR(20),
    estimated_duration_hours INTEGER,

    -- Content
    modules JSONB DEFAULT '[]', -- Array of module objects
    prerequisites JSONB DEFAULT '[]',

    -- Outcomes
    learning_objectives JSONB DEFAULT '[]',
    skills_gained JSONB DEFAULT '[]',
    certification_awarded VARCHAR(255),

    -- Status
    is_active BOOLEAN DEFAULT true,
    version VARCHAR(20) DEFAULT '1.0',

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- USER LEARNING PROGRESS TABLE
-- ============================================================================
CREATE TABLE user_learning_progress (
    progress_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    path_id UUID NOT NULL REFERENCES learning_paths(path_id) ON DELETE CASCADE,

    -- Progress
    status VARCHAR(20) DEFAULT 'not_started', -- not_started, in_progress, completed, abandoned
    start_date DATE,
    completion_date DATE,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,

    -- Modules Completed
    modules_completed JSONB DEFAULT '[]',
    current_module VARCHAR(255),

    -- Performance
    quiz_scores JSONB DEFAULT '[]',
    average_quiz_score DECIMAL(5,2),
    time_spent_hours DECIMAL(8,2),

    -- Certification
    certification_earned BOOLEAN DEFAULT false,
    certification_date DATE,
    certification_score DECIMAL(5,2),

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_user_path UNIQUE (user_id, path_id)
);

-- ============================================================================
-- SUCCESS STORIES TABLE
-- ============================================================================
CREATE TABLE success_stories (
    story_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,

    -- Story Details
    story_title VARCHAR(500) NOT NULL,
    story_content TEXT NOT NULL,
    story_category VARCHAR(100), -- productivity_win, innovation, time_savings, quality_improvement

    -- Context
    department VARCHAR(100),
    feature_used VARCHAR(255),
    use_case TEXT,

    -- Impact
    quantifiable_impact JSONB DEFAULT '{}', -- e.g., {"hours_saved": 20, "revenue_generated": 50000}
    qualitative_impact TEXT,

    -- Sharing
    is_public BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    sharing_permissions VARCHAR(20) DEFAULT 'internal', -- internal, public, partner

    -- Media
    images JSONB DEFAULT '[]',
    videos JSONB DEFAULT '[]',
    attachments JSONB DEFAULT '[]',

    -- Engagement
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,

    -- Metadata
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by UUID,
    approval_date TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Users indexes
CREATE INDEX idx_users_org_id ON users(organization_id);
CREATE INDEX idx_users_email ON users(user_email);
CREATE INDEX idx_users_azure_ad_id ON users(azure_ad_id);
CREATE INDEX idx_users_department ON users(department);
CREATE INDEX idx_users_status ON users(status);

-- User Adoption indexes
CREATE INDEX idx_user_adoption_user_id ON user_adoption(user_id);
CREATE INDEX idx_user_adoption_org_id ON user_adoption(organization_id);
CREATE INDEX idx_user_adoption_proficiency ON user_adoption(proficiency_level);
CREATE INDEX idx_user_adoption_champion ON user_adoption(champion_status);
CREATE INDEX idx_user_adoption_at_risk ON user_adoption(at_risk);

-- Feature Usage indexes
CREATE INDEX idx_feature_usage_org_id ON feature_usage(organization_id);
CREATE INDEX idx_feature_usage_feature_id ON feature_usage(feature_id);
CREATE INDEX idx_feature_usage_date ON feature_usage(date);

-- Department Adoption indexes
CREATE INDEX idx_dept_adoption_org_id ON department_adoption(organization_id);
CREATE INDEX idx_dept_adoption_dept ON department_adoption(department);
CREATE INDEX idx_dept_adoption_date ON department_adoption(measurement_date);

-- Interventions indexes
CREATE INDEX idx_interventions_org_id ON adoption_interventions(organization_id);
CREATE INDEX idx_interventions_status ON adoption_interventions(status);
CREATE INDEX idx_interventions_type ON adoption_interventions(intervention_type);

-- Feedback indexes
CREATE INDEX idx_feedback_org_id ON user_feedback(organization_id);
CREATE INDEX idx_feedback_user_id ON user_feedback(user_id);
CREATE INDEX idx_feedback_status ON user_feedback(status);
CREATE INDEX idx_feedback_type ON user_feedback(feedback_type);

-- Events indexes
CREATE INDEX idx_engagement_events_org_id ON engagement_events(organization_id);
CREATE INDEX idx_engagement_events_user_id ON engagement_events(user_id);
CREATE INDEX idx_engagement_events_type ON engagement_events(event_type);
CREATE INDEX idx_engagement_events_timestamp ON engagement_events(event_timestamp);

-- Learning Progress indexes
CREATE INDEX idx_learning_progress_user_id ON user_learning_progress(user_id);
CREATE INDEX idx_learning_progress_path_id ON user_learning_progress(path_id);
CREATE INDEX idx_learning_progress_status ON user_learning_progress(status);

-- ============================================================================
-- VIEWS FOR REPORTING
-- ============================================================================

-- Adoption Overview
CREATE VIEW adoption_overview AS
SELECT
    ua.organization_id,
    o.organization_name,
    COUNT(*) AS total_users,
    COUNT(CASE WHEN ua.copilot_enabled_date IS NOT NULL THEN 1 END) AS enabled_users,
    COUNT(CASE WHEN ua.onboarding_completed THEN 1 END) AS onboarded_users,
    COUNT(CASE WHEN ua.days_active_last_30 > 0 THEN 1 END) AS active_users_30d,
    ROUND(AVG(ua.engagement_score)::numeric, 2) AS avg_engagement_score,
    ROUND(AVG(ua.satisfaction_score)::numeric, 2) AS avg_satisfaction_score,
    COUNT(CASE WHEN ua.champion_status IN ('champion', 'super_champion') THEN 1 END) AS champions_count,
    COUNT(CASE WHEN ua.at_risk THEN 1 END) AS at_risk_users
FROM user_adoption ua
JOIN users u ON ua.user_id = u.user_id
JOIN organizations o ON ua.organization_id = o.organization_id
WHERE u.status = 'active'
GROUP BY ua.organization_id, o.organization_name;

-- Feature Adoption Summary
CREATE VIEW feature_adoption_summary AS
SELECT
    fc.feature_id,
    fc.feature_name,
    fc.application,
    COUNT(DISTINCT fu.organization_id) AS orgs_using,
    AVG(fu.adoption_rate) AS avg_adoption_rate,
    SUM(fu.unique_users) AS total_unique_users,
    SUM(fu.total_uses) AS total_uses,
    AVG(fu.success_rate) AS avg_success_rate,
    AVG(fu.average_rating) AS avg_rating
FROM feature_catalog fc
LEFT JOIN feature_usage fu ON fc.feature_id = fu.feature_id
GROUP BY fc.feature_id, fc.feature_name, fc.application;

-- Department Performance
CREATE VIEW department_performance AS
SELECT
    d.organization_id,
    o.organization_name,
    d.department,
    d.adoption_rate,
    d.average_engagement_score,
    d.champion_count,
    d.experts_count + d.advanced_count AS proficient_users,
    d.measurement_date
FROM department_adoption d
JOIN organizations o ON d.organization_id = o.organization_id
ORDER BY d.measurement_date DESC, d.adoption_rate DESC;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_adoption_updated_at BEFORE UPDATE ON user_adoption
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_catalog_updated_at BEFORE UPDATE ON feature_catalog
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_department_adoption_updated_at BEFORE UPDATE ON department_adoption
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interventions_updated_at BEFORE UPDATE ON adoption_interventions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON user_feedback
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE users IS 'Core user information integrated with Microsoft 365 identity';
COMMENT ON TABLE user_adoption IS 'Comprehensive user adoption tracking and proficiency monitoring';
COMMENT ON TABLE feature_catalog IS 'Catalog of all Microsoft Copilot features across applications';
COMMENT ON TABLE feature_usage IS 'Feature-level usage and adoption metrics';
COMMENT ON TABLE department_adoption IS 'Department-level adoption and performance metrics';
COMMENT ON TABLE adoption_interventions IS 'Targeted interventions to improve adoption and engagement';
COMMENT ON TABLE user_feedback IS 'User feedback, feature requests, and issue tracking';
COMMENT ON TABLE engagement_events IS 'Detailed user engagement event tracking for analytics';
COMMENT ON TABLE learning_paths IS 'Structured learning paths for user training';
COMMENT ON TABLE user_learning_progress IS 'Individual user progress through learning paths';
COMMENT ON TABLE success_stories IS 'User success stories and best practices sharing';
