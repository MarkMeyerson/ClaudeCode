/**
 * NAIOS Platform - Shared TypeScript Types and Interfaces
 *
 * This file contains all shared types, interfaces, and enums used across
 * the NAIOS platform services. It ensures type safety and consistency
 * across all microservices.
 *
 * @module shared/types
 * @version 1.0.0
 */

// ============================================================================
// COMMON TYPES
// ============================================================================

/**
 * UUID type alias for better type documentation
 */
export type UUID = string;

/**
 * ISO 8601 date string
 */
export type ISODateString = string;

/**
 * Decimal number represented as string for precision
 */
export type DecimalString = string;

/**
 * JSON-compatible value
 */
export type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
export interface JSONObject {
  [key: string]: JSONValue;
}
export type JSONArray = JSONValue[];

// ============================================================================
// USER AND AUTHENTICATION TYPES
// ============================================================================

/**
 * User role enum
 */
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ORG_ADMIN = 'org_admin',
  PROGRAM_MANAGER = 'program_manager',
  FUNDRAISER = 'fundraiser',
  VOLUNTEER_COORDINATOR = 'volunteer_coordinator',
  FINANCE_MANAGER = 'finance_manager',
  GRANT_WRITER = 'grant_writer',
  BOARD_MEMBER = 'board_member',
  STAFF = 'staff',
  VOLUNTEER = 'volunteer',
  DONOR = 'donor',
  READ_ONLY = 'read_only'
}

/**
 * User interface
 */
export interface User {
  user_id: UUID;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  organization_id?: UUID;
  permissions: string[];
  is_active: boolean;
  last_login?: ISODateString;
  created_at: ISODateString;
  updated_at: ISODateString;
}

/**
 * JWT Payload interface
 */
export interface JWTPayload {
  user_id: UUID;
  email: string;
  role: UserRole;
  organization_id?: UUID;
  permissions: string[];
  iat: number;
  exp: number;
}

/**
 * Authentication request
 */
export interface AuthRequest {
  email: string;
  password: string;
  remember_me?: boolean;
}

/**
 * Authentication response
 */
export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: ResponseMetadata;
}

/**
 * API Error structure
 */
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  stack?: string;
  timestamp: ISODateString;
  request_id?: string;
}

/**
 * Response metadata for pagination and additional info
 */
export interface ResponseMetadata {
  page?: number;
  per_page?: number;
  total_count?: number;
  total_pages?: number;
  has_next_page?: boolean;
  has_previous_page?: boolean;
  request_id?: string;
  execution_time_ms?: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    per_page: number;
    total_count: number;
    total_pages: number;
    has_next_page: boolean;
    has_previous_page: boolean;
  };
}

// ============================================================================
// QUERY AND FILTER TYPES
// ============================================================================

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  per_page?: number;
  offset?: number;
  limit?: number;
}

/**
 * Sorting parameters
 */
export interface SortParams {
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

/**
 * Filter operators
 */
export enum FilterOperator {
  EQUALS = 'eq',
  NOT_EQUALS = 'ne',
  GREATER_THAN = 'gt',
  GREATER_THAN_OR_EQUAL = 'gte',
  LESS_THAN = 'lt',
  LESS_THAN_OR_EQUAL = 'lte',
  IN = 'in',
  NOT_IN = 'nin',
  LIKE = 'like',
  ILIKE = 'ilike',
  IS_NULL = 'is_null',
  IS_NOT_NULL = 'is_not_null',
  BETWEEN = 'between',
  CONTAINS = 'contains'
}

/**
 * Filter condition
 */
export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: any;
}

/**
 * Query parameters
 */
export interface QueryParams extends PaginationParams, SortParams {
  filters?: FilterCondition[];
  search?: string;
  fields?: string[];
  include?: string[];
}

// ============================================================================
// ASSESSMENT TYPES
// ============================================================================

/**
 * Assessment status enum
 */
export enum AssessmentStatus {
  PLANNED = 'Planned',
  IN_PROGRESS = 'In Progress',
  DATA_COLLECTION = 'Data Collection',
  ANALYSIS = 'Analysis',
  REVIEW = 'Review',
  COMPLETED = 'Completed',
  APPROVED = 'Approved',
  ARCHIVED = 'Archived'
}

