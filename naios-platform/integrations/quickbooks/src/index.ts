/**
 * NAIOS Platform - QuickBooks Online Integration
 *
 * Complete integration with QuickBooks Online for accounting and financial management.
 * Supports:
 * - OAuth 2.0 authentication
 * - Chart of accounts management
 * - Transaction processing (invoices, bills, payments, expenses)
 * - Customer and vendor management
 * - Financial reporting and reconciliation
 * - Webhook handling for real-time updates
 * - Bidirectional data sync
 */

import QuickBooks from 'node-quickbooks';
import axios from 'axios';
import { logger } from '@naios/shared/utils/logger';
import { AppError } from '@naios/shared/middleware/error.middleware';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface QuickBooksConfig {
  consumerKey: string;
  consumerSecret: string;
  realmId: string;
  accessToken: string;
  refreshToken: string;
  useSandbox: boolean;
}

interface Account {
  Id?: string;
  Name: string;
  AccountType: 'Bank' | 'Other Current Asset' | 'Fixed Asset' | 'Other Asset' |
                'Accounts Receivable' | 'Equity' | 'Expense' | 'Other Expense' |
                'Cost of Goods Sold' | 'Accounts Payable' | 'Credit Card' |
                'Long Term Liability' | 'Other Current Liability' | 'Income' | 'Other Income';
  AccountSubType: string;
  AcctNum?: string;
  Description?: string;
  Active?: boolean;
  CurrentBalance?: number;
  CurrencyRef?: { value: string };
}

interface Customer {
  Id?: string;
  DisplayName: string;
  GivenName?: string;
  FamilyName?: string;
  CompanyName?: string;
  PrimaryEmailAddr?: { Address: string };
  PrimaryPhone?: { FreeFormNumber: string };
  BillAddr?: Address;
  ShipAddr?: Address;
  Notes?: string;
  Active?: boolean;
  Balance?: number;
  BalanceWithJobs?: number;
  TaxExempt?: boolean;
  PreferredDeliveryMethod?: string;
}

interface Vendor {
  Id?: string;
  DisplayName: string;
  CompanyName?: string;
  GivenName?: string;
  FamilyName?: string;
  PrimaryEmailAddr?: { Address: string };
  PrimaryPhone?: { FreeFormNumber: string };
  BillAddr?: Address;
  WebAddr?: { URI: string };
  Active?: boolean;
  Balance?: number;
  AcctNum?: string;
  Vendor1099?: boolean;
  TaxIdentifier?: string;
}

interface Address {
  Line1?: string;
  Line2?: string;
  City?: string;
  CountrySubDivisionCode?: string; // State/Province
  PostalCode?: string;
  Country?: string;
}

interface Invoice {
  Id?: string;
  CustomerRef: { value: string };
  Line: InvoiceLine[];
  TxnDate?: string;
  DueDate?: string;
  DocNumber?: string;
  PrivateNote?: string;
  CustomerMemo?: { value: string };
  BillEmail?: { Address: string };
  TxnTaxDetail?: any;
  TotalAmt?: number;
  Balance?: number;
  DueDate?: string;
  AllowOnlineACHPayment?: boolean;
  AllowOnlineCreditCardPayment?: boolean;
  EmailStatus?: string;
  PrintStatus?: string;
}

interface InvoiceLine {
  DetailType: 'SalesItemLineDetail' | 'SubTotalLineDetail' | 'DiscountLineDetail';
  Amount: number;
  Description?: string;
  SalesItemLineDetail?: {
    ItemRef: { value: string };
    Qty?: number;
    UnitPrice?: number;
    TaxCodeRef?: { value: string };
  };
}

interface Bill {
  Id?: string;
  VendorRef: { value: string };
  Line: BillLine[];
  TxnDate?: string;
  DueDate?: string;
  DocNumber?: string;
  PrivateNote?: string;
  APAccountRef?: { value: string };
  TotalAmt?: number;
  Balance?: number;
}

interface BillLine {
  DetailType: 'AccountBasedExpenseLineDetail' | 'ItemBasedExpenseLineDetail';
  Amount: number;
  Description?: string;
  AccountBasedExpenseLineDetail?: {
    AccountRef: { value: string };
    BillableStatus?: string;
    TaxCodeRef?: { value: string };
  };
  ItemBasedExpenseLineDetail?: {
    ItemRef: { value: string };
    Qty?: number;
    UnitPrice?: number;
    TaxCodeRef?: { value: string };
  };
}

