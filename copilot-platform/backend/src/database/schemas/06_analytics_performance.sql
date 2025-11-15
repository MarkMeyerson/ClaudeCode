-- ============================================================================
-- ADVANCED ANALYTICS & PERFORMANCE DATABASE SCHEMA
-- Microsoft Copilot Onboarding & ROI Platform - Enterprise Edition
-- ============================================================================

-- ============================================================================
-- PERFORMANCE METRICS TABLE
-- ============================================================================
CREATE TABLE performance_metrics (
    metric_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(organization_id) ON DELETE CASCADE,

    -- Time Dimension
    metric_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
    metric_hour INTEGER, -- 0-23

    -- API Performance
    endpoint VARCHAR(500),
    http_method VARCHAR(10),
    response_time_ms INTEGER,
    response_size_bytes INTEGER,
    status_code INTEGER,

    -- Database Performance
    query_time_ms INTEGER,
    query_count INTEGER,
    cache_hits INTEGER,
    cache_misses INTEGER,
    cache_hit_ratio DECIMAL(5,2),

    -- Resource Utilization
    cpu_usage_percent DECIMAL(5,2),
    memory_usage_mb INTEGER,
    memory_usage_percent DECIMAL(5,2),
    disk_io_read_mb DECIMAL(10,2),
    disk_io_write_mb DECIMAL(10,2),

    -- Network
    network_in_mb DECIMAL(10,2),
    network_out_mb DECIMAL(10,2),
    concurrent_connections INTEGER,

    -- Application Metrics
    active_users INTEGER,
    active_sessions INTEGER,
    requests_per_second DECIMAL(10,2),
    errors_per_minute DECIMAL(8,2),

    -- Custom Metrics
    custom_metrics JSONB DEFAULT '{}',

    -- Metadata
    server_id VARCHAR(100),
    region VARCHAR(50),
    environment VARCHAR(20) -- production, staging, development
);

CREATE INDEX idx_performance_metrics_timestamp ON performance_metrics(metric_timestamp DESC);
CREATE INDEX idx_performance_metrics_date ON performance_metrics(metric_date DESC);
CREATE INDEX idx_performance_metrics_endpoint ON performance_metrics(endpoint);

-- Partition by month for better performance
-- CREATE TABLE performance_metrics_y2024m01 PARTITION OF performance_metrics
--     FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- ============================================================================
-- APPLICATION ERRORS TABLE
-- ============================================================================
CREATE TABLE application_errors (
    error_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(organization_id),

    -- Error Details
    error_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    error_type VARCHAR(100) NOT NULL,
    error_message TEXT NOT NULL,
    error_stack_trace TEXT,

    -- Context
    endpoint VARCHAR(500),
    http_method VARCHAR(10),
    request_id VARCHAR(255),
    user_id UUID,
    session_id VARCHAR(255),

    -- Request Details
    request_headers JSONB,
    request_body JSONB,
    request_params JSONB,

    -- Error Classification
    severity VARCHAR(20), -- debug, info, warning, error, critical
    category VARCHAR(100), -- validation, database, network, authentication, business_logic
    is_handled BOOLEAN DEFAULT false,

    -- Resolution
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP,
    resolved_by UUID,
    resolution_notes TEXT,

    -- Grouping (for error aggregation)
    error_fingerprint VARCHAR(255), -- Hash of error type + stack
    occurrence_count INTEGER DEFAULT 1,
    first_occurrence TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_occurrence TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Environment
    server_id VARCHAR(100),
    environment VARCHAR(20),
    app_version VARCHAR(50),

    -- Metadata
    custom_data JSONB DEFAULT '{}'
);

CREATE INDEX idx_application_errors_timestamp ON application_errors(error_timestamp DESC);
CREATE INDEX idx_application_errors_fingerprint ON application_errors(error_fingerprint);
CREATE INDEX idx_application_errors_severity ON application_errors(severity);
CREATE INDEX idx_application_errors_unresolved ON application_errors(resolved) WHERE resolved = false;

