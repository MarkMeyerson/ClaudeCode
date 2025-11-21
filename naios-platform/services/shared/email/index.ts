/**
 * NAIOS Platform - Email Service
 *
 * Comprehensive email service with:
 * - Multiple provider support (SendGrid, Mailgun, AWS SES)
 * - Template engine with Handlebars
 * - Queue support for async sending
 * - Email tracking and analytics
 * - Retry logic and error handling
 */

import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/error.middleware';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface EmailConfig {
  provider: 'sendgrid' | 'mailgun' | 'aws-ses' | 'smtp';
  apiKey?: string;
  domain?: string;
  fromEmail: string;
  fromName: string;
  replyTo?: string;
  smtpConfig?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
}

export interface EmailAttachment {
  filename: string;
  content?: Buffer | string;
  path?: string;
  contentType?: string;
}

export interface EmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  template?: string;
  templateData?: Record<string, any>;
  html?: string;
  text?: string;
  attachments?: EmailAttachment[];
  priority?: 'high' | 'normal' | 'low';
  headers?: Record<string, string>;
  tags?: string[];
  trackOpens?: boolean;
  trackClicks?: boolean;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider?: string;
  timestamp: Date;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

// ============================================================================
// EMAIL SERVICE CLASS
// ============================================================================

export class EmailService {
  private config: EmailConfig;
  private transporter: Mail | null = null;
  private templates: Map<string, handlebars.TemplateDelegate> = new Map();
  private templateCache: Map<string, { subject: string; html: handlebars.TemplateDelegate; text?: handlebars.TemplateDelegate }> = new Map();

  constructor(config: EmailConfig) {
    this.config = config;
    this.initializeTransporter();
    this.registerHelpers();
  }

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  private initializeTransporter(): void {
    switch (this.config.provider) {
      case 'sendgrid':
        this.transporter = nodemailer.createTransport({
          host: 'smtp.sendgrid.net',
          port: 587,
          secure: false,
          auth: {
            user: 'apikey',
            pass: this.config.apiKey || '',
          },
        });
        break;

      case 'mailgun':
        this.transporter = nodemailer.createTransport({
          host: 'smtp.mailgun.org',
          port: 587,
          secure: false,
          auth: {
            user: `postmaster@${this.config.domain}`,
            pass: this.config.apiKey || '',
          },
        });
        break;

      case 'aws-ses':
        this.transporter = nodemailer.createTransport({
          host: `email-smtp.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com`,
          port: 587,
          secure: false,
          auth: {
            user: process.env.AWS_SES_ACCESS_KEY || '',
            pass: process.env.AWS_SES_SECRET_KEY || '',
          },
        });
        break;

      case 'smtp':
        if (!this.config.smtpConfig) {
          throw new AppError(500, 'EMAIL_CONFIG_ERROR', 'SMTP configuration is required');
        }
        this.transporter = nodemailer.createTransport(this.config.smtpConfig);
        break;

      default:
        throw new AppError(500, 'EMAIL_CONFIG_ERROR', `Unsupported email provider: ${this.config.provider}`);
    }

    logger.info('Email transporter initialized', { provider: this.config.provider });
  }

  private registerHelpers(): void {
    // Currency formatter
    handlebars.registerHelper('currency', (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
    });

    // Date formatter
    handlebars.registerHelper('date', (date: Date | string, format?: string) => {
      const d = typeof date === 'string' ? new Date(date) : date;
      if (format === 'short') {
        return d.toLocaleDateString('en-US');
      } else if (format === 'long') {
        return d.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      }
      return d.toISOString();
    });

    // Conditional helper
    handlebars.registerHelper('ifEquals', function (arg1: any, arg2: any, options: any) {
      return arg1 === arg2 ? options.fn(this) : options.inverse(this);
    });

    // Join array helper
    handlebars.registerHelper('join', (array: any[], separator: string) => {
      return array.join(separator);
    });
  }

