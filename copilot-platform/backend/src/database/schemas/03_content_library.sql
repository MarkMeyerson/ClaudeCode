-- ============================================================================
-- PHASE 6: CONTENT LIBRARY & DOCUMENTATION DATABASE SCHEMA
-- Microsoft Copilot Onboarding & ROI Platform
-- ============================================================================

-- ============================================================================
-- CONTENT LIBRARY TABLE
-- ============================================================================
CREATE TABLE content_library (
    content_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_title VARCHAR(500) NOT NULL,
    content_type VARCHAR(50) NOT NULL, -- whitepaper, case_study, video, template, guide, documentation, webinar, tutorial

    -- Content Details
    description TEXT,
    abstract TEXT,
    full_content TEXT,
    author VARCHAR(255),
    co_authors JSONB DEFAULT '[]',
    publication_date DATE,
    last_updated_date DATE,

    -- File Information
    file_url VARCHAR(500),
    file_format VARCHAR(20), -- pdf, docx, pptx, mp4, html, md
    file_size_mb DECIMAL(10,2),
    duration_minutes INTEGER, -- For videos and webinars
    page_count INTEGER, -- For documents
    word_count INTEGER,

    -- Categorization
    category VARCHAR(100),
    subcategory VARCHAR(100),
    tags JSONB DEFAULT '[]',
    industry VARCHAR(100),
    company_size VARCHAR(50), -- small, medium, large, enterprise, all
    department VARCHAR(100),
    copilot_features JSONB DEFAULT '[]',
    applications JSONB DEFAULT '[]', -- word, excel, powerpoint, etc.

    -- Target Audience
    target_audience VARCHAR(100), -- executive, manager, end_user, admin, developer
    experience_level VARCHAR(20), -- beginner, intermediate, advanced, expert, all
    job_roles JSONB DEFAULT '[]',

    -- SEO & Discovery
    keywords JSONB DEFAULT '[]',
    meta_description TEXT,
    search_terms JSONB DEFAULT '[]',
    thumbnail_url VARCHAR(500),
    preview_image_url VARCHAR(500),

    -- Versioning
    version VARCHAR(20) DEFAULT '1.0',
    version_notes TEXT,
    changelog JSONB DEFAULT '[]',
    supersedes UUID REFERENCES content_library(content_id),
    is_latest_version BOOLEAN DEFAULT true,

    -- Access Control
    access_level VARCHAR(20) DEFAULT 'public', -- public, registered, premium, partner, internal
    requires_authentication BOOLEAN DEFAULT false,
    requires_nda BOOLEAN DEFAULT false,
    allowed_organizations JSONB DEFAULT '[]',
    restricted_regions JSONB DEFAULT '[]',

    -- Engagement Metrics
    view_count INTEGER DEFAULT 0,
    unique_viewers INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2),
    rating_count INTEGER DEFAULT 0,
    bookmark_count INTEGER DEFAULT 0,
    completion_rate DECIMAL(5,2), -- For videos/courses

    -- Quality Metrics
    quality_score DECIMAL(3,2), -- Internal quality rating
    relevance_score DECIMAL(3,2),
    freshness_score DECIMAL(3,2),

    -- Localization
    language VARCHAR(20) DEFAULT 'en',
    translations_available JSONB DEFAULT '[]',
    is_machine_translated BOOLEAN DEFAULT false,

    -- Status
    status VARCHAR(20) DEFAULT 'draft', -- draft, review, published, archived, deprecated
    published_date TIMESTAMP,
    archived_date TIMESTAMP,
    review_required_date DATE,

    -- Related Content
    related_content JSONB DEFAULT '[]',
    prerequisites JSONB DEFAULT '[]',
    next_steps JSONB DEFAULT '[]',

    -- Metadata
    active BOOLEAN DEFAULT true,
    featured BOOLEAN DEFAULT false,
    trending BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- ============================================================================
-- ROI WHITEPAPERS TABLE
-- ============================================================================
CREATE TABLE roi_whitepapers (
    whitepaper_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID REFERENCES content_library(content_id) ON DELETE CASCADE,

    -- Organization Profile
    industry VARCHAR(100) NOT NULL,
    company_size VARCHAR(50) NOT NULL,
    geographic_region VARCHAR(100),
    implementation_type VARCHAR(50), -- pilot, departmental, enterprise_wide

    -- Key ROI Metrics
    productivity_gain_pct DECIMAL(5,2),
    cost_savings_pct DECIMAL(5,2),
    time_savings_hours INTEGER,
    roi_percentage DECIMAL(8,2),
    payback_months INTEGER,
    breakeven_point VARCHAR(100),

    -- Financial Metrics
    total_investment DECIMAL(12,2),
    annual_benefit DECIMAL(12,2),
    three_year_benefit DECIMAL(12,2),
    npv DECIMAL(12,2),
    irr DECIMAL(5,2),

    -- Implementation Details
    deployment_duration_weeks INTEGER,
    users_deployed INTEGER,
    departments_involved JSONB DEFAULT '[]',

    -- Study Methodology
    study_methodology TEXT,
    sample_size INTEGER,
    study_duration_months INTEGER,
    study_start_date DATE,
    study_end_date DATE,
    data_collection_methods JSONB DEFAULT '[]',
    validation_approach TEXT,

    -- Key Findings
    executive_summary TEXT,
    key_findings JSONB DEFAULT '[]',
    success_factors JSONB DEFAULT '[]',
    challenges_encountered JSONB DEFAULT '[]',
    lessons_learned JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',

    -- Supporting Data
    charts_graphs JSONB DEFAULT '[]',
    data_tables JSONB DEFAULT '[]',
    quotes_testimonials JSONB DEFAULT '[]',
    statistical_significance DECIMAL(3,2),

    -- Metadata
    peer_reviewed BOOLEAN DEFAULT false,
    reviewed_by VARCHAR(255),
    review_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- CASE STUDIES TABLE
-- ============================================================================
CREATE TABLE case_studies (
    case_study_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID REFERENCES content_library(content_id) ON DELETE CASCADE,

    -- Organization Profile
    company_name VARCHAR(255),
    is_anonymous BOOLEAN DEFAULT false,
    industry VARCHAR(100) NOT NULL,
    company_size VARCHAR(50) NOT NULL,
    employee_count INTEGER,
    annual_revenue DECIMAL(15,2),
    geographic_region VARCHAR(100),
    headquarters_location VARCHAR(100),

    -- Implementation Details
    implementation_start_date DATE,
    implementation_end_date DATE,
    implementation_duration_weeks INTEGER,
    deployment_model VARCHAR(50), -- phased, big_bang, pilot_first
    users_deployed INTEGER,
    departments_involved JSONB DEFAULT '[]',
    total_budget DECIMAL(12,2),

    -- Business Context
    business_objectives JSONB DEFAULT '[]',
    business_challenges JSONB DEFAULT '[]',
    technical_challenges JSONB DEFAULT '[]',
    organizational_challenges JSONB DEFAULT '[]',

    -- Solution Approach
    solutions_implemented JSONB DEFAULT '[]',
    implementation_strategy TEXT,
    change_management_approach TEXT,
    training_approach TEXT,
    support_model TEXT,

    -- Results & Outcomes
    productivity_improvement DECIMAL(5,2),
    cost_savings DECIMAL(12,2),
    revenue_increase DECIMAL(12,2),
    roi_achieved DECIMAL(8,2),
    payback_period_months INTEGER,
    time_to_value_weeks INTEGER,

    -- Detailed Metrics
    kpis_measured JSONB DEFAULT '[]',
    before_metrics JSONB DEFAULT '{}',
    after_metrics JSONB DEFAULT '{}',
    percentage_improvements JSONB DEFAULT '{}',

    -- Adoption Metrics
    adoption_rate_achieved DECIMAL(5,2),
    user_satisfaction_score DECIMAL(5,2),
    nps_score DECIMAL(5,2),
    champion_count INTEGER,

    -- Qualitative Outcomes
    qualitative_benefits JSONB DEFAULT '[]',
    unexpected_benefits JSONB DEFAULT '[]',
    cultural_impact TEXT,
    innovation_examples JSONB DEFAULT '[]',

    -- Quotes & Testimonials
    executive_quotes JSONB DEFAULT '[]',
    manager_quotes JSONB DEFAULT '[]',
    user_testimonials JSONB DEFAULT '[]',

    -- Media
    photos JSONB DEFAULT '[]',
    videos JSONB DEFAULT '[]',
    infographics JSONB DEFAULT '[]',

    -- Lessons & Best Practices
    success_factors JSONB DEFAULT '[]',
    lessons_learned JSONB DEFAULT '[]',
    common_pitfalls JSONB DEFAULT '[]',
    advice_for_others TEXT,
    best_practices JSONB DEFAULT '[]',

    -- Validation
    customer_approved BOOLEAN DEFAULT false,
    approval_date DATE,
    approved_by VARCHAR(255),

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- VIDEO CONTENT TABLE
-- ============================================================================
CREATE TABLE video_content (
    video_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID REFERENCES content_library(content_id) ON DELETE CASCADE,

    -- Video Details
    video_type VARCHAR(50), -- tutorial, webinar, demo, interview, testimonial
    video_url VARCHAR(500) NOT NULL,
    embed_code TEXT,
    thumbnail_url VARCHAR(500),
    preview_gif_url VARCHAR(500),

    -- Technical Details
    video_format VARCHAR(20), -- mp4, webm, mov
    resolution VARCHAR(20), -- 1080p, 4K, etc.
    file_size_mb DECIMAL(10,2),
    duration_seconds INTEGER,
    has_subtitles BOOLEAN DEFAULT false,
    has_transcript BOOLEAN DEFAULT false,

    -- Content Structure
    chapters JSONB DEFAULT '[]', -- Array of {title, start_time, end_time}
    topics_covered JSONB DEFAULT '[]',
    key_takeaways JSONB DEFAULT '[]',

    -- Speaker/Presenter
    presenter_name VARCHAR(255),
    presenter_title VARCHAR(255),
    presenter_company VARCHAR(255),
    presenter_bio TEXT,

    -- Transcript & Captions
    transcript TEXT,
    caption_files JSONB DEFAULT '[]', -- Array of {language, url}

    -- Interactive Elements
    has_quiz BOOLEAN DEFAULT false,
    quiz_data JSONB DEFAULT '{}',
    interactive_elements JSONB DEFAULT '[]',

    -- Engagement Metrics
    views_count INTEGER DEFAULT 0,
    unique_viewers INTEGER DEFAULT 0,
    average_watch_duration_seconds INTEGER,
    completion_rate DECIMAL(5,2),
    engagement_score DECIMAL(5,2),

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TEMPLATES TABLE
-- ============================================================================
CREATE TABLE templates (
    template_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID REFERENCES content_library(content_id) ON DELETE CASCADE,

    -- Template Details
    template_type VARCHAR(100) NOT NULL, -- implementation_plan, communication, assessment, report, governance, training
    template_format VARCHAR(50), -- docx, pptx, xlsx, pdf, html
    template_category VARCHAR(100),

    -- Template Content
    template_file_url VARCHAR(500) NOT NULL,
    preview_image_url VARCHAR(500),
    editable_fields JSONB DEFAULT '[]',

    -- Customization
    is_customizable BOOLEAN DEFAULT true,
    customization_instructions TEXT,
    variables JSONB DEFAULT '[]', -- Merge fields/variables
    supports_branding BOOLEAN DEFAULT true,

    -- Usage
    use_cases JSONB DEFAULT '[]',
    instructions TEXT,
    examples JSONB DEFAULT '[]',

    -- Related Resources
    related_templates JSONB DEFAULT '[]',
    required_templates JSONB DEFAULT '[]',

    -- Metrics
    download_count INTEGER DEFAULT 0,
    usage_count INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2),

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- DOCUMENTATION TABLE
-- ============================================================================
CREATE TABLE documentation (
    doc_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID REFERENCES content_library(content_id) ON DELETE CASCADE,

    -- Documentation Type
    doc_type VARCHAR(50) NOT NULL, -- technical, user_guide, admin_guide, api_reference, troubleshooting, faq
    doc_category VARCHAR(100),

    -- Content Structure
    sections JSONB DEFAULT '[]', -- Array of section objects
    table_of_contents JSONB DEFAULT '[]',
    related_docs JSONB DEFAULT '[]',

    -- Format
    content_format VARCHAR(20), -- markdown, html, pdf
    markdown_content TEXT,
    html_content TEXT,

    -- Navigation
    parent_doc_id UUID REFERENCES documentation(doc_id),
    order_index INTEGER,
    breadcrumb_path JSONB DEFAULT '[]',

    -- Code Samples
    has_code_samples BOOLEAN DEFAULT false,
    code_samples JSONB DEFAULT '[]',

    -- Interactive Elements
    has_interactive_demo BOOLEAN DEFAULT false,
    demo_url VARCHAR(500),

    -- Searchability
    search_content TEXT, -- Optimized for full-text search
    indexed BOOLEAN DEFAULT false,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- CONTENT COLLECTIONS TABLE
-- ============================================================================
CREATE TABLE content_collections (
    collection_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_name VARCHAR(255) NOT NULL,
    collection_description TEXT,

    -- Collection Type
    collection_type VARCHAR(50), -- curated, auto_generated, learning_path, topic_bundle

    -- Content Items
    content_items JSONB DEFAULT '[]', -- Array of content_id references
    item_count INTEGER DEFAULT 0,

    -- Organization
    display_order JSONB DEFAULT '[]',
    sections JSONB DEFAULT '[]',

    -- Metadata
    tags JSONB DEFAULT '[]',
    target_audience VARCHAR(100),
    created_by UUID,
    is_public BOOLEAN DEFAULT true,

    -- Engagement
    view_count INTEGER DEFAULT 0,
    bookmark_count INTEGER DEFAULT 0,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- CONTENT RATINGS TABLE
-- ============================================================================
CREATE TABLE content_ratings (
    rating_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES content_library(content_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(organization_id) ON DELETE CASCADE,

    -- Rating
    rating INTEGER NOT NULL, -- 1-5 stars
    review_text TEXT,
    review_title VARCHAR(255),

    -- Helpful Metrics
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,

    -- Status
    is_verified_user BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT true,
    moderated BOOLEAN DEFAULT false,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_rating CHECK (rating >= 1 AND rating <= 5),
    CONSTRAINT unique_user_content_rating UNIQUE (user_id, content_id)
);

-- ============================================================================
-- CONTENT VIEWS TABLE
-- ============================================================================
CREATE TABLE content_views (
    view_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES content_library(content_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(organization_id),

    -- View Details
    view_date DATE NOT NULL DEFAULT CURRENT_DATE,
    view_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    view_duration_seconds INTEGER,
    completed BOOLEAN DEFAULT false,
    completion_percentage DECIMAL(5,2),

    -- Context
    referrer_url VARCHAR(500),
    device_type VARCHAR(50), -- desktop, mobile, tablet
    browser VARCHAR(100),

    -- Engagement
    downloaded BOOLEAN DEFAULT false,
    bookmarked BOOLEAN DEFAULT false,
    shared BOOLEAN DEFAULT false,

    -- Session
    session_id VARCHAR(255),

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Content Library indexes
CREATE INDEX idx_content_library_type ON content_library(content_type);
CREATE INDEX idx_content_library_category ON content_library(category);
CREATE INDEX idx_content_library_status ON content_library(status);
CREATE INDEX idx_content_library_language ON content_library(language);
CREATE INDEX idx_content_library_published ON content_library(published_date);
CREATE INDEX idx_content_library_featured ON content_library(featured);
CREATE INDEX idx_content_library_tags ON content_library USING GIN(tags);
CREATE INDEX idx_content_library_keywords ON content_library USING GIN(keywords);

-- Full-text search indexes
CREATE INDEX idx_content_library_search ON content_library USING GIN(to_tsvector('english', content_title || ' ' || COALESCE(description, '') || ' ' || COALESCE(abstract, '')));

-- ROI Whitepapers indexes
CREATE INDEX idx_whitepapers_industry ON roi_whitepapers(industry);
CREATE INDEX idx_whitepapers_company_size ON roi_whitepapers(company_size);

-- Case Studies indexes
CREATE INDEX idx_case_studies_industry ON case_studies(industry);
CREATE INDEX idx_case_studies_company_size ON case_studies(company_size);
CREATE INDEX idx_case_studies_approved ON case_studies(customer_approved);

-- Content Ratings indexes
CREATE INDEX idx_content_ratings_content_id ON content_ratings(content_id);
CREATE INDEX idx_content_ratings_rating ON content_ratings(rating);

-- Content Views indexes
CREATE INDEX idx_content_views_content_id ON content_views(content_id);
CREATE INDEX idx_content_views_user_id ON content_views(user_id);
CREATE INDEX idx_content_views_date ON content_views(view_date);

-- ============================================================================
-- VIEWS FOR REPORTING
-- ============================================================================

-- Popular Content View
CREATE VIEW popular_content AS
SELECT
    cl.content_id,
    cl.content_title,
    cl.content_type,
    cl.category,
    cl.view_count,
    cl.download_count,
    cl.average_rating,
    cl.rating_count,
    cl.published_date,
    (cl.view_count * 0.4 + cl.download_count * 0.3 + COALESCE(cl.average_rating, 0) * 20 * 0.3) AS popularity_score
FROM content_library cl
WHERE cl.status = 'published' AND cl.active = true
ORDER BY popularity_score DESC;

-- Content Performance View
CREATE VIEW content_performance AS
SELECT
    cl.content_id,
    cl.content_title,
    cl.content_type,
    COUNT(DISTINCT cv.user_id) AS unique_viewers,
    COUNT(cv.view_id) AS total_views,
    AVG(cv.view_duration_seconds) AS avg_view_duration,
    AVG(cv.completion_percentage) AS avg_completion_rate,
    COUNT(CASE WHEN cv.downloaded THEN 1 END) AS download_count,
    AVG(cr.rating) AS average_rating,
    COUNT(cr.rating_id) AS rating_count
FROM content_library cl
LEFT JOIN content_views cv ON cl.content_id = cv.content_id
LEFT JOIN content_ratings cr ON cl.content_id = cr.content_id
WHERE cl.status = 'published'
GROUP BY cl.content_id, cl.content_title, cl.content_type;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_content_library_updated_at BEFORE UPDATE ON content_library
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whitepapers_updated_at BEFORE UPDATE ON roi_whitepapers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_case_studies_updated_at BEFORE UPDATE ON case_studies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_content_updated_at BEFORE UPDATE ON video_content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE content_library IS 'Central content repository for all platform content';
COMMENT ON TABLE roi_whitepapers IS 'ROI whitepapers with detailed study methodology and findings';
COMMENT ON TABLE case_studies IS 'Customer case studies with implementation details and outcomes';
COMMENT ON TABLE video_content IS 'Video tutorials, webinars, and other video content';
COMMENT ON TABLE templates IS 'Downloadable templates for implementation and management';
COMMENT ON TABLE documentation IS 'Technical and user documentation with structured content';
COMMENT ON TABLE content_collections IS 'Curated collections and bundles of related content';
COMMENT ON TABLE content_ratings IS 'User ratings and reviews for content items';
COMMENT ON TABLE content_views IS 'Detailed view tracking and engagement metrics';