/**
 * Assessment type enum
 */
export enum AssessmentType {
  INITIAL = 'Initial Assessment',
  FOLLOW_UP = 'Follow-up Assessment',
  ANNUAL = 'Annual Review',
  PROGRAM = 'Program Assessment',
  TECHNOLOGY = 'Technology Assessment',
  CAPACITY = 'Capacity Assessment',
  READINESS = 'Readiness Assessment',
  MATURITY = 'Maturity Assessment',
  CUSTOM = 'Custom Assessment'
}

/**
 * Maturity level enum
 */
export enum MaturityLevel {
  INITIAL = 1,
  DEVELOPING = 2,
  DEFINED = 3,
  MANAGED = 4,
  OPTIMIZING = 5
}

/**
 * Organization interface
 */
export interface Organization {
  org_id: UUID;
  ein: string;
  name: string;
  legal_name?: string;
  legal_structure?: string;
  tax_status?: string;
  founding_date?: ISODateString;
  mission_statement?: string;
  vision_statement?: string;
  budget_size?: DecimalString;
  employee_count?: number;
  volunteer_count?: number;
  board_size?: number;
  location_city?: string;
  location_state?: string;
  website?: string;
  sector_primary?: string;
  is_active: boolean;
  created_at: ISODateString;
  updated_at: ISODateString;
}

/**
 * Assessment interface
 */
export interface Assessment {
  assessment_id: UUID;
  org_id: UUID;
  assessment_type: AssessmentType;
  assessment_name?: string;
  assessment_date: ISODateString;
  assessor_id?: UUID;
  status: AssessmentStatus;
  overall_score?: number;
  dimension_scores?: JSONObject;
  strengths_identified?: string[];
  weaknesses_identified?: string[];
  opportunities_identified?: string[];
  threats_identified?: string[];
  priority_areas?: string[];
  recommended_actions?: JSONObject;
  created_at: ISODateString;
  updated_at: ISODateString;
}

/**
 * Assessment dimension interface
 */
export interface AssessmentDimension {
  dimension_id: UUID;
  assessment_id: UUID;
  dimension_name: string;
  dimension_category: string;
  current_maturity_level?: MaturityLevel;
  target_maturity_level?: MaturityLevel;
  dimension_score?: number;
  gap_analysis?: string;
  improvement_priorities?: string[];
  created_at: ISODateString;
  updated_at: ISODateString;
}

// ============================================================================
// DONOR TYPES
// ============================================================================

/**
 * Donor type enum
 */
export enum DonorType {
  INDIVIDUAL = 'Individual',
  FAMILY = 'Family',
  CORPORATION = 'Corporation',
  FOUNDATION = 'Foundation',
  TRUST = 'Trust',
  ESTATE = 'Estate',
  GOVERNMENT = 'Government',
  OTHER = 'Other'
}

/**
 * Donor level enum
 */
export enum DonorLevel {
  LEGACY_CIRCLE = 'Legacy Circle',
  MAJOR_DONOR = 'Major Donor',
  LEADERSHIP = 'Leadership',
  SUSTAINER = 'Sustainer',
  CONTRIBUTOR = 'Contributor',
  FRIEND = 'Friend',
  PROSPECT = 'Prospect'
}

/**
 * Donor interface
 */
export interface Donor {
  donor_id: UUID;
  donor_number: string;
  donor_type: DonorType;
  first_name?: string;
  last_name?: string;
  organization_name?: string;
  email_primary?: string;
  phone_primary?: string;
  address_line1?: string;
  city?: string;
  state?: string;
  zip?: string;
  donor_level?: DonorLevel;
  lifetime_giving?: DecimalString;
  first_gift_date?: ISODateString;
  last_gift_date?: ISODateString;
  engagement_score?: number;
  retention_risk_score?: number;
  major_gift_prospect?: boolean;
  planned_giving_prospect?: boolean;
  is_active: boolean;
  created_at: ISODateString;
  updated_at: ISODateString;
}

/**
 * Donation interface
 */
