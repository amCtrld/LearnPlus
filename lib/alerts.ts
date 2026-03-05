/**
 * Alert System for Critical Events
 * 
 * Sends notifications for critical system events:
 * - Database failures
 * - Authentication issues
 * - High error rates
 * - Security breaches
 * - Service unavailability
 * 
 * Notification channels:
 * - Console logging (development)
 * - Firestore logging (production)
 * - Email (TODO: integrate email service)
 * - Webhook (TODO: Slack, Discord, etc.)
 */

import { getAdminFirestore } from './firebase';

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';
export type AlertCategory =
  | 'database'
  | 'authentication'
  | 'security'
  | 'performance'
  | 'external_service'
  | 'system';

export interface Alert {
  id?: string;
  timestamp: Date;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  message: string;
  context?: Record<string, any>;
  resolved?: boolean;
  resolvedAt?: Date;
  notificationsSent?: string[]; // Array of notification channels used
}

/**
 * Alert thresholds and cooldowns
 */
const ALERT_CONFIG = {
  // Minimum time between alerts of the same type (milliseconds)
  cooldown: {
    info: 60 * 60 * 1000,      // 1 hour
    warning: 30 * 60 * 1000,    // 30 minutes
    error: 15 * 60 * 1000,      // 15 minutes
    critical: 5 * 60 * 1000,    // 5 minutes
  },
  
  // Error rate thresholds
  errorRateThreshold: {
    warning: 5,  // 5% error rate
    critical: 15, // 15% error rate
  },
  
  // Response time thresholds (milliseconds)
  responseTimeThreshold: {
    warning: 1000,  // 1 second
    critical: 3000, // 3 seconds
  },
};

/**
 * Track recent alerts to prevent spam
 */
const recentAlerts = new Map<string, number>();

/**
 * Check if alert should be throttled
 */
function shouldThrottle(alertKey: string, severity: AlertSeverity): boolean {
  const lastAlert = recentAlerts.get(alertKey);
  if (!lastAlert) return false;
  
  const cooldown = ALERT_CONFIG.cooldown[severity];
  const timeSinceLastAlert = Date.now() - lastAlert;
  
  return timeSinceLastAlert < cooldown;
}

/**
 * Send alert via console
 */
function sendConsoleAlert(alert: Alert): void {
  const severityColors = {
    info: '\x1b[36m',     // Cyan
    warning: '\x1b[33m',  // Yellow
    error: '\x1b[35m',    // Magenta
    critical: '\x1b[31m\x1b[1m', // Bold Red
  };
  
  const color = severityColors[alert.severity];
  const reset = '\x1b[0m';
  
  console.log(`\n${color}[ALERT:${alert.severity.toUpperCase()}]${reset}`);
  console.log(`${color}${alert.title}${reset}`);
  console.log(`Category: ${alert.category}`);
  console.log(`Message: ${alert.message}`);
  
  if (alert.context) {
    console.log('Context:', alert.context);
  }
  console.log('');
}

/**
 * Send alert via Firestore
 */
async function sendFirestoreAlert(alert: Alert): Promise<void> {
  try {
    const db = getAdminFirestore();
    if (!db) return;
    
    await db.collection('alerts').add({
      ...alert,
      timestamp: new Date(alert.timestamp),
    });
  } catch (error) {
    console.error('Failed to save alert to Firestore:', error);
  }
}

/**
 * Send alert via email (TODO: implement)
 */
async function sendEmailAlert(alert: Alert): Promise<void> {
  // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
  console.log('[TODO] Send email alert:', alert.title);
  
  // Example implementation:
  // const emailService = getEmailService();
  // await emailService.send({
  //   to: process.env.ALERT_EMAIL,
  //   subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
  //   body: formatAlertEmail(alert),
  // });
}

/**
 * Send alert via webhook (TODO: implement)
 */
async function sendWebhookAlert(alert: Alert): Promise<void> {
  // TODO: Integrate with webhook service (Slack, Discord, etc.)
  console.log('[TODO] Send webhook alert:', alert.title);
  
  // Example Slack implementation:
  // if (process.env.SLACK_WEBHOOK_URL) {
  //   await fetch(process.env.SLACK_WEBHOOK_URL, {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({
  //       text: `*${alert.title}*`,
  //       attachments: [{
  //         color: alert.severity === 'critical' ? 'danger' : 'warning',
  //         fields: [
  //           { title: 'Severity', value: alert.severity, short: true },
  //           { title: 'Category', value: alert.category, short: true },
  //           { title: 'Message', value: alert.message },
  //         ],
  //       }],
  //     }),
  //   });
  // }
}

/**
 * Send alert through configured channels
 */
export async function sendAlert(alert: Alert): Promise<void> {
  // Generate alert key for throttling
  const alertKey = `${alert.category}:${alert.title}`;
  
  // Check if alert should be throttled
  if (shouldThrottle(alertKey, alert.severity)) {
    console.log(`[Alert throttled] ${alert.title}`);
    return;
  }
  
  // Record alert time
  recentAlerts.set(alertKey, Date.now());
  
  // Track which channels were used
  const notificationsSent: string[] = [];
  
  // Always log to console
  sendConsoleAlert(alert);
  notificationsSent.push('console');
  
  // Save to Firestore in production
  if (process.env.NODE_ENV === 'production') {
    await sendFirestoreAlert(alert);
    notificationsSent.push('firestore');
  }
  
  // Send email for error and critical alerts
  if (alert.severity === 'error' || alert.severity === 'critical') {
    await sendEmailAlert(alert);
    notificationsSent.push('email');
  }
  
  // Send webhook for critical alerts
  if (alert.severity === 'critical') {
    await sendWebhookAlert(alert);
    notificationsSent.push('webhook');
  }
  
  // Update alert with notifications sent
  alert.notificationsSent = notificationsSent;
}