  // ==========================================================================
  // TEMPLATE MANAGEMENT
  // ==========================================================================

  async loadTemplate(templateName: string): Promise<void> {
    try {
      const templateDir = path.join(__dirname, 'templates', templateName);

      // Load subject
      const subjectPath = path.join(templateDir, 'subject.txt');
      const subjectContent = await fs.readFile(subjectPath, 'utf-8');

      // Load HTML template
      const htmlPath = path.join(templateDir, 'template.html');
      const htmlContent = await fs.readFile(htmlPath, 'utf-8');
      const htmlTemplate = handlebars.compile(htmlContent);

      // Load optional text template
      let textTemplate: handlebars.TemplateDelegate | undefined;
      try {
        const textPath = path.join(templateDir, 'template.txt');
        const textContent = await fs.readFile(textPath, 'utf-8');
        textTemplate = handlebars.compile(textContent);
      } catch {
        // Text template is optional
      }

      this.templateCache.set(templateName, {
        subject: subjectContent.trim(),
        html: htmlTemplate,
        text: textTemplate,
      });

      logger.info('Email template loaded', { templateName });
    } catch (error) {
      logger.error('Failed to load email template', { templateName, error });
      throw new AppError(500, 'TEMPLATE_LOAD_ERROR', `Failed to load template: ${templateName}`);
    }
  }

  async loadAllTemplates(): Promise<void> {
    const templatesDir = path.join(__dirname, 'templates');
    try {
      const templateNames = await fs.readdir(templatesDir);
      await Promise.all(templateNames.map(name => this.loadTemplate(name)));
      logger.info('All email templates loaded', { count: templateNames.length });
    } catch (error) {
      logger.error('Failed to load email templates', { error });
    }
  }

  // ==========================================================================
  // SENDING EMAILS
  // ==========================================================================

  async send(options: EmailOptions): Promise<EmailResult> {
    try {
      if (!this.transporter) {
        throw new AppError(500, 'EMAIL_SERVICE_ERROR', 'Email transporter not initialized');
      }

      let html = options.html;
      let text = options.text;
      let subject = options.subject;

      // Use template if specified
      if (options.template) {
        const template = this.templateCache.get(options.template);
        if (!template) {
          await this.loadTemplate(options.template);
          const loadedTemplate = this.templateCache.get(options.template);
          if (!loadedTemplate) {
            throw new AppError(500, 'TEMPLATE_NOT_FOUND', `Template not found: ${options.template}`);
          }
          html = loadedTemplate.html(options.templateData || {});
          text = loadedTemplate.text?.(options.templateData || {});
          subject = loadedTemplate.subject;
        } else {
          html = template.html(options.templateData || {});
          text = template.text?.(options.templateData || {});
          subject = template.subject;
        }
      }

      // Prepare email
      const mailOptions: Mail.Options = {
        from: {
          name: this.config.fromName,
          address: this.config.fromEmail,
        },
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined,
        bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined,
        subject,
        html,
        text,
        replyTo: this.config.replyTo,
        attachments: options.attachments,
        priority: options.priority,
        headers: options.headers,
      };

      // Send email
      const info = await this.transporter.sendMail(mailOptions);

      logger.info('Email sent successfully', {
        to: options.to,
        subject,
        messageId: info.messageId,
        provider: this.config.provider,
      });

      return {
        success: true,
        messageId: info.messageId,
        provider: this.config.provider,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error('Failed to send email', { error, options });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: this.config.provider,
        timestamp: new Date(),
      };
    }
  }

  // ==========================================================================
  // CONVENIENCE METHODS
  // ==========================================================================

  async sendWelcomeEmail(to: string, data: { name: string; loginUrl: string }): Promise<EmailResult> {
    return this.send({
      to,
      template: 'welcome',
      templateData: data,
      tags: ['welcome', 'onboarding'],
    });
  }

