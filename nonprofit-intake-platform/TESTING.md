# Testing Guide - Non-Profit Intake Platform

## **Comprehensive Testing Strategy**

---

## **Testing Philosophy**

We follow a comprehensive testing pyramid approach:
- **70% Unit Tests** - Fast, isolated component testing
- **20% Integration Tests** - API and service interaction testing
- **10% E2E Tests** - Critical user journey testing

**Target Coverage**: 95%+ code coverage across all services

---

## **Quick Start**

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test suite
npm test -- AssessmentOrchestrator.test.ts

# Run E2E tests
npm run test:e2e
```

---

## **Unit Testing**

### **Backend Unit Tests (Jest)**

**Location**: `backend/src/**/__tests__/`

**Example Test**:

```typescript
// backend/src/services/intake-engine/__tests__/IntakeEngine.test.ts

import { IntakeEngine } from '../IntakeEngine';
import { Organization, OrganizationType } from '../../../types';

describe('IntakeEngine', () => {
  let intakeEngine: IntakeEngine;

  beforeEach(() => {
    intakeEngine = new IntakeEngine({
      enableAIClassification: true,
      enableDuplicateDetection: true,
      enableFraudDetection: false,
      enablePublicDataEnrichment: false,
      autoAdvanceStages: true,
    });
  });

  describe('classifyOrganization', () => {
    it('should correctly classify 501(c)(3) as mission_driven', async () => {
      const orgData: Partial<Organization> = {
        organizationName: 'Food Bank of America',
        taxStatus: '501c3',
        missionStatement: 'Ending hunger in our community through food distribution',
        ein: '12-3456789',
      };

      const result = await intakeEngine.classifyOrganization(orgData);

      expect(result.organizationType).toBe('mission_driven');
      expect(result.subType).toBe('charity');
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('should correctly classify 501(c)(6) as association', async () => {
      const orgData: Partial<Organization> = {
        organizationName: 'American Medical Association',
        taxStatus: '501c6',
        missionStatement: 'Advancing the art and science of medicine',
      };

      const result = await intakeEngine.classifyOrganization(orgData);

      expect(result.organizationType).toBe('association');
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('should correctly classify 527 as PAC', async () => {
      const orgData: Partial<Organization> = {
        organizationName: 'Americans for Better Government PAC',
        taxStatus: '527',
      };

      const result = await intakeEngine.classifyOrganization(orgData);

      expect(result.organizationType).toBe('pac');
    });
  });

  describe('validateIntakeData', () => {
    it('should validate EIN format', async () => {
      const invalidOrg: Partial<Organization> = {
        organizationName: 'Test Org',
        ein: '123456789', // Missing dash
      };

      const result = await intakeEngine.validateIntakeData(invalidOrg);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'ein',
          code: 'INVALID_EIN',
        })
      );
    });

    it('should validate required fields', async () => {
      const incompleteOrg: Partial<Organization> = {
        // Missing organizationName
        taxStatus: '501c3',
      };

      const result = await intakeEngine.validateIntakeData(incompleteOrg);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'organizationName',
          code: 'REQUIRED_FIELD',
        })
      );
    });
  });

  describe('calculateIntakeScore', () => {
    it('should return 0 for minimal data', () => {
      const minimalOrg: Partial<Organization> = {
        organizationName: 'Test Org',
      };

      const score = intakeEngine.calculateIntakeScore(minimalOrg);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThan(30);
    });

    it('should return high score for complete data', () => {
      const completeOrg: Partial<Organization> = {
        organizationName: 'Complete Org',
        legalName: 'Complete Organization Inc.',
        ein: '12-3456789',
        taxStatus: '501c3',
        foundingDate: new Date('2020-01-01'),
        annualBudget: 500000,
        totalRevenue: 500000,
        totalExpenses: 450000,
        totalAssets: 1000000,
        missionStatement: 'Making a difference',
        primaryPrograms: [{ name: 'Program 1', description: 'Desc', programArea: 'education' }],
        ceoExecutiveDirector: {
          firstName: 'John',
          lastName: 'Doe',
          name: 'John Doe',
          email: 'john@example.com',
        },
        boardSize: 12,
        email: 'info@org.org',
        phone: '555-1234',
        website: 'https://org.org',
      };

      const score = intakeEngine.calculateIntakeScore(completeOrg);

      expect(score).toBeGreaterThan(85);
    });
  });
});
```

### **Running Unit Tests**

```bash
# Run all unit tests
npm run test:unit