/**
 * Create and send database alert
 */
export async function alertDatabaseIssue(
  message: string,
  severity: AlertSeverity = 'error',
  context?: Record<string, any>
): Promise<void> {
  await sendAlert({
    timestamp: new Date(),
    severity,
    category: 'database',
    title: 'Database Issue',
    message,
    context,
  });
}

/**
 * Create and send authentication alert
 */
export async function alertAuthenticationIssue(
  message: string,
  severity: AlertSeverity = 'warning',
  context?: Record<string, any>
): Promise<void> {
  await sendAlert({
    timestamp: new Date(),
    severity,
    category: 'authentication',
    title: 'Authentication Issue',
    message,
    context,
  });
}

/**
 * Create and send security alert
 */
export async function alertSecurityIssue(
  message: string,
  severity: AlertSeverity = 'critical',
  context?: Record<string, any>
): Promise<void> {
  await sendAlert({
    timestamp: new Date(),
    severity,
    category: 'security',
    title: 'Security Issue',
    message,
    context,
  });
}

/**
 * Create and send performance alert
 */
export async function alertPerformanceIssue(
  message: string,
  severity: AlertSeverity = 'warning',
  context?: Record<string, any>
): Promise<void> {
  await sendAlert({
    timestamp: new Date(),
    severity,
    category: 'performance',
    title: 'Performance Issue',
    message,
    context,
  });
}

/**
 * Create and send external service alert
 */
export async function alertExternalServiceIssue(
  message: string,
  severity: AlertSeverity = 'error',
  context?: Record<string, any>
): Promise<void> {
  await sendAlert({
    timestamp: new Date(),
    severity,
    category: 'external_service',
    title: 'External Service Issue',
    message,
    context,
  });
}

/**
 * Monitor error rate and send alert if threshold exceeded
 */
export async function checkErrorRate(
  totalRequests: number,
  errorCount: number
): Promise<void> {
  if (totalRequests === 0) return;
  
  const errorRate = (errorCount / totalRequests) * 100;
  
  if (errorRate >= ALERT_CONFIG.errorRateThreshold.critical) {
    await sendAlert({
      timestamp: new Date(),
      severity: 'critical',
      category: 'system',
      title: 'High Error Rate',
      message: `Error rate is ${errorRate.toFixed(2)}% (${errorCount}/${totalRequests} requests failed)`,
      context: { errorRate, errorCount, totalRequests },
    });
  } else if (errorRate >= ALERT_CONFIG.errorRateThreshold.warning) {
    await sendAlert({
      timestamp: new Date(),
      severity: 'warning',
      category: 'system',
      title: 'Elevated Error Rate',
      message: `Error rate is ${errorRate.toFixed(2)}% (${errorCount}/${totalRequests} requests failed)`,
      context: { errorRate, errorCount, totalRequests },
    });
  }
}

/**
 * Monitor response time and send alert if threshold exceeded
 */
export async function checkResponseTime(
  endpoint: string,
  responseTime: number
): Promise<void> {
  if (responseTime >= ALERT_CONFIG.responseTimeThreshold.critical) {
    await sendAlert({
      timestamp: new Date(),
      severity: 'critical',
      category: 'performance',
      title: 'Critical Response Time',
      message: `${endpoint} responded in ${responseTime}ms (threshold: ${ALERT_CONFIG.responseTimeThreshold.critical}ms)`,
      context: { endpoint, responseTime },
    });
  } else if (responseTime >= ALERT_CONFIG.responseTimeThreshold.warning) {
    await sendAlert({
      timestamp: new Date(),
      severity: 'warning',
      category: 'performance',
      title: 'Slow Response Time',
      message: `${endpoint} responded in ${responseTime}ms (threshold: ${ALERT_CONFIG.responseTimeThreshold.warning}ms)`,
      context: { endpoint, responseTime },
    });
  }
}

/**
 * Get recent alerts
 */
export async function getRecentAlerts(
  limit: number = 50,
  severity?: AlertSeverity
): Promise<Alert[]> {
  const db = getAdminFirestore();
  if (!db) return [];
  
  let query: any = db.collection('alerts')
    .orderBy('timestamp', 'desc')
    .limit(limit);
  
  if (severity) {
    query = query.where('severity', '==', severity);
  }
  
  const snapshot = await query.get();
  
  return snapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp.toDate(),
    resolvedAt: doc.data().resolvedAt?.toDate(),
  }));
}

/**
 * Mark alert as resolved
 */
export async function resolveAlert(alertId: string): Promise<void> {
  const db = getAdminFirestore();
  if (!db) return;
  
  await db.collection('alerts').doc(alertId).update({
    resolved: true,
    resolvedAt: new Date(),
  });
}

export default sendAlert;