-- ============================================================================
-- USER ANALYTICS TABLE
-- ============================================================================
CREATE TABLE user_analytics (
    analytics_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,

    -- Time Dimension
    analytics_date DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Session Metrics
    sessions_count INTEGER DEFAULT 0,
    total_session_duration_minutes INTEGER DEFAULT 0,
    average_session_duration_minutes DECIMAL(8,2),

    -- Page Views
    page_views INTEGER DEFAULT 0,
    unique_pages_viewed INTEGER DEFAULT 0,
    most_viewed_pages JSONB DEFAULT '[]',

    -- Feature Usage
    features_used JSONB DEFAULT '[]', -- [{"feature": "roi_dashboard", "count": 10}]
    total_feature_interactions INTEGER DEFAULT 0,

    -- Actions Performed
    documents_created INTEGER DEFAULT 0,
    documents_edited INTEGER DEFAULT 0,
    reports_generated INTEGER DEFAULT 0,
    searches_performed INTEGER DEFAULT 0,
    exports_downloaded INTEGER DEFAULT 0,

    -- Engagement Score
    engagement_score DECIMAL(5,2), -- 0-100
    engagement_level VARCHAR(20), -- low, medium, high, very_high

    -- Device & Browser
    devices_used JSONB DEFAULT '[]',
    browsers_used JSONB DEFAULT '[]',

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_user_date_analytics UNIQUE (user_id, analytics_date)
);

CREATE INDEX idx_user_analytics_date ON user_analytics(analytics_date DESC);
CREATE INDEX idx_user_analytics_user ON user_analytics(user_id);
CREATE INDEX idx_user_analytics_engagement ON user_analytics(engagement_score DESC);

-- ============================================================================
-- SYSTEM HEALTH CHECKS TABLE
-- ============================================================================
CREATE TABLE system_health_checks (
    check_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Check Details
    check_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    check_name VARCHAR(255) NOT NULL,
    check_type VARCHAR(50) NOT NULL, -- database, api, cache, integration, service

    -- Results
    status VARCHAR(20) NOT NULL, -- healthy, degraded, unhealthy
    response_time_ms INTEGER,
    success BOOLEAN NOT NULL,

    -- Details
    error_message TEXT,
    details JSONB DEFAULT '{}',

    -- Thresholds
    warning_threshold INTEGER,
    critical_threshold INTEGER,

    -- Environment
    server_id VARCHAR(100),
    region VARCHAR(50),
    environment VARCHAR(20)
);

CREATE INDEX idx_system_health_timestamp ON system_health_checks(check_timestamp DESC);
CREATE INDEX idx_system_health_status ON system_health_checks(status);
CREATE INDEX idx_system_health_type ON system_health_checks(check_type);

-- ============================================================================
-- CACHE ANALYTICS TABLE
-- ============================================================================
CREATE TABLE cache_analytics (
    cache_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Time Dimension
    metric_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metric_date DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Cache Details
    cache_name VARCHAR(100) NOT NULL, -- redis, browser, cdn
    cache_key_pattern VARCHAR(255),

    -- Metrics
    total_requests INTEGER DEFAULT 0,
    cache_hits INTEGER DEFAULT 0,
    cache_misses INTEGER DEFAULT 0,
    cache_hit_ratio DECIMAL(5,2),

    -- Performance
    average_hit_latency_ms DECIMAL(8,2),
    average_miss_latency_ms DECIMAL(8,2),

    -- Size Metrics
    keys_count INTEGER,
    memory_used_mb DECIMAL(10,2),
    memory_limit_mb DECIMAL(10,2),
    memory_usage_percent DECIMAL(5,2),

    -- Evictions
    evictions_count INTEGER DEFAULT 0,
    eviction_reason VARCHAR(100),

    -- TTL Analytics
    average_ttl_seconds INTEGER,
    expired_keys INTEGER DEFAULT 0,

    CONSTRAINT unique_cache_date UNIQUE (cache_name, metric_date)
);

CREATE INDEX idx_cache_analytics_date ON cache_analytics(metric_date DESC);
CREATE INDEX idx_cache_analytics_name ON cache_analytics(cache_name);