# Run specific file
npm test -- IntakeEngine.test.ts

# Run with coverage
npm run test:unit -- --coverage

# Run in watch mode for TDD
npm run test:unit -- --watch
```

### **Coverage Requirements**

- Overall: 95%+
- Statements: 95%+
- Branches: 90%+
- Functions: 95%+
- Lines: 95%+

---

## **Integration Testing**

### **API Integration Tests**

**Location**: `backend/src/api/__tests__/integration/`

**Example Test**:

```typescript
// backend/src/api/__tests__/integration/assessment.integration.test.ts

import request from 'supertest';
import app from '../../../app';
import { setupTestDatabase, teardownTestDatabase, getTestToken } from '../../test-utils';

describe('Assessment API Integration', () => {
  let authToken: string;
  let testOrgId: string;

  beforeAll(async () => {
    await setupTestDatabase();
    const user = await createTestUser();
    authToken = await getTestToken(user.userId);
    testOrgId = user.primaryOrgId;
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe('POST /api/assessments', () => {
    it('should create new assessment', async () => {
      const response = await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          orgId: testOrgId,
          assessmentType: 'comprehensive',
          organizationType: 'mission_driven',
        })
        .expect(201);

      expect(response.body).toHaveProperty('assessmentId');
      expect(response.body.status).toBe('in_progress');
      expect(response.body.questionsTotal).toBeGreaterThan(0);
    });

    it('should reject unauthenticated requests', async () => {
      await request(app)
        .post('/api/assessments')
        .send({
          orgId: testOrgId,
          assessmentType: 'comprehensive',
        })
        .expect(401);
    });
  });

  describe('GET /api/assessments/:id', () => {
    it('should retrieve assessment by ID', async () => {
      // Create assessment first
      const createResponse = await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          orgId: testOrgId,
          assessmentType: 'comprehensive',
          organizationType: 'mission_driven',
        });

      const assessmentId = createResponse.body.assessmentId;

      // Retrieve it
      const response = await request(app)
        .get(`/api/assessments/${assessmentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.assessmentId).toBe(assessmentId);
      expect(response.body.orgId).toBe(testOrgId);
    });
  });

  describe('POST /api/assessments/:id/responses', () => {
    it('should submit assessment response', async () => {
      // Create assessment
      const assessment = await createTestAssessment(testOrgId);

      // Get first question
      const questions = await getAssessmentQuestions(assessment.assessmentId);

      // Submit response
      const response = await request(app)
        .post(`/api/assessments/${assessment.assessmentId}/responses`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          questionId: questions[0].questionId,
          responseValue: 'yes',
          responseScore: 5,
        })
        .expect(201);

      expect(response.body).toHaveProperty('responseId');
      expect(response.body.questionId).toBe(questions[0].questionId);
    });
  });
});
```

### **Database Integration Tests**

```typescript
// Example database integration test
describe('Database Operations', () => {
  it('should handle concurrent writes safely', async () => {
    const promises = Array(10).fill(null).map((_, i) =>
      createOrganization({ organizationName: `Org ${i}` })
    );

    const results = await Promise.all(promises);

    expect(results).toHaveLength(10);
    expect(new Set(results.map(r => r.orgId)).size).toBe(10); // All unique IDs
  });
});
```

---

## **End-to-End Testing (Playwright)**

### **E2E Test Setup**

**Location**: `frontend/e2e/`

**Configuration**: `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### **Example E2E Test**

```typescript
// e2e/assessment-flow.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Assessment Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await login(page, 'test@example.com', 'password');
  });

  test('should complete full assessment workflow', async ({ page }) => {
    // Navigate to assessment
    await page.click('text=Start Assessment');
    await expect(page).toHaveURL(/.*assessment/);

    // Verify progress tracker
    await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();

    // Answer first question
    await page.click('[data-testid="question-1"]');
    await page.selectOption('select[name="answer"]', 'yes');
    await page.click('button:has-text("Next")');

    // Verify auto-save
    await expect(page.locator('text=Saved')).toBeVisible();

    // Continue through multiple sections
    for (let i = 0; i < 5; i++) {
      await page.click('[data-testid="scale-5"]');
      await page.click('button:has-text("Next")');
      await page.waitForTimeout(500); // Wait for auto-save
    }

    // Verify assessment progress
    const progress = await page.locator('[data-testid="completion-percentage"]').textContent();
    expect(parseInt(progress!)).toBeGreaterThan(0);

    // Save and exit
    await page.click('button:has-text("Save & Exit")');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should handle offline mode', async ({ page, context }) => {
    await page.goto('/assessment');

    // Go offline
    await context.setOffline(true);

    // Answer question
    await page.selectOption('select[name="answer"]', 'yes');
    await page.click('button:has-text("Next")');

    // Verify offline indicator
    await expect(page.locator('text=Offline - Changes will sync when online')).toBeVisible();

    // Go back online
    await context.setOffline(false);

    // Verify sync
    await expect(page.locator('text=Synced')).toBeVisible({ timeout: 5000 });
  });
});
```

### **Accessibility Testing**

```typescript
// e2e/accessibility.spec.ts

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should be navigable by keyboard', async ({ page }) => {
    await page.goto('/');

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveAttribute('role', 'button');

    // Navigate with keyboard
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/.*dashboard/);
  });
});
```

---

## **Performance Testing**

### **Load Testing (k6)**

```javascript
// performance/load-test.js

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],   // Error rate should be less than 1%
  },
};

