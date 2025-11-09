-- Multi-Agent System Database Schema
-- Tables for tracking agent executions and business metrics

-- Agent executions table
CREATE TABLE IF NOT EXISTS agent_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  results JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_agent_executions_type ON agent_executions(agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_executions_status ON agent_executions(status);
CREATE INDEX IF NOT EXISTS idx_agent_executions_started_at ON agent_executions(started_at DESC);

-- Business metrics table
CREATE TABLE IF NOT EXISTS business_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type VARCHAR(50) NOT NULL,
  metric_name VARCHAR(100) NOT NULL,
  metric_value TEXT NOT NULL,
  metric_unit VARCHAR(20),
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_business_metrics_type ON business_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_business_metrics_period ON business_metrics(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_business_metrics_created_at ON business_metrics(created_at DESC);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for agent_executions
DROP TRIGGER IF EXISTS update_agent_executions_updated_at ON agent_executions;
CREATE TRIGGER update_agent_executions_updated_at
  BEFORE UPDATE ON agent_executions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE agent_executions IS 'Tracks all agent execution runs across the multi-agent system';
COMMENT ON TABLE business_metrics IS 'Stores business metrics collected by various agents';

COMMENT ON COLUMN agent_executions.agent_type IS 'Type of agent that ran (e.g., finance-tracker, content-creator)';
COMMENT ON COLUMN agent_executions.status IS 'Execution status: pending, running, completed, failed';
COMMENT ON COLUMN agent_executions.metadata IS 'Additional metadata about the execution context';
COMMENT ON COLUMN agent_executions.results IS 'Results and output from the agent execution';

COMMENT ON COLUMN business_metrics.metric_type IS 'Category of metric (e.g., revenue, expense, customer)';
COMMENT ON COLUMN business_metrics.metric_name IS 'Specific metric name (e.g., monthly_revenue, churn_rate)';
COMMENT ON COLUMN business_metrics.metric_value IS 'The metric value (stored as text for flexibility)';
COMMENT ON COLUMN business_metrics.metric_unit IS 'Unit of measurement (e.g., USD, percent, count)';
COMMENT ON COLUMN business_metrics.period_start IS 'Start of the measurement period';
COMMENT ON COLUMN business_metrics.period_end IS 'End of the measurement period';
