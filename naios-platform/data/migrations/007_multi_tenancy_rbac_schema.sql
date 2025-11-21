-- ============================================================================
-- NAIOS Platform - Multi-Tenancy & Enhanced RBAC Schema
-- Version: 2.0.0
-- Description: Enterprise-grade multi-tenant foundation with comprehensive RBAC
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ============================================================================
-- TENANTS (Organizations using the SaaS platform)
-- ============================================================================
CREATE TABLE tenants (
    tenant_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL, -- For subdomain/URL

    -- Subscription & billing
    subscription_tier VARCHAR(50) NOT NULL CHECK (subscription_tier IN (
        'Free', 'Starter', 'Professional', 'Enterprise', 'Custom'
    )),
    subscription_status VARCHAR(50) DEFAULT 'Active' CHECK (subscription_status IN (
        'Trial', 'Active', 'Past Due', 'Canceled', 'Suspended'
    )),
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    subscription_starts_at TIMESTAMP WITH TIME ZONE,
    subscription_ends_at TIMESTAMP WITH TIME ZONE,

    monthly_fee DECIMAL(10, 2),
    billing_email VARCHAR(255),
    billing_contact_name VARCHAR(255),

    -- Limits based on subscription tier
    max_users INTEGER DEFAULT 5,
    max_storage_gb INTEGER DEFAULT 10,
    max_monthly_emails INTEGER DEFAULT 1000,
    max_active_campaigns INTEGER DEFAULT 5,

    -- Features enabled
    features_enabled JSONB DEFAULT '[]'::jsonb,

    -- Organization details
    ein VARCHAR(20),
    organization_type VARCHAR(100),
    founded_year INTEGER,
    website VARCHAR(500),

    -- Contact information
    primary_contact_name VARCHAR(255),
    primary_contact_email VARCHAR(255) NOT NULL,
    primary_contact_phone VARCHAR(20),

    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip VARCHAR(20),
    country VARCHAR(100) DEFAULT 'USA',

    -- Branding
    logo_url VARCHAR(500),
    primary_color VARCHAR(7), -- Hex color
    secondary_color VARCHAR(7),
    custom_domain VARCHAR(255),

    -- Settings
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    locale VARCHAR(10) DEFAULT 'en-US',
    currency VARCHAR(3) DEFAULT 'USD',
    fiscal_year_end VARCHAR(5) DEFAULT '12-31',

    -- Security settings
    require_2fa BOOLEAN DEFAULT FALSE,
    password_expiry_days INTEGER DEFAULT 90,
    session_timeout_minutes INTEGER DEFAULT 480,
    allowed_ip_addresses TEXT[],
    sso_enabled BOOLEAN DEFAULT FALSE,
    sso_provider VARCHAR(50),
    sso_config JSONB,

    -- Compliance
    gdpr_compliant BOOLEAN DEFAULT TRUE,
    ccpa_compliant BOOLEAN DEFAULT TRUE,
    hipaa_compliant BOOLEAN DEFAULT FALSE,
    data_residency VARCHAR(50),

    -- Usage tracking
    current_users_count INTEGER DEFAULT 0,
    current_storage_gb DECIMAL(10, 2) DEFAULT 0,
    monthly_emails_sent INTEGER DEFAULT 0,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    onboarding_step VARCHAR(50),

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,

    custom_fields JSONB DEFAULT '{}'::jsonb,
    notes TEXT
);

CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_subscription_status ON tenants(subscription_status);
CREATE INDEX idx_tenants_subscription_tier ON tenants(subscription_tier);
CREATE INDEX idx_tenants_is_active ON tenants(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- USERS (Platform users across all tenants)
-- ============================================================================
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,

    -- Authentication
    email VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    password_hash VARCHAR(255) NOT NULL,
    password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    must_change_password BOOLEAN DEFAULT FALSE,

    -- Two-factor authentication
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    two_factor_backup_codes TEXT[],

    -- Personal information
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    full_name VARCHAR(255) GENERATED ALWAYS AS (
        COALESCE(first_name || ' ' || last_name, email)
    ) STORED,
    display_name VARCHAR(255),
    title VARCHAR(100),
    department VARCHAR(100),

    -- Contact
    phone VARCHAR(20),
    mobile VARCHAR(20),

    -- Avatar
    avatar_url VARCHAR(500),

    -- Preferences
    timezone VARCHAR(50),
    locale VARCHAR(10),
    theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    notification_preferences JSONB DEFAULT '{}'::jsonb,

    -- Status
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN (
        'Active', 'Inactive', 'Suspended', 'Locked', 'Pending'
    )),

    -- Login tracking
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_login_ip VARCHAR(50),
    login_count INTEGER DEFAULT 0,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,

    -- Session
    current_session_id VARCHAR(255),

    -- API access
    api_key VARCHAR(255) UNIQUE,
    api_key_created_at TIMESTAMP WITH TIME ZONE,
    api_rate_limit INTEGER DEFAULT 1000, -- Per hour

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    invited_by UUID,

    custom_fields JSONB DEFAULT '{}'::jsonb,
    notes TEXT,

    UNIQUE(tenant_id, email)
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_api_key ON users(api_key) WHERE api_key IS NOT NULL;

-- ============================================================================
-- ROLES (Flexible role definitions)
-- ============================================================================
CREATE TABLE roles (
    role_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(tenant_id) ON DELETE CASCADE,

    role_name VARCHAR(100) NOT NULL,
    role_slug VARCHAR(100) NOT NULL,
    description TEXT,

    -- Role type
    is_system_role BOOLEAN DEFAULT FALSE, -- System roles can't be deleted
    is_default_role BOOLEAN DEFAULT FALSE, -- Assigned to new users

    -- Hierarchy
    parent_role_id UUID REFERENCES roles(role_id),
    level INTEGER DEFAULT 0, -- For hierarchy visualization

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,

    UNIQUE(tenant_id, role_slug),
    UNIQUE(tenant_id, role_name)
);

CREATE INDEX idx_roles_tenant ON roles(tenant_id);
CREATE INDEX idx_roles_is_system ON roles(is_system_role);

-- ============================================================================
-- PERMISSIONS (Granular permission definitions)
-- ============================================================================
CREATE TABLE permissions (
    permission_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    permission_name VARCHAR(100) NOT NULL UNIQUE,
    permission_slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,

    -- Grouping
    resource VARCHAR(100) NOT NULL, -- e.g., 'donors', 'grants', 'volunteers'
    action VARCHAR(50) NOT NULL, -- e.g., 'view', 'create', 'update', 'delete', 'export'

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_permissions_resource ON permissions(resource);
CREATE INDEX idx_permissions_action ON permissions(action);

-- ============================================================================
-- ROLE_PERMISSIONS (Many-to-many relationship)
-- ============================================================================
CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(permission_id) ON DELETE CASCADE,

    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    granted_by UUID,

    PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);

-- ============================================================================
-- USER_ROLES (Many-to-many relationship)
-- ============================================================================
CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,

    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID,
    expires_at TIMESTAMP WITH TIME ZONE,

    PRIMARY KEY (user_id, role_id)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);