export default function () {
  // Login
  const loginRes = http.post('http://localhost:3001/api/auth/login', JSON.stringify({
    email: 'test@example.com',
    password: 'password',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(loginRes, {
    'login successful': (r) => r.status === 200,
    'got token': (r) => r.json('token') !== '',
  });

  const token = loginRes.json('token');

  // Get dashboard data
  const dashboardRes = http.get('http://localhost:3001/api/dashboard', {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  check(dashboardRes, {
    'dashboard loaded': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

**Run Load Test**:

```bash
k6 run performance/load-test.js
```

---

## **Security Testing**

### **OWASP ZAP Integration**

```bash
# Run ZAP baseline scan
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t http://localhost:3000 \
  -r zap-report.html

# Run full scan
docker run -t owasp/zap2docker-stable zap-full-scan.py \
  -t http://localhost:3000 \
  -r zap-full-report.html
```

### **Dependency Scanning**

```bash
# Audit npm dependencies
npm audit

# Fix vulnerabilities
npm audit fix

# Check for outdated packages
npm outdated
```

---

## **Test Data Management**

### **Test Fixtures**

```typescript
// test-utils/fixtures.ts

export const testOrganizations = {
  missionDriven: {
    organizationName: 'Test Food Bank',
    organizationType: 'mission_driven',
    taxStatus: '501c3',
    ein: '12-3456789',
    annualBudget: 500000,
  },
  association: {
    organizationName: 'Test Medical Association',
    organizationType: 'association',
    taxStatus: '501c6',
    ein: '98-7654321',
    annualBudget: 1000000,
  },
  pac: {
    organizationName: 'Test Political PAC',
    organizationType: 'pac',
    taxStatus: '527',
    annualBudget: 250000,
  },
};
```

### **Database Seeding for Tests**

```typescript
// test-utils/seed.ts

export async function seedTestDatabase() {
  await clearDatabase();

  // Create test users
  const users = await createTestUsers(10);

  // Create test organizations
  const orgs = await createTestOrganizations(20);

  // Create test assessments
  await createTestAssessments(orgs);

  return { users, orgs };
}
```

---

## **Continuous Integration**

### **GitHub Actions Workflow**

```yaml
# .github/workflows/test.yml

name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:unit -- --coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## **Test Coverage Reports**

### **Generating Coverage**

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/lcov-report/index.html
```

### **Coverage Badges**

Add to README.md:

```markdown
![Coverage](https://img.shields.io/codecov/c/github/your-org/nonprofit-platform)
```

---

## **Best Practices**

1. **Write tests first** (TDD approach)
2. **Keep tests fast** (unit tests < 1s each)
3. **Make tests deterministic** (no flaky tests)
4. **Use meaningful test names** (describe what, not how)
5. **Mock external dependencies** (APIs, databases in unit tests)
6. **Test edge cases** (null, undefined, empty arrays)
7. **Maintain high coverage** (but focus on meaningful coverage)
8. **Run tests in CI** (fail fast on broken tests)

---

**Last Updated**: 2025
**Version**: 1.0.0
