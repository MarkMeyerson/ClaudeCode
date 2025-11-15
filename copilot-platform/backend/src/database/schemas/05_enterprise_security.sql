-- ============================================================================
-- ENTERPRISE SECURITY & COMPLIANCE DATABASE SCHEMA
-- Microsoft Copilot Onboarding & ROI Platform - Enterprise Edition
-- ============================================================================

-- ============================================================================
-- SECURITY POLICIES TABLE
-- ============================================================================
CREATE TABLE security_policies (
    policy_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,
    policy_name VARCHAR(255) NOT NULL,
    policy_type VARCHAR(50) NOT NULL, -- password, mfa, session, access, data

    -- Password Policy
    password_min_length INTEGER DEFAULT 12,
    password_require_uppercase BOOLEAN DEFAULT true,
    password_require_lowercase BOOLEAN DEFAULT true,
    password_require_numbers BOOLEAN DEFAULT true,
    password_require_special BOOLEAN DEFAULT true,
    password_expiry_days INTEGER DEFAULT 90,
    password_history_count INTEGER DEFAULT 10,
    password_complexity_score INTEGER DEFAULT 3, -- 1-5

    -- MFA Policy
    mfa_required BOOLEAN DEFAULT true,
    mfa_methods JSONB DEFAULT '["totp", "sms", "email"]',
    mfa_grace_period_hours INTEGER DEFAULT 24,
    mfa_remember_device_days INTEGER DEFAULT 30,

    -- Session Policy
    session_timeout_minutes INTEGER DEFAULT 60,
    session_idle_timeout_minutes INTEGER DEFAULT 15,
    session_absolute_timeout_hours INTEGER DEFAULT 12,
    concurrent_sessions_allowed INTEGER DEFAULT 3,

    -- Access Control
    ip_whitelist INET[],
    ip_blacklist INET[],
    geo_restrictions JSONB DEFAULT '{}', -- {"allowed_countries": [], "blocked_countries": []}
    impossible_travel_detection BOOLEAN DEFAULT true,
    impossible_travel_threshold_km INTEGER DEFAULT 500,

    -- Risk-Based Authentication
    risk_based_auth_enabled BOOLEAN DEFAULT true,
    low_risk_score_threshold DECIMAL(3,2) DEFAULT 0.30,
    medium_risk_score_threshold DECIMAL(3,2) DEFAULT 0.60,
    high_risk_score_threshold DECIMAL(3,2) DEFAULT 0.85,

    -- Device Trust
    require_device_registration BOOLEAN DEFAULT false,
    device_trust_period_days INTEGER DEFAULT 30,
    max_trusted_devices INTEGER DEFAULT 5,

    -- Compliance
    compliance_frameworks JSONB DEFAULT '[]', -- ["SOC2", "ISO27001", "GDPR"]
    audit_log_retention_days INTEGER DEFAULT 2555, -- 7 years

    -- Status
    is_active BOOLEAN DEFAULT true,
    enforced_from TIMESTAMP,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,

    CONSTRAINT unique_policy_per_org UNIQUE (organization_id, policy_type)
);

-- ============================================================================
-- SECURITY EVENTS TABLE
-- ============================================================================
CREATE TABLE security_events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(organization_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,

    -- Event Details
    event_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    event_type VARCHAR(100) NOT NULL, -- login, logout, failed_login, mfa_challenge, password_change, etc.
    event_category VARCHAR(50) NOT NULL, -- authentication, authorization, data_access, configuration
    severity VARCHAR(20) NOT NULL, -- info, low, medium, high, critical

    -- Request Context
    ip_address INET,
    user_agent TEXT,
    device_id VARCHAR(255),
    session_id VARCHAR(255),
    request_id VARCHAR(255),

    -- Location
    geo_location JSONB, -- {"country": "", "city": "", "lat": 0, "lon": 0}
    asn INTEGER,
    asn_organization VARCHAR(255),

    -- Risk Assessment
    risk_score DECIMAL(3,2), -- 0.00 - 1.00
    risk_factors JSONB, -- Array of risk indicators
    risk_level VARCHAR(20), -- low, medium, high, critical

    -- Action Taken
    action_taken VARCHAR(50), -- allowed, blocked, challenged, flagged
    blocked BOOLEAN DEFAULT false,
    requires_review BOOLEAN DEFAULT false,
    reviewed BOOLEAN DEFAULT false,
    reviewed_by UUID,
    reviewed_at TIMESTAMP,

    -- Details
    event_details JSONB,
    error_message TEXT,

    -- Compliance
    compliance_relevant BOOLEAN DEFAULT false,
    compliance_frameworks JSONB DEFAULT '[]',

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Indexes for performance
    CONSTRAINT chk_risk_score CHECK (risk_score >= 0 AND risk_score <= 1)
);

