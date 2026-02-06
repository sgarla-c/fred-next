# 🚀 AWS Deployment Guide - FRED Next.js Application

**Application**: FRED Equipment Rental System  
**Stack**: Next.js 16, PostgreSQL, Docker  
**Date**: February 4, 2026

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [AWS Services Overview](#aws-services-overview)
3. [Required Information](#required-information)
4. [Deployment Options](#deployment-options)
5. [Step-by-Step Deployment](#step-by-step-deployment)
6. [Environment Configuration](#environment-configuration)
7. [Database Setup](#database-setup)
8. [Cost Estimates](#cost-estimates)
9. [Post-Deployment](#post-deployment)

---

## 🔐 Prerequisites

### AWS Account Setup

1. **AWS Account**
   - Sign up at https://aws.amazon.com
   - Verify email and payment method
   - Enable MFA for root account

2. **IAM User Creation**
   ```
   User name: fred-deployer
   Access type: Programmatic access
   Permissions needed:
   - AmazonECS_FullAccess
   - AmazonRDSFullAccess
   - AmazonVPCFullAccess
   - IAMFullAccess (or limited IAM permissions)
   - CloudWatchLogsFullAccess
   - AmazonEC2ContainerRegistryFullAccess
   ```

3. **Install AWS CLI**
   ```powershell
   # Download and install from: https://aws.amazon.com/cli/
   
   # Configure after installation
   aws configure
   # AWS Access Key ID: YOUR_ACCESS_KEY
   # AWS Secret Access Key: YOUR_SECRET_KEY
   # Default region: us-east-1
   # Default output format: json
   ```

4. **Install Docker Desktop** (already installed ✅)

---

## 🎯 AWS Services Overview

### Recommended Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AWS Cloud                                │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │  Route 53 (DNS)                                    │   │
│  │  https://fred.yourdomain.com                       │   │
│  └──────────────────┬─────────────────────────────────┘   │
│                     │                                       │
│                     ▼                                       │
│  ┌────────────────────────────────────────────────────┐   │
│  │  Application Load Balancer (ALB)                   │   │
│  │  - SSL/TLS Termination                             │   │
│  │  - Port 443 (HTTPS)                                │   │
│  └──────────────────┬─────────────────────────────────┘   │
│                     │                                       │
│                     ▼                                       │
│  ┌────────────────────────────────────────────────────┐   │
│  │  ECS Fargate Service                               │   │
│  │  ┌──────────────┐  ┌──────────────┐               │   │
│  │  │ Task 1       │  │ Task 2       │               │   │
│  │  │ Next.js App  │  │ Next.js App  │               │   │
│  │  │ (Container)  │  │ (Container)  │               │   │
│  │  └──────────────┘  └──────────────┘               │   │
│  └──────────────────┬─────────────────────────────────┘   │
│                     │                                       │
│                     ▼                                       │
│  ┌────────────────────────────────────────────────────┐   │
│  │  RDS PostgreSQL                                    │   │
│  │  - Multi-AZ for high availability                  │   │
│  │  - Automated backups                               │   │
│  │  - Database: fred_poc                              │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │  Secrets Manager                                   │   │
│  │  - Database credentials                            │   │
│  │  - NextAuth secret                                 │   │
│  │  - SMTP credentials                                │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │  CloudWatch                                        │   │
│  │  - Application logs                                │   │
│  │  - Metrics & monitoring                            │   │
│  │  - Alarms                                          │   │
│  └────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 Required Information

### 1. AWS Account Details

- [ ] AWS Account ID: `____________`
- [ ] IAM User Access Key ID: `____________`
- [ ] IAM User Secret Access Key: `____________`
- [ ] AWS Region: `us-east-1` (or preferred)

### 2. Database Configuration

- [ ] RDS Instance Identifier: `fred-postgres-prod`
- [ ] Database Name: `fred_poc`
- [ ] Master Username: `fred_admin`
- [ ] Master Password: `____________` (generate secure password)
- [ ] Instance Class: `db.t3.small` (recommended for production)
- [ ] Allocated Storage: `20 GB` (minimum)
- [ ] Multi-AZ: `Yes` (recommended for production)

### 3. Application Configuration

- [ ] Application Name: `fred-next-prod`
- [ ] Environment: `production`
- [ ] Domain Name (optional): `fred.yourdomain.com`
- [ ] SSL Certificate ARN (if using custom domain): `____________`

### 4. Network Configuration

- [ ] VPC ID: `____________` (create new or use default)
- [ ] Subnet IDs: `____________, ____________` (at least 2)
- [ ] Security Group IDs: `____________`

### 5. Container Registry

- [ ] ECR Repository Name: `fred-next`
- [ ] Image Tag Strategy: `latest` or `git-sha`

### 6. Secrets to Generate

```bash
# Generate NextAuth secret (run in terminal)
openssl rand -base64 32
```

- [ ] NEXTAUTH_SECRET: `____________`
- [ ] Database Password: `____________`
- [ ] SMTP Password (if using AWS SES): `____________`

---

## 🎯 Deployment Options

### Option 1: AWS ECS Fargate (Recommended) ⭐

**Best for**: Production deployments with scalability

**Pros:**
- Serverless container management
- Auto-scaling capabilities
- High availability
- Good cost-performance ratio
- Full control over infrastructure

**Cons:**
- More complex initial setup
- Requires VPC/networking knowledge

**Cost**: ~$30-60/month for app + $25-35/month for RDS

---

### Option 2: AWS App Runner

**Best for**: Quick deployments, MVP testing

**Pros:**
- Simplest deployment (connects directly to GitHub)
- Automatic HTTPS
- Auto-scaling included
- Minimal configuration

**Cons:**
- Less control over infrastructure
- Higher cost at scale
- Limited customization

**Cost**: ~$25-50/month for app + $25-35/month for RDS

---

### Option 3: AWS Amplify

**Best for**: Next.js applications with serverless preference

**Pros:**
- Optimized for Next.js
- CI/CD built-in
- Edge network (CloudFront)
- Easy GitHub integration

**Cons:**
- Requires adaptation for server-side features
- Database connections need special handling
- May not support all Next.js features

**Cost**: ~$15-30/month for app + $25-35/month for RDS

---

### Option 4: AWS EC2

**Best for**: Full VM control, legacy requirements

**Pros:**
- Complete control
- Can run Docker Compose as-is
- SSH access
- Familiar server environment

**Cons:**
- Manual management required
- Need to handle security updates
- More expensive
- Not auto-scaling

**Cost**: ~$30-50/month for EC2 + $25-35/month for RDS

---

## 🚀 Step-by-Step Deployment (ECS Fargate)

### Phase 1: Database Setup (RDS)

#### 1.1 Create RDS PostgreSQL Instance

```bash
# Using AWS CLI
aws rds create-db-instance \
  --db-instance-identifier fred-postgres-prod \
  --db-instance-class db.t3.small \
  --engine postgres \
  --engine-version 16.1 \
  --master-username fred_admin \
  --master-user-password YOUR_SECURE_PASSWORD \
  --allocated-storage 20 \
  --db-name fred_poc \
  --backup-retention-period 7 \
  --vpc-security-group-ids sg-XXXXXXXXX \
  --publicly-accessible false \
  --multi-az true \
  --storage-encrypted true
```

Or via AWS Console:
1. Navigate to RDS → Create database
2. Choose PostgreSQL
3. Template: Production
4. DB instance identifier: `fred-postgres-prod`
5. Master username: `fred_admin`
6. Auto generate password (save it!)
7. DB instance class: `db.t3.small`
8. Storage: 20 GB, enable autoscaling
9. VPC: Select your VPC
10. Create database

#### 1.2 Get Database Endpoint

```bash
aws rds describe-db-instances \
  --db-instance-identifier fred-postgres-prod \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text
```

Save this endpoint: `fred-postgres-prod.xxxxxxxxx.us-east-1.rds.amazonaws.com`

### Phase 2: Container Registry (ECR)

#### 2.1 Create ECR Repository

```bash
aws ecr create-repository \
  --repository-name fred-next \
  --region us-east-1
```

#### 2.2 Build and Push Docker Image

```powershell
# Get ECR login token
$ecrLogin = aws ecr get-login-password --region us-east-1
$ecrLogin | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build production image
Push-Location "c:\Users\SGARLA-C\FRED\fred-next"
docker build -f Dockerfile -t fred-next:latest .

# Tag for ECR
docker tag fred-next:latest ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/fred-next:latest

# Push to ECR
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/fred-next:latest
Pop-Location
```

### Phase 3: Secrets Management

#### 3.1 Store Secrets in AWS Secrets Manager

```bash
# Database credentials
aws secretsmanager create-secret \
  --name fred/database \
  --secret-string '{
    "username":"fred_admin",
    "password":"YOUR_DB_PASSWORD",
    "engine":"postgres",
    "host":"fred-postgres-prod.xxxxxxxxx.us-east-1.rds.amazonaws.com",
    "port":5432,
    "dbname":"fred_poc"
  }'

# NextAuth secret
aws secretsmanager create-secret \
  --name fred/nextauth-secret \
  --secret-string "YOUR_GENERATED_SECRET"

# SMTP credentials (if using)
aws secretsmanager create-secret \
  --name fred/smtp \
  --secret-string '{
    "host":"smtp.example.com",
    "port":"587",
    "user":"smtp_user",
    "password":"smtp_password",
    "from":"noreply@txdot.gov"
  }'
```

### Phase 4: ECS Setup

#### 4.1 Create ECS Cluster

```bash
aws ecs create-cluster \
  --cluster-name fred-production \
  --region us-east-1
```

#### 4.2 Create Task Definition

Create file: `ecs-task-definition.json`

```json
{
  "family": "fred-next-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::ACCOUNT_ID:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT_ID:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "fred-next-container",
      "image": "ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/fred-next:latest",
      "portMappings": [
        {
          "containerPort": 3100,
          "protocol": "tcp"
        }
      ],
      "essential": true,
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "3100"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:fred/database:username::"
        },
        {
          "name": "NEXTAUTH_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:fred/nextauth-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/fred-next",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

Register task definition:

```bash
aws ecs register-task-definition \
  --cli-input-json file://ecs-task-definition.json
```

#### 4.3 Create ECS Service

```bash
aws ecs create-service \
  --cluster fred-production \
  --service-name fred-next-service \
  --task-definition fred-next-task \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx,subnet-yyyyy],securityGroups=[sg-xxxxx],assignPublicIp=ENABLED}"
```

### Phase 5: Load Balancer Setup

#### 5.1 Create Application Load Balancer

```bash
aws elbv2 create-load-balancer \
  --name fred-alb \
  --subnets subnet-xxxxx subnet-yyyyy \
  --security-groups sg-xxxxx \
  --scheme internet-facing \
  --type application
```

#### 5.2 Create Target Group

```bash
aws elbv2 create-target-group \
  --name fred-target-group \
  --protocol HTTP \
  --port 3100 \
  --vpc-id vpc-xxxxx \
  --target-type ip \
  --health-check-path /
```

#### 5.3 Create Listener

```bash
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:us-east-1:ACCOUNT_ID:loadbalancer/app/fred-alb/xxxxx \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:us-east-1:ACCOUNT_ID:targetgroup/fred-target-group/xxxxx
```

### Phase 6: Database Migration

#### 6.1 Run Migrations from Local Machine

Update `.env` with production database URL:

```env
DATABASE_URL="postgresql://fred_admin:YOUR_PASSWORD@fred-postgres-prod.xxxxxxxxx.us-east-1.rds.amazonaws.com:5432/fred_poc"
```

Run migrations:

```powershell
Push-Location "c:\Users\SGARLA-C\FRED\fred-next"
npx prisma migrate deploy
npx prisma db seed
Pop-Location
```

---

## 🔧 Environment Configuration

### Production Environment Variables

Create in AWS Secrets Manager or ECS Task Definition:

```env
# Required
NODE_ENV=production
DATABASE_URL=postgresql://fred_admin:PASSWORD@RDS_ENDPOINT:5432/fred_poc
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-generated-secret-key
PORT=3100
HOSTNAME=0.0.0.0

# SMTP (AWS SES recommended)
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=your-ses-smtp-username
SMTP_PASSWORD=your-ses-smtp-password
SMTP_FROM=noreply@txdot.gov

# Legacy Database (if needed)
LEGACY_DB_SERVER=your-sqlserver-endpoint
LEGACY_DB_NAME=FOD_RENTAL
LEGACY_DB_USER=your-username
LEGACY_DB_PASSWORD=your-password
```

---

## 💰 Cost Estimates

### Monthly Cost Breakdown

#### ECS Fargate Deployment

| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| ECS Fargate | 2 tasks, 0.5 vCPU, 1GB RAM | $30-40 |
| RDS PostgreSQL | db.t3.small, 20GB storage | $25-35 |
| Application Load Balancer | Standard ALB | $16-20 |
| NAT Gateway (if needed) | 1 NAT Gateway | $32-45 |
| CloudWatch Logs | 5GB/month | $2-5 |
| Data Transfer | 10GB outbound | $1-2 |
| **Total** | | **$106-147/month** |

#### Cost Optimization Tips

1. **Use Savings Plans** - Save 20-30% with 1-year commitment
2. **Right-size instances** - Start small, scale as needed
3. **Use spot instances** - For non-critical tasks
4. **Enable RDS auto-pause** - For dev/test environments
5. **Use CloudFront CDN** - Reduce data transfer costs

---

## 📊 Post-Deployment

### 1. Verify Deployment

```bash
# Check service status
aws ecs describe-services \
  --cluster fred-production \
  --services fred-next-service

# Get ALB DNS name
aws elbv2 describe-load-balancers \
  --names fred-alb \
  --query 'LoadBalancers[0].DNSName' \
  --output text

# Test the endpoint
curl http://ALB_DNS_NAME
```

### 2. Configure Domain (Optional)

If using custom domain:

```bash
# Create Route 53 record
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "fred.yourdomain.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z35SXDOTRQ7X7K",
          "DNSName": "ALB_DNS_NAME",
          "EvaluateTargetHealth": false
        }
      }
    }]
  }'
```

### 3. Set Up SSL/TLS

```bash
# Request ACM certificate
aws acm request-certificate \
  --domain-name fred.yourdomain.com \
  --validation-method DNS \
  --region us-east-1

# Update ALB listener to use HTTPS
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:us-east-1:ACCOUNT_ID:loadbalancer/app/fred-alb/xxxxx \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/xxxxx \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:us-east-1:ACCOUNT_ID:targetgroup/fred-target-group/xxxxx
```

### 4. Set Up Monitoring

```bash
# Create CloudWatch alarm for high CPU
aws cloudwatch put-metric-alarm \
  --alarm-name fred-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

### 5. Enable Auto-Scaling

```bash
# Register scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/fred-production/fred-next-service \
  --min-capacity 2 \
  --max-capacity 10

# Create scaling policy
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/fred-production/fred-next-service \
  --policy-name fred-cpu-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://scaling-policy.json
```

---

## 🔒 Security Checklist

- [ ] Enable RDS encryption at rest
- [ ] Use AWS Secrets Manager for all sensitive data
- [ ] Configure security groups with least privilege
- [ ] Enable VPC Flow Logs
- [ ] Set up AWS WAF on ALB
- [ ] Enable CloudTrail for audit logs
- [ ] Configure RDS automated backups
- [ ] Enable multi-factor authentication on AWS account
- [ ] Rotate credentials regularly
- [ ] Use HTTPS only (redirect HTTP to HTTPS)

---

## 🚨 Troubleshooting

### Common Issues

#### 1. Container Won't Start

Check logs:
```bash
aws logs tail /ecs/fred-next --follow
```

#### 2. Database Connection Failed

Test connectivity:
```bash
# From ECS task
aws ecs execute-command \
  --cluster fred-production \
  --task TASK_ID \
  --container fred-next-container \
  --command "/bin/sh" \
  --interactive
```

#### 3. High Memory Usage

Increase task memory:
```bash
# Update task definition with more memory
# Then update service to use new task definition
aws ecs update-service \
  --cluster fred-production \
  --service fred-next-service \
  --task-definition fred-next-task:2 \
  --force-new-deployment
```

---

## 📚 Additional Resources

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [AWS RDS PostgreSQL](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)

---

## 🔄 CI/CD Pipeline (Optional)

See `AWS_CICD.md` for GitHub Actions workflow to automate deployments.

---

**Need Help?**
- AWS Support: https://console.aws.amazon.com/support/
- Community: https://repost.aws/

**Last Updated**: February 4, 2026
