// ============================================================================
// ENTERPRISE SECURITY SERVICE
// Microsoft Copilot Onboarding & ROI Platform
// ============================================================================

import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { createClient, RedisClientType } from 'redis';

interface SecurityEvent {
  userId?: string;
  organizationId?: string;
  eventType: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  ipAddress: string;
  userAgent: string;
  details?: Record<string, any>;
}

interface RiskAssessment {
  riskScore: number; // 0-1
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: string[];
  actionTaken: 'allowed' | 'blocked' | 'challenged';
}

export class SecurityService {
  private db: Pool;
  private redis: RedisClientType;
  private jwtSecret: string;

  constructor(database: Pool, redisClient: RedisClientType) {
    this.db = database;
    this.redis = redisClient;
    this.jwtSecret = process.env.JWT_SECRET || 'change-this-secret';
  }

  /**
   * Hash password with bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  }

  /**
   * Verify password
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT token
   */
  generateToken(payload: any, expiresIn: string = '24h'): string {
    return jwt.sign(payload, this.jwtSecret, { expiresIn });
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Log security event
   */
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    const riskAssessment = await this.assessRisk(event);

    const query = `
      INSERT INTO security_events (
        user_id,
        organization_id,
        event_type,
        event_category,
        severity,
        ip_address,
        user_agent,
        risk_score,
        risk_level,
        risk_factors,
        action_taken,
        blocked,
        event_details
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `;

    await this.db.query(query, [
      event.userId,
      event.organizationId,
      event.eventType,
      this.categorizeEvent(event.eventType),
      event.severity,
      event.ipAddress,
      event.userAgent,
      riskAssessment.riskScore,
      riskAssessment.riskLevel,
      JSON.stringify(riskAssessment.riskFactors),
      riskAssessment.actionTaken,
      riskAssessment.actionTaken === 'blocked',
      JSON.stringify(event.details || {})
    ]);

    // Send alerts for high-severity events
    if (event.severity === 'high' || event.severity === 'critical') {
      await this.sendSecurityAlert(event, riskAssessment);
    }
  }

  /**
   * Assess security risk
   */
  private async assessRisk(event: SecurityEvent): Promise<RiskAssessment> {
    let riskScore = 0;
    const riskFactors: string[] = [];

    // Check for failed login attempts
    if (event.eventType === 'failed_login' && event.userId) {
      const recentFailures = await this.getRecentFailedLogins(event.userId);
      if (recentFailures >= 3) {
        riskScore += 0.3;
        riskFactors.push('Multiple failed login attempts');
      }
    }

    // Check for unusual location
    if (event.userId) {
      const isUnusualLocation = await this.checkUnusualLocation(event.userId, event.ipAddress);
      if (isUnusualLocation) {
        riskScore += 0.25;
        riskFactors.push('Login from unusual location');
      }
    }

    // Check for impossible travel
    if (event.userId) {
      const impossibleTravel = await this.detectImpossibleTravel(event.userId, event.ipAddress);
      if (impossibleTravel) {
        riskScore += 0.4;
        riskFactors.push('Impossible travel detected');
      }
    }

    // Check for suspicious IP
    const isSuspiciousIP = await this.checkSuspiciousIP(event.ipAddress);
    if (isSuspiciousIP) {
      riskScore += 0.3;
      riskFactors.push('IP flagged as suspicious');
    }

    // Check for unusual time
    const isUnusualTime = this.checkUnusualTime(new Date());
    if (isUnusualTime) {
      riskScore += 0.1;
      riskFactors.push('Activity during unusual hours');
    }

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (riskScore < 0.3) riskLevel = 'low';
    else if (riskScore < 0.6) riskLevel = 'medium';
    else if (riskScore < 0.85) riskLevel = 'high';
    else riskLevel = 'critical';

    // Determine action
    let actionTaken: 'allowed' | 'blocked' | 'challenged';
    if (riskScore >= 0.85) actionTaken = 'blocked';
    else if (riskScore >= 0.6) actionTaken = 'challenged';
    else actionTaken = 'allowed';

    return {
      riskScore: Math.min(1, riskScore),
      riskLevel,
      riskFactors,
      actionTaken
    };
  }