CREATE INDEX idx_security_events_timestamp ON security_events(event_timestamp DESC);
CREATE INDEX idx_security_events_org_id ON security_events(organization_id);
CREATE INDEX idx_security_events_user_id ON security_events(user_id);
CREATE INDEX idx_security_events_type ON security_events(event_type);
CREATE INDEX idx_security_events_severity ON security_events(severity);
CREATE INDEX idx_security_events_blocked ON security_events(blocked);
CREATE INDEX idx_security_events_risk_score ON security_events(risk_score DESC);

-- ============================================================================
-- ENCRYPTION KEYS TABLE
-- ============================================================================
CREATE TABLE encryption_keys (
    key_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(organization_id) ON DELETE CASCADE,

    -- Key Details
    key_name VARCHAR(255) NOT NULL,
    key_type VARCHAR(50) NOT NULL, -- aes256, rsa2048, rsa4096, ed25519
    key_purpose VARCHAR(100) NOT NULL, -- data_encryption, token_signing, api_key, webhook

    -- Key Material (encrypted at rest)
    encrypted_key_value BYTEA NOT NULL,
    key_derivation_function VARCHAR(50), -- pbkdf2, scrypt, argon2
    encryption_algorithm VARCHAR(50), -- aes-256-gcm

    -- Key Management
    key_version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    is_primary BOOLEAN DEFAULT false,

    -- Rotation
    rotation_policy VARCHAR(50), -- manual, automatic, compliance_driven
    rotation_schedule INTERVAL, -- e.g., '90 days'
    last_rotated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    next_rotation_due TIMESTAMP,
    rotation_count INTEGER DEFAULT 0,

    -- Lifecycle
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activated_at TIMESTAMP,
    deactivated_at TIMESTAMP,
    expires_at TIMESTAMP,

    -- Compliance
    compliance_requirements JSONB DEFAULT '[]',

    -- Audit
    created_by UUID,
    last_modified_by UUID,

    CONSTRAINT unique_primary_key_per_purpose UNIQUE (organization_id, key_purpose, is_primary) WHERE is_primary = true
);

-- ============================================================================
-- USER AUTHENTICATION TABLE
-- ============================================================================
CREATE TABLE user_authentication (
    auth_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,

    -- Password
    password_hash VARCHAR(255),
    password_algorithm VARCHAR(50) DEFAULT 'bcrypt',
    password_last_changed TIMESTAMP,
    password_must_change BOOLEAN DEFAULT false,
    password_expires_at TIMESTAMP,
    password_history JSONB DEFAULT '[]', -- Last 10 password hashes

    -- MFA Configuration
    mfa_enabled BOOLEAN DEFAULT false,
    mfa_enforced BOOLEAN DEFAULT false,
    mfa_methods JSONB DEFAULT '[]', -- [{"type": "totp", "secret": "...", "verified": true}]
    mfa_backup_codes JSONB DEFAULT '[]', -- Encrypted backup codes

    -- Account Status
    account_locked BOOLEAN DEFAULT false,
    lock_reason VARCHAR(255),
    locked_at TIMESTAMP,
    locked_until TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    last_failed_login TIMESTAMP,

    -- Login History
    last_login TIMESTAMP,
    last_login_ip INET,
    last_successful_login TIMESTAMP,
    total_login_count INTEGER DEFAULT 0,

    -- Password Reset
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP,
    reset_requested_at TIMESTAMP,

    -- Email Verification
    email_verified BOOLEAN DEFAULT false,
    email_verification_token VARCHAR(255),
    email_verified_at TIMESTAMP,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_user_auth UNIQUE (user_id)
);

