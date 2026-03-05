/**
 * K6 Load Testing Script for LearnPlus API
 * Tests the application under load with 100+ concurrent users
 * 
 * Usage:
 *   k6 run k6-tests/load-test.js
 * 
 * Options:
 *   k6 run --vus 100 --duration 60s k6-tests/load-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const healthCheckDuration = new Trend('health_check_duration');
const apiResponseTime = new Trend('api_response_time');

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 20 },   // Ramp up to 20 users over 1 minute
    { duration: '3m', target: 50 },   // Ramp up to 50 users over 3 minutes
    { duration: '2m', target: 100 },  // Ramp up to 100 users over 2 minutes
    { duration: '5m', target: 100 },  // Stay at 100 users for 5 minutes
    { duration: '2m', target: 50 },   // Ramp down to 50 users
    { duration: '1m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests should be below 2s
    http_req_failed: ['rate<0.05'],     // Error rate should be below 5%
    errors: ['rate<0.05'],              // Custom error rate below 5%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

/**
 * Setup function - runs once before all iterations
 */
export function setup() {
  console.log(`Load testing: ${BASE_URL}`);
  console.log('Test stages: 0→20→50→100→50→0 users over 14 minutes');
  
  return {
    baseUrl: BASE_URL,
    testStartTime: new Date().toISOString(),
  };
}

/**
 * Main test function - runs for each virtual user iteration
 */
export default function (data) {
  // Scenario 1: Health check (10% of requests)
  if (Math.random() < 0.1) {
    testHealthCheck(data.baseUrl);
  }
  
  // Scenario 2: Access code verification (20% of requests)
  if (Math.random() < 0.2) {
    testAccessCodeVerification(data.baseUrl);
  }
  
  // Scenario 3: Problem validation (40% of requests)
  if (Math.random() < 0.4) {
    testProblemValidation(data.baseUrl);
  }
  
  // Scenario 4: Event logging (30% of requests)
  if (Math.random() < 0.3) {
    testEventLogging(data.baseUrl);
  }
  
  // Think time - simulate user reading/thinking
  sleep(Math.random() * 3 + 1); // 1-4 seconds
}

/**
 * Test health check endpoint
 */
function testHealthCheck(baseUrl) {
  const startTime = Date.now();
  const res = http.get(`${baseUrl}/api/health`);
  const duration = Date.now() - startTime;
  
  healthCheckDuration.add(duration);
  
  const checkResult = check(res, {
    'health check status is 200 or 503': (r) => r.status === 200 || r.status === 503,
    'health check has status field': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.status !== undefined;
      } catch {
        return false;
      }
    },
    'health check responds within 2s': (r) => duration < 2000,
  });
  
  errorRate.add(!checkResult);
}

/**
 * Test access code verification endpoint
 */
function testAccessCodeVerification(baseUrl) {
  const payload = JSON.stringify({
    accessCode: `TEST-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const startTime = Date.now();
  const res = http.post(`${baseUrl}/api/auth/verify-access-code`, payload, params);
  const duration = Date.now() - startTime;
  
  apiResponseTime.add(duration);
  
  const checkResult = check(res, {
    'access code verification responds': (r) => r.status !== 0,
    'access code response is valid JSON': (r) => {
      try {
        JSON.parse(r.body);
        return true;
      } catch {
        return false;
      }
    },
    'responds within 3s': (r) => duration < 3000,
  });
  
  errorRate.add(!checkResult);
}

/**
 * Test problem validation endpoint
 */
function testProblemValidation(baseUrl) {
  const problems = [
    'diff-basics-1',
    'diff-basics-2',
    'diff-basics-3',
    'diff-product-1',
    'diff-quotient-1',
  ];
  
  const payload = JSON.stringify({
    problemId: problems[Math.floor(Math.random() * problems.length)],
    stepNumber: Math.floor(Math.random() * 3) + 1,
    userAnswer: '2x',
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `session=load-test-user-${Math.floor(Math.random() * 100)}`,
    },
  };
  
  const startTime = Date.now();
  const res = http.post(`${baseUrl}/api/validate-step`, payload, params);
  const duration = Date.now() - startTime;
  
  apiResponseTime.add(duration);
  
  const checkResult = check(res, {
    'validate step responds': (r) => r.status !== 0,
    'validate step not 500': (r) => r.status !== 500,
    'responds within 2s': (r) => duration < 2000,
  });
  
  errorRate.add(!checkResult);
}

/**
 * Test event logging endpoint
 */
function testEventLogging(baseUrl) {
  const eventTypes = [
    'problem_viewed',
    'answer_submitted',
    'hint_requested',
    'step_completed',
  ];
  
  const payload = JSON.stringify({
    eventType: eventTypes[Math.floor(Math.random() * eventTypes.length)],
    eventData: {
      problemId: 'diff-basics-1',
      timestamp: new Date().toISOString(),
    },
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `session=load-test-user-${Math.floor(Math.random() * 100)}`,
    },
  };
  
  const startTime = Date.now();
  const res = http.post(`${baseUrl}/api/log-event`, payload, params);
  const duration = Date.now() - startTime;
  
  apiResponseTime.add(duration);
  
  const checkResult = check(res, {
    'log event responds': (r) => r.status !== 0,
    'log event not 500': (r) => r.status !== 500,
    'responds within 1.5s': (r) => duration < 1500,
  });
  
  errorRate.add(!checkResult);
}

/**
 * Teardown function - runs once after all iterations
 */
export function teardown(data) {
  console.log(`\nLoad test completed`);
  console.log(`Started: ${data.testStartTime}`);
  console.log(`Ended: ${new Date().toISOString()}`);
  console.log('\nCheck the summary above for detailed metrics.');
}

/**
 * Handle summary - customize the end-of-test summary
 */
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'k6-tests/results/load-test-summary.json': JSON.stringify(data),
  };
}

// Helper function for text summary
function textSummary(data, options) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;
  
  let summary = '\n';
  summary += `${indent}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  summary += `${indent}    LOAD TEST SUMMARY\n`;
  summary += `${indent}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  if (data.metrics.http_reqs) {
    summary += `${indent}  Total Requests: ${data.metrics.http_reqs.values.count}\n`;
  }
  
  if (data.metrics.http_req_duration) {
    summary += `${indent}  Avg Response Time: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
    summary += `${indent}  P95 Response Time: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  }
  
  if (data.metrics.http_req_failed) {
    summary += `${indent}  Error Rate: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%\n`;
  }
  
  if (data.metrics.vus_max) {
    summary += `${indent}  Peak Virtual Users: ${data.metrics.vus_max.values.max}\n`;
  }
  
  summary += `\n${indent}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  
  return summary;
}
