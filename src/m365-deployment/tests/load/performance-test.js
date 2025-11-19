import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 10 },  // Warm up
    { duration: '5m', target: 50 },  // Normal load
    { duration: '2m', target: 100 }, // Peak load
    { duration: '1m', target: 0 },   // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.1'],    // Error rate should be below 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://sga-qapack-func-prod.azurewebsites.net';

export default function () {
  const payload = {
    qaPackId: 'test-qa-pack-' + Math.random().toString(36).substr(2, 9),
    jobNumber: 'JOB-' + Math.floor(Math.random() * 1000),
    client: 'Test Client ' + Math.floor(Math.random() * 100),
    dailyReport: {
      msdyn_completedby: 'test@sga.com.au',
      msdyn_starttime: '08:00',
      msdyn_finishtime: '17:00',
      msdyn_correctorused: false,
      msdyn_siteinstructions: 'Test instructions',
      msdyn_othercomments: 'Test comments',
      msdyn_date: new Date().toISOString().split('T')[0]
    },
    asphaltPlacement: {
      msdyn_date: new Date().toISOString().split('T')[0],
      msdyn_lotno: 'LOT-' + Math.floor(Math.random() * 100),
      msdyn_pavementsurfacecondition: 1,
      msdyn_rainfallduringshift: false
    },
    placementRows: [
      {
        msdyn_docketnumber: 'DOC-' + Math.floor(Math.random() * 1000),
        msdyn_tonnes: Math.floor(Math.random() * 20) + 10,
        msdyn_incomingtemp: Math.floor(Math.random() * 10) + 140,
        msdyn_placementtemp: Math.floor(Math.random() * 10) + 140,
        msdyn_tempscompliant: Math.random() > 0.2,
        msdyn_nonconformancereason: Math.random() > 0.8 ? 'Temperature out of range' : '',
        msdyn_sequencenumber: 1
      }
    ]
  };

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + __ENV.AUTH_TOKEN,
    },
  };

  const response = http.post(`${BASE_URL}/api/GenerateAISummary`, JSON.stringify(payload), params);

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'has summary in response': (r) => r.json().hasOwnProperty('summary'),
    'summary is not empty': (r) => r.json().summary && r.json().summary.length > 0,
  });

  sleep(1); // Wait 1 second between requests
}