CREATE INDEX idx_user_roles_expires ON user_roles(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================================================
-- USER_PERMISSIONS (Direct user permissions - overrides)
-- ============================================================================
CREATE TABLE user_permissions (
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(permission_id) ON DELETE CASCADE,

    granted BOOLEAN DEFAULT TRUE, -- FALSE = explicitly denied
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    granted_by UUID,
    expires_at TIMESTAMP WITH TIME ZONE,
    reason TEXT,

    PRIMARY KEY (user_id, permission_id)
);

CREATE INDEX idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX idx_user_permissions_permission ON user_permissions(permission_id);

-- ============================================================================
-- AUDIT_LOG (Comprehensive audit trail)
-- ============================================================================
CREATE TABLE audit_log (
    audit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,

    -- Action details
    action VARCHAR(100) NOT NULL, -- e.g., 'user.login', 'donor.create', 'grant.delete'
    resource_type VARCHAR(100), -- e.g., 'donor', 'grant', 'user'
    resource_id UUID,

    -- Request details
    ip_address VARCHAR(50),
    user_agent TEXT,
    request_method VARCHAR(10),
    request_path VARCHAR(500),

    -- Changes
    old_values JSONB,
    new_values JSONB,
    changes JSONB,

    -- Status
    status VARCHAR(50), -- 'success', 'failure', 'error'
    error_message TEXT,

    -- Metadata
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    duration_ms INTEGER,

    additional_data JSONB
);

CREATE INDEX idx_audit_log_tenant ON audit_log(tenant_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp DESC);
CREATE INDEX idx_audit_log_resource ON audit_log(resource_type, resource_id);

-- ============================================================================
-- SESSIONS (User session tracking)
-- ============================================================================
CREATE TABLE sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,

    -- Session details
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    refresh_token_hash VARCHAR(255) UNIQUE,

    -- Device/browser
    ip_address VARCHAR(50),
    user_agent TEXT,
    device_type VARCHAR(50),
    browser VARCHAR(100),
    os VARCHAR(100),
    location_city VARCHAR(100),
    location_country VARCHAR(100),

    -- Timing
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_reason TEXT
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token_hash);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
CREATE INDEX idx_sessions_active ON sessions(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- INVITATIONS (User invitations)
-- ============================================================================
CREATE TABLE invitations (
    invitation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,

    email VARCHAR(255) NOT NULL,
    role_id UUID REFERENCES roles(role_id),

    -- Invitation details
    invitation_token VARCHAR(255) UNIQUE NOT NULL,
    invited_by UUID REFERENCES users(user_id),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Status
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN (
        'Pending', 'Accepted', 'Expired', 'Revoked'
    )),
    accepted_at TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE,

    -- Message
    personal_message TEXT,

    UNIQUE(tenant_id, email, status) WHERE status = 'Pending'
);

CREATE INDEX idx_invitations_tenant ON invitations(tenant_id);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_token ON invitations(invitation_token);
CREATE INDEX idx_invitations_status ON invitations(status);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- DEFAULT PERMISSIONS
-- ============================================================================

-- Donor Management
INSERT INTO permissions (permission_name, permission_slug, resource, action, description) VALUES
('View Donors', 'donors.view', 'donors', 'view', 'View donor profiles and donation history'),
('Create Donors', 'donors.create', 'donors', 'create', 'Create new donor records'),
('Update Donors', 'donors.update', 'donors', 'update', 'Update existing donor information'),
('Delete Donors', 'donors.delete', 'donors', 'delete', 'Delete donor records'),
('Export Donors', 'donors.export', 'donors', 'export', 'Export donor data'),
('Import Donors', 'donors.import', 'donors', 'import', 'Import donor data'),
('Run Wealth Screening', 'donors.wealth_screening', 'donors', 'wealth_screening', 'Run wealth screening on donors');

-- Grants
INSERT INTO permissions (permission_name, permission_slug, resource, action, description) VALUES
('View Grants', 'grants.view', 'grants', 'view', 'View grant opportunities and applications'),
('Create Grants', 'grants.create', 'grants', 'create', 'Create new grant applications'),
('Update Grants', 'grants.update', 'grants', 'update', 'Update grant applications'),
('Delete Grants', 'grants.delete', 'grants', 'delete', 'Delete grant applications'),
('Submit Grants', 'grants.submit', 'grants', 'submit', 'Submit grant applications'),
('Use AI Assistant', 'grants.ai_assistant', 'grants', 'ai_assistant', 'Use AI-powered grant writing assistant');