-- ============================================================================
-- REAL USER MONITORING (RUM) TABLE
-- ============================================================================
CREATE TABLE real_user_monitoring (
    rum_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(organization_id),
    user_id UUID REFERENCES users(user_id),

    -- Session
    session_id VARCHAR(255) NOT NULL,
    page_url TEXT NOT NULL,
    page_title VARCHAR(500),

    -- Timestamp
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Navigation Timing
    dns_time_ms INTEGER,
    tcp_time_ms INTEGER,
    request_time_ms INTEGER,
    response_time_ms INTEGER,
    dom_processing_time_ms INTEGER,
    dom_content_loaded_ms INTEGER,
    load_complete_ms INTEGER,

    -- Paint Timing
    first_paint_ms INTEGER,
    first_contentful_paint_ms INTEGER,
    largest_contentful_paint_ms INTEGER,
    first_input_delay_ms INTEGER,
    cumulative_layout_shift DECIMAL(5,3),

    -- Resource Timing
    total_resources INTEGER,
    total_resource_size_kb DECIMAL(10,2),
    slow_resources JSONB DEFAULT '[]',

    -- Device & Browser
    device_type VARCHAR(50),
    browser VARCHAR(100),
    browser_version VARCHAR(50),
    os VARCHAR(100),
    screen_resolution VARCHAR(20),

    -- Network
    connection_type VARCHAR(50),
    effective_connection_type VARCHAR(20),
    downlink_mbps DECIMAL(8,2),

    -- Performance Score
    performance_score DECIMAL(5,2), -- 0-100 (Lighthouse-style)

    -- User Experience
    user_frustrated BOOLEAN DEFAULT false, -- Long wait times
    rage_clicks INTEGER DEFAULT 0,
    dead_clicks INTEGER DEFAULT 0,

    -- Metadata
    custom_metrics JSONB DEFAULT '{}'
);

CREATE INDEX idx_rum_timestamp ON real_user_monitoring(timestamp DESC);
CREATE INDEX idx_rum_user ON real_user_monitoring(user_id);
CREATE INDEX idx_rum_session ON real_user_monitoring(session_id);
CREATE INDEX idx_rum_performance ON real_user_monitoring(performance_score);

-- ============================================================================
-- BUSINESS METRICS TABLE
-- ============================================================================
CREATE TABLE business_metrics (
    metric_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,

    -- Time Dimension
    metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
    metric_period VARCHAR(20), -- daily, weekly, monthly, quarterly, annual

    -- User Metrics
    total_users INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    new_users INTEGER DEFAULT 0,
    churned_users INTEGER DEFAULT 0,
    user_retention_rate DECIMAL(5,2),

    -- Adoption Metrics
    copilot_adoption_rate DECIMAL(5,2),
    feature_adoption_rate DECIMAL(5,2),
    training_completion_rate DECIMAL(5,2),

    -- ROI Metrics
    total_roi DECIMAL(12,2),
    avg_roi_per_user DECIMAL(10,2),
    productivity_value DECIMAL(15,2),
    cost_savings DECIMAL(15,2),

    -- Engagement Metrics
    daily_active_users INTEGER,
    weekly_active_users INTEGER,
    monthly_active_users INTEGER,
    average_session_duration_minutes DECIMAL(8,2),

    -- Revenue Metrics (if applicable)
    revenue DECIMAL(15,2),
    arr DECIMAL(15,2), -- Annual Recurring Revenue
    mrr DECIMAL(15,2), -- Monthly Recurring Revenue

    -- Support Metrics
    support_tickets INTEGER DEFAULT 0,
    avg_resolution_time_hours DECIMAL(8,2),
    customer_satisfaction_score DECIMAL(3,2),
    nps_score DECIMAL(5,2),

    -- Content Metrics
    content_views INTEGER DEFAULT 0,
    content_downloads INTEGER DEFAULT 0,
    video_completions INTEGER DEFAULT 0,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_org_date_period UNIQUE (organization_id, metric_date, metric_period)
);

CREATE INDEX idx_business_metrics_date ON business_metrics(metric_date DESC);
CREATE INDEX idx_business_metrics_org ON business_metrics(organization_id);

