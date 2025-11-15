# 6A Platform API Reference
## Complete REST API Documentation

**Version:** 1.0.0
**Base URL:** `https://api.sherpatech.ai/api/v1`
**Authentication:** Bearer Token (JWT)

---

## Table of Contents

1. [Authentication](#authentication)
2. [Assessment Engine API](#assessment-engine-api)
3. [Alignment Orchestrator API](#alignment-orchestrator-api)
4. [Activation Manager API](#activation-manager-api)
5. [Acceleration Tracker API](#acceleration-tracker-api)
6. [Application Monitor API](#application-monitor-api)
7. [Amplification Analyzer API](#amplification-analyzer-api)
8. [Reporting Engine API](#reporting-engine-api)
9. [ROI Calculator API](#roi-calculator-api)
10. [Error Codes](#error-codes)
11. [Rate Limiting](#rate-limiting)
12. [Webhooks](#webhooks)

---

## Authentication

All API requests require authentication using JWT Bearer tokens.

### Obtain Access Token

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your_password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400,
    "user": {
      "userId": "uuid-here",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "userType": "client",
      "organizationId": "uuid-here"
    }
  }
}
```

### Using the Token

Include the token in the Authorization header for all subsequent requests:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Refresh Token

```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## Assessment Engine API

### Assessments

#### List Assessments

```http
GET /api/v1/assessments/client/{clientId}
Authorization: Bearer {token}
```

**Query Parameters:**
- `status` (optional): Filter by status (draft, in_progress, completed, etc.)
- `type` (optional): Filter by type (comprehensive, quick, focused)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "assessmentId": "uuid",
      "assessmentName": "Q4 2024 AI Readiness Assessment",
      "assessmentType": "comprehensive",
      "status": "completed",
      "overallScore": 72.5,
      "createdAt": "2024-01-15T10:00:00Z",
      "completedAt": "2024-01-20T15:30:00Z",
      "consultantId": "uuid",
      "consultantName": "Jane Smith"
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

#### Get Assessment by ID

```http
GET /api/v1/assessments/{assessmentId}
Authorization: Bearer {token}
```

**Query Parameters:**
- `includeResponses` (optional): Include all responses (default: false)

**Response:**
```json
{
  "success": true,
  "data": {
    "assessmentId": "uuid",
    "clientId": "uuid",
    "assessmentName": "Q4 2024 AI Readiness Assessment",
    "assessmentType": "comprehensive",
    "status": "completed",
    "version": 1,
    "overallScore": 72.5,
    "scores": {
      "digitalMaturity": 75.0,
      "aiReadiness": 78.5,
      "dataCapabilities": 68.0,
      "organizationalCulture": 80.0,
      "technicalInfrastructure": 65.5,
      "processAutomation": 72.0,
      "skillsGaps": 60.0,
      "competitiveLandscape": 70.0,
      "regulatoryCompliance": 85.0,
      "financialReadiness": 75.0,
      "changeManagement": 68.5,
      "vendorEcosystem": 71.0
    },
    "analysis": {
      "strengths": ["Strong organizational culture", "Excellent compliance"],
      "weaknesses": ["Skills gap in AI/ML", "Legacy infrastructure"],
      "opportunities": ["Customer service automation", "Predictive analytics"],
      "threats": ["Competitor AI adoption", "Talent shortage"],
      "recommendations": ["Establish AI Center of Excellence", "Invest in training"]
    },
    "createdAt": "2024-01-15T10:00:00Z",
    "completedAt": "2024-01-20T15:30:00Z"
  }
}
```

#### Create Assessment

```http
POST /api/v1/assessments
Authorization: Bearer {token}
Content-Type: application/json

{
  "clientId": "uuid",
  "assessmentName": "Q1 2025 AI Readiness Assessment",
  "assessmentType": "comprehensive",
  "industry": "Technology",
  "companySize": "medium",
  "dueDate": "2025-02-01"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "assessmentId": "newly-created-uuid",
    "clientId": "uuid",
    "assessmentName": "Q1 2025 AI Readiness Assessment",
    "assessmentType": "comprehensive",
    "status": "draft",
    "createdAt": "2025-01-15T10:00:00Z"
  },
  "message": "Assessment created successfully"
}
```

#### Submit Response

```http
POST /api/v1/assessments/{assessmentId}/responses
Authorization: Bearer {token}
Content-Type: application/json

{
  "questionId": "uuid",
  "dimension": "ai_readiness",
  "responseValue": "option_c",
  "confidenceLevel": 0.9,
  "justification": "We have a dedicated AI team and have completed 3 pilot projects",
  "evidenceProvided": [
    {
      "type": "document",
      "url": "https://...",
      "description": "AI Strategy Document"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": {
      "responseId": "uuid",
      "assessmentId": "uuid",
      "questionId": "uuid",
      "dimension": "ai_readiness",
      "responseValue": "option_c",
      "respondedAt": "2025-01-15T10:30:00Z"
    },
    "score": 75.0
  },
  "message": "Response submitted successfully"
}
```

#### Submit Assessment for Scoring

```http
POST /api/v1/assessments/{assessmentId}/submit
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "assessment": {
      "assessmentId": "uuid",
      "status": "completed",
      "submittedAt": "2025-01-15T12:00:00Z"
    },
    "scores": {
      "overall": 72.5,
      "digitalMaturity": 75.0,
      "aiReadiness": 78.5
      // ... all dimension scores
    },
    "analysis": {
      "strengths": [...],
      "weaknesses": [...],
      "opportunities": [...],
      "threats": [...],
      "recommendations": [...]
    }
  },
  "message": "Assessment submitted and analyzed successfully"
}
```

#### Get Assessment Progress

```http
GET /api/v1/assessments/{assessmentId}/progress
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "assessmentId": "uuid",
    "totalQuestions": 250,
    "answeredQuestions": 180,
    "completionPercentage": 72.0,
    "dimensionProgress": {
      "digitalMaturity": {
        "total": 25,
        "answered": 22,
        "percentage": 88
      },
      "aiReadiness": {
        "total": 30,
        "answered": 25,
        "percentage": 83.3
      }
      // ... other dimensions
    },
    "estimatedTimeRemaining": 45,
    "lastUpdated": "2025-01-15T11:30:00Z"
  }
}
```

#### Get AI Insights

```http
GET /api/v1/assessments/{assessmentId}/insights
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "strategicInsights": [
      "AI readiness above industry average",
      "Strong data foundation enables advanced use cases",
      "Leadership support provides competitive advantage"
    ],
    "competitivePositioning": "Strong - 68th percentile vs. industry peers",
    "marketOpportunities": [
      "Customer experience personalization",
      "Predictive maintenance",
      "Intelligent process automation"
    ],
    "technologyRecommendations": [
      "Azure AI Services for quick wins",
      "Custom ML models for competitive differentiation",
      "MLOps platform for scalability"
    ],
    "investmentPriorities": [
      {
        "area": "Skills Development",
        "priority": 1,
        "estimatedInvestment": "$150,000",
        "expectedROI": "300%"
      },
      {
        "area": "Data Infrastructure",
        "priority": 2,
        "estimatedInvestment": "$200,000",
        "expectedROI": "250%"
      }
    ]
  }
}
```

#### Compare with Benchmarks

```http
GET /api/v1/assessments/{assessmentId}/benchmarks
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "assessmentId": "uuid",
    "industry": "Technology",
    "companySize": "medium",
    "overallScore": 72.5,
    "industryAverage": 65.3,
    "industryMedian": 67.0,
    "percentileRanking": 68,
    "topPerformers": 85.5,
    "dimensionComparisons": [
      {
        "dimension": "AI Readiness",
        "clientScore": 78.5,
        "industryAverage": 62.0,
        "percentile": 72,
        "gap": 16.5,
        "status": "above_average"
      },
      {
        "dimension": "Data Capabilities",
        "clientScore": 68.0,
        "industryAverage": 70.5,
        "percentile": 45,
        "gap": -2.5,
        "status": "below_average"
      }
    ],
    "competitivePosition": "strong",
    "insights": [
      "AI readiness significantly above average",
      "Data capabilities need improvement",
      "Strong culture supports AI adoption"
    ]
  }
}
```

#### Export Assessment

```http
GET /api/v1/assessments/{assessmentId}/export?format=pdf
Authorization: Bearer {token}
```

**Query Parameters:**
- `format`: pdf, xlsx, json, pptx

**Response:** Binary file download or JSON data

---

## Alignment Orchestrator API

### Alignment Sessions

#### Create Alignment Session

```http
POST /api/v1/alignment/sessions
Authorization: Bearer {token}
Content-Type: application/json

{
  "clientId": "uuid",
  "assessmentId": "uuid",
  "sessionName": "Executive Alignment Session",
  "sessionType": "executive",
  "sessionDate": "2025-01-25",
  "participants": [
    {"userId": "uuid", "role": "Executive Sponsor"},
    {"userId": "uuid", "role": "CTO"},
    {"userId": "uuid", "role": "COO"}
  ],
  "objectives": "Align on AI strategy and priorities",
  "agenda": [
    "Review assessment results",
    "Discuss strategic priorities",
    "Identify AI opportunities",
    "Gain leadership buy-in"
  ]
}
```

#### List Strategic Initiatives

```http
GET /api/v1/initiatives?clientId={clientId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "initiativeId": "uuid",
      "initiativeName": "Customer Service AI Chatbot",
      "description": "Deploy AI-powered chatbot for tier-1 support",
      "businessGoal": "Reduce support costs by 40%",
      "priorityScore": 85,
      "impactScore": 90,
      "effortScore": 60,
      "riskScore": 30,
      "riceScore": 135,
      "status": "approved",
      "plannedStart": "2025-02-01",
      "plannedEnd": "2025-04-30"
    }
  ]
}
```

#### Create Strategic Initiative

```http
POST /api/v1/initiatives
Authorization: Bearer {token}
Content-Type: application/json

{
  "clientId": "uuid",
  "initiativeName": "Predictive Analytics for Sales",
  "description": "Implement ML model to predict sales opportunities",
  "businessGoal": "Increase conversion rate by 25%",
  "aiOpportunity": "Leverage historical data to identify high-probability leads",
  "reach": 150,
  "impact": 3,
  "confidence": 0.8,
  "effort": 12,
  "budgetAllocated": 180000,
  "targetMetrics": {
    "conversionRate": "+25%",
    "salesCycleReduction": "-30%",
    "revenueIncrease": "+$2M annually"
  }
}
```

---

## Activation Manager API

### Projects

#### Create Project

```http
POST /api/v1/projects
Authorization: Bearer {token}
Content-Type: application/json

{
  "clientId": "uuid",
  "initiativeId": "uuid",
  "projectName": "Customer Service Chatbot - Pilot",
  "projectType": "pilot",
  "methodology": "agile",
  "plannedStart": "2025-02-01",
  "plannedEnd": "2025-04-30",
  "allocatedBudget": 150000,
  "teamMembers": [
    {"userId": "uuid", "role": "Project Manager"},
    {"userId": "uuid", "role": "Technical Lead"},
    {"userId": "uuid", "role": "Developer"}
  ],
  "deliverables": [
    "Working chatbot prototype",
    "Integration with support system",
    "Training for support team"
  ],
  "acceptanceCriteria": [
    "Handle 60% of tier-1 queries",
    "80% user satisfaction",
    "< 2s response time"
  ]
}
```

#### List Projects

```http
GET /api/v1/projects?clientId={clientId}&status=active
Authorization: Bearer {token}
```

**Query Parameters:**
- `clientId`: Filter by client
- `status`: Filter by status (planning, active, completed, etc.)
- `page`: Page number
- `limit`: Items per page

#### Get Project Details

```http
GET /api/v1/projects/{projectId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "projectId": "uuid",
    "projectName": "Customer Service Chatbot - Pilot",
    "projectType": "pilot",
    "status": "active",
    "healthStatus": "green",
    "completionPercentage": 45,
    "plannedStart": "2025-02-01",
    "plannedEnd": "2025-04-30",
    "allocatedBudget": 150000,
    "spentBudget": 67500,
    "teamMembers": [...],
    "milestones": [...],
    "risks": [...],
    "recentActivity": [...]
  }
}
```

### Tasks

#### Create Task

```http
POST /api/v1/tasks
Authorization: Bearer {token}
Content-Type: application/json

{
  "projectId": "uuid",
  "taskName": "Design chatbot conversation flow",
  "description": "Create detailed conversation flow for common support queries",
  "assignedTo": "uuid",
  "priority": "high",
  "plannedStart": "2025-02-05",
  "plannedEnd": "2025-02-12",
  "estimatedHours": 16,
  "deliverables": ["Conversation flow diagram", "Use case scenarios"],
  "acceptanceCriteria": ["Covers top 20 support queries", "Approved by stakeholders"]
}
```

#### Update Task

```http
PUT /api/v1/tasks/{taskId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "in_progress",
  "completionPercentage": 60,
  "actualHours": 10,
  "notes": "Making good progress, conversation flow for 12/20 queries completed"
}
```

---

## Acceleration Tracker API

### Metrics

#### Submit Metrics

```http
POST /api/v1/metrics
Authorization: Bearer {token}
Content-Type: application/json

{
  "clientId": "uuid",
  "projectId": "uuid",
  "metricDate": "2025-01-31",
  "metricPeriod": "monthly",
  "throughputImprovement": 35.5,
  "processingTimeReduction": 42.0,
  "errorRateReduction": 65.0,
  "automationPercentage": 60.0,
  "costSavings": 45000,
  "revenueIncrease": 120000,
  "userAdoptionRate": 75,
  "activeUsers": 450,
  "userSatisfactionScore": 8.2
}
```

#### Get Metrics Dashboard

```http
GET /api/v1/metrics/{clientId}?period=last30days
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "last30days",
    "summary": {
      "totalCostSavings": 135000,
      "totalRevenueIncrease": 360000,
      "overallROI": 425,
      "activeProjects": 5,
      "completedProjects": 2
    },
    "trends": {
      "costSavings": [
        {"date": "2025-01-01", "value": 45000},
        {"date": "2025-01-15", "value": 67500},
        {"date": "2025-01-31", "value": 135000}
      ],
      "userAdoption": [...]
    },
    "byProject": [...]
  }
}
```

### ROI Calculation

```http
GET /api/v1/roi/{projectId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "projectId": "uuid",
    "projectName": "Customer Service Chatbot",
    "totalInvestment": 150000,
    "totalBenefits": 487500,
    "netBenefit": 337500,
    "roiPercentage": 225,
    "paybackPeriodMonths": 4.6,
    "npv": 312000,
    "irr": 45.2,
    "breakdownByCategory": {
      "costSavings": 300000,
      "revenueIncrease": 150000,
      "productivityGains": 37500
    }
  }
}
```

### Optimization Opportunities

```http
GET /api/v1/optimizations?clientId={clientId}&status=identified
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "opportunityId": "uuid",
      "title": "Expand Chatbot to Email Channel",
      "description": "Extend chatbot capabilities to handle email inquiries",
      "category": "automation",
      "currentState": "Chatbot handles web chat only",
      "desiredState": "Chatbot handles web chat and email",
      "estimatedImpactScore": 80,
      "estimatedEffortScore": 40,
      "priorityScore": 95,
      "estimatedCostSavings": 75000,
      "estimatedROI": 300,
      "estimatedDurationWeeks": 6,
      "status": "identified"
    }
  ]
}
```

---

## Application Monitor API

### Solutions

#### Register Solution

```http
POST /api/v1/solutions
Authorization: Bearer {token}
Content-Type: application/json

{
  "clientId": "uuid",
  "projectId": "uuid",
  "solutionName": "Customer Support AI Chatbot",
  "solutionType": "automation",
  "productionDate": "2025-03-01",
  "version": "1.0.0",
  "integratedSystems": ["Zendesk", "Salesforce", "Slack"],
  "slaTargets": {
    "uptime": 99.9,
    "responseTime": 2000,
    "errorRate": 0.01
  }
}
```

#### Get Solution Health

```http
GET /api/v1/health/{solutionId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "solutionId": "uuid",
    "healthStatus": "healthy",
    "uptime": 99.95,
    "averageResponseTime": 1850,
    "errorRate": 0.005,
    "activeUsers": 523,
    "transactionsPerDay": 8500,
    "lastChecked": "2025-01-15T12:00:00Z",
    "slaCompliance": {
      "uptime": true,
      "responseTime": true,
      "errorRate": true
    }
  }
}
```

### Incidents

#### Create Incident

```http
POST /api/v1/incidents
Authorization: Bearer {token}
Content-Type: application/json

{
  "solutionId": "uuid",
  "severity": "high",
  "title": "Elevated error rate on chatbot",
  "description": "Error rate increased to 2.5% starting at 10:00 AM",
  "impactDescription": "Users experiencing failures, fallback to human agents triggered",
  "affectedComponents": ["NLP Engine", "Response Generation"],
  "usersAffected": 150
}
```

---

## Amplification Analyzer API

### Scaling Initiatives

#### Create Amplification Initiative

```http
POST /api/v1/amplification/initiatives
Authorization: Bearer {token}
Content-Type: application/json

{
  "clientId": "uuid",
  "solutionId": "uuid",
  "initiativeType": "geographic_expansion",
  "title": "Expand Chatbot to EMEA Region",
  "description": "Deploy chatbot to European and Middle Eastern markets",
  "currentScale": {
    "regions": 1,
    "languages": 1,
    "users": 5000
  },
  "targetScale": {
    "regions": 5,
    "languages": 8,
    "users": 25000
  },
  "newLocations": ["London", "Paris", "Dubai", "Frankfurt", "Amsterdam"],
  "expectedReturn": 1200000
}
```

### Innovation Experiments

#### Create Experiment

```http
POST /api/v1/experiments
Authorization: Bearer {token}
Content-Type: application/json

{
  "clientId": "uuid",
  "experimentName": "Voice-Activated Customer Service",
  "hypothesis": "Voice interface will increase accessibility and adoption by 35%",
  "experimentType": "technology",
  "methodology": "a_b_test",
  "sampleSize": 500,
  "durationDays": 30,
  "successCriteria": {
    "adoptionIncrease": ">30%",
    "userSatisfaction": ">8.0/10",
    "errorRate": "<5%"
  }
}
```

#### Get Experiment Results

```http
GET /api/v1/experiments/{experimentId}/results
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "experimentId": "uuid",
    "experimentName": "Voice-Activated Customer Service",
    "outcome": "success",
    "results": {
      "adoptionIncrease": 42,
      "userSatisfaction": 8.4,
      "errorRate": 3.2
    },
    "insights": [
      "Voice interface particularly popular with mobile users",
      "Adoption highest during commute hours",
      "Technical accuracy exceeded expectations"
    ],
    "recommendations": [
      "Scale to full user base",
      "Expand voice commands",
      "Integrate with mobile app"
    ],
    "scaleDecision": "scale"
  }
}
```

### Knowledge Base

#### Add Knowledge Artifact

```http
POST /api/v1/knowledge
Authorization: Bearer {token}
Content-Type: application/json

{
  "clientId": "uuid",
  "artifactType": "best_practice",
  "title": "Best Practices for Chatbot Training",
  "description": "Lessons learned from implementing customer service chatbot",
  "content": "## Training Data Requirements\n\n1. Minimum 1000 conversation examples...",
  "phase": "activate",
  "category": "implementation",
  "tags": ["chatbot", "nlp", "training"],
  "industry": ["technology", "retail", "financial_services"]
}
```

---

## Error Codes

### HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Authentication required or failed
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Service temporarily unavailable

### Error Response Format

```json
{
  "success": false,
  "error": "Validation Error",
  "message": "Invalid input parameters",
  "details": [
    {
      "field": "clientId",
      "message": "clientId must be a valid UUID"
    }
  ]
}
```

---

## Rate Limiting

### Limits

- **Standard tier:** 100 requests per 15 minutes per IP
- **Professional tier:** 500 requests per 15 minutes
- **Enterprise tier:** 2000 requests per 15 minutes

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1643990400
```

### Rate Limit Exceeded Response

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json

{
  "success": false,
  "error": "Rate Limit Exceeded",
  "message": "Too many requests. Please try again later.",
  "retryAfter": 900
}
```

---

## Webhooks

### Configure Webhook

```http
POST /api/v1/webhooks
Authorization: Bearer {token}
Content-Type: application/json

{
  "webhookUrl": "https://your-domain.com/webhooks/6a-platform",
  "eventTypes": [
    "assessment.completed",
    "project.created",
    "milestone.reached",
    "incident.created"
  ],
  "secretKey": "your-secret-key-for-signature-verification"
}
```

### Webhook Events

**Event: assessment.completed**
```json
{
  "eventType": "assessment.completed",
  "eventId": "uuid",
  "timestamp": "2025-01-15T15:30:00Z",
  "data": {
    "assessmentId": "uuid",
    "clientId": "uuid",
    "overallScore": 72.5,
    "completedAt": "2025-01-15T15:30:00Z"
  }
}
```

**Event: project.created**
```json
{
  "eventType": "project.created",
  "eventId": "uuid",
  "timestamp": "2025-01-20T10:00:00Z",
  "data": {
    "projectId": "uuid",
    "projectName": "Customer Service Chatbot - Pilot",
    "clientId": "uuid",
    "plannedStart": "2025-02-01"
  }
}
```

---

## Support

For API support:
- **Email:** api-support@sherpatech.ai
- **Documentation:** https://docs.sherpatech.ai
- **Status Page:** https://status.sherpatech.ai

---

**© 2024 SherpaTech.AI** | **Version 1.0.0**