interface Payment {
  Id?: string;
  CustomerRef: { value: string };
  TotalAmt: number;
  TxnDate?: string;
  PrivateNote?: string;
  DepositToAccountRef?: { value: string };
  PaymentMethodRef?: { value: string };
  Line?: PaymentLine[];
}

interface PaymentLine {
  Amount: number;
  LinkedTxn: Array<{
    TxnId: string;
    TxnType: 'Invoice';
  }>;
}

interface BillPayment {
  Id?: string;
  VendorRef: { value: string };
  PayType: 'Check' | 'CreditCard';
  TotalAmt: number;
  TxnDate?: string;
  PrivateNote?: string;
  APAccountRef?: { value: string };
  BankAccountRef?: { value: string };
  CheckPayment?: {
    BankAccountRef: { value: string };
    PrintStatus?: string;
  };
  CreditCardPayment?: {
    CCAccountRef: { value: string };
  };
  Line: BillPaymentLine[];
}

interface BillPaymentLine {
  Amount: number;
  LinkedTxn: Array<{
    TxnId: string;
    TxnType: 'Bill';
  }>;
}

interface JournalEntry {
  Id?: string;
  TxnDate?: string;
  PrivateNote?: string;
  DocNumber?: string;
  Line: JournalEntryLine[];
  Adjustment?: boolean;
}

interface JournalEntryLine {
  DetailType: 'JournalEntryLineDetail';
  Amount: number;
  Description?: string;
  JournalEntryLineDetail: {
    PostingType: 'Debit' | 'Credit';
    AccountRef: { value: string };
    Entity?: {
      Type: string;
      EntityRef: { value: string };
    };
    ClassRef?: { value: string };
    DepartmentRef?: { value: string };
  };
}

interface ProfitLossReport {
  reportDate: string;
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  incomeByCategory: Record<string, number>;
  expensesByCategory: Record<string, number>;
}

interface BalanceSheetReport {
  reportDate: string;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  assetsByCategory: Record<string, number>;
  liabilitiesByCategory: Record<string, number>;
}

// ============================================================================
// QUICKBOOKS CLIENT
// ============================================================================

export class QuickBooksClient {
  private qbo: QuickBooks;
  private config: QuickBooksConfig;

  constructor(config: QuickBooksConfig) {
    this.config = config;
    this.qbo = new QuickBooks(
      config.consumerKey,
      config.consumerSecret,
      config.accessToken,
      false, // No token secret for OAuth 2.0
      config.realmId,
      config.useSandbox,
      true, // Enable debugging
      null, // Minor version
      '2.0', // OAuth version
      config.refreshToken
    );
  }

  // ============================================================================
  // AUTHENTICATION
  // ============================================================================

