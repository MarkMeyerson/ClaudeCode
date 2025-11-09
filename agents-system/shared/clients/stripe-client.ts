/**
 * Shared Stripe Client
 * Provides methods to interact with Stripe API for financial data
 */

import Stripe from 'stripe';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import { StripeCustomer, StripeCharge, StripeSubscription } from '../types';

let stripeClient: Stripe | null = null;

/**
 * Initialize Stripe client
 */
export function initStripeClient(): Stripe {
  if (stripeClient) {
    return stripeClient;
  }

  if (!config.stripeApiKey) {
    throw new Error('STRIPE_API_KEY is required but not configured');
  }

  stripeClient = new Stripe(config.stripeApiKey, {
    apiVersion: '2024-11-20.acacia',
  });

  logger.info('Stripe client initialized');

  return stripeClient;
}

/**
 * Get Stripe client instance
 */
export function getStripeClient(): Stripe {
  if (!stripeClient) {
    return initStripeClient();
  }
  return stripeClient;
}

/**
 * Get charges for a time period
 */
export async function getCharges(
  startDate: Date,
  endDate: Date,
  limit: number = 100
): Promise<StripeCharge[]> {
  const stripe = getStripeClient();

  try {
    const charges = await stripe.charges.list({
      created: {
        gte: Math.floor(startDate.getTime() / 1000),
        lte: Math.floor(endDate.getTime() / 1000),
      },
      limit,
    });

    logger.debug('Retrieved charges from Stripe', {
      count: charges.data.length,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    return charges.data as StripeCharge[];
  } catch (error: any) {
    logger.error('Failed to retrieve charges from Stripe', {
      error: error.message,
    });
    throw error;
  }
}

/**
 * Get all subscriptions
 */
export async function getSubscriptions(
  status?: 'active' | 'canceled' | 'past_due' | 'all',
  limit: number = 100
): Promise<StripeSubscription[]> {
  const stripe = getStripeClient();

  try {
    const params: Stripe.SubscriptionListParams = { limit };
    if (status && status !== 'all') {
      params.status = status;
    }

    const subscriptions = await stripe.subscriptions.list(params);

    logger.debug('Retrieved subscriptions from Stripe', {
      count: subscriptions.data.length,
      status: status || 'all',
    });

    return subscriptions.data as StripeSubscription[];
  } catch (error: any) {
    logger.error('Failed to retrieve subscriptions from Stripe', {
      error: error.message,
    });
    throw error;
  }
}

/**
 * Get customers
 */
export async function getCustomers(limit: number = 100): Promise<StripeCustomer[]> {
  const stripe = getStripeClient();

  try {
    const customers = await stripe.customers.list({ limit });

    logger.debug('Retrieved customers from Stripe', {
      count: customers.data.length,
    });

    return customers.data as StripeCustomer[];
  } catch (error: any) {
    logger.error('Failed to retrieve customers from Stripe', {
      error: error.message,
    });
    throw error;
  }
}

/**
 * Get balance transactions for a time period
 */
export async function getBalanceTransactions(
  startDate: Date,
  endDate: Date,
  limit: number = 100
): Promise<Stripe.BalanceTransaction[]> {
  const stripe = getStripeClient();

  try {
    const transactions = await stripe.balanceTransactions.list({
      created: {
        gte: Math.floor(startDate.getTime() / 1000),
        lte: Math.floor(endDate.getTime() / 1000),
      },
      limit,
    });

    logger.debug('Retrieved balance transactions from Stripe', {
      count: transactions.data.length,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    return transactions.data;
  } catch (error: any) {
    logger.error('Failed to retrieve balance transactions from Stripe', {
      error: error.message,
    });
    throw error;
  }
}

/**
 * Get customer by ID
 */
export async function getCustomer(customerId: string): Promise<StripeCustomer> {
  const stripe = getStripeClient();

  try {
    const customer = await stripe.customers.retrieve(customerId);

    if (customer.deleted) {
      throw new Error(`Customer ${customerId} has been deleted`);
    }

    return customer as StripeCustomer;
  } catch (error: any) {
    logger.error('Failed to retrieve customer from Stripe', {
      customerId,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Calculate total revenue from charges
 */
export function calculateRevenue(charges: StripeCharge[]): number {
  return charges
    .filter((charge) => charge.status === 'succeeded')
    .reduce((total, charge) => total + charge.amount, 0) / 100; // Convert cents to dollars
}

/**
 * Calculate MRR (Monthly Recurring Revenue) from subscriptions
 */
export function calculateMRR(subscriptions: StripeSubscription[]): number {
  return subscriptions
    .filter((sub) => sub.status === 'active')
    .reduce((total, sub) => {
      const amount = sub.items.data[0]?.price?.unit_amount || 0;
      const interval = sub.items.data[0]?.price?.recurring?.interval || 'month';

      // Convert to monthly amount
      let monthlyAmount = amount;
      if (interval === 'year') {
        monthlyAmount = amount / 12;
      } else if (interval === 'week') {
        monthlyAmount = amount * 4.33; // Average weeks per month
      } else if (interval === 'day') {
        monthlyAmount = amount * 30;
      }

      return total + monthlyAmount;
    }, 0) / 100; // Convert cents to dollars
}

export default {
  initStripeClient,
  getStripeClient,
  getCharges,
  getSubscriptions,
  getCustomers,
  getBalanceTransactions,
  getCustomer,
  calculateRevenue,
  calculateMRR,
};
