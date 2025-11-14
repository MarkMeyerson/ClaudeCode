-- ============================================================================
-- NAIOS Platform - Financial Hub Database Schema
-- Version: 1.0.0
-- Description: Complete fund accounting and financial management schema
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CHART OF ACCOUNTS TABLE
-- Fund accounting chart of accounts
-- ============================================================================
CREATE TABLE accounts (
    -- Primary identification
    account_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_number VARCHAR(50) UNIQUE NOT NULL,
    account_code VARCHAR(20) UNIQUE NOT NULL,

    -- Account details
    account_name VARCHAR(255) NOT NULL,
    account_description TEXT,
    account_type VARCHAR(50) NOT NULL CHECK (account_type IN (
        'Asset', 'Liability', 'Net Asset', 'Revenue',
        'Expense', 'Equity'
    )),
    account_category VARCHAR(100) NOT NULL CHECK (account_category IN (
        -- Assets
        'Current Assets', 'Fixed Assets', 'Investments', 'Other Assets',
        -- Liabilities
        'Current Liabilities', 'Long-term Liabilities', 'Deferred Revenue',
        -- Net Assets
        'Unrestricted Net Assets', 'Temporarily Restricted', 'Permanently Restricted',
        -- Revenue
        'Contributions', 'Grants', 'Program Revenue', 'Investment Income', 'Other Revenue',
        -- Expenses
        'Program Services', 'Management and General', 'Fundraising', 'Other Expenses'
    )),
    account_subcategory VARCHAR(100),

    -- Hierarchy
    parent_account_id UUID REFERENCES accounts(account_id),
    account_level INTEGER DEFAULT 1,
    account_path VARCHAR(500),
    is_parent BOOLEAN DEFAULT FALSE,

    -- Balance information
    normal_balance VARCHAR(10) NOT NULL CHECK (normal_balance IN ('Debit', 'Credit')),
    current_balance DECIMAL(15, 2) DEFAULT 0,
    beginning_balance DECIMAL(15, 2) DEFAULT 0,
    budget_amount DECIMAL(15, 2) DEFAULT 0,
    ytd_actual DECIMAL(15, 2) DEFAULT 0,
    ytd_budget DECIMAL(15, 2) DEFAULT 0,
    variance DECIMAL(15, 2) GENERATED ALWAYS AS (ytd_actual - ytd_budget) STORED,

    -- Fund accounting
    fund_type VARCHAR(50) CHECK (fund_type IN (
        'Unrestricted', 'Temporarily Restricted', 'Permanently Restricted',
        'Board Designated', 'Donor Restricted'
    )),
    restriction_type VARCHAR(100),

    -- Restricted fund balances
    restricted_balance DECIMAL(15, 2) DEFAULT 0,
    temporarily_restricted DECIMAL(15, 2) DEFAULT 0,
    permanently_restricted DECIMAL(15, 2) DEFAULT 0,
    board_designated DECIMAL(15, 2) DEFAULT 0,

    -- Functional expense classification
    functional_classification VARCHAR(100) CHECK (functional_classification IN (
        'Program Services', 'Management and General', 'Fundraising', 'N/A'
    )),
    program_allocation_percentage DECIMAL(5, 2),

    -- Department and program assignment
    department_id UUID,
    department_name VARCHAR(255),
    program_id UUID,
    program_name VARCHAR(255),
    grant_id UUID,
    project_id UUID,

    -- Class and location tracking
    class_id UUID,
    class_name VARCHAR(100),
    location_id UUID,
    location_name VARCHAR(100),

    -- Tax and reporting
    tax_line_mapping VARCHAR(100),
    form_990_line VARCHAR(50),
    fasb_classification VARCHAR(100),
    financial_statement_line VARCHAR(255),

    -- Reconciliation
    reconciliation_status VARCHAR(50) CHECK (reconciliation_status IN (
        'Reconciled', 'Pending', 'Not Required', 'Discrepancy'
    )),
    last_reconciled_date DATE,
    reconciled_balance DECIMAL(15, 2),

    -- Status and controls
    active_status BOOLEAN DEFAULT TRUE,
    allow_manual_entry BOOLEAN DEFAULT TRUE,
    require_department BOOLEAN DEFAULT FALSE,
    require_program BOOLEAN DEFAULT FALSE,
    require_grant BOOLEAN DEFAULT FALSE,

    -- Metadata
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    modified_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modified_by UUID,
    effective_date DATE,
    end_date DATE,

    -- Audit trail
    audit_notes TEXT,
    last_modified_by UUID,

    -- Additional data
    custom_fields JSONB,
    notes TEXT,
    tags TEXT[]
);

