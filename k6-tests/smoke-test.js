/**
 * K6 Smoke Test - Quick validation of critical endpoints
 * Tests basic functionality with minimal load
 * 
 * Usage:
 *   k6 run k6-tests/smoke-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<3000'],
    http_req_failed: ['rate<0.1'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Test 1: Health check
  {
    const res = http.get(`${BASE_URL}/api/health`);
    check(res, {
      'health check status OK': (r) => r.status === 200 || r.status === 503,
      'health check has response': (r) => r.body.length > 0,
    });
  }

  sleep(1);

  // Test 2: Home page
  {
    const res = http.get(`${BASE_URL}/`);
    check(res, {
      'home page loads': (r) => r.status === 200,
    });
  }

  sleep(1);

  // Test 3: Access code page
  {
    const res = http.get(`${BASE_URL}/access-code`);
    check(res, {
      'access code page loads': (r) => r.status === 200,
    });
  }

  sleep(2);
}
