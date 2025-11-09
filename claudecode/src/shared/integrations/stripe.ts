import Stripe from 'stripe';
import { appConfig } from '../config';
import { Logger } from '../utils/logger';
import { IntegrationError } from '../utils/errors';
import type { StripeCustomer, StripePayment } from '../types';

export class StripeClient {
  private client: Stripe;
  private logger: Logger;

  constructor() {
    this.client = new Stripe(appConfig.integrations.stripe.apiKey, {
      apiVersion: '2024-12-18.acacia',
    });
    this.logger = new Logger('StripeClient');
  }

  // Customer Operations
  /**
   * Get a customer by ID
   */
  async getCustomer(customerId: string): Promise<StripeCustomer> {
    try {
      this.logger.debug('Fetching customer', { customerId });
      const customer = await this.client.customers.retrieve(customerId);

      if (customer.deleted) {
        throw new Error('Customer has been deleted');
      }

      return {
        id: customer.id,
        email: customer.email || '',
        name: customer.name || undefined,
        metadata: customer.metadata,
      };
    } catch (error) {
      this.logger.error('Failed to get customer', error as Error, { customerId });
      throw new IntegrationError('Stripe', 'Failed to get customer', error as Error);
    }
  }

  /**
   * Create a new customer
   */
  async createCustomer(params: {
    email: string;
    name?: string;
    metadata?: Record<string, string>;
  }): Promise<StripeCustomer> {
    try {
      this.logger.debug('Creating customer', { email: params.email });
      const customer = await this.client.customers.create(params);

      return {
        id: customer.id,
        email: customer.email || '',
        name: customer.name || undefined,
        metadata: customer.metadata,
      };
    } catch (error) {
      this.logger.error('Failed to create customer', error as Error, { email: params.email });
      throw new IntegrationError('Stripe', 'Failed to create customer', error as Error);
    }
  }

  /**
   * Update a customer
   */
  async updateCustomer(
    customerId: string,
    params: Partial<{ email: string; name: string; metadata: Record<string, string> }>
  ): Promise<StripeCustomer> {
    try {
      this.logger.debug('Updating customer', { customerId });
      const customer = await this.client.customers.update(customerId, params);

      return {
        id: customer.id,
        email: customer.email || '',
        name: customer.name || undefined,
        metadata: customer.metadata,
      };
    } catch (error) {
      this.logger.error('Failed to update customer', error as Error, { customerId });
      throw new IntegrationError('Stripe', 'Failed to update customer', error as Error);
    }
  }

  /**
   * Search customers by email
   */
  async searchCustomersByEmail(email: string): Promise<StripeCustomer[]> {
    try {
      this.logger.debug('Searching customers by email', { email });
      const customers = await this.client.customers.search({
        query: `email:'${email}'`,
      });

      return customers.data.map((customer) => ({
        id: customer.id,
        email: customer.email || '',
        name: customer.name || undefined,
        metadata: customer.metadata,
      }));
    } catch (error) {
      this.logger.error('Failed to search customers', error as Error, { email });
      throw new IntegrationError('Stripe', 'Failed to search customers', error as Error);
    }
  }

  // Payment Operations
  /**
   * Get a payment intent by ID
   */
  async getPaymentIntent(paymentIntentId: string): Promise<StripePayment> {
    try {
      this.logger.debug('Fetching payment intent', { paymentIntentId });
      const payment = await this.client.paymentIntents.retrieve(paymentIntentId);

      return {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        customer: payment.customer as string | undefined,
        created: payment.created,
      };
    } catch (error) {
      this.logger.error('Failed to get payment intent', error as Error, { paymentIntentId });
      throw new IntegrationError('Stripe', 'Failed to get payment intent', error as Error);
    }
  }

  /**
   * Create a payment intent
   */
  async createPaymentIntent(params: {
    amount: number;
    currency: string;
    customer?: string;
    metadata?: Record<string, string>;
  }): Promise<StripePayment> {
    try {
      this.logger.debug('Creating payment intent', { amount: params.amount, currency: params.currency });
      const payment = await this.client.paymentIntents.create(params);

      return {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        customer: payment.customer as string | undefined,
        created: payment.created,
      };
    } catch (error) {
      this.logger.error('Failed to create payment intent', error as Error);
      throw new IntegrationError('Stripe', 'Failed to create payment intent', error as Error);
    }
  }

  /**
   * Get invoices for a customer
   */
  async getCustomerInvoices(customerId: string): Promise<any[]> {
    try {
      this.logger.debug('Fetching customer invoices', { customerId });
      const invoices = await this.client.invoices.list({
        customer: customerId,
      });

      return invoices.data;
    } catch (error) {
      this.logger.error('Failed to get customer invoices', error as Error, { customerId });
      throw new IntegrationError('Stripe', 'Failed to get customer invoices', error as Error);
    }
  }

  /**
   * Get payment history for a customer
   */
  async getCustomerPayments(customerId: string, limit: number = 100): Promise<StripePayment[]> {
    try {
      this.logger.debug('Fetching customer payments', { customerId, limit });
      const charges = await this.client.charges.list({
        customer: customerId,
        limit,
      });

      return charges.data.map((charge) => ({
        id: charge.id,
        amount: charge.amount,
        currency: charge.currency,
        status: charge.status,
        customer: charge.customer as string | undefined,
        created: charge.created,
      }));
    } catch (error) {
      this.logger.error('Failed to get customer payments', error as Error, { customerId });
      throw new IntegrationError('Stripe', 'Failed to get customer payments', error as Error);
    }
  }

  /**
   * Create a subscription
   */
  async createSubscription(params: {
    customer: string;
    items: Array<{ price: string; quantity?: number }>;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Subscription> {
    try {
      this.logger.debug('Creating subscription', { customer: params.customer });
      const subscription = await this.client.subscriptions.create(params);
      this.logger.info('Subscription created', { subscriptionId: subscription.id });
      return subscription;
    } catch (error) {
      this.logger.error('Failed to create subscription', error as Error, { customer: params.customer });
      throw new IntegrationError('Stripe', 'Failed to create subscription', error as Error);
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      this.logger.debug('Canceling subscription', { subscriptionId });
      await this.client.subscriptions.cancel(subscriptionId);
      this.logger.info('Subscription canceled', { subscriptionId });
    } catch (error) {
      this.logger.error('Failed to cancel subscription', error as Error, { subscriptionId });
      throw new IntegrationError('Stripe', 'Failed to cancel subscription', error as Error);
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string | Buffer, signature: string): Stripe.Event {
    try {
      const webhookSecret = appConfig.integrations.stripe.webhookSecret;
      if (!webhookSecret) {
        throw new Error('Webhook secret not configured');
      }

      return this.client.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      this.logger.error('Failed to verify webhook signature', error as Error);
      throw new IntegrationError('Stripe', 'Failed to verify webhook signature', error as Error);
    }
  }
}

export const stripeClient = new StripeClient();
export default StripeClient;