-- Indexes for accounts
CREATE INDEX idx_accounts_number ON accounts(account_number);
CREATE INDEX idx_accounts_code ON accounts(account_code);
CREATE INDEX idx_accounts_type ON accounts(account_type);
CREATE INDEX idx_accounts_category ON accounts(account_category);
CREATE INDEX idx_accounts_parent ON accounts(parent_account_id);
CREATE INDEX idx_accounts_department ON accounts(department_id);
CREATE INDEX idx_accounts_program ON accounts(program_id);
CREATE INDEX idx_accounts_active ON accounts(active_status) WHERE active_status = TRUE;

-- ============================================================================
-- TRANSACTIONS TABLE
-- All financial transactions
-- ============================================================================
CREATE TABLE transactions (
    -- Primary identification
    transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_number VARCHAR(50) UNIQUE NOT NULL,

    -- Transaction details
    transaction_date DATE NOT NULL,
    posting_date DATE,
    effective_date DATE,
    period_year INTEGER,
    period_month INTEGER CHECK (period_month BETWEEN 1 AND 12),
    fiscal_year INTEGER,
    fiscal_period INTEGER,

    -- Account and amount
    account_id UUID NOT NULL REFERENCES accounts(account_id),
    debit_amount DECIMAL(15, 2) DEFAULT 0 CHECK (debit_amount >= 0),
    credit_amount DECIMAL(15, 2) DEFAULT 0 CHECK (credit_amount >= 0),
    net_amount DECIMAL(15, 2) GENERATED ALWAYS AS (debit_amount - credit_amount) STORED,

    -- Transaction classification
    description TEXT NOT NULL,
    memo TEXT,
    reference_number VARCHAR(100),
    external_reference VARCHAR(100),
    transaction_type VARCHAR(100) NOT NULL CHECK (transaction_type IN (
        'Journal Entry', 'Cash Receipt', 'Cash Disbursement', 'Transfer',
        'Adjustment', 'Accrual', 'Depreciation', 'Allocation',
        'Donation', 'Grant Receipt', 'Program Revenue', 'Investment',
        'Payroll', 'Invoice', 'Bill Payment', 'Other'
    )),
    transaction_source VARCHAR(100) CHECK (transaction_source IN (
        'Manual', 'Import', 'Integration', 'Automatic', 'Recurring', 'System'
    )),

    -- Payment details
    payment_method VARCHAR(50) CHECK (payment_method IN (
        'Check', 'ACH', 'Wire', 'Credit Card', 'Debit Card',
        'Cash', 'PayPal', 'Stripe', 'Other Electronic', 'N/A'
    )),
    check_number VARCHAR(50),
    payment_reference VARCHAR(100),

    -- Entity references
    vendor_id UUID,
    vendor_name VARCHAR(255),
    customer_id UUID,
    customer_name VARCHAR(255),
    employee_id UUID,
    employee_name VARCHAR(255),
    donor_id UUID,

    -- Organizational dimensions
    department_id UUID,
    department_name VARCHAR(255),
    program_id UUID,
    program_name VARCHAR(255),
    grant_id UUID,
    grant_name VARCHAR(255),
    project_id UUID,
    project_name VARCHAR(255),

    -- Additional dimensions
    class_id UUID,
    class_name VARCHAR(100),
    location_id UUID,
    location_name VARCHAR(100),

    -- Fund accounting
    fund_id UUID,
    fund_name VARCHAR(255),
    fund_type VARCHAR(50),
    restricted_fund_id UUID,
    restriction_type VARCHAR(100),
    restriction_purpose TEXT,

    -- Approval workflow
    approval_status VARCHAR(50) DEFAULT 'Pending' CHECK (approval_status IN (
        'Draft', 'Pending', 'Approved', 'Rejected', 'Posted', 'Void'
    )),
    approval_level INTEGER,
    approved_by UUID,
    approval_date TIMESTAMP WITH TIME ZONE,
    approval_notes TEXT,

    -- Posting status
    posted BOOLEAN DEFAULT FALSE,
    posted_by UUID,
    posted_at TIMESTAMP WITH TIME ZONE,
    posting_batch_id UUID,

    -- Reconciliation
    reconciliation_status VARCHAR(50) CHECK (reconciliation_status IN (
        'Unreconciled', 'Reconciled', 'Cleared', 'Void'
    )),
    reconciled BOOLEAN DEFAULT FALSE,
    reconciled_date DATE,
    reconciled_by UUID,
    bank_statement_date DATE,

    -- Voiding
    void_status BOOLEAN DEFAULT FALSE,
    void_date DATE,
    void_reason TEXT,
    voided_by UUID,
    void_transaction_id UUID,

    -- Related documents
    invoice_id UUID,
    invoice_number VARCHAR(100),
    bill_id UUID,
    bill_number VARCHAR(100),
    receipt_id UUID,
    receipt_number VARCHAR(100),

    -- Supporting documentation
    supporting_docs JSONB,
    attachment_urls TEXT[],
    document_count INTEGER DEFAULT 0,

    -- Audit trail
    audit_notes TEXT,
    modification_history JSONB,

    -- Tax information
    tax_deductible BOOLEAN DEFAULT FALSE,
    taxable BOOLEAN DEFAULT FALSE,
    tax_category VARCHAR(100),
    tax_year INTEGER,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    last_modified_by UUID,

    -- Integration tracking
    imported_from VARCHAR(100),
    import_batch_id UUID,
    sync_id VARCHAR(255),
    external_id VARCHAR(255),

    -- Additional data
    custom_fields JSONB,
    metadata JSONB,
    notes TEXT,
    tags TEXT[],

    -- Constraints
    CONSTRAINT check_debit_or_credit CHECK (
        (debit_amount > 0 AND credit_amount = 0) OR
        (credit_amount > 0 AND debit_amount = 0)
    )
);

