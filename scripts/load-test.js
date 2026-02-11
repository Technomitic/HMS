// k6 Load Test — run with: k6 run scripts/load-test.js
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.API_URL || 'http://localhost:4000/api/v1';

const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration');

export const options = {
  stages: [
    { duration: '30s', target: 50 },   // Ramp up to 50 users
    { duration: '2m', target: 50 },     // Stay at 50
    { duration: '30s', target: 200 },   // Ramp to 200
    { duration: '2m', target: 200 },    // Stay at 200
    { duration: '30s', target: 500 },   // Ramp to 500
    { duration: '2m', target: 500 },    // Stay at 500
    { duration: '1m', target: 0 },      // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],     // 95% of requests under 2s
    http_req_failed: ['rate<0.05'],        // Less than 5% failure rate
    errors: ['rate<0.1'],                  // Custom error rate under 10%
  },
};

let accessToken = null;

export function setup() {
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({
      email: 'jane.doe@demo.com',
      password: 'Demo@2024!',
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );

  const body = JSON.parse(loginRes.body);
  return { token: body.data.accessToken };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${data.token}`,
  };

  group('Health Check', () => {
    const res = http.get(`${BASE_URL}/health`);
    check(res, {
      'health status 200': (r) => r.status === 200,
      'health body healthy': (r) => JSON.parse(r.body).status === 'healthy',
    }) || errorRate.add(1);
  });

  group('Dashboard', () => {
    const res = http.get(`${BASE_URL}/dashboard/patient`, { headers });
    check(res, {
      'dashboard status 200': (r) => r.status === 200,
    }) || errorRate.add(1);
  });

  group('Doctor List', () => {
    const res = http.get(`${BASE_URL}/doctors?limit=10`);
    check(res, {
      'doctors status 200': (r) => r.status === 200,
      'doctors has data': (r) => JSON.parse(r.body).data.length > 0,
    }) || errorRate.add(1);
  });

  group('Notifications', () => {
    const res = http.get(`${BASE_URL}/notifications?limit=5`, { headers });
    check(res, {
      'notifications status 200': (r) => r.status === 200,
    }) || errorRate.add(1);
  });

  group('Available Slots', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    // Use a doctor ID from seed data — will fail gracefully if not found
    const res = http.get(
      `${BASE_URL}/doctors?department=CARDIOLOGY&limit=1`,
    );

    if (res.status === 200) {
      const doctors = JSON.parse(res.body).data;
      if (doctors.length > 0) {
        const doctorId = doctors[0].user?.id || doctors[0].userId;
        if (doctorId) {
          const slotsRes = http.get(
            `${BASE_URL}/appointments/slots/${doctorId}?date=${dateStr}`,
            { headers },
          );
          check(slotsRes, {
            'slots status 200': (r) => r.status === 200,
          }) || errorRate.add(1);
        }
      }
    }
  });

  sleep(1);
}