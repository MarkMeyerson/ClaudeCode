/**
 * NAIOS Platform - Stripe Integration
 *
 * Payment processing integration with Stripe for donation management
 *
 * @version 1.0.0
 */

import Stripe from 'stripe';
import { logger } from '@naios/shared/utils/logger';
import dotenv from 'dotenv';

dotenv.config();

// ============================================================================
// STRIPE CLIENT CONFIGURATION
// ============================================================================

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
});

// ============================================================================
// PAYMENT FUNCTIONS
// ============================================================================

/**
 * Create a payment intent for a one-time donation
 *
 * @param amount - Amount in cents
 * @param currency - Currency code (default: usd)
 * @param metadata - Additional metadata
 * @returns Payment intent
 */
export async function createDonationPaymentIntent(
  amount: number,
  currency: string = 'usd',
  metadata: Record<string, string> = {}
): Promise<Stripe.PaymentIntent> {
  try {
    logger.info('Creating payment intent', { amount, currency, metadata });

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: {
        ...metadata,
        platform: 'naios',
        type: 'donation'
      },
      automatic_payment_methods: {
        enabled: true
      }
    });

    logger.info('Payment intent created successfully', {
      payment_intent_id: paymentIntent.id,
      amount: paymentIntent.amount
    });

    return paymentIntent;
  } catch (error) {
    logger.error('Failed to create payment intent', { error });
    throw error;
  }
}

/**
 * Create a recurring donation subscription
 *
 * @param customerId - Stripe customer ID
 * @param priceId - Stripe price ID
 * @param metadata - Additional metadata
 * @returns Subscription
 */
export async function createRecurringDonation(
  customerId: string,
  priceId: string,
  metadata: Record<string, string> = {}
): Promise<Stripe.Subscription> {
  try {
    logger.info('Creating recurring donation', { customerId, priceId, metadata });

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      metadata: {
        ...metadata,
        platform: 'naios',
        type: 'recurring_donation'
      }
    });

    logger.info('Recurring donation created successfully', {
      subscription_id: subscription.id,
      customer_id: customerId
    });

    return subscription;
  } catch (error) {
    logger.error('Failed to create recurring donation', { error });
    throw error;
  }
}

/**
 * Create or update a Stripe customer
 *
 * @param donor - Donor information
 * @returns Stripe customer
 */
export async function createOrUpdateCustomer(donor: {
  email: string;
  name: string;
  phone?: string;
  address?: Stripe.AddressParam;
  metadata?: Record<string, string>;
}): Promise<Stripe.Customer> {
  try {
    // Check if customer already exists
    const existingCustomers = await stripe.customers.list({
      email: donor.email,
      limit: 1
    });

    if (existingCustomers.data.length > 0) {
      // Update existing customer
      const customer = await stripe.customers.update(
        existingCustomers.data[0].id,
        {
          name: donor.name,
          phone: donor.phone,
          address: donor.address,
          metadata: donor.metadata
        }
      );

      logger.info('Stripe customer updated', { customer_id: customer.id });
      return customer;
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: donor.email,
        name: donor.name,
        phone: donor.phone,
        address: donor.address,
        metadata: {
          ...donor.metadata,
          platform: 'naios'
        }
      });

      logger.info('Stripe customer created', { customer_id: customer.id });
      return customer;
    }
  } catch (error) {
    logger.error('Failed to create/update Stripe customer', { error });
    throw error;
  }
}

/**
 * Process a refund
 *
 * @param paymentIntentId - Payment intent ID to refund
 * @param amount - Amount to refund (optional, defaults to full amount)
 * @param reason - Refund reason
 * @returns Refund
 */
export async function processRefund(
  paymentIntentId: string,
  amount?: number,
  reason?: Stripe.RefundCreateParams.Reason
): Promise<Stripe.Refund> {
  try {
    logger.info('Processing refund', { paymentIntentId, amount, reason });

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount,
      reason
    });

    logger.info('Refund processed successfully', {
      refund_id: refund.id,
      amount: refund.amount
    });

    return refund;
  } catch (error) {
    logger.error('Failed to process refund', { error });
    throw error;
  }
}

/**
 * Cancel a recurring donation subscription
 *
 * @param subscriptionId - Subscription ID to cancel
 * @returns Canceled subscription
 */
export async function cancelRecurringDonation(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  try {
    logger.info('Canceling recurring donation', { subscriptionId });

    const subscription = await stripe.subscriptions.cancel(subscriptionId);

    logger.info('Recurring donation canceled successfully', {
      subscription_id: subscription.id
    });

    return subscription;
  } catch (error) {
    logger.error('Failed to cancel recurring donation', { error });
    throw error;
  }
}

// ============================================================================
// WEBHOOK HANDLERS
// ============================================================================

/**
 * Handle Stripe webhook events
 *
 * @param payload - Webhook payload
 * @param signature - Webhook signature
 * @returns Processed event
 */
export async function handleStripeWebhook(
  payload: string | Buffer,
  signature: string
): Promise<Stripe.Event> {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );

    logger.info('Received Stripe webhook', {
      event_type: event.type,
      event_id: event.id
    });

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(event.data.object as Stripe.Subscription);
        break;

      case 'charge.refunded':
        await handleRefund(event.data.object as Stripe.Charge);
        break;

      default:
        logger.info('Unhandled webhook event type', { type: event.type });
    }

    return event;
  } catch (error) {
    logger.error('Failed to handle Stripe webhook', { error });
    throw error;
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  logger.info('Payment succeeded', {
    payment_intent_id: paymentIntent.id,
    amount: paymentIntent.amount,
    metadata: paymentIntent.metadata
  });

  // TODO: Create donation record in database
  // TODO: Send acknowledgment email
  // TODO: Sync to Notion
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  logger.warn('Payment failed', {
    payment_intent_id: paymentIntent.id,
    last_payment_error: paymentIntent.last_payment_error
  });

  // TODO: Update donation record
  // TODO: Notify fundraising team
}

/**
 * Handle subscription change
 */
async function handleSubscriptionChange(subscription: Stripe.Subscription): Promise<void> {
  logger.info('Subscription changed', {
    subscription_id: subscription.id,
    status: subscription.status
  });

  // TODO: Update recurring donation record
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCanceled(subscription: Stripe.Subscription): Promise<void> {
  logger.info('Subscription canceled', {
    subscription_id: subscription.id
  });

  // TODO: Update recurring donation status
  // TODO: Send confirmation email
}

/**
 * Handle refund
 */
async function handleRefund(charge: Stripe.Charge): Promise<void> {
  logger.info('Charge refunded', {
    charge_id: charge.id,
    amount_refunded: charge.amount_refunded
  });

  // TODO: Update donation record
  // TODO: Send refund confirmation
}

// ============================================================================
// EXPORT INTEGRATION FUNCTIONS
// ============================================================================

export default {
  createDonationPaymentIntent,
  createRecurringDonation,
  createOrUpdateCustomer,
  processRefund,
  cancelRecurringDonation,
  handleStripeWebhook,
  stripe
};
