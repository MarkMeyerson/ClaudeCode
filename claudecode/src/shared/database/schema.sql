-- SherpaTech Multi-Agent System Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Agent Tasks Table
CREATE TABLE IF NOT EXISTS agent_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id VARCHAR(50) NOT NULL,
    type VARCHAR(100) NOT NULL,
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    data JSONB NOT NULL DEFAULT '{}',
    result JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,

    INDEX idx_agent_tasks_agent_id (agent_id),
    INDEX idx_agent_tasks_status (status),
    INDEX idx_agent_tasks_created_at (created_at)
);

-- Agent Events Table
CREATE TABLE IF NOT EXISTS agent_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_agent_events_agent_id (agent_id),
    INDEX idx_agent_events_type (event_type),
    INDEX idx_agent_events_created_at (created_at)
);

-- Agent State Table (for persistent agent state)
CREATE TABLE IF NOT EXISTS agent_state (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id VARCHAR(50) NOT NULL UNIQUE,
    state JSONB NOT NULL DEFAULT '{}',
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_agent_state_agent_id (agent_id)
);

-- Integration Sync Logs Table
CREATE TABLE IF NOT EXISTS integration_sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integration_name VARCHAR(50) NOT NULL,
    sync_type VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed', 'partial')),
    records_synced INTEGER DEFAULT 0,
    error_message TEXT,
    metadata JSONB,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,

    INDEX idx_sync_logs_integration (integration_name),
    INDEX idx_sync_logs_status (status),
    INDEX idx_sync_logs_started_at (started_at)
);

-- Shared Knowledge Base Table
CREATE TABLE IF NOT EXISTS knowledge_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    source VARCHAR(100),
    created_by VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_knowledge_base_category (category),
    INDEX idx_knowledge_base_tags (tags),
    INDEX idx_knowledge_base_created_at (created_at)
);

-- Customer Data Cache Table (for aggregated customer info)
CREATE TABLE IF NOT EXISTS customer_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_email VARCHAR(255) NOT NULL UNIQUE,
    hubspot_contact_id VARCHAR(50),
    stripe_customer_id VARCHAR(50),
    notion_page_id VARCHAR(50),
    data JSONB NOT NULL DEFAULT '{}',
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_customer_cache_email (customer_email),
    INDEX idx_customer_cache_hubspot_id (hubspot_contact_id),
    INDEX idx_customer_cache_stripe_id (stripe_customer_id)
);

-- Agent Communication Table (for inter-agent messaging)
CREATE TABLE IF NOT EXISTS agent_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_agent_id VARCHAR(50) NOT NULL,
    to_agent_id VARCHAR(50) NOT NULL,
    message_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'delivered', 'processed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,

    INDEX idx_agent_messages_to_agent (to_agent_id, status),
    INDEX idx_agent_messages_from_agent (from_agent_id),
    INDEX idx_agent_messages_created_at (created_at)
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_agent_tasks_updated_at BEFORE UPDATE ON agent_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_state_updated_at BEFORE UPDATE ON agent_state
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_base_updated_at BEFORE UPDATE ON knowledge_base
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_cache_updated_at BEFORE UPDATE ON customer_cache
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
