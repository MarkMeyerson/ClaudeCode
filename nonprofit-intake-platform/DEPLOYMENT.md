# Non-Profit Intake Platform - Production Deployment Guide

## **Complete Deployment Guide for Enterprise Production**

This comprehensive guide covers everything needed to deploy the Non-Profit Intake Platform to production environments.

---

## **Table of Contents**

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Infrastructure Setup](#infrastructure-setup)
3. [Database Configuration](#database-configuration)
4. [Application Deployment](#application-deployment)
5. [Security Configuration](#security-configuration)
6. [Performance Optimization](#performance-optimization)
7. [Monitoring & Logging](#monitoring--logging)
8. [Backup & Disaster Recovery](#backup--disaster-recovery)
9. [Scaling Strategy](#scaling-strategy)
10. [Troubleshooting](#troubleshooting)

---

## **Pre-Deployment Checklist**

### **Infrastructure Requirements**

- [ ] Cloud provider account (AWS, Azure, or GCP)
- [ ] Domain name registered and DNS configured
- [ ] SSL/TLS certificates obtained
- [ ] Container registry access (Docker Hub, ECR, or ACR)
- [ ] CI/CD pipeline configured (GitHub Actions)
- [ ] Monitoring service setup (DataDog, New Relic)
- [ ] Error tracking service (Sentry)
- [ ] CDN configuration (CloudFlare)

### **Security Requirements**

- [ ] Encryption keys generated (256-bit)
- [ ] JWT secrets configured
- [ ] API keys for third-party services
- [ ] Database credentials secured
- [ ] Firewall rules defined
- [ ] Rate limiting configured
- [ ] DDoS protection enabled

### **Application Requirements**

- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] Seed data prepared
- [ ] API documentation generated
- [ ] Load testing completed
- [ ] Security audit passed
- [ ] Accessibility testing completed

---

## **Infrastructure Setup**

### **Option 1: AWS Deployment**

#### **1. VPC Configuration**

```bash
# Create VPC
aws ec2 create-vpc --cidr-block 10.0.0.0/16 --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=nonprofit-platform-vpc}]'

# Create subnets
aws ec2 create-subnet --vpc-id vpc-xxxxx --cidr-block 10.0.1.0/24 --availability-zone us-east-1a
aws ec2 create-subnet --vpc-id vpc-xxxxx --cidr-block 10.0.2.0/24 --availability-zone us-east-1b

# Create Internet Gateway
aws ec2 create-internet-gateway --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=nonprofit-igw}]'
```

#### **2. RDS PostgreSQL Setup**

```bash
# Create DB subnet group
aws rds create-db-subnet-group \
  --db-subnet-group-name nonprofit-db-subnet \
  --db-subnet-group-description "Subnet group for nonprofit platform" \
  --subnet-ids subnet-xxxxx subnet-yyyyy

# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier nonprofit-production-db \
  --db-instance-class db.r5.large \
  --engine postgres \
  --engine-version 15.4 \
  --master-username postgres \
  --master-user-password YourSecurePassword \
  --allocated-storage 100 \
  --storage-type gp3 \
  --db-subnet-group-name nonprofit-db-subnet \
  --vpc-security-group-ids sg-xxxxx \
  --backup-retention-period 30 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "mon:04:00-mon:05:00" \
  --multi-az \
  --storage-encrypted \
  --enable-performance-insights
```

#### **3. ElastiCache Redis Setup**

```bash
# Create Redis cluster
aws elasticache create-replication-group \
  --replication-group-id nonprofit-redis \
  --replication-group-description "Redis cache for nonprofit platform" \
  --engine redis \
  --cache-node-type cache.r5.large \
  --num-cache-clusters 2 \
  --automatic-failover-enabled \
  --multi-az-enabled \
  --cache-subnet-group-name nonprofit-cache-subnet \
  --security-group-ids sg-xxxxx \
  --at-rest-encryption-enabled \
  --transit-encryption-enabled
```

#### **4. EKS Cluster Setup**

```bash
# Create EKS cluster
eksctl create cluster \
  --name nonprofit-platform-production \
  --version 1.28 \
  --region us-east-1 \
  --nodegroup-name standard-workers \
  --node-type t3.large \
  --nodes 3 \
  --nodes-min 2 \
  --nodes-max 10 \
  --managed \
  --asg-access \
  --external-dns-access \
  --full-ecr-access \
  --alb-ingress-access
```

### **Option 2: Azure Deployment**

#### **1. Resource Group**

```bash
# Create resource group
az group create \
  --name nonprofit-platform-rg \
  --location eastus

# Create virtual network
az network vnet create \
  --resource-group nonprofit-platform-rg \
  --name nonprofit-vnet \
  --address-prefix 10.0.0.0/16 \
  --subnet-name app-subnet \
  --subnet-prefix 10.0.1.0/24
```

#### **2. Azure Database for PostgreSQL**

```bash
# Create PostgreSQL server
az postgres flexible-server create \
  --resource-group nonprofit-platform-rg \
  --name nonprofit-db-prod \
  --location eastus \
  --admin-user adminuser \
  --admin-password SecurePassword123! \
  --sku-name Standard_D4s_v3 \
  --tier GeneralPurpose \
  --version 15 \
  --storage-size 128 \
  --backup-retention 30 \
  --geo-redundant-backup Enabled \
  --high-availability Enabled
```

#### **3. Azure Kubernetes Service (AKS)**

```bash
# Create AKS cluster
az aks create \
  --resource-group nonprofit-platform-rg \
  --name nonprofit-aks-prod \
  --node-count 3 \
  --node-vm-size Standard_D4s_v3 \
  --enable-cluster-autoscaler \
  --min-count 2 \
  --max-count 10 \
  --enable-addons monitoring \
  --generate-ssh-keys
```

---

## **Database Configuration**

### **1. Initial Setup**

```bash
# Connect to database
psql -h nonprofit-production-db.xxxxx.us-east-1.rds.amazonaws.com -U postgres -d postgres

# Create application database
CREATE DATABASE nonprofit_platform_prod;

# Create application user
CREATE USER nonprofit_app WITH ENCRYPTED PASSWORD 'YourAppPassword';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE nonprofit_platform_prod TO nonprofit_app;
```

### **2. Run Migrations**

```bash
# Set database URL
export DATABASE_URL="postgresql://nonprofit_app:password@host:5432/nonprofit_platform_prod"

# Run migrations
npm run db:migrate:prod

# Verify migrations
psql $DATABASE_URL -c "SELECT * FROM pg_catalog.pg_tables WHERE schemaname = 'public';"
```

### **3. Performance Optimization**

```sql
-- Create indexes for performance
CREATE INDEX CONCURRENTLY idx_org_type ON organizations(organization_type);
CREATE INDEX CONCURRENTLY idx_org_created ON organizations(created_at DESC);
CREATE INDEX CONCURRENTLY idx_assess_org ON assessments(org_id);
CREATE INDEX CONCURRENTLY idx_comp_due_date ON compliance_requirements(due_date);

-- Enable query monitoring
ALTER SYSTEM SET track_activities = on;
ALTER SYSTEM SET track_counts = on;
ALTER SYSTEM SET track_io_timing = on;
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
```

---

## **Application Deployment**

### **Kubernetes Deployment**

#### **1. Create Kubernetes Manifests**

See `k8s/production/` directory for complete manifests.

#### **2. Deploy Application**

```bash
# Create namespace
kubectl create namespace nonprofit-platform

# Create secrets
kubectl create secret generic app-secrets \
  --from-literal=database-url=$DATABASE_URL \
  --from-literal=jwt-secret=$JWT_SECRET \
  --from-literal=redis-password=$REDIS_PASSWORD \
  --namespace nonprofit-platform

# Deploy backend
kubectl apply -f k8s/production/backend-deployment.yaml

# Deploy frontend
kubectl apply -f k8s/production/frontend-deployment.yaml

# Deploy ingress
kubectl apply -f k8s/production/ingress.yaml
```

#### **3. Configure Auto-Scaling**

```yaml
# HorizontalPodAutoscaler for backend
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
  namespace: nonprofit-platform
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: nonprofit-backend
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

---

## **Security Configuration**

### **1. SSL/TLS Setup**

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create Let's Encrypt issuer
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@nonprofitintake.org
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

### **2. Network Policies**

```yaml
# Restrict backend access
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-network-policy
  namespace: nonprofit-platform
spec:
  podSelector:
    matchLabels:
      app: nonprofit-backend
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: nonprofit-frontend
    ports:
    - protocol: TCP
      port: 3001
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: postgres
    ports:
    - protocol: TCP
      port: 5432
```

### **3. Secrets Management**

```bash
# Use AWS Secrets Manager
aws secretsmanager create-secret \
  --name nonprofit-platform/production \
  --secret-string file://secrets.json

# Or use Azure Key Vault
az keyvault create \
  --name nonprofit-vault-prod \
  --resource-group nonprofit-platform-rg \
  --location eastus

az keyvault secret set \
  --vault-name nonprofit-vault-prod \
  --name database-password \
  --value "YourSecurePassword"
```

---

## **Performance Optimization**

### **1. CDN Configuration (CloudFlare)**

```nginx
# nginx configuration for caching
location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
  expires 1y;
  add_header Cache-Control "public, immutable";
}

location /api/ {
  proxy_cache api_cache;
  proxy_cache_valid 200 5m;
  proxy_cache_valid 404 1m;
  add_header X-Cache-Status $upstream_cache_status;
}
```

### **2. Redis Caching Strategy**

```typescript
// Cache configuration
const cacheConfig = {
  assessments: { ttl: 300 }, // 5 minutes
  organizations: { ttl: 600 }, // 10 minutes
  grants: { ttl: 3600 }, // 1 hour
  staticData: { ttl: 86400 }, // 24 hours
};
```

### **3. Database Connection Pooling**

```typescript
// pg-pool configuration
const pool = new Pool({
  max: 20,
  min: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: {
    rejectUnauthorized: false,
  },
});
```

---

## **Monitoring & Logging**

### **1. DataDog Setup**

```yaml
# DataDog agent DaemonSet
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: datadog-agent
  namespace: nonprofit-platform
spec:
  selector:
    matchLabels:
      app: datadog-agent
  template:
    metadata:
      labels:
        app: datadog-agent
    spec:
      containers:
      - name: datadog-agent
        image: datadog/agent:latest
        env:
        - name: DD_API_KEY
          valueFrom:
            secretKeyRef:
              name: datadog-secret
              key: api-key
        - name: DD_SITE
          value: "datadoghq.com"
        - name: DD_LOGS_ENABLED
          value: "true"
        - name: DD_APM_ENABLED
          value: "true"
```

### **2. Application Logging**

```typescript
// Winston logger configuration
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'nonprofit-platform' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});
```

### **3. Health Checks**

```typescript
// Health check endpoints
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/health/db', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'healthy' });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', error: error.message });
  }
});
```

---

## **Backup & Disaster Recovery**

### **1. Automated Database Backups**

```bash
# RDS automated backups (AWS)
aws rds modify-db-instance \
  --db-instance-identifier nonprofit-production-db \
  --backup-retention-period 30 \
  --preferred-backup-window "03:00-04:00"

# Manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier nonprofit-production-db \
  --db-snapshot-identifier nonprofit-manual-backup-$(date +%Y%m%d)
```

### **2. Application Data Backup**

```bash
#!/bin/bash
# backup-database.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/postgresql"
S3_BUCKET="s3://nonprofit-backups/database"

# Create backup
pg_dump -Fc $DATABASE_URL > $BACKUP_DIR/backup_$DATE.dump

# Upload to S3
aws s3 cp $BACKUP_DIR/backup_$DATE.dump $S3_BUCKET/

# Cleanup old local backups (keep 7 days)
find $BACKUP_DIR -name "backup_*.dump" -mtime +7 -delete

# Verify backup
pg_restore --list $BACKUP_DIR/backup_$DATE.dump > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "Backup successful: backup_$DATE.dump"
else
  echo "Backup verification failed!"
  exit 1
fi
```

### **3. Disaster Recovery Plan**

**RTO (Recovery Time Objective)**: 4 hours
**RPO (Recovery Point Objective)**: 15 minutes

**Recovery Steps**:
1. Spin up new infrastructure in alternate region
2. Restore database from latest backup
3. Deploy application from container registry
4. Update DNS to point to new infrastructure
5. Verify functionality
6. Communicate with users

---

## **Scaling Strategy**

### **Horizontal Scaling Triggers**

- CPU utilization > 70% for 5 minutes
- Memory utilization > 80% for 5 minutes
- Request latency p95 > 500ms for 5 minutes
- Active connections > 80% of capacity

### **Vertical Scaling Considerations**

- Database: Start with db.r5.large, scale to db.r5.2xlarge as needed
- Redis: Start with cache.r5.large, scale to cache.r5.xlarge
- Application: Start with 2vCPU/4GB, scale to 4vCPU/8GB

### **Database Scaling**

```bash
# Read replicas for read-heavy workloads
aws rds create-db-instance-read-replica \
  --db-instance-identifier nonprofit-db-read-replica-1 \
  --source-db-instance-identifier nonprofit-production-db \
  --db-instance-class db.r5.large