  /**
   * Refresh the OAuth 2.0 access token
   */
  async refreshAccessToken(): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const response = await new Promise<any>((resolve, reject) => {
        this.qbo.refreshAccessToken((err: any, result: any) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      this.config.accessToken = response.access_token;
      this.config.refreshToken = response.refresh_token;

      logger.info('QuickBooks access token refreshed successfully');

      return {
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
      };
    } catch (error) {
      logger.error('Failed to refresh QuickBooks access token', { error });
      throw new AppError(500, 'QB_AUTH_ERROR', 'Failed to refresh access token');
    }
  }

  // ============================================================================
  // CHART OF ACCOUNTS
  // ============================================================================

  /**
   * Get all accounts
   */
  async getAccounts(filters?: { active?: boolean; type?: string }): Promise<Account[]> {
    try {
      let query = 'SELECT * FROM Account';
      const conditions: string[] = [];

      if (filters?.active !== undefined) {
        conditions.push(`Active = ${filters.active}`);
      }
      if (filters?.type) {
        conditions.push(`AccountType = '${filters.type}'`);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' MAXRESULTS 1000';

      const result = await this.queryQuickBooks<Account>(query);
      logger.info(`Retrieved ${result.length} accounts from QuickBooks`);
      return result;
    } catch (error) {
      logger.error('Failed to get accounts', { error });
      throw error;
    }
  }

  /**
   * Create a new account
   */
  async createAccount(account: Account): Promise<Account> {
    try {
      const result = await new Promise<Account>((resolve, reject) => {
        this.qbo.createAccount(account, (err: any, result: Account) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      logger.info('Created account in QuickBooks', { accountId: result.Id, name: result.Name });
      return result;
    } catch (error) {
      logger.error('Failed to create account', { error, account });
      throw error;
    }
  }

  /**
   * Update an existing account
   */
  async updateAccount(account: Account): Promise<Account> {
    try {
      const result = await new Promise<Account>((resolve, reject) => {
        this.qbo.updateAccount(account, (err: any, result: Account) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      logger.info('Updated account in QuickBooks', { accountId: result.Id });
      return result;
    } catch (error) {
      logger.error('Failed to update account', { error, accountId: account.Id });
      throw error;
    }
  }

  /**
   * Get account by ID
   */
  async getAccount(accountId: string): Promise<Account> {
    try {
      const result = await new Promise<Account>((resolve, reject) => {
        this.qbo.getAccount(accountId, (err: any, result: Account) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      return result;
    } catch (error) {
      logger.error('Failed to get account', { error, accountId });
      throw error;
    }
  }

  // ============================================================================
  // CUSTOMERS
  // ============================================================================

  /**
   * Create a new customer (donor in NAIOS)
   */
  async createCustomer(customer: Customer): Promise<Customer> {
    try {
      const result = await new Promise<Customer>((resolve, reject) => {
        this.qbo.createCustomer(customer, (err: any, result: Customer) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      logger.info('Created customer in QuickBooks', { customerId: result.Id, name: result.DisplayName });
      return result;
    } catch (error) {
      logger.error('Failed to create customer', { error, customer });
      throw error;
    }
  }

  /**
   * Update an existing customer
   */
  async updateCustomer(customer: Customer): Promise<Customer> {
    try {
      const result = await new Promise<Customer>((resolve, reject) => {
        this.qbo.updateCustomer(customer, (err: any, result: Customer) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      logger.info('Updated customer in QuickBooks', { customerId: result.Id });
      return result;
    } catch (error) {
      logger.error('Failed to update customer', { error, customerId: customer.Id });
      throw error;
    }
  }

  /**
   * Get customer by ID
   */
  async getCustomer(customerId: string): Promise<Customer> {
    try {
      const result = await new Promise<Customer>((resolve, reject) => {
        this.qbo.getCustomer(customerId, (err: any, result: Customer) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      return result;
    } catch (error) {
      logger.error('Failed to get customer', { error, customerId });
      throw error;
    }
  }

  /**
   * Search for customers
   */
  async searchCustomers(searchTerm: string): Promise<Customer[]> {
    try {
      const query = `SELECT * FROM Customer WHERE DisplayName LIKE '%${searchTerm}%' MAXRESULTS 100`;
      const result = await this.queryQuickBooks<Customer>(query);
      logger.info(`Found ${result.length} customers matching "${searchTerm}"`);
      return result;
    } catch (error) {
      logger.error('Failed to search customers', { error, searchTerm });
      throw error;
    }
  }

  // ============================================================================
  // VENDORS
  // ============================================================================

  /**
   * Create a new vendor
   */
  async createVendor(vendor: Vendor): Promise<Vendor> {
    try {
      const result = await new Promise<Vendor>((resolve, reject) => {
        this.qbo.createVendor(vendor, (err: any, result: Vendor) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      logger.info('Created vendor in QuickBooks', { vendorId: result.Id, name: result.DisplayName });
      return result;
    } catch (error) {
      logger.error('Failed to create vendor', { error, vendor });
      throw error;
    }
  }

  /**
   * Update an existing vendor
   */
  async updateVendor(vendor: Vendor): Promise<Vendor> {
    try {
      const result = await new Promise<Vendor>((resolve, reject) => {
        this.qbo.updateVendor(vendor, (err: any, result: Vendor) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      logger.info('Updated vendor in QuickBooks', { vendorId: result.Id });
      return result;
    } catch (error) {
      logger.error('Failed to update vendor', { error, vendorId: vendor.Id });
      throw error;
    }
  }

  /**
   * Get vendor by ID
   */
  async getVendor(vendorId: string): Promise<Vendor> {
    try {
      const result = await new Promise<Vendor>((resolve, reject) => {
        this.qbo.getVendor(vendorId, (err: any, result: Vendor) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      return result;
    } catch (error) {
      logger.error('Failed to get vendor', { error, vendorId });
      throw error;
    }
  }

  // ============================================================================
  // INVOICES
  // ============================================================================

  /**
   * Create a new invoice
   */
  async createInvoice(invoice: Invoice): Promise<Invoice> {
    try {
      const result = await new Promise<Invoice>((resolve, reject) => {
        this.qbo.createInvoice(invoice, (err: any, result: Invoice) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      logger.info('Created invoice in QuickBooks', { invoiceId: result.Id, amount: result.TotalAmt });
      return result;
    } catch (error) {
      logger.error('Failed to create invoice', { error, invoice });
      throw error;
    }
  }

  /**
   * Update an existing invoice
   */
  async updateInvoice(invoice: Invoice): Promise<Invoice> {
    try {
      const result = await new Promise<Invoice>((resolve, reject) => {
        this.qbo.updateInvoice(invoice, (err: any, result: Invoice) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      logger.info('Updated invoice in QuickBooks', { invoiceId: result.Id });
      return result;
    } catch (error) {
      logger.error('Failed to update invoice', { error, invoiceId: invoice.Id });
      throw error;
    }
  }

  /**
   * Get invoice by ID
   */
  async getInvoice(invoiceId: string): Promise<Invoice> {
    try {
      const result = await new Promise<Invoice>((resolve, reject) => {
        this.qbo.getInvoice(invoiceId, (err: any, result: Invoice) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      return result;
    } catch (error) {
      logger.error('Failed to get invoice', { error, invoiceId });
      throw error;
    }
  }

  /**
   * Send invoice via email
   */
  async sendInvoice(invoiceId: string, emailAddress: string): Promise<void> {
    try {
      await new Promise<void>((resolve, reject) => {
        this.qbo.sendInvoice(invoiceId, emailAddress, (err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });

      logger.info('Sent invoice email', { invoiceId, emailAddress });
    } catch (error) {
      logger.error('Failed to send invoice', { error, invoiceId });
      throw error;
    }
  }

  // ============================================================================
  // BILLS
  // ============================================================================

  /**
   * Create a new bill
   */
  async createBill(bill: Bill): Promise<Bill> {
    try {
      const result = await new Promise<Bill>((resolve, reject) => {
        this.qbo.createBill(bill, (err: any, result: Bill) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      logger.info('Created bill in QuickBooks', { billId: result.Id, amount: result.TotalAmt });
      return result;
    } catch (error) {
      logger.error('Failed to create bill', { error, bill });
      throw error;
    }
  }

  /**
   * Update an existing bill
   */
  async updateBill(bill: Bill): Promise<Bill> {
    try {
      const result = await new Promise<Bill>((resolve, reject) => {
        this.qbo.updateBill(bill, (err: any, result: Bill) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      logger.info('Updated bill in QuickBooks', { billId: result.Id });
      return result;
    } catch (error) {
      logger.error('Failed to update bill', { error, billId: bill.Id });
      throw error;
    }
  }

  // ============================================================================
  // PAYMENTS
  // ============================================================================

  /**
   * Create a payment (customer payment received)
   */
  async createPayment(payment: Payment): Promise<Payment> {
    try {
      const result = await new Promise<Payment>((resolve, reject) => {
        this.qbo.createPayment(payment, (err: any, result: Payment) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      logger.info('Created payment in QuickBooks', { paymentId: result.Id, amount: result.TotalAmt });
      return result;
    } catch (error) {
      logger.error('Failed to create payment', { error, payment });
      throw error;
    }
  }

  /**
   * Create a bill payment (payment to vendor)
   */
  async createBillPayment(billPayment: BillPayment): Promise<BillPayment> {
    try {
      const result = await new Promise<BillPayment>((resolve, reject) => {
        this.qbo.createBillPayment(billPayment, (err: any, result: BillPayment) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      logger.info('Created bill payment in QuickBooks', { paymentId: result.Id, amount: result.TotalAmt });
      return result;
    } catch (error) {
      logger.error('Failed to create bill payment', { error, billPayment });
      throw error;
    }
  }

  // ============================================================================
  // JOURNAL ENTRIES
  // ============================================================================

  /**
   * Create a journal entry
   */
  async createJournalEntry(journalEntry: JournalEntry): Promise<JournalEntry> {
    try {
      const result = await new Promise<JournalEntry>((resolve, reject) => {
        this.qbo.createJournalEntry(journalEntry, (err: any, result: JournalEntry) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      logger.info('Created journal entry in QuickBooks', { journalEntryId: result.Id });
      return result;
    } catch (error) {
      logger.error('Failed to create journal entry', { error, journalEntry });
      throw error;
    }
  }

  // ============================================================================
  // REPORTING
  // ============================================================================

  /**
   * Get Profit & Loss report
   */
  async getProfitLossReport(startDate: string, endDate: string): Promise<ProfitLossReport> {
    try {
      const result = await new Promise<any>((resolve, reject) => {
        this.qbo.reportProfitAndLoss(
          { start_date: startDate, end_date: endDate },
          (err: any, result: any) => {
            if (err) reject(err);
            else resolve(result);
          }
        );
      });

      // Parse the report data
      const report: ProfitLossReport = {
        reportDate: endDate,
        totalIncome: 0,
        totalExpenses: 0,
        netIncome: 0,
        incomeByCategory: {},
        expensesByCategory: {},
      };

      // Process report rows
      if (result.Rows?.Row) {
        for (const section of result.Rows.Row) {
          if (section.group === 'Income') {
            report.totalIncome = parseFloat(section.Summary?.ColData?.[1]?.value || '0');
            // Process income categories
            if (section.Rows?.Row) {
              for (const row of section.Rows.Row) {
                const category = row.ColData?.[0]?.value;
                const amount = parseFloat(row.ColData?.[1]?.value || '0');
                if (category) {
                  report.incomeByCategory[category] = amount;
                }
              }
            }
          } else if (section.group === 'Expenses') {
            report.totalExpenses = parseFloat(section.Summary?.ColData?.[1]?.value || '0');
            // Process expense categories
            if (section.Rows?.Row) {
              for (const row of section.Rows.Row) {
                const category = row.ColData?.[0]?.value;
                const amount = parseFloat(row.ColData?.[1]?.value || '0');
                if (category) {
                  report.expensesByCategory[category] = amount;
                }
              }
            }
          }
        }
      }

      report.netIncome = report.totalIncome - report.totalExpenses;

      logger.info('Retrieved Profit & Loss report', { startDate, endDate, netIncome: report.netIncome });
      return report;
    } catch (error) {
      logger.error('Failed to get Profit & Loss report', { error, startDate, endDate });
      throw error;
    }
  }

  /**
   * Get Balance Sheet report
   */
  async getBalanceSheetReport(reportDate: string): Promise<BalanceSheetReport> {
    try {
      const result = await new Promise<any>((resolve, reject) => {
        this.qbo.reportBalanceSheet(
          { date: reportDate },
          (err: any, result: any) => {
            if (err) reject(err);
            else resolve(result);
          }
        );
      });

      const report: BalanceSheetReport = {
        reportDate,
        totalAssets: 0,
        totalLiabilities: 0,
        totalEquity: 0,
        assetsByCategory: {},
        liabilitiesByCategory: {},
      };

      // Process report sections
      if (result.Rows?.Row) {
        for (const section of result.Rows.Row) {
          if (section.group === 'Assets') {
            report.totalAssets = parseFloat(section.Summary?.ColData?.[1]?.value || '0');
            if (section.Rows?.Row) {
              for (const row of section.Rows.Row) {
                const category = row.ColData?.[0]?.value;
                const amount = parseFloat(row.ColData?.[1]?.value || '0');
                if (category) {
                  report.assetsByCategory[category] = amount;
                }
              }
            }
          } else if (section.group === 'Liabilities and Equity') {
            if (section.Rows?.Row) {
              for (const subsection of section.Rows.Row) {
                if (subsection.group === 'Liabilities') {
                  report.totalLiabilities = parseFloat(subsection.Summary?.ColData?.[1]?.value || '0');
                  if (subsection.Rows?.Row) {
                    for (const row of subsection.Rows.Row) {
                      const category = row.ColData?.[0]?.value;
                      const amount = parseFloat(row.ColData?.[1]?.value || '0');
                      if (category) {
                        report.liabilitiesByCategory[category] = amount;
                      }
                    }
                  }
                } else if (subsection.group === 'Equity') {
                  report.totalEquity = parseFloat(subsection.Summary?.ColData?.[1]?.value || '0');
                }
              }
            }
          }
        }
      }

      logger.info('Retrieved Balance Sheet report', { reportDate, totalAssets: report.totalAssets });
      return report;
    } catch (error) {
      logger.error('Failed to get Balance Sheet report', { error, reportDate });
      throw error;
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Execute a QuickBooks query
   */
  private async queryQuickBooks<T>(query: string): Promise<T[]> {
    try {
      const result = await new Promise<any>((resolve, reject) => {
        this.qbo.query(query, (err: any, result: any) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      return result.QueryResponse?.Account ||
             result.QueryResponse?.Customer ||
             result.QueryResponse?.Vendor ||
             result.QueryResponse?.Invoice ||
             result.QueryResponse?.Bill ||
             result.QueryResponse?.Payment ||
             [];
    } catch (error) {
      logger.error('QuickBooks query failed', { error, query });
      throw error;
    }
  }

  /**
   * Get company info
   */
  async getCompanyInfo(): Promise<any> {
    try {
      const result = await new Promise<any>((resolve, reject) => {
        this.qbo.getCompanyInfo(this.config.realmId, (err: any, result: any) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      logger.info('Retrieved company info', { companyName: result.CompanyName });
      return result;
    } catch (error) {
      logger.error('Failed to get company info', { error });
      throw error;
    }
  }

  // ============================================================================
  // WEBHOOK HANDLING
  // ============================================================================

  /**
   * Handle QuickBooks webhook events
   */
  async handleWebhook(payload: any): Promise<void> {
    try {
      const { eventNotifications } = payload;

      if (!eventNotifications || eventNotifications.length === 0) {
        logger.warn('Received webhook with no event notifications');
        return;
      }

      for (const notification of eventNotifications) {
        const { realmId, dataChangeEvent } = notification;

        if (dataChangeEvent?.entities) {
          for (const entity of dataChangeEvent.entities) {
            const { name, id, operation } = entity;

            logger.info('Processing QuickBooks webhook', {
              realmId,
              entityType: name,
              entityId: id,
              operation
            });

            switch (name) {
              case 'Customer':
                await this.handleCustomerWebhook(id, operation);
                break;
              case 'Invoice':
                await this.handleInvoiceWebhook(id, operation);
                break;
              case 'Payment':
                await this.handlePaymentWebhook(id, operation);
                break;
              case 'Bill':
                await this.handleBillWebhook(id, operation);
                break;
              case 'Account':
                await this.handleAccountWebhook(id, operation);
                break;
              default:
                logger.info('Unhandled entity type', { entityType: name });
            }
          }
        }
      }
    } catch (error) {
      logger.error('Failed to handle webhook', { error, payload });
      throw error;
    }
  }

  private async handleCustomerWebhook(customerId: string, operation: string): Promise<void> {
    // Implement customer sync logic here
    logger.info('Handling customer webhook', { customerId, operation });

    if (operation === 'Create' || operation === 'Update') {
      const customer = await this.getCustomer(customerId);
      // TODO: Sync to NAIOS donor database
    } else if (operation === 'Delete') {
      // TODO: Mark as deleted in NAIOS
    }
  }

  private async handleInvoiceWebhook(invoiceId: string, operation: string): Promise<void> {
    logger.info('Handling invoice webhook', { invoiceId, operation });

    if (operation === 'Create' || operation === 'Update') {
      const invoice = await this.getInvoice(invoiceId);
      // TODO: Sync to NAIOS financial records
    }
  }

  private async handlePaymentWebhook(paymentId: string, operation: string): Promise<void> {
    logger.info('Handling payment webhook', { paymentId, operation });
    // TODO: Sync payment to NAIOS donation records
  }

  private async handleBillWebhook(billId: string, operation: string): Promise<void> {
    logger.info('Handling bill webhook', { billId, operation });
    // TODO: Sync to NAIOS expense tracking
  }

  private async handleAccountWebhook(accountId: string, operation: string): Promise<void> {
    logger.info('Handling account webhook', { accountId, operation });
    // TODO: Sync chart of accounts to NAIOS
  }
}

// ============================================================================
// SYNC UTILITIES
// ============================================================================

/**
 * Sync a donation from NAIOS to QuickBooks as an invoice
 */
export async function syncDonationToQuickBooks(
  qbClient: QuickBooksClient,
  donation: any
): Promise<string> {
  try {
    // First, ensure customer exists
    let customerId: string;

    if (donation.quickbooks_customer_id) {
      customerId = donation.quickbooks_customer_id;
    } else {
      // Create customer in QuickBooks
      const customer = await qbClient.createCustomer({
        DisplayName: donation.donor_name || 'Anonymous Donor',
        GivenName: donation.donor_first_name,
        FamilyName: donation.donor_last_name,
        PrimaryEmailAddr: donation.donor_email ? { Address: donation.donor_email } : undefined,
        Notes: `NAIOS Donor ID: ${donation.donor_id}`,
      });
      customerId = customer.Id!;

      // TODO: Save customerId back to NAIOS donor record
    }

    // Create invoice for the donation
    const invoice: Invoice = {
      CustomerRef: { value: customerId },
      TxnDate: donation.donation_date,
      Line: [
        {
          DetailType: 'SalesItemLineDetail',
          Amount: donation.amount,
          Description: donation.description || 'Donation',
          SalesItemLineDetail: {
            ItemRef: { value: '1' }, // TODO: Use actual donation item ID
            Qty: 1,
            UnitPrice: donation.amount,
          },
        },
      ],
      PrivateNote: `NAIOS Donation ID: ${donation.donation_id}`,
      CustomerMemo: { value: donation.notes || 'Thank you for your donation!' },
      BillEmail: donation.donor_email ? { Address: donation.donor_email } : undefined,
    };

    const result = await qbClient.createInvoice(invoice);
    logger.info('Synced donation to QuickBooks', { donationId: donation.donation_id, invoiceId: result.Id });

    return result.Id!;
  } catch (error) {
    logger.error('Failed to sync donation to QuickBooks', { error, donation });
    throw error;
  }
}

/**
 * Sync an expense from NAIOS to QuickBooks as a bill
 */
export async function syncExpenseToQuickBooks(
  qbClient: QuickBooksClient,
  expense: any
): Promise<string> {
  try {
    // Ensure vendor exists
    let vendorId: string;

    if (expense.quickbooks_vendor_id) {
      vendorId = expense.quickbooks_vendor_id;
    } else {
      const vendor = await qbClient.createVendor({
        DisplayName: expense.vendor_name,
        CompanyName: expense.vendor_company,
        PrimaryEmailAddr: expense.vendor_email ? { Address: expense.vendor_email } : undefined,
      });
      vendorId = vendor.Id!;
    }

    // Create bill
    const bill: Bill = {
      VendorRef: { value: vendorId },
      TxnDate: expense.expense_date,
      DueDate: expense.due_date,
      Line: [
        {
          DetailType: 'AccountBasedExpenseLineDetail',
          Amount: expense.amount,
          Description: expense.description,
          AccountBasedExpenseLineDetail: {
            AccountRef: { value: expense.expense_account_id },
          },
        },
      ],
      PrivateNote: `NAIOS Expense ID: ${expense.expense_id}`,
    };

    const result = await qbClient.createBill(bill);
    logger.info('Synced expense to QuickBooks', { expenseId: expense.expense_id, billId: result.Id });

    return result.Id!;
  } catch (error) {
    logger.error('Failed to sync expense to QuickBooks', { error, expense });
    throw error;
  }
}

/**
 * Sync financial transaction from NAIOS to QuickBooks as journal entry
 */
export async function syncTransactionToQuickBooks(
  qbClient: QuickBooksClient,
  transaction: any
): Promise<string> {
  try {
    const journalEntry: JournalEntry = {
      TxnDate: transaction.transaction_date,
      PrivateNote: `NAIOS Transaction: ${transaction.transaction_number}`,
      Line: [
        {
          DetailType: 'JournalEntryLineDetail',
          Amount: transaction.debit_amount || transaction.credit_amount,
          Description: transaction.description,
          JournalEntryLineDetail: {
            PostingType: transaction.debit_amount > 0 ? 'Debit' : 'Credit',
            AccountRef: { value: transaction.account_id },
          },
        },
      ],
    };

    const result = await qbClient.createJournalEntry(journalEntry);
    logger.info('Synced transaction to QuickBooks', {
      transactionId: transaction.transaction_id,
      journalEntryId: result.Id
    });

    return result.Id!;
  } catch (error) {
    logger.error('Failed to sync transaction to QuickBooks', { error, transaction });
    throw error;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default QuickBooksClient;

export type {
  QuickBooksConfig,
  Account,
  Customer,
  Vendor,
  Invoice,
  Bill,
  Payment,
  BillPayment,
  JournalEntry,
  ProfitLossReport,
  BalanceSheetReport,
};