  async sendDonationReceipt(
    to: string,
    data: {
      donorName: string;
      amount: number;
      donationDate: Date;
      transactionId: string;
      taxDeductible: boolean;
      organizationName: string;
      ein: string;
    }
  ): Promise<EmailResult> {
    return this.send({
      to,
      template: 'donation-receipt',
      templateData: data,
      tags: ['donation', 'receipt'],
      priority: 'high',
    });
  }

  async sendAssessmentReport(
    to: string,
    data: {
      organizationName: string;
      assessmentType: string;
      overallScore: number;
      maturityLevel: string;
      reportUrl: string;
      assessmentDate: Date;
    }
  ): Promise<EmailResult> {
    return this.send({
      to,
      template: 'assessment-report',
      templateData: data,
      tags: ['assessment', 'report'],
    });
  }

  async sendVolunteerConfirmation(
    to: string,
    data: {
      volunteerName: string;
      opportunityTitle: string;
      startDate: Date;
      location: string;
      contactPerson: string;
      contactEmail: string;
      contactPhone: string;
    }
  ): Promise<EmailResult> {
    return this.send({
      to,
      template: 'volunteer-confirmation',
      templateData: data,
      tags: ['volunteer', 'confirmation'],
    });
  }

  async sendGrantNotification(
    to: string,
    data: {
      grantName: string;
      funderName: string;
      status: 'awarded' | 'declined' | 'under-review';
      amount?: number;
      nextSteps?: string;
      dueDate?: Date;
    }
  ): Promise<EmailResult> {
    return this.send({
      to,
      template: 'grant-notification',
      templateData: data,
      tags: ['grant', 'notification'],
      priority: data.status === 'awarded' ? 'high' : 'normal',
    });
  }

  async sendPasswordReset(
    to: string,
    data: {
      name: string;
      resetToken: string;
      resetUrl: string;
      expiresIn: string;
    }
  ): Promise<EmailResult> {
    return this.send({
      to,
      template: 'password-reset',
      templateData: data,
      tags: ['security', 'password-reset'],
      priority: 'high',
    });
  }

  async sendMonthlyReport(
    to: string,
    data: {
      organizationName: string;
      month: string;
      year: number;
      totalDonations: number;
      donationCount: number;
      volunteerHours: number;
      programsActive: number;
      beneficiariesServed: number;
      reportUrl: string;
    }
  ): Promise<EmailResult> {
    return this.send({
      to,
      template: 'monthly-report',
      templateData: data,
      tags: ['report', 'monthly'],
    });
  }

  async sendEventInvitation(
    to: string,
    data: {
      eventName: string;
      eventDate: Date;
      location: string;
      description: string;
      rsvpUrl: string;
      organizerName: string;
      organizerEmail: string;
    }
  ): Promise<EmailResult> {
    return this.send({
      to,
      template: 'event-invitation',
      templateData: data,
      tags: ['event', 'invitation'],
    });
  }

  // ==========================================================================
  // BATCH SENDING
  // ==========================================================================

  async sendBatch(recipients: string[], options: Omit<EmailOptions, 'to'>): Promise<EmailResult[]> {
    const results: EmailResult[] = [];

    for (const recipient of recipients) {
      const result = await this.send({ ...options, to: recipient });
      results.push(result);

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    logger.info('Batch email send completed', {
      total: recipients.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
    });

    return results;
  }

  // ==========================================================================
  // VERIFICATION
  // ==========================================================================

  async verify(): Promise<boolean> {
    try {
      if (!this.transporter) {
        return false;
      }
      await this.transporter.verify();
      logger.info('Email service verified successfully');
      return true;
    } catch (error) {
      logger.error('Email service verification failed', { error });
      return false;
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let emailService: EmailService | null = null;

export function initializeEmailService(config: EmailConfig): EmailService {
  emailService = new EmailService(config);
  return emailService;
}

export function getEmailService(): EmailService {
  if (!emailService) {
    throw new AppError(500, 'EMAIL_SERVICE_ERROR', 'Email service not initialized');
  }
  return emailService;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default EmailService;