```

---

## **Troubleshooting**

### **Common Issues**

**Issue**: High database CPU
**Solution**: Analyze slow queries, add indexes, enable connection pooling

**Issue**: Memory leaks in Node.js
**Solution**: Enable heap snapshots, analyze with Chrome DevTools, implement memory limits

**Issue**: Slow API responses
**Solution**: Enable APM, identify bottlenecks, add caching, optimize queries

### **Useful Commands**

```bash
# Check pod status
kubectl get pods -n nonprofit-platform

# View logs
kubectl logs -f deployment/nonprofit-backend -n nonprofit-platform

# Execute into pod
kubectl exec -it pod/nonprofit-backend-xxxxx -n nonprofit-platform -- /bin/bash

# Check resource usage
kubectl top pods -n nonprofit-platform

# Restart deployment
kubectl rollout restart deployment/nonprofit-backend -n nonprofit-platform
```

---

## **Post-Deployment Checklist**

- [ ] Verify all services are running
- [ ] Test critical user flows
- [ ] Verify SSL certificate
- [ ] Test monitoring alerts
- [ ] Verify backups are running
- [ ] Test disaster recovery plan
- [ ] Update documentation
- [ ] Train operations team
- [ ] Set up on-call rotation
- [ ] Monitor for 48 hours post-deployment

---

**Deployment Contact**: devops@nonprofitintake.org
**Emergency Escalation**: +1-800-XXX-XXXX

**Last Updated**: 2025
**Version**: 1.0.0