-- Volunteers
INSERT INTO permissions (permission_name, permission_slug, resource, action, description) VALUES
('View Volunteers', 'volunteers.view', 'volunteers', 'view', 'View volunteer profiles and hours'),
('Create Volunteers', 'volunteers.create', 'volunteers', 'create', 'Create new volunteer records'),
('Update Volunteers', 'volunteers.update', 'volunteers', 'update', 'Update volunteer information'),
('Delete Volunteers', 'volunteers.delete', 'volunteers', 'delete', 'Delete volunteer records'),
('Manage Schedule', 'volunteers.schedule', 'volunteers', 'schedule', 'Manage volunteer schedules'),
('Approve Hours', 'volunteers.approve_hours', 'volunteers', 'approve_hours', 'Approve volunteer hour logs');

-- Financial
INSERT INTO permissions (permission_name, permission_slug, resource, action, description) VALUES
('View Financials', 'financials.view', 'financials', 'view', 'View financial data and reports'),
('Manage Transactions', 'financials.manage', 'financials', 'manage', 'Create and manage transactions'),
('Generate Form 990', 'financials.form_990', 'financials', 'form_990', 'Generate Form 990 reports'),
('QuickBooks Sync', 'financials.quickbooks_sync', 'financials', 'quickbooks_sync', 'Sync with QuickBooks');

-- Programs & Impact
INSERT INTO permissions (permission_name, permission_slug, resource, action, description) VALUES
('View Programs', 'programs.view', 'programs', 'view', 'View programs and impact data'),
('Manage Programs', 'programs.manage', 'programs', 'manage', 'Create and manage programs'),
('Track Outcomes', 'programs.outcomes', 'programs', 'outcomes', 'Track program outcomes'),
('Generate Impact Reports', 'programs.reports', 'programs', 'reports', 'Generate impact reports');

-- Board Governance
INSERT INTO permissions (permission_name, permission_slug, resource, action, description) VALUES
('View Board Portal', 'board.view', 'board', 'view', 'Access board governance portal'),
('Manage Meetings', 'board.meetings', 'board', 'meetings', 'Manage board meetings'),
('Manage Documents', 'board.documents', 'board', 'documents', 'Manage board documents'),
('View Minutes', 'board.minutes', 'board', 'minutes', 'View meeting minutes');

-- Events
INSERT INTO permissions (permission_name, permission_slug, resource, action, description) VALUES
('View Events', 'events.view', 'events', 'view', 'View events'),
('Manage Events', 'events.manage', 'events', 'manage', 'Create and manage events'),
('Manage Registrations', 'events.registrations', 'events', 'registrations', 'Manage event registrations'),
('Process Payments', 'events.payments', 'events', 'payments', 'Process event payments');

-- Email Marketing
INSERT INTO permissions (permission_name, permission_slug, resource, action, description) VALUES
('View Campaigns', 'email.view', 'email', 'view', 'View email campaigns'),
('Create Campaigns', 'email.create', 'email', 'create', 'Create email campaigns'),
('Send Campaigns', 'email.send', 'email', 'send', 'Send email campaigns'),
('View Analytics', 'email.analytics', 'email', 'analytics', 'View email analytics');

-- Reports
INSERT INTO permissions (permission_name, permission_slug, resource, action, description) VALUES
('View Reports', 'reports.view', 'reports', 'view', 'View reports and dashboards'),
('Create Custom Reports', 'reports.create', 'reports', 'create', 'Create custom reports'),
('Export Reports', 'reports.export', 'reports', 'export', 'Export report data');

-- Users & Settings
INSERT INTO permissions (permission_name, permission_slug, resource, action, description) VALUES
('View Users', 'users.view', 'users', 'view', 'View user list'),
('Manage Users', 'users.manage', 'users', 'manage', 'Create and manage users'),
('Manage Roles', 'roles.manage', 'roles', 'manage', 'Manage roles and permissions'),
('View Settings', 'settings.view', 'settings', 'view', 'View organization settings'),
('Manage Settings', 'settings.manage', 'settings', 'manage', 'Manage organization settings'),
('View Audit Log', 'audit.view', 'audit', 'view', 'View audit log');

-- ============================================================================
-- END OF MULTI-TENANCY & RBAC SCHEMA
-- ============================================================================