-- ============================================================================
-- A/B TESTING TABLE
-- ============================================================================
CREATE TABLE ab_tests (
    test_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(organization_id),

    -- Test Details
    test_name VARCHAR(255) NOT NULL,
    test_description TEXT,
    test_hypothesis TEXT,

    -- Variants
    control_variant JSONB NOT NULL, -- {"name": "control", "config": {...}}
    test_variants JSONB NOT NULL, -- [{"name": "variant_a", "config": {...}}]

    -- Traffic Allocation
    traffic_allocation JSONB DEFAULT '{"control": 50, "variant_a": 50}',

    -- Targeting
    target_audience JSONB DEFAULT '{}',

    -- Status
    status VARCHAR(20) DEFAULT 'draft', -- draft, running, paused, completed
    start_date TIMESTAMP,
    end_date TIMESTAMP,

    -- Results
    winner VARCHAR(100),
    confidence_level DECIMAL(5,2),
    statistical_significance BOOLEAN DEFAULT false,

    -- Metrics Being Tested
    primary_metric VARCHAR(100),
    secondary_metrics JSONB DEFAULT '[]',

    -- Sample Size
    minimum_sample_size INTEGER DEFAULT 1000,
    current_sample_size INTEGER DEFAULT 0,

    -- Creator
    created_by UUID,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ab_test_results (
    result_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id UUID NOT NULL REFERENCES ab_tests(test_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id),

    -- Assignment
    variant_name VARCHAR(100) NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Outcome
    converted BOOLEAN DEFAULT false,
    conversion_timestamp TIMESTAMP,
    conversion_value DECIMAL(12,2),

    -- Metrics
    metric_values JSONB DEFAULT '{}',

    -- Metadata
    session_id VARCHAR(255),
    device_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ab_test_results_test ON ab_test_results(test_id);
CREATE INDEX idx_ab_test_results_variant ON ab_test_results(variant_name);

-- ============================================================================
-- FEATURE FLAGS TABLE
-- ============================================================================
CREATE TABLE feature_flags (
    flag_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(organization_id),

    -- Flag Details
    flag_key VARCHAR(255) NOT NULL UNIQUE,
    flag_name VARCHAR(255) NOT NULL,
    flag_description TEXT,

    -- Default State
    enabled BOOLEAN DEFAULT false,

    -- Rollout Strategy
    rollout_strategy VARCHAR(50) DEFAULT 'all', -- all, percentage, users, organizations
    rollout_percentage INTEGER, -- 0-100
    rollout_users JSONB DEFAULT '[]',
    rollout_organizations JSONB DEFAULT '[]',

    -- Conditions
    conditions JSONB DEFAULT '[]',

    -- Variants (for multivariate flags)
    variants JSONB DEFAULT '[]',

    -- Status
    is_active BOOLEAN DEFAULT true,
    permanent BOOLEAN DEFAULT false, -- true if this is a long-term flag

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

CREATE TABLE feature_flag_evaluations (
    evaluation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flag_id UUID NOT NULL REFERENCES feature_flags(flag_id) ON DELETE CASCADE,
    user_id UUID,
    organization_id UUID,

    -- Evaluation
    evaluation_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    flag_key VARCHAR(255) NOT NULL,
    variant_key VARCHAR(100),
    enabled BOOLEAN NOT NULL,

    -- Context
    evaluation_context JSONB DEFAULT '{}',

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_feature_flag_evaluations_flag ON feature_flag_evaluations(flag_id);
CREATE INDEX idx_feature_flag_evaluations_user ON feature_flag_evaluations(user_id);
CREATE INDEX idx_feature_flag_evaluations_timestamp ON feature_flag_evaluations(evaluation_timestamp DESC);

-- ============================================================================
-- CUSTOM REPORTS TABLE
-- ============================================================================
CREATE TABLE custom_reports (
    report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,

    -- Report Details
    report_name VARCHAR(255) NOT NULL,
    report_description TEXT,
    report_type VARCHAR(50), -- roi, adoption, productivity, compliance, custom

    -- Query Configuration
    data_sources JSONB NOT NULL, -- Tables/views to query
    filters JSONB DEFAULT '[]',
    aggregations JSONB DEFAULT '[]',
    grouping JSONB DEFAULT '[]',
    sorting JSONB DEFAULT '[]',

    -- Visualization
    chart_type VARCHAR(50), -- table, line, bar, pie, scatter, heatmap
    chart_config JSONB DEFAULT '{}',

    -- Schedule
    scheduled BOOLEAN DEFAULT false,
    schedule_frequency VARCHAR(20), -- daily, weekly, monthly
    schedule_time TIME,
    schedule_day_of_week INTEGER, -- 0-6
    schedule_day_of_month INTEGER, -- 1-31

    -- Delivery
    delivery_methods JSONB DEFAULT '[]', -- ["email", "slack", "teams"]
    recipients JSONB DEFAULT '[]',

    -- Access Control
    is_public BOOLEAN DEFAULT false,
    shared_with JSONB DEFAULT '[]',

    -- Metadata
    created_by UUID,
    last_run TIMESTAMP,
    run_count INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_custom_reports_org ON custom_reports(organization_id);
CREATE INDEX idx_custom_reports_type ON custom_reports(report_type);

-- ============================================================================
-- WEBHOOKS TABLE
-- ============================================================================
CREATE TABLE webhooks (
    webhook_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,

    -- Webhook Details
    webhook_name VARCHAR(255) NOT NULL,
    webhook_url VARCHAR(500) NOT NULL,
    webhook_secret VARCHAR(255), -- For signature verification

    -- Events
    event_types JSONB NOT NULL, -- ["user.created", "roi.calculated", "adoption.milestone"]

    -- Configuration
    http_method VARCHAR(10) DEFAULT 'POST',
    headers JSONB DEFAULT '{}',
    payload_template TEXT,

    -- Retry Configuration
    retry_enabled BOOLEAN DEFAULT true,
    max_retries INTEGER DEFAULT 3,
    retry_backoff VARCHAR(20) DEFAULT 'exponential',

    -- Status
    is_active BOOLEAN DEFAULT true,
    last_triggered TIMESTAMP,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

CREATE TABLE webhook_deliveries (
    delivery_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_id UUID NOT NULL REFERENCES webhooks(webhook_id) ON DELETE CASCADE,

    -- Delivery Details
    event_type VARCHAR(100) NOT NULL,
    event_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Request
    request_url VARCHAR(500) NOT NULL,
    request_headers JSONB,
    request_payload JSONB,

    -- Response
    response_status_code INTEGER,
    response_headers JSONB,
    response_body TEXT,
    response_time_ms INTEGER,

    -- Status
    status VARCHAR(20), -- pending, success, failed, retrying
    attempt_number INTEGER DEFAULT 1,
    next_retry TIMESTAMP,

    -- Error
    error_message TEXT,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX idx_webhook_deliveries_timestamp ON webhook_deliveries(event_timestamp DESC);

-- ============================================================================
-- MATERIALIZED VIEWS FOR PERFORMANCE
-- ============================================================================

-- Daily Performance Summary
CREATE MATERIALIZED VIEW mv_daily_performance_summary AS
SELECT
    metric_date,
    organization_id,
    AVG(response_time_ms) as avg_response_time,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms) as p95_response_time,
    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY response_time_ms) as p99_response_time,
    COUNT(*) as total_requests,
    SUM(CASE WHEN status_code >= 500 THEN 1 ELSE 0 END) as server_errors,
    SUM(CASE WHEN status_code >= 400 AND status_code < 500 THEN 1 ELSE 0 END) as client_errors
FROM performance_metrics
GROUP BY metric_date, organization_id;

CREATE UNIQUE INDEX ON mv_daily_performance_summary (metric_date, organization_id);

-- Create refresh function
CREATE OR REPLACE FUNCTION refresh_performance_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_performance_summary;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE performance_metrics IS 'Real-time performance monitoring metrics';
COMMENT ON TABLE application_errors IS 'Application error tracking and aggregation';
COMMENT ON TABLE user_analytics IS 'Detailed user behavior and engagement analytics';
COMMENT ON TABLE system_health_checks IS 'Automated health check results';
COMMENT ON TABLE cache_analytics IS 'Cache performance and hit ratio analytics';
COMMENT ON TABLE real_user_monitoring IS 'Real user monitoring (RUM) for frontend performance';
COMMENT ON TABLE business_metrics IS 'High-level business KPIs and metrics';
COMMENT ON TABLE ab_tests IS 'A/B testing configuration and management';
COMMENT ON TABLE feature_flags IS 'Feature flag system for gradual rollouts';
COMMENT ON TABLE custom_reports IS 'User-defined custom reports and dashboards';
COMMENT ON TABLE webhooks IS 'Webhook configuration for event notifications';