-- Indexes for transactions
CREATE INDEX idx_transactions_number ON transactions(transaction_number);
CREATE INDEX idx_transactions_date ON transactions(transaction_date DESC);
CREATE INDEX idx_transactions_posting_date ON transactions(posting_date DESC);
CREATE INDEX idx_transactions_account ON transactions(account_id);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_vendor ON transactions(vendor_id);
CREATE INDEX idx_transactions_customer ON transactions(customer_id);
CREATE INDEX idx_transactions_employee ON transactions(employee_id);
CREATE INDEX idx_transactions_donor ON transactions(donor_id);
CREATE INDEX idx_transactions_department ON transactions(department_id);
CREATE INDEX idx_transactions_program ON transactions(program_id);
CREATE INDEX idx_transactions_grant ON transactions(grant_id);
CREATE INDEX idx_transactions_fund ON transactions(fund_id);
CREATE INDEX idx_transactions_approval ON transactions(approval_status);
CREATE INDEX idx_transactions_posted ON transactions(posted) WHERE posted = TRUE;
CREATE INDEX idx_transactions_reconciled ON transactions(reconciled);
CREATE INDEX idx_transactions_fiscal ON transactions(fiscal_year, fiscal_period);
CREATE INDEX idx_transactions_external_id ON transactions(external_id);

-- ============================================================================
-- BUDGETS TABLE
-- Budget planning and tracking
-- ============================================================================
CREATE TABLE budgets (
    -- Primary identification
    budget_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_code VARCHAR(50) UNIQUE NOT NULL,

    -- Budget details
    fiscal_year INTEGER NOT NULL,
    budget_name VARCHAR(255) NOT NULL,
    budget_description TEXT,
    budget_type VARCHAR(50) NOT NULL CHECK (budget_type IN (
        'Operating', 'Capital', 'Program', 'Department',
        'Grant', 'Project', 'Consolidated', 'Revised'
    )),

    -- Status and versions
    status VARCHAR(50) DEFAULT 'Draft' CHECK (status IN (
        'Draft', 'Proposed', 'Under Review', 'Board Review',
        'Approved', 'Active', 'Closed', 'Archived'
    )),
    version_number INTEGER DEFAULT 1,
    is_active_version BOOLEAN DEFAULT FALSE,
    parent_budget_id UUID REFERENCES budgets(budget_id),

    -- Budget totals
    total_revenue_budget DECIMAL(15, 2) NOT NULL DEFAULT 0,
    total_expense_budget DECIMAL(15, 2) NOT NULL DEFAULT 0,
    total_surplus_deficit DECIMAL(15, 2) GENERATED ALWAYS AS (
        total_revenue_budget - total_expense_budget
    ) STORED,

    -- Revenue breakdown
    unrestricted_revenue DECIMAL(15, 2) DEFAULT 0,
    restricted_revenue DECIMAL(15, 2) DEFAULT 0,
    temporarily_restricted DECIMAL(15, 2) DEFAULT 0,
    permanently_restricted DECIMAL(15, 2) DEFAULT 0,

    -- Expense breakdown by function
    personnel_costs DECIMAL(15, 2) DEFAULT 0,
    operating_expenses DECIMAL(15, 2) DEFAULT 0,
    program_expenses DECIMAL(15, 2) DEFAULT 0,
    fundraising_expenses DECIMAL(15, 2) DEFAULT 0,
    admin_expenses DECIMAL(15, 2) DEFAULT 0,
    capital_expenses DECIMAL(15, 2) DEFAULT 0,

    -- Specific line items
    depreciation DECIMAL(15, 2) DEFAULT 0,
    interest_expense DECIMAL(15, 2) DEFAULT 0,
    debt_service DECIMAL(15, 2) DEFAULT 0,
    contingency DECIMAL(15, 2) DEFAULT 0,

    -- Board-related
    board_approved BOOLEAN DEFAULT FALSE,
    approval_date DATE,
    approved_by UUID,
    board_resolution_number VARCHAR(100),

    -- Revision tracking
    revision_number INTEGER DEFAULT 0,
    revision_date DATE,
    revision_reason TEXT,
    previous_version_id UUID,

    -- Assumptions and methodology
    assumptions TEXT,
    methodology TEXT,
    inflation_rate DECIMAL(5, 2),
    growth_rate DECIMAL(5, 2),

    -- Variance thresholds
    variance_threshold DECIMAL(5, 2) DEFAULT 10.0,
    alert_threshold DECIMAL(5, 2) DEFAULT 15.0,

    -- Period budgets (monthly/quarterly)
    monthly_budgets JSONB,
    quarterly_budgets JSONB,

    -- Dimensional budgets
    department_budgets JSONB,
    program_budgets JSONB,
    grant_budgets JSONB,
    fund_budgets JSONB,

    -- Comparison metrics
    comparison_to_prior_year DECIMAL(15, 2),
    prior_year_actual DECIMAL(15, 2),
    percent_change_from_prior DECIMAL(5, 2),

    -- Notes and documentation
    budget_narrative TEXT,
    executive_summary TEXT,
    key_initiatives TEXT[],
    risk_factors TEXT[],
    opportunities TEXT[],

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    submitted_date TIMESTAMP WITH TIME ZONE,
    submitted_by UUID,

    -- Additional data
    attachments JSONB,
    custom_fields JSONB,
    notes TEXT,
    tags TEXT[]
);

-- Indexes for budgets
CREATE INDEX idx_budgets_fiscal_year ON budgets(fiscal_year);
CREATE INDEX idx_budgets_code ON budgets(budget_code);
CREATE INDEX idx_budgets_type ON budgets(budget_type);
CREATE INDEX idx_budgets_status ON budgets(status);
CREATE INDEX idx_budgets_active ON budgets(is_active_version) WHERE is_active_version = TRUE;

