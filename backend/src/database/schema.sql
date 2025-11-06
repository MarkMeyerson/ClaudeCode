-- SherpaTech.AI AI Readiness Assessment Database Schema

-- Create assessments table
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    company_size VARCHAR(50),
    industry VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'in_progress',

    -- Scores for each dimension (0-20 each)
    strategic_clarity_score INTEGER DEFAULT 0,
    governance_readiness_score INTEGER DEFAULT 0,
    team_capability_score INTEGER DEFAULT 0,
    technical_infrastructure_score INTEGER DEFAULT 0,
    executive_alignment_score INTEGER DEFAULT 0,

    -- Total score (0-100)
    total_score INTEGER DEFAULT 0,

    -- 6A Phase mapping
    readiness_phase VARCHAR(50),

    -- HubSpot integration
    hubspot_contact_id VARCHAR(255),
    hubspot_synced BOOLEAN DEFAULT FALSE,
    hubspot_synced_at TIMESTAMP,

    -- Email tracking
    report_emailed BOOLEAN DEFAULT FALSE,
    report_emailed_at TIMESTAMP
);

-- Create responses table for storing individual question responses
CREATE TABLE IF NOT EXISTS responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    dimension VARCHAR(100) NOT NULL,
    question_id VARCHAR(100) NOT NULL,
    question_text TEXT NOT NULL,
    answer_value INTEGER NOT NULL,
    answer_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_assessments_email ON assessments(email);
CREATE INDEX IF NOT EXISTS idx_assessments_created_at ON assessments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assessments_status ON assessments(status);
CREATE INDEX IF NOT EXISTS idx_responses_assessment_id ON responses(assessment_id);
CREATE INDEX IF NOT EXISTS idx_responses_dimension ON responses(dimension);

-- Create a view for assessment summary
CREATE OR REPLACE VIEW assessment_summary AS
SELECT
    a.id,
    a.company_name,
    a.contact_name,
    a.email,
    a.total_score,
    a.readiness_phase,
    a.created_at,
    a.completed_at,
    COUNT(r.id) as total_responses
FROM assessments a
LEFT JOIN responses r ON a.id = r.assessment_id
GROUP BY a.id, a.company_name, a.contact_name, a.email,
         a.total_score, a.readiness_phase, a.created_at, a.completed_at;