export interface Donation {
  donation_id: UUID;
  donation_number: string;
  donor_id: UUID;
  amount: DecimalString;
  currency: string;
  donation_date: ISODateString;
  payment_method: string;
  campaign_id?: UUID;
  fund_id?: UUID;
  program_id?: UUID;
  designation?: string;
  restriction_type?: string;
  tax_deductible: boolean;
  acknowledgment_sent: boolean;
  receipt_sent: boolean;
  status: string;
  created_at: ISODateString;
  updated_at: ISODateString;
}

// ============================================================================
// FINANCIAL TYPES
// ============================================================================

/**
 * Account type enum
 */
export enum AccountType {
  ASSET = 'Asset',
  LIABILITY = 'Liability',
  NET_ASSET = 'Net Asset',
  REVENUE = 'Revenue',
  EXPENSE = 'Expense',
  EQUITY = 'Equity'
}

/**
 * Transaction type enum
 */
export enum TransactionType {
  JOURNAL_ENTRY = 'Journal Entry',
  CASH_RECEIPT = 'Cash Receipt',
  CASH_DISBURSEMENT = 'Cash Disbursement',
  TRANSFER = 'Transfer',
  ADJUSTMENT = 'Adjustment',
  DONATION = 'Donation',
  GRANT_RECEIPT = 'Grant Receipt',
  PAYROLL = 'Payroll',
  INVOICE = 'Invoice',
  BILL_PAYMENT = 'Bill Payment'
}

/**
 * Account interface
 */
export interface Account {
  account_id: UUID;
  account_number: string;
  account_code: string;
  account_name: string;
  account_type: AccountType;
  account_category: string;
  normal_balance: 'Debit' | 'Credit';
  current_balance: DecimalString;
  budget_amount?: DecimalString;
  active_status: boolean;
  created_date: ISODateString;
  modified_date: ISODateString;
}

/**
 * Transaction interface
 */
export interface Transaction {
  transaction_id: UUID;
  transaction_number: string;
  transaction_date: ISODateString;
  account_id: UUID;
  debit_amount: DecimalString;
  credit_amount: DecimalString;
  description: string;
  transaction_type: TransactionType;
  approval_status: string;
  posted: boolean;
  created_at: ISODateString;
  updated_at: ISODateString;
}

// ============================================================================
// INTEGRATION TYPES
// ============================================================================

/**
 * Integration provider enum
 */
export enum IntegrationProvider {
  NOTION = 'notion',
  HUBSPOT = 'hubspot',
  STRIPE = 'stripe',
  QUICKBOOKS = 'quickbooks',
  MICROSOFT365 = 'microsoft365',
  GOOGLE = 'google',
  MAILCHIMP = 'mailchimp',
  TWILIO = 'twilio',
  SLACK = 'slack',
  ZOOM = 'zoom'
}

/**
 * Integration status enum
 */
export enum IntegrationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  PENDING = 'pending',
  AUTHENTICATING = 'authenticating'
}

/**
 * Integration configuration
 */
export interface IntegrationConfig {
  integration_id: UUID;
  provider: IntegrationProvider;
  organization_id: UUID;
  status: IntegrationStatus;
  credentials: JSONObject;
  settings: JSONObject;
  last_sync?: ISODateString;
  created_at: ISODateString;
  updated_at: ISODateString;
}

// ============================================================================
// WEBHOOK TYPES
// ============================================================================

/**
 * Webhook event type
 */
export enum WebhookEventType {
  DONATION_CREATED = 'donation.created',
  DONATION_UPDATED = 'donation.updated',
  DONOR_CREATED = 'donor.created',
  DONOR_UPDATED = 'donor.updated',
  ASSESSMENT_COMPLETED = 'assessment.completed',
  TRANSACTION_POSTED = 'transaction.posted',
  CAMPAIGN_STARTED = 'campaign.started',
  CAMPAIGN_ENDED = 'campaign.ended'
}

/**
 * Webhook payload
 */
export interface WebhookPayload {
  event: WebhookEventType;
  timestamp: ISODateString;
  data: any;
  organization_id: UUID;
}

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

export type {
  // Add any additional type exports here
};