-- ============================================================================
-- RESTRICTED_FUNDS TABLE
-- Management of restricted and designated funds
-- ============================================================================
CREATE TABLE restricted_funds (
    -- Primary identification
    fund_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fund_number VARCHAR(50) UNIQUE NOT NULL,
    fund_name VARCHAR(255) NOT NULL,

    -- Fund classification
    fund_type VARCHAR(50) NOT NULL CHECK (fund_type IN (
        'Temporarily Restricted', 'Permanently Restricted',
        'Board Designated', 'Endowment', 'Quasi-Endowment',
        'Operating Reserve', 'Capital Reserve', 'Program Fund'
    )),
    restriction_level VARCHAR(50) CHECK (restriction_level IN (
        'Donor Restricted', 'Grantor Restricted', 'Board Restricted',
        'Legally Restricted', 'Contractually Restricted'
    )),

    -- Donor/grantor information
    donor_id UUID,
    donor_name VARCHAR(255),
    grant_id UUID,
    grant_name VARCHAR(255),
    establishing_document VARCHAR(255),
    legal_reference VARCHAR(255),

    -- Restriction details
    restriction_description TEXT NOT NULL,
    restriction_category VARCHAR(100),
    purpose TEXT NOT NULL,
    allowable_uses TEXT[],
    prohibited_uses TEXT[],

    -- Timeline
    start_date DATE NOT NULL,
    end_date DATE,
    perpetual BOOLEAN DEFAULT FALSE,
    time_restricted BOOLEAN DEFAULT FALSE,
    purpose_restricted BOOLEAN DEFAULT TRUE,

    -- Financial tracking
    original_amount DECIMAL(15, 2) NOT NULL,
    current_balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
    principal_balance DECIMAL(15, 2) DEFAULT 0,
    earnings_balance DECIMAL(15, 2) DEFAULT 0,
    spent_amount DECIMAL(15, 2) DEFAULT 0,
    available_balance DECIMAL(15, 2) GENERATED ALWAYS AS (
        current_balance - COALESCE(committed_amount, 0)
    ) STORED,
    committed_amount DECIMAL(15, 2) DEFAULT 0,

    -- Investment tracking
    investment_earnings DECIMAL(15, 2) DEFAULT 0,
    realized_gains DECIMAL(15, 2) DEFAULT 0,
    unrealized_gains DECIMAL(15, 2) DEFAULT 0,
    investment_fees DECIMAL(15, 2) DEFAULT 0,

    -- Administrative fees
    admin_fee_rate DECIMAL(5, 2),
    admin_fees_charged DECIMAL(15, 2) DEFAULT 0,
    admin_fee_frequency VARCHAR(50),

    -- Spending rules (for endowments)
    spending_policy VARCHAR(100),
    spending_rate DECIMAL(5, 2),
    minimum_balance DECIMAL(15, 2),
    spending_cap DECIMAL(15, 2),

    -- Release conditions
    release_conditions TEXT[],
    conditions_met BOOLEAN DEFAULT FALSE,
    release_date DATE,
    released_amount DECIMAL(15, 2) DEFAULT 0,
    release_authorization UUID,
    release_notes TEXT,

    -- Compliance
    compliance_status VARCHAR(50) CHECK (compliance_status IN (
        'Compliant', 'Under Review', 'Non-Compliant', 'Remediation', 'Resolved'
    )),
    compliance_notes TEXT,
    last_compliance_review DATE,
    next_compliance_review DATE,

    -- Reporting requirements
    reporting_requirements TEXT[],
    reporting_frequency VARCHAR(50),
    last_report_date DATE,
    next_report_date DATE,
    reports_submitted JSONB,

    -- Program/department assignment
    program_id UUID,
    program_name VARCHAR(255),
    department_id UUID,
    department_name VARCHAR(255),

    -- Stewardship
    steward_id UUID,
    steward_name VARCHAR(255),
    acknowledgment_requirements TEXT,
    recognition_level VARCHAR(100),

    -- Status
    active_status BOOLEAN DEFAULT TRUE,
    closed_date DATE,
    closed_reason TEXT,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,

    -- Additional data
    custom_fields JSONB,
    attachments JSONB,
    notes TEXT,
    tags TEXT[]
);

-- Indexes for restricted_funds
CREATE INDEX idx_restricted_funds_number ON restricted_funds(fund_number);
CREATE INDEX idx_restricted_funds_type ON restricted_funds(fund_type);
CREATE INDEX idx_restricted_funds_donor ON restricted_funds(donor_id);
CREATE INDEX idx_restricted_funds_grant ON restricted_funds(grant_id);
CREATE INDEX idx_restricted_funds_program ON restricted_funds(program_id);
CREATE INDEX idx_restricted_funds_active ON restricted_funds(active_status) WHERE active_status = TRUE;
CREATE INDEX idx_restricted_funds_balance ON restricted_funds(current_balance);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_restricted_funds_updated_at BEFORE UPDATE ON restricted_funds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MATERIALIZED VIEWS FOR PERFORMANCE
-- ============================================================================

-- Budget vs Actual Summary
CREATE MATERIALIZED VIEW mv_budget_vs_actual AS
SELECT
    a.account_id,
    a.account_number,
    a.account_name,
    a.account_type,
    a.account_category,
    b.fiscal_year,
    b.budget_id,
    a.budget_amount,
    a.ytd_actual,
    a.ytd_budget,
    a.variance,
    CASE WHEN a.budget_amount > 0
        THEN (a.ytd_actual / a.budget_amount * 100)
        ELSE 0
    END AS percent_of_budget
FROM accounts a
LEFT JOIN budgets b ON b.is_active_version = TRUE
WHERE a.active_status = TRUE;

CREATE UNIQUE INDEX ON mv_budget_vs_actual (account_id, fiscal_year);

-- ============================================================================
-- END OF FINANCIAL HUB SCHEMA
-- ============================================================================
