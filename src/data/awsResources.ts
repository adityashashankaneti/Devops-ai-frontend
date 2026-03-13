import { ResourceCategory } from '../types';

export const awsResourceCategories: ResourceCategory[] = [
  {
    id: 'networking',
    name: 'Networking',
    resources: [
      { id: 'vpc', name: 'VPC', category: 'networking', description: 'Virtual Private Cloud', color: '#8B5CF6', abbr: 'VPC', nodeType: 'container' },
      { id: 'subnet-public', name: 'Public Subnet', category: 'networking', description: 'Public-facing subnet', color: '#06B6D4', abbr: 'PUB', nodeType: 'container' },
      { id: 'subnet-private', name: 'Private Subnet', category: 'networking', description: 'Private subnet (no direct internet)', color: '#0891B2', abbr: 'PRV', nodeType: 'container' },
      { id: 'availability-zone', name: 'Availability Zone', category: 'networking', description: 'Isolated data center location', color: '#0E7490', abbr: 'AZ', nodeType: 'container' },
      { id: 'nat-gateway', name: 'NAT Gateway', category: 'networking', description: 'Network Address Translation', color: '#7C3AED', abbr: 'NAT' },
      { id: 'internet-gateway', name: 'Internet Gateway', category: 'networking', description: 'Connect VPC to Internet', color: '#6D28D9', abbr: 'IGW' },
      { id: 'route53', name: 'Route 53', category: 'networking', description: 'DNS Web Service', color: '#5B21B6', abbr: 'R53', nodeType: 'expandable' },
      { id: 'elastic-ip', name: 'Elastic IP', category: 'networking', description: 'Static Public IPv4', color: '#4C1D95', abbr: 'EIP' },
      { id: 'transit-gateway', name: 'Transit Gateway', category: 'networking', description: 'Network Transit Hub', color: '#6D28D9', abbr: 'TGW' },
      { id: 'direct-connect', name: 'Direct Connect', category: 'networking', description: 'Dedicated Network Connection', color: '#5B21B6', abbr: 'DX' },
      { id: 'vpc-peering', name: 'VPC Peering', category: 'networking', description: 'Connect VPCs Together', color: '#7C3AED', abbr: 'VPR' },
    ],
  },
  {
    id: 'compute',
    name: 'Compute',
    resources: [
      { id: 'ec2', name: 'EC2', category: 'compute', description: 'Elastic Compute Cloud', color: '#F59E0B', abbr: 'EC2' },
      { id: 'lambda', name: 'Lambda', category: 'compute', description: 'Serverless Functions', color: '#D97706', abbr: 'λ' },
      { id: 'ecs', name: 'ECS', category: 'compute', description: 'Elastic Container Service', color: '#B45309', abbr: 'ECS' },
      { id: 'eks', name: 'EKS', category: 'compute', description: 'Elastic Kubernetes Service', color: '#92400E', abbr: 'EKS' },
      { id: 'fargate', name: 'Fargate', category: 'compute', description: 'Serverless Containers', color: '#78350F', abbr: 'FG' },
      { id: 'auto-scaling', name: 'Auto Scaling', category: 'compute', description: 'Automatic Scaling Groups', color: '#F59E0B', abbr: 'ASG' },
      { id: 'batch', name: 'Batch', category: 'compute', description: 'Batch Computing Jobs', color: '#D97706', abbr: 'BCH' },
    ],
  },
  {
    id: 'storage',
    name: 'Storage',
    resources: [
      { id: 's3', name: 'S3', category: 'storage', description: 'Simple Storage Service', color: '#10B981', abbr: 'S3' },
      { id: 'ebs', name: 'EBS', category: 'storage', description: 'Elastic Block Store', color: '#059669', abbr: 'EBS' },
      { id: 'efs', name: 'EFS', category: 'storage', description: 'Elastic File System', color: '#047857', abbr: 'EFS' },
      { id: 'glacier', name: 'Glacier', category: 'storage', description: 'Archive Storage', color: '#065F46', abbr: 'GLC' },
      { id: 'fsx', name: 'FSx', category: 'storage', description: 'Managed File Systems', color: '#10B981', abbr: 'FSx' },
    ],
  },
  {
    id: 'database',
    name: 'Database',
    resources: [
      { id: 'rds', name: 'RDS', category: 'database', description: 'Relational Database Service', color: '#3B82F6', abbr: 'RDS' },
      { id: 'dynamodb', name: 'DynamoDB', category: 'database', description: 'NoSQL Database', color: '#2563EB', abbr: 'DDB' },
      { id: 'elasticache', name: 'ElastiCache', category: 'database', description: 'In-Memory Cache', color: '#1D4ED8', abbr: 'ELC' },
      { id: 'aurora', name: 'Aurora', category: 'database', description: 'MySQL/Postgres Compatible', color: '#1E40AF', abbr: 'AUR' },
      { id: 'redshift', name: 'Redshift', category: 'database', description: 'Data Warehouse', color: '#1E3A8A', abbr: 'RS' },
      { id: 'documentdb', name: 'DocumentDB', category: 'database', description: 'MongoDB Compatible', color: '#2563EB', abbr: 'DOC' },
    ],
  },
  {
    id: 'load-balancing',
    name: 'Load Balancing',
    resources: [
      { id: 'alb', name: 'App Load Balancer', category: 'load-balancing', description: 'Application Load Balancer', color: '#EC4899', abbr: 'ALB' },
      { id: 'nlb', name: 'Net Load Balancer', category: 'load-balancing', description: 'Network Load Balancer', color: '#DB2777', abbr: 'NLB' },
      { id: 'api-gateway', name: 'API Gateway', category: 'load-balancing', description: 'REST / WebSocket APIs', color: '#BE185D', abbr: 'AGW' },
      { id: 'global-accelerator', name: 'Global Accelerator', category: 'load-balancing', description: 'Global Traffic Routing', color: '#9D174D', abbr: 'GA' },
    ],
  },
  {
    id: 'security',
    name: 'Security',
    resources: [
      { id: 'iam', name: 'IAM', category: 'security', description: 'Identity & Access Management', color: '#EF4444', abbr: 'IAM' },
      { id: 'waf', name: 'WAF', category: 'security', description: 'Web Application Firewall', color: '#DC2626', abbr: 'WAF' },
      { id: 'shield', name: 'Shield', category: 'security', description: 'DDoS Protection', color: '#B91C1C', abbr: 'SHD' },
      { id: 'kms', name: 'KMS', category: 'security', description: 'Key Management Service', color: '#991B1B', abbr: 'KMS' },
      { id: 'secrets-manager', name: 'Secrets Manager', category: 'security', description: 'Secrets Rotation & Storage', color: '#7F1D1D', abbr: 'SM' },
      { id: 'security-group', name: 'Security Group', category: 'security', description: 'Virtual Firewall Rules', color: '#EF4444', abbr: 'SG', nodeType: 'container' },
      { id: 'acm', name: 'ACM', category: 'security', description: 'Certificate Manager', color: '#DC2626', abbr: 'ACM' },
    ],
  },
  {
    id: 'monitoring',
    name: 'Monitoring',
    resources: [
      { id: 'cloudwatch', name: 'CloudWatch', category: 'monitoring', description: 'Monitoring & Observability', color: '#14B8A6', abbr: 'CW' },
      { id: 'cloudtrail', name: 'CloudTrail', category: 'monitoring', description: 'API Audit Logging', color: '#0D9488', abbr: 'CT' },
      { id: 'config', name: 'AWS Config', category: 'monitoring', description: 'Resource Configuration', color: '#0F766E', abbr: 'CFG' },
      { id: 'xray', name: 'X-Ray', category: 'monitoring', description: 'Distributed Tracing', color: '#0D9488', abbr: 'XRY' },
    ],
  },
  {
    id: 'messaging',
    name: 'Messaging & CDN',
    resources: [
      { id: 'cloudfront', name: 'CloudFront', category: 'messaging', description: 'Content Delivery Network', color: '#F97316', abbr: 'CF' },
      { id: 'sqs', name: 'SQS', category: 'messaging', description: 'Simple Queue Service', color: '#EA580C', abbr: 'SQS' },
      { id: 'sns', name: 'SNS', category: 'messaging', description: 'Simple Notification Service', color: '#C2410C', abbr: 'SNS' },
      { id: 'eventbridge', name: 'EventBridge', category: 'messaging', description: 'Serverless Event Bus', color: '#9A3412', abbr: 'EB' },
      { id: 'kinesis', name: 'Kinesis', category: 'messaging', description: 'Real-time Data Streaming', color: '#F97316', abbr: 'KIN' },
    ],
  },
  {
    id: 'devops',
    name: 'DevOps & CICD',
    resources: [
      { id: 'codepipeline', name: 'CodePipeline', category: 'devops', description: 'CI/CD Automation', color: '#A855F7', abbr: 'CP' },
      { id: 'codebuild', name: 'CodeBuild', category: 'devops', description: 'Build & Test Service', color: '#9333EA', abbr: 'CB' },
      { id: 'codedeploy', name: 'CodeDeploy', category: 'devops', description: 'Automated Deployments', color: '#7C3AED', abbr: 'CD' },
      { id: 'ecr', name: 'ECR', category: 'devops', description: 'Container Registry', color: '#6D28D9', abbr: 'ECR' },
      { id: 'terraform', name: 'Terraform', category: 'devops', description: 'Infrastructure as Code', color: '#5B21B6', abbr: 'TF' },
    ],
  },
];

export const allAWSResources = awsResourceCategories.flatMap((cat) => cat.resources);