  /**
   * Check rate limiting
   */
  async checkRateLimit(
    identifier: string,
    identifierType: 'ip' | 'user' | 'api_key',
    maxRequests: number = 100,
    windowMinutes: number = 15
  ): Promise<boolean> {
    const key = `ratelimit:${identifierType}:${identifier}`;
    const count = await this.redis.get(key);

    if (count && parseInt(count) >= maxRequests) {
      // Rate limit exceeded
      await this.logSecurityEvent({
        eventType: 'rate_limit_exceeded',
        severity: 'medium',
        ipAddress: identifier,
        userAgent: '',
        details: { maxRequests, windowMinutes }
      });
      return false;
    }

    // Increment counter
    await this.redis.incr(key);
    await this.redis.expire(key, windowMinutes * 60);

    return true;
  }

  /**
   * Validate device trust
   */
  async validateDeviceTrust(userId: string, deviceFingerprint: string): Promise<boolean> {
    const query = `
      SELECT * FROM trusted_devices
      WHERE user_id = $1
        AND device_fingerprint = $2
        AND is_trusted = true
        AND (trusted_until IS NULL OR trusted_until > NOW())
        AND revoked = false
    `;

    const result = await this.db.query(query, [userId, deviceFingerprint]);
    return result.rows.length > 0;
  }

  /**
   * Register trusted device
   */
  async registerTrustedDevice(
    userId: string,
    organizationId: string,
    deviceFingerprint: string,
    deviceDetails: any,
    trustPeriodDays: number = 30
  ): Promise<void> {
    const query = `
      INSERT INTO trusted_devices (
        user_id,
        organization_id,
        device_fingerprint,
        device_name,
        device_type,
        operating_system,
        browser,
        first_seen_ip,
        trusted_until
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW() + INTERVAL '${trustPeriodDays} days')
      ON CONFLICT (device_fingerprint) DO UPDATE
        SET last_used = NOW(),
            total_uses = trusted_devices.total_uses + 1
    `;

    await this.db.query(query, [
      userId,
      organizationId,
      deviceFingerprint,
      deviceDetails.name,
      deviceDetails.type,
      deviceDetails.os,
      deviceDetails.browser,
      deviceDetails.ip
    ]);
  }

  /**
   * Validate API key
   */
  async validateAPIKey(apiKey: string): Promise<any> {
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    const query = `
      SELECT * FROM api_keys
      WHERE key_hash = $1
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
    `;

    const result = await this.db.query(query, [keyHash]);

    if (result.rows.length === 0) {
      throw new Error('Invalid or expired API key');
    }

    const key = result.rows[0];

    // Update last used
    await this.db.query(
      'UPDATE api_keys SET last_used = NOW(), total_requests = total_requests + 1 WHERE api_key_id = $1',
      [key.api_key_id]
    );

    // Check rate limit
    const allowed = await this.checkRateLimit(
      key.api_key_id,
      'api_key',
      key.rate_limit_per_minute,
      1
    );

    if (!allowed) {
      throw new Error('API rate limit exceeded');
    }

    return key;
  }

