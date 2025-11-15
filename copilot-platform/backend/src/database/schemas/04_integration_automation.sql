-- ============================================================================
-- PHASE 7: INTEGRATION & AUTOMATION DATABASE SCHEMA
-- Microsoft Copilot Onboarding & ROI Platform
-- ============================================================================

-- ============================================================================
-- MICROSOFT TENANTS TABLE
-- ============================================================================
CREATE TABLE microsoft_tenants (
    tenant_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,

    -- Microsoft Tenant Details
    m365_tenant_id VARCHAR(255) NOT NULL UNIQUE,
    tenant_name VARCHAR(255) NOT NULL,
    tenant_display_name VARCHAR(255),

    -- Configuration
    primary_domain VARCHAR(255) NOT NULL,
    verified_domains JSONB DEFAULT '[]',
    tenant_region VARCHAR(50),
    tenant_type VARCHAR(50), -- commercial, government, education
    license_agreement VARCHAR(100),
    total_licenses INTEGER,

    -- Azure AD Details
    azure_ad_tenant_id VARCHAR(255),
    directory_id VARCHAR(255),
    initial_domain VARCHAR(255),

    -- Integration Status
    graph_api_connected BOOLEAN DEFAULT false,
    graph_api_version VARCHAR(20) DEFAULT 'v1.0',
    admin_consent_granted BOOLEAN DEFAULT false,
    admin_consent_date TIMESTAMP,
    admin_consent_by VARCHAR(255),
    copilot_enabled BOOLEAN DEFAULT false,
    copilot_enabled_date DATE,

    -- Connection Details
    connection_method VARCHAR(50), -- oauth, certificate, managed_identity
    app_registration_id VARCHAR(255),
    service_principal_id VARCHAR(255),
    service_principal_name VARCHAR(255),

    -- Authentication
    certificate_thumbprint VARCHAR(255),
    certificate_expiry DATE,
    client_secret_expiry DATE,
    token_expiry TIMESTAMP,
    refresh_token_expiry TIMESTAMP,

    -- Sync Settings
    sync_enabled BOOLEAN DEFAULT true,
    sync_frequency VARCHAR(20) DEFAULT 'hourly', -- real-time, hourly, daily, weekly, manual
    last_sync_timestamp TIMESTAMP,
    last_successful_sync TIMESTAMP,
    next_scheduled_sync TIMESTAMP,
    sync_status VARCHAR(20) DEFAULT 'pending', -- pending, in_progress, success, failed, paused

    -- Sync Scope
    sync_users BOOLEAN DEFAULT true,
    sync_groups BOOLEAN DEFAULT true,
    sync_licenses BOOLEAN DEFAULT true,
    sync_usage_reports BOOLEAN DEFAULT true,
    sync_security_events BOOLEAN DEFAULT false,

    -- Data Retention
    data_retention_days INTEGER DEFAULT 90,
    archive_old_data BOOLEAN DEFAULT true,

    -- Error Handling
    retry_on_failure BOOLEAN DEFAULT true,
    max_retry_attempts INTEGER DEFAULT 3,
    last_error TEXT,
    last_error_timestamp TIMESTAMP,
    consecutive_failures INTEGER DEFAULT 0,

    -- Webhooks
    webhook_enabled BOOLEAN DEFAULT false,
    webhook_url VARCHAR(500),
    webhook_secret VARCHAR(255),

    -- API Rate Limiting
    api_quota_limit INTEGER,
    api_calls_today INTEGER DEFAULT 0,
    api_quota_reset_time TIMESTAMP,

    -- Status
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, suspended, error
    health_status VARCHAR(20) DEFAULT 'healthy', -- healthy, degraded, unhealthy

    -- Metadata
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- ============================================================================
-- INTEGRATION LOGS TABLE
-- ============================================================================
CREATE TABLE integration_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES microsoft_tenants(tenant_id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(organization_id) ON DELETE CASCADE,

    -- Log Details
    log_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    integration_type VARCHAR(50) NOT NULL, -- graph_api, azure_ad, teams, m365_admin, power_platform
    integration_name VARCHAR(100),
    operation VARCHAR(100) NOT NULL, -- sync_users, sync_licenses, fetch_usage, etc.
    operation_type VARCHAR(20), -- read, write, update, delete

    -- Status
    status VARCHAR(20) NOT NULL, -- success, failed, partial, warning
    status_code INTEGER,
    status_message TEXT,

    -- Data Transfer
    records_requested INTEGER,
    records_processed INTEGER DEFAULT 0,
    records_succeeded INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    records_skipped INTEGER DEFAULT 0,

    -- Performance
    execution_start_time TIMESTAMP,
    execution_end_time TIMESTAMP,
    execution_time_ms INTEGER,
    api_calls_made INTEGER DEFAULT 0,
    data_transferred_mb DECIMAL(10,2),

    -- Errors & Warnings
    error_count INTEGER DEFAULT 0,
    warning_count INTEGER DEFAULT 0,
    error_details JSONB DEFAULT '[]',
    warning_details JSONB DEFAULT '[]',

    -- Request/Response
    request_id VARCHAR(255),
    correlation_id VARCHAR(255),
    request_payload JSONB,
    response_payload JSONB,
    http_method VARCHAR(10),
    endpoint_url VARCHAR(500),

    -- Metadata
    initiated_by VARCHAR(255), -- system, user_email, scheduled_job
    initiated_by_user_id UUID,
    job_id VARCHAR(255),
    batch_id VARCHAR(255)
);

-- ============================================================================
-- GRAPH API PERMISSIONS TABLE
-- ============================================================================
CREATE TABLE graph_api_permissions (
    permission_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES microsoft_tenants(tenant_id) ON DELETE CASCADE,

    -- Permission Details
    permission_name VARCHAR(255) NOT NULL,
    permission_type VARCHAR(50), -- delegated, application
    permission_scope VARCHAR(500),
    resource_app_id VARCHAR(255), -- Microsoft Graph, SharePoint, etc.

    -- Status
    is_granted BOOLEAN DEFAULT false,
    granted_date TIMESTAMP,
    granted_by VARCHAR(255),
    consent_type VARCHAR(50), -- admin, user

    -- Usage
    is_required BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    usage_description TEXT,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SYNC JOBS TABLE
-- ============================================================================
CREATE TABLE sync_jobs (
    job_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES microsoft_tenants(tenant_id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,

    -- Job Details
    job_name VARCHAR(255) NOT NULL,
    job_type VARCHAR(50) NOT NULL, -- user_sync, license_sync, usage_sync, group_sync, full_sync
    job_description TEXT,

    -- Scheduling
    schedule_type VARCHAR(20), -- once, recurring, on_demand
    schedule_cron VARCHAR(100), -- Cron expression for recurring jobs
    next_run_time TIMESTAMP,
    last_run_time TIMESTAMP,

    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, running, completed, failed, cancelled
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    current_step VARCHAR(255),

    -- Execution Details
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    duration_seconds INTEGER,

    -- Results
    items_processed INTEGER DEFAULT 0,
    items_succeeded INTEGER DEFAULT 0,
    items_failed INTEGER DEFAULT 0,
    error_log JSONB DEFAULT '[]',

    -- Configuration
    job_config JSONB DEFAULT '{}',
    filters JSONB DEFAULT '{}',

    -- Retry Logic
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    retry_after TIMESTAMP,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

-- ============================================================================
-- MICROSOFT GROUPS TABLE
-- ============================================================================
CREATE TABLE microsoft_groups (
    group_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES microsoft_tenants(tenant_id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,

    -- Microsoft Group Details
    m365_group_id VARCHAR(255) NOT NULL,
    group_name VARCHAR(255) NOT NULL,
    group_email VARCHAR(255),
    group_type VARCHAR(50), -- microsoft_365, security, distribution, mail_enabled_security

    -- Description
    description TEXT,
    classification VARCHAR(100),

    -- Settings
    visibility VARCHAR(20), -- public, private, hidden
    is_assignable_to_role BOOLEAN DEFAULT false,
    is_team_enabled BOOLEAN DEFAULT false,

    -- Membership
    member_count INTEGER DEFAULT 0,
    owner_count INTEGER DEFAULT 0,
    guest_count INTEGER DEFAULT 0,

    -- Copilot Settings
    copilot_enabled_for_group BOOLEAN DEFAULT false,
    copilot_license_assigned BOOLEAN DEFAULT false,

    -- Sync
    last_synced TIMESTAMP,
    sync_status VARCHAR(20) DEFAULT 'synced',

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    m365_created_date TIMESTAMP,
    m365_modified_date TIMESTAMP
);

-- ============================================================================
-- MICROSOFT LICENSES TABLE
-- ============================================================================
CREATE TABLE microsoft_licenses (
    license_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES microsoft_tenants(tenant_id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,

    -- License Details
    sku_id VARCHAR(255) NOT NULL,
    sku_part_number VARCHAR(255),
    product_name VARCHAR(255),
    service_plan_name VARCHAR(255),

    -- Allocation
    total_licenses INTEGER DEFAULT 0,
    consumed_licenses INTEGER DEFAULT 0,
    available_licenses INTEGER DEFAULT 0,
    warning_units INTEGER DEFAULT 0,
    suspended_licenses INTEGER DEFAULT 0,

    -- Copilot Specific
    is_copilot_license BOOLEAN DEFAULT false,
    copilot_product_name VARCHAR(255),

    -- Pricing
    unit_price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    billing_cycle VARCHAR(20), -- monthly, annual

    -- Sync
    last_synced TIMESTAMP,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- USER LICENSE ASSIGNMENTS TABLE
-- ============================================================================
CREATE TABLE user_license_assignments (
    assignment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES microsoft_tenants(tenant_id) ON DELETE CASCADE,
    license_id UUID NOT NULL REFERENCES microsoft_licenses(license_id) ON DELETE CASCADE,

    -- Assignment Details
    assigned_date TIMESTAMP,
    assignment_source VARCHAR(50), -- direct, group_based, inherited
    assigned_by VARCHAR(255),

    -- Status
    status VARCHAR(20) DEFAULT 'active', -- active, suspended, removed
    is_active BOOLEAN DEFAULT true,

    -- Service Plans
    enabled_service_plans JSONB DEFAULT '[]',
    disabled_service_plans JSONB DEFAULT '[]',

    -- Sync
    last_synced TIMESTAMP,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_user_license UNIQUE (user_id, license_id)
);

-- ============================================================================
-- TEAMS INTEGRATION TABLE
-- ============================================================================
CREATE TABLE teams_integration (
    teams_integration_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES microsoft_tenants(tenant_id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,

    -- Teams App Details
    app_id VARCHAR(255),
    app_name VARCHAR(255),
    app_version VARCHAR(50),
    app_status VARCHAR(20) DEFAULT 'active', -- active, inactive, pending

    -- Bot Configuration
    bot_enabled BOOLEAN DEFAULT false,
    bot_id VARCHAR(255),
    bot_name VARCHAR(255),
    bot_endpoint_url VARCHAR(500),

    -- Messaging Extension
    messaging_extension_enabled BOOLEAN DEFAULT false,

    -- Tabs
    tabs_enabled BOOLEAN DEFAULT false,
    tab_configurations JSONB DEFAULT '[]',

    -- Installation
    installed_in_teams_count INTEGER DEFAULT 0,
    installed_in_channels_count INTEGER DEFAULT 0,
    total_users_reached INTEGER DEFAULT 0,

    -- Usage
    daily_active_users INTEGER DEFAULT 0,
    monthly_active_users INTEGER DEFAULT 0,
    total_interactions INTEGER DEFAULT 0,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- POWER PLATFORM INTEGRATION TABLE
-- ============================================================================
CREATE TABLE power_platform_integration (
    power_integration_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES microsoft_tenants(tenant_id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,

    -- Environment Details
    environment_id VARCHAR(255),
    environment_name VARCHAR(255),
    environment_type VARCHAR(50), -- production, sandbox, trial, developer

    -- Power Apps
    power_apps_enabled BOOLEAN DEFAULT false,
    total_apps INTEGER DEFAULT 0,
    copilot_integrated_apps INTEGER DEFAULT 0,

    -- Power Automate
    power_automate_enabled BOOLEAN DEFAULT false,
    total_flows INTEGER DEFAULT 0,
    copilot_integrated_flows INTEGER DEFAULT 0,

    -- Power BI
    power_bi_enabled BOOLEAN DEFAULT false,
    total_reports INTEGER DEFAULT 0,
    copilot_features_used BOOLEAN DEFAULT false,

    -- Dataverse
    dataverse_enabled BOOLEAN DEFAULT false,
    dataverse_capacity_gb DECIMAL(10,2),

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- WEBHOOK EVENTS TABLE
-- ============================================================================
CREATE TABLE webhook_events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES microsoft_tenants(tenant_id) ON DELETE CASCADE,

    -- Event Details
    event_type VARCHAR(100) NOT NULL,
    event_source VARCHAR(100), -- graph_api, teams, sharepoint, etc.
    event_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Payload
    event_payload JSONB NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    change_type VARCHAR(50), -- created, updated, deleted

    -- Processing
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP,
    processing_status VARCHAR(20), -- pending, success, failed
    processing_error TEXT,

    -- Retry
    retry_count INTEGER DEFAULT 0,
    next_retry_at TIMESTAMP,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- API RATE LIMITING TABLE
-- ============================================================================
CREATE TABLE api_rate_limiting (
    rate_limit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES microsoft_tenants(tenant_id) ON DELETE CASCADE,

    -- Rate Limit Details
    api_endpoint VARCHAR(500) NOT NULL,
    limit_type VARCHAR(50), -- per_minute, per_hour, per_day
    limit_value INTEGER NOT NULL,
    current_usage INTEGER DEFAULT 0,

    -- Window
    window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    window_end TIMESTAMP,

    -- Throttling
    is_throttled BOOLEAN DEFAULT false,
    throttled_until TIMESTAMP,
    retry_after_seconds INTEGER,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Microsoft Tenants indexes
CREATE INDEX idx_microsoft_tenants_org_id ON microsoft_tenants(organization_id);
CREATE INDEX idx_microsoft_tenants_m365_id ON microsoft_tenants(m365_tenant_id);
CREATE INDEX idx_microsoft_tenants_status ON microsoft_tenants(status);
CREATE INDEX idx_microsoft_tenants_sync_status ON microsoft_tenants(sync_status);

-- Integration Logs indexes
CREATE INDEX idx_integration_logs_tenant_id ON integration_logs(tenant_id);
CREATE INDEX idx_integration_logs_org_id ON integration_logs(organization_id);
CREATE INDEX idx_integration_logs_timestamp ON integration_logs(log_timestamp);
CREATE INDEX idx_integration_logs_type ON integration_logs(integration_type);
CREATE INDEX idx_integration_logs_status ON integration_logs(status);
CREATE INDEX idx_integration_logs_correlation ON integration_logs(correlation_id);

-- Sync Jobs indexes
CREATE INDEX idx_sync_jobs_tenant_id ON sync_jobs(tenant_id);
CREATE INDEX idx_sync_jobs_status ON sync_jobs(status);
CREATE INDEX idx_sync_jobs_next_run ON sync_jobs(next_run_time);
CREATE INDEX idx_sync_jobs_type ON sync_jobs(job_type);

-- Microsoft Groups indexes
CREATE INDEX idx_microsoft_groups_tenant_id ON microsoft_groups(tenant_id);
CREATE INDEX idx_microsoft_groups_m365_id ON microsoft_groups(m365_group_id);

-- Microsoft Licenses indexes
CREATE INDEX idx_microsoft_licenses_tenant_id ON microsoft_licenses(tenant_id);
CREATE INDEX idx_microsoft_licenses_copilot ON microsoft_licenses(is_copilot_license);

-- User License Assignments indexes
CREATE INDEX idx_user_licenses_user_id ON user_license_assignments(user_id);
CREATE INDEX idx_user_licenses_tenant_id ON user_license_assignments(tenant_id);
CREATE INDEX idx_user_licenses_status ON user_license_assignments(status);

-- Webhook Events indexes
CREATE INDEX idx_webhook_events_tenant_id ON webhook_events(tenant_id);
CREATE INDEX idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX idx_webhook_events_timestamp ON webhook_events(event_timestamp);

-- ============================================================================
-- VIEWS FOR REPORTING
-- ============================================================================

-- Tenant Health View
CREATE VIEW tenant_health AS
SELECT
    mt.tenant_id,
    mt.organization_id,
    o.organization_name,
    mt.tenant_name,
    mt.m365_tenant_id,
    mt.status,
    mt.health_status,
    mt.sync_status,
    mt.last_successful_sync,
    mt.consecutive_failures,
    mt.graph_api_connected,
    mt.admin_consent_granted,
    CASE
        WHEN mt.consecutive_failures >= 3 THEN 'critical'
        WHEN mt.consecutive_failures >= 1 THEN 'warning'
        ELSE 'healthy'
    END AS alert_level
FROM microsoft_tenants mt
JOIN organizations o ON mt.organization_id = o.organization_id;

-- Integration Activity Summary
CREATE VIEW integration_activity_summary AS
SELECT
    DATE(log_timestamp) AS activity_date,
    tenant_id,
    integration_type,
    COUNT(*) AS total_operations,
    COUNT(CASE WHEN status = 'success' THEN 1 END) AS successful_operations,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) AS failed_operations,
    SUM(api_calls_made) AS total_api_calls,
    AVG(execution_time_ms) AS avg_execution_time_ms,
    SUM(records_processed) AS total_records_processed
FROM integration_logs
GROUP BY DATE(log_timestamp), tenant_id, integration_type;

-- License Utilization View
CREATE VIEW license_utilization AS
SELECT
    ml.tenant_id,
    mt.organization_id,
    o.organization_name,
    ml.product_name,
    ml.total_licenses,
    ml.consumed_licenses,
    ml.available_licenses,
    CASE
        WHEN ml.total_licenses > 0
        THEN ROUND((ml.consumed_licenses::numeric / ml.total_licenses * 100)::numeric, 2)
        ELSE 0
    END AS utilization_percentage,
    ml.is_copilot_license
FROM microsoft_licenses ml
JOIN microsoft_tenants mt ON ml.tenant_id = mt.tenant_id
JOIN organizations o ON mt.organization_id = o.organization_id;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_microsoft_tenants_updated_at BEFORE UPDATE ON microsoft_tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sync_jobs_updated_at BEFORE UPDATE ON sync_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_microsoft_groups_updated_at BEFORE UPDATE ON microsoft_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_microsoft_licenses_updated_at BEFORE UPDATE ON microsoft_licenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_license_assignments_updated_at BEFORE UPDATE ON user_license_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE microsoft_tenants IS 'Microsoft 365 tenant configuration and connection details';
COMMENT ON TABLE integration_logs IS 'Detailed logs of all integration operations and API calls';
COMMENT ON TABLE graph_api_permissions IS 'Microsoft Graph API permissions granted to the platform';
COMMENT ON TABLE sync_jobs IS 'Scheduled and on-demand synchronization jobs';
COMMENT ON TABLE microsoft_groups IS 'Microsoft 365 groups synced from tenant';
COMMENT ON TABLE microsoft_licenses IS 'License SKUs and allocation details from tenant';
COMMENT ON TABLE user_license_assignments IS 'Individual user license assignments';
COMMENT ON TABLE teams_integration IS 'Microsoft Teams app integration configuration';
COMMENT ON TABLE power_platform_integration IS 'Power Platform environment integration';
COMMENT ON TABLE webhook_events IS 'Webhook events received from Microsoft services';
COMMENT ON TABLE api_rate_limiting IS 'API rate limiting and throttling management';