-- ============================================================================
-- TRUSTED DEVICES TABLE
-- ============================================================================
CREATE TABLE trusted_devices (
    device_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,

    -- Device Details
    device_fingerprint VARCHAR(255) NOT NULL UNIQUE,
    device_name VARCHAR(255),
    device_type VARCHAR(50), -- desktop, mobile, tablet
    operating_system VARCHAR(100),
    browser VARCHAR(100),

    -- Trust Status
    is_trusted BOOLEAN DEFAULT true,
    trust_level VARCHAR(20) DEFAULT 'medium', -- low, medium, high
    trust_score DECIMAL(3,2),

    -- First Seen
    first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    first_seen_ip INET,
    first_seen_location JSONB,

    -- Last Activity
    last_used TIMESTAMP,
    last_used_ip INET,
    last_used_location JSONB,
    total_uses INTEGER DEFAULT 1,

    -- Expiration
    trusted_until TIMESTAMP,
    auto_renew BOOLEAN DEFAULT true,

    -- Revocation
    revoked BOOLEAN DEFAULT false,
    revoked_at TIMESTAMP,
    revoked_by UUID,
    revoke_reason TEXT,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trusted_devices_user_id ON trusted_devices(user_id);
CREATE INDEX idx_trusted_devices_fingerprint ON trusted_devices(device_fingerprint);

-- ============================================================================
-- API KEYS TABLE
-- ============================================================================
CREATE TABLE api_keys (
    api_key_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,

    -- Key Details
    key_name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL UNIQUE, -- Hash of the actual API key
    key_prefix VARCHAR(20) NOT NULL, -- First few chars for identification

    -- Permissions
    scopes JSONB DEFAULT '[]', -- ["read:users", "write:roi", "admin:all"]
    ip_whitelist INET[],
    allowed_endpoints JSONB DEFAULT '[]',
    rate_limit_per_minute INTEGER DEFAULT 60,
    rate_limit_per_hour INTEGER DEFAULT 1000,

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Usage
    last_used TIMESTAMP,
    last_used_ip INET,
    total_requests INTEGER DEFAULT 0,

    -- Expiration
    expires_at TIMESTAMP,
    auto_rotate BOOLEAN DEFAULT false,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    revoked_at TIMESTAMP,
    revoked_by UUID
);

CREATE INDEX idx_api_keys_org_id ON api_keys(organization_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_active ON api_keys(is_active) WHERE is_active = true;

-- ============================================================================
-- RATE LIMITING TABLE
-- ============================================================================
CREATE TABLE rate_limits (
    limit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Target
    identifier_type VARCHAR(50) NOT NULL, -- ip, user, api_key, organization
    identifier_value VARCHAR(255) NOT NULL,

    -- Limit Configuration
    endpoint_pattern VARCHAR(500), -- NULL for global limits
    limit_window INTERVAL NOT NULL, -- '1 minute', '1 hour', '1 day'
    max_requests INTEGER NOT NULL,

    -- Current State
    request_count INTEGER DEFAULT 0,
    window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    window_end TIMESTAMP,

    -- Actions
    throttled BOOLEAN DEFAULT false,
    throttled_until TIMESTAMP,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_rate_limit UNIQUE (identifier_type, identifier_value, endpoint_pattern, window_start)
);

CREATE INDEX idx_rate_limits_identifier ON rate_limits(identifier_type, identifier_value);
CREATE INDEX idx_rate_limits_window ON rate_limits(window_end);

-- ============================================================================
-- AUDIT LOG TABLE (Comprehensive)
-- ============================================================================
CREATE TABLE audit_log (
    audit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(organization_id) ON DELETE CASCADE,

    -- Actor
    actor_type VARCHAR(50) NOT NULL, -- user, system, api_key, service
    actor_id UUID,
    actor_email VARCHAR(255),
    actor_ip INET,

    -- Action
    action_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    action_type VARCHAR(100) NOT NULL, -- create, read, update, delete, execute
    action_category VARCHAR(50) NOT NULL, -- data, configuration, security, compliance
    action_name VARCHAR(255) NOT NULL,
    action_result VARCHAR(20) NOT NULL, -- success, failure, partial

    -- Target
    target_type VARCHAR(100), -- user, organization, content, report
    target_id UUID,
    target_name VARCHAR(255),

    -- Changes
    before_state JSONB,
    after_state JSONB,
    changes JSONB, -- Detailed field-by-field changes

    -- Context
    request_id VARCHAR(255),
    session_id VARCHAR(255),
    user_agent TEXT,

    -- Compliance
    compliance_event BOOLEAN DEFAULT false,
    compliance_frameworks JSONB DEFAULT '[]',
    retention_period INTERVAL DEFAULT '7 years',

    -- Details
    description TEXT,
    metadata JSONB DEFAULT '{}',

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_log_timestamp ON audit_log(action_timestamp DESC);
CREATE INDEX idx_audit_log_org_id ON audit_log(organization_id);
CREATE INDEX idx_audit_log_actor ON audit_log(actor_type, actor_id);
CREATE INDEX idx_audit_log_target ON audit_log(target_type, target_id);
CREATE INDEX idx_audit_log_action ON audit_log(action_type, action_category);
CREATE INDEX idx_audit_log_compliance ON audit_log(compliance_event) WHERE compliance_event = true;

-- ============================================================================
-- DATA CLASSIFICATION TABLE
-- ============================================================================
CREATE TABLE data_classification (
    classification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,

    -- Classification
    data_type VARCHAR(100) NOT NULL, -- personal, financial, health, proprietary, public
    classification_level VARCHAR(50) NOT NULL, -- public, internal, confidential, restricted

    -- Table/Column
    table_name VARCHAR(255),
    column_name VARCHAR(255),

    -- Protection Requirements
    encryption_required BOOLEAN DEFAULT false,
    masking_required BOOLEAN DEFAULT false,
    access_logging_required BOOLEAN DEFAULT true,

    -- Compliance
    compliance_frameworks JSONB DEFAULT '[]',
    regulatory_requirements JSONB DEFAULT '[]',

    -- Retention
    retention_period INTERVAL,
    deletion_method VARCHAR(50), -- soft_delete, hard_delete, anonymize

    -- Access Control
    allowed_roles JSONB DEFAULT '[]',
    requires_approval BOOLEAN DEFAULT false,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- CONSENT MANAGEMENT TABLE
-- ============================================================================
CREATE TABLE user_consent (
    consent_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,

    -- Consent Type
    consent_type VARCHAR(100) NOT NULL, -- data_processing, marketing, analytics, third_party
    consent_purpose TEXT NOT NULL,

    -- Status
    consent_given BOOLEAN NOT NULL,
    consent_method VARCHAR(50), -- explicit, implicit, opt_in, opt_out

    -- Timestamps
    consent_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiry_date TIMESTAMP,

    -- Withdrawal
    withdrawn BOOLEAN DEFAULT false,
    withdrawn_date TIMESTAMP,
    withdrawal_method VARCHAR(50),

    -- Context
    consent_ip INET,
    consent_user_agent TEXT,
    consent_version VARCHAR(50), -- Version of privacy policy

    -- Compliance
    gdpr_compliant BOOLEAN DEFAULT true,
    ccpa_compliant BOOLEAN DEFAULT true,
    legal_basis VARCHAR(100), -- consent, contract, legitimate_interest

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_consent_user_id ON user_consent(user_id);
CREATE INDEX idx_user_consent_type ON user_consent(consent_type);

-- ============================================================================
-- DATA RETENTION POLICIES TABLE
-- ============================================================================
CREATE TABLE data_retention_policies (
    policy_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,

    -- Policy Details
    policy_name VARCHAR(255) NOT NULL,
    data_category VARCHAR(100) NOT NULL,

    -- Retention Rules
    retention_period INTERVAL NOT NULL,
    retention_start_event VARCHAR(100), -- creation, last_modified, last_accessed

    -- Deletion Rules
    auto_delete BOOLEAN DEFAULT false,
    deletion_method VARCHAR(50), -- hard_delete, soft_delete, anonymize, archive
    notification_before_days INTEGER DEFAULT 30,

    -- Exceptions
    legal_hold_exempt BOOLEAN DEFAULT false,
    minimum_retention_period INTERVAL,

    -- Compliance
    regulatory_requirement VARCHAR(255),
    compliance_frameworks JSONB DEFAULT '[]',

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

-- ============================================================================
-- COMPLIANCE CERTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE compliance_certifications (
    certification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,

    -- Certification Details
    framework_name VARCHAR(100) NOT NULL, -- SOC2, ISO27001, GDPR, HIPAA
    certification_type VARCHAR(50), -- Type_I, Type_II

    -- Status
    status VARCHAR(50) NOT NULL, -- in_progress, certified, expired, suspended

    -- Dates
    assessment_start_date DATE,
    certification_date DATE,
    expiry_date DATE,
    next_audit_date DATE,

    -- Auditor
    auditor_name VARCHAR(255),
    audit_report_url VARCHAR(500),

    -- Scope
    scope_description TEXT,
    controls_assessed JSONB DEFAULT '[]',

    -- Results
    findings JSONB DEFAULT '[]',
    remediation_status JSONB DEFAULT '{}',

    -- Documents
    certificate_url VARCHAR(500),
    report_url VARCHAR(500),

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SECURITY INCIDENTS TABLE
-- ============================================================================
CREATE TABLE security_incidents (
    incident_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,

    -- Incident Details
    incident_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,

    -- Classification
    incident_type VARCHAR(100) NOT NULL, -- data_breach, unauthorized_access, malware, phishing
    severity VARCHAR(20) NOT NULL, -- low, medium, high, critical
    impact_level VARCHAR(20) NOT NULL, -- minor, moderate, major, severe

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'open', -- open, investigating, contained, resolved, closed

    -- Timeline
    detected_at TIMESTAMP NOT NULL,
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP,
    contained_at TIMESTAMP,
    resolved_at TIMESTAMP,
    closed_at TIMESTAMP,

    -- Assignment
    assigned_to UUID,
    incident_team JSONB DEFAULT '[]',

    -- Impact Assessment
    affected_users INTEGER DEFAULT 0,
    affected_records INTEGER DEFAULT 0,
    data_types_affected JSONB DEFAULT '[]',
    systems_affected JSONB DEFAULT '[]',

    -- Response
    containment_actions JSONB DEFAULT '[]',
    remediation_actions JSONB DEFAULT '[]',
    lessons_learned TEXT,

    -- Notifications
    regulatory_notification_required BOOLEAN DEFAULT false,
    regulatory_notifications JSONB DEFAULT '[]',
    user_notification_required BOOLEAN DEFAULT false,
    users_notified_at TIMESTAMP,

    -- Compliance
    gdpr_breach BOOLEAN DEFAULT false,
    hipaa_breach BOOLEAN DEFAULT false,
    reportable_breach BOOLEAN DEFAULT false,

    -- Root Cause
    root_cause TEXT,
    contributing_factors JSONB DEFAULT '[]',

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

CREATE INDEX idx_security_incidents_org_id ON security_incidents(organization_id);
CREATE INDEX idx_security_incidents_status ON security_incidents(status);
CREATE INDEX idx_security_incidents_severity ON security_incidents(severity);
CREATE INDEX idx_security_incidents_detected ON security_incidents(detected_at DESC);

-- ============================================================================
-- TRIGGERS FOR AUTO-UPDATE
-- ============================================================================

CREATE TRIGGER update_security_policies_updated_at BEFORE UPDATE ON security_policies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_authentication_updated_at BEFORE UPDATE ON user_authentication
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trusted_devices_updated_at BEFORE UPDATE ON trusted_devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rate_limits_updated_at BEFORE UPDATE ON rate_limits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS FOR SECURITY MONITORING
-- ============================================================================

CREATE VIEW security_dashboard AS
SELECT
    o.organization_id,
    o.organization_name,
    COUNT(DISTINCT CASE WHEN se.severity = 'critical' AND se.event_timestamp > NOW() - INTERVAL '24 hours' THEN se.event_id END) as critical_events_24h,
    COUNT(DISTINCT CASE WHEN se.blocked = true AND se.event_timestamp > NOW() - INTERVAL '24 hours' THEN se.event_id END) as blocked_events_24h,
    COUNT(DISTINCT CASE WHEN si.status = 'open' THEN si.incident_id END) as open_incidents,
    COUNT(DISTINCT CASE WHEN ua.account_locked = true THEN ua.user_id END) as locked_accounts,
    AVG(se.risk_score) as avg_risk_score_24h
FROM organizations o
LEFT JOIN security_events se ON o.organization_id = se.organization_id AND se.event_timestamp > NOW() - INTERVAL '24 hours'
LEFT JOIN security_incidents si ON o.organization_id = si.organization_id
LEFT JOIN user_authentication ua ON ua.user_id IN (SELECT user_id FROM users WHERE organization_id = o.organization_id)
GROUP BY o.organization_id, o.organization_name;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE security_policies IS 'Organization security policies including password, MFA, session, and access controls';
COMMENT ON TABLE security_events IS 'Comprehensive security event logging for threat detection and compliance';
COMMENT ON TABLE encryption_keys IS 'Encrypted key management with rotation policies';
COMMENT ON TABLE user_authentication IS 'User authentication details including password and MFA configuration';
COMMENT ON TABLE trusted_devices IS 'Trusted device registry for enhanced security';
COMMENT ON TABLE api_keys IS 'API key management with scoping and rate limiting';
COMMENT ON TABLE audit_log IS 'Comprehensive audit trail for all system actions';
COMMENT ON TABLE data_classification IS 'Data classification and protection requirements';
COMMENT ON TABLE user_consent IS 'GDPR/CCPA compliant consent management';
COMMENT ON TABLE data_retention_policies IS 'Automated data retention and deletion policies';
COMMENT ON TABLE compliance_certifications IS 'Track compliance certifications and audit results';
COMMENT ON TABLE security_incidents IS 'Security incident management and breach tracking';