  /**
   * Generate API key
   */
  async generateAPIKey(
    organizationId: string,
    userId: string,
    keyName: string,
    scopes: string[],
    expiryDays?: number
  ): Promise<string> {
    // Generate secure random key
    const apiKey = `sk_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    const keyPrefix = apiKey.substring(0, 10);

    const expiresAt = expiryDays ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000) : null;

    const query = `
      INSERT INTO api_keys (
        organization_id,
        user_id,
        key_name,
        key_hash,
        key_prefix,
        scopes,
        expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING api_key_id
    `;

    await this.db.query(query, [
      organizationId,
      userId,
      keyName,
      keyHash,
      keyPrefix,
      JSON.stringify(scopes),
      expiresAt
    ]);

    // Return the actual key (only time it's shown)
    return apiKey;
  }

  /**
   * Encrypt sensitive data
   */
  encrypt(data: string, organizationId: string): string {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(this.jwtSecret + organizationId, 'salt', 32);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return JSON.stringify({
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    });
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedData: string, organizationId: string): string {
    const { encrypted, iv, authTag } = JSON.parse(encryptedData);

    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(this.jwtSecret + organizationId, 'salt', 32);

    const decipher = crypto.createDecipheriv(
      algorithm,
      key,
      Buffer.from(iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private async getRecentFailedLogins(userId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM security_events
      WHERE user_id = $1
        AND event_type = 'failed_login'
        AND event_timestamp > NOW() - INTERVAL '1 hour'
    `;

    const result = await this.db.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }

  private async checkUnusualLocation(userId: string, ipAddress: string): Promise<boolean> {
    // Get user's typical locations
    const query = `
      SELECT DISTINCT ip_address
      FROM security_events
      WHERE user_id = $1
        AND event_type = 'successful_login'
        AND event_timestamp > NOW() - INTERVAL '30 days'
      LIMIT 5
    `;

    const result = await this.db.query(query, [userId]);
    const knownIPs = result.rows.map(r => r.ip_address);

    return !knownIPs.includes(ipAddress);
  }

  private async detectImpossibleTravel(userId: string, currentIP: string): Promise<boolean> {
    // Get last login location and time
    const query = `
      SELECT ip_address, event_timestamp, geo_location
      FROM security_events
      WHERE user_id = $1
        AND event_type = 'successful_login'
        AND ip_address != $2
      ORDER BY event_timestamp DESC
      LIMIT 1
    `;

    const result = await this.db.query(query, [userId, currentIP]);

    if (result.rows.length === 0) return false;

    const lastLogin = result.rows[0];
    const timeDiffHours = (Date.now() - new Date(lastLogin.event_timestamp).getTime()) / (1000 * 60 * 60);

    // If login from different location within 2 hours, flag as impossible travel
    if (timeDiffHours < 2 && lastLogin.ip_address !== currentIP) {
      return true;
    }

    return false;
  }

  private async checkSuspiciousIP(ipAddress: string): Promise<boolean> {
    // Check against known malicious IPs
    const query = `
      SELECT COUNT(*) as count
      FROM security_events
      WHERE ip_address = $1
        AND blocked = true
        AND event_timestamp > NOW() - INTERVAL '7 days'
    `;

    const result = await this.db.query(query, [ipAddress]);
    return parseInt(result.rows[0].count) > 5;
  }

  private checkUnusualTime(timestamp: Date): boolean {
    const hour = timestamp.getHours();
    // Consider 11pm - 5am as unusual
    return hour >= 23 || hour < 5;
  }

  private categorizeEvent(eventType: string): string {
    const categories: Record<string, string> = {
      'login': 'authentication',
      'logout': 'authentication',
      'failed_login': 'authentication',
      'password_change': 'authentication',
      'mfa_challenge': 'authentication',
      'data_access': 'data_access',
      'data_export': 'data_access',
      'config_change': 'configuration',
      'user_created': 'user_management',
      'user_deleted': 'user_management'
    };

    return categories[eventType] || 'other';
  }

  private async sendSecurityAlert(event: SecurityEvent, risk: RiskAssessment): Promise<void> {
    // In production, this would send alerts via email, Slack, Teams, etc.
    console.log('SECURITY ALERT:', {
      event: event.eventType,
      severity: event.severity,
      riskLevel: risk.riskLevel,
      riskFactors: risk.riskFactors,
      action: risk.actionTaken
    });

    // Store alert for dashboard
    // Send to security team
    // Trigger incident if critical
  }
}
