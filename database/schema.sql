-- AI Readiness Assessment Bot Database Schema
-- PostgreSQL (Supabase)
-- Last Updated: November 22, 2025

-- Assessments table (main user data and overall scores)
CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(255),
  contact_name VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  company_size VARCHAR(50),
  industry VARCHAR(100),
  strategic_clarity_score INTEGER DEFAULT 0,
  governance_readiness_score INTEGER DEFAULT 0,
  team_capability_score INTEGER DEFAULT 0,
  technical_infrastructure_score INTEGER DEFAULT 0,
  executive_alignment_score INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  readiness_phase VARCHAR(50),
  status VARCHAR(20) DEFAULT 'in_progress',
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Responses table (individual question answers)
CREATE TABLE IF NOT EXISTS responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  dimension VARCHAR(100) NOT NULL,
  question_id VARCHAR(100) NOT NULL,
  question_text TEXT NOT NULL,
  answer_value INTEGER NOT NULL,
  answer_text TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Assessment results table (calculated dimension scores)
CREATE TABLE IF NOT EXISTS assessment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  dimension VARCHAR(100) NOT NULL,
  score INTEGER NOT NULL,
  max_score INTEGER DEFAULT 20,
  percentage DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(assessment_id, dimension)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_assessments_email ON assessments(email);
CREATE INDEX IF NOT EXISTS idx_assessments_created_at ON assessments(created_at);
CREATE INDEX IF NOT EXISTS idx_assessments_status ON assessments(status);
CREATE INDEX IF NOT EXISTS idx_responses_assessment_id ON responses(assessment_id);
CREATE INDEX IF NOT EXISTS idx_responses_dimension ON responses(dimension);
CREATE INDEX IF NOT EXISTS idx_results_assessment_id ON assessment_results(assessment_id);
CREATE INDEX IF NOT EXISTS idx_results_dimension ON assessment_results(dimension);

-- Comments for documentation
COMMENT ON TABLE assessments IS 'Main table storing assessment metadata and overall scores';
COMMENT ON TABLE responses IS 'Individual question responses with answer values';
COMMENT ON TABLE assessment_results IS 'Calculated scores for each of the 5 dimensions';

COMMENT ON COLUMN assessments.readiness_phase IS 'Foundation (0-39), Emerging (40-59), Activate (60-79), Scale (80-100)';
COMMENT ON COLUMN assessments.status IS 'in_progress or completed';
COMMENT ON COLUMN assessments.strategic_clarity_score IS 'Score out of 20 for Strategic Clarity dimension';
COMMENT ON COLUMN assessments.governance_readiness_score IS 'Score out of 20 for Governance Readiness dimension';
COMMENT ON COLUMN assessments.team_capability_score IS 'Score out of 20 for Team Capability dimension';
COMMENT ON COLUMN assessments.technical_infrastructure_score IS 'Score out of 20 for Technical Infrastructure dimension';
COMMENT ON COLUMN assessments.executive_alignment_score IS 'Score out of 20 for Executive Alignment dimension';
COMMENT ON COLUMN assessments.total_score IS 'Overall score out of 100 (sum of all dimension scores)';
COMMENT ON COLUMN assessment_results.percentage IS 'Score as percentage (score/max_score * 100)';
