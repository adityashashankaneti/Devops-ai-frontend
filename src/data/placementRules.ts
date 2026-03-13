import { AWSResource } from '../types';

/**
 * Defines which container resource IDs each resource is allowed inside.
 * - undefined (not in map) = no restriction, can go inside any container or standalone
 * - [] = CANNOT go inside any container (global service)
 * - ['vpc', ...] = can ONLY go inside one of these container types
 */
export const ALLOWED_CONTAINERS: Record<string, string[]> = {
  // ── Networking containers (must be inside VPC) ──────────────────────────
  'subnet-public':      ['vpc', 'availability-zone'],
  'subnet-private':     ['vpc', 'availability-zone'],
  'availability-zone':  ['vpc'],
  'security-group':     ['vpc'],
  'internet-gateway':   ['vpc'],
  'nat-gateway':        ['subnet-public'],

  // ── Compute (live inside subnets) ───────────────────────────────────────
  'ec2':          ['subnet-public', 'subnet-private', 'security-group'],
  'ecs':          ['subnet-public', 'subnet-private'],
  'eks':          ['subnet-public', 'subnet-private'],
  'fargate':      ['subnet-private', 'subnet-public'],
  'auto-scaling': ['subnet-private', 'subnet-public'],
  'batch':        ['subnet-private', 'subnet-public'],

  // ── Database (private subnets) ──────────────────────────────────────────
  'rds':         ['subnet-private', 'subnet-public'],
  'elasticache': ['subnet-private', 'subnet-public'],
  'aurora':      ['subnet-private', 'subnet-public'],
  'redshift':    ['subnet-private'],
  'documentdb':  ['subnet-private', 'subnet-public'],

  // ── Storage (some global, some in subnets) ──────────────────────────────
  'ebs':     ['subnet-private', 'subnet-public'],
  'efs':     ['subnet-private', 'subnet-public'],
  'fsx':     ['subnet-private'],
  's3':      [],   // global object store
  'glacier': [],   // global archive

  // ── Load balancing ──────────────────────────────────────────────────────
  'alb': ['subnet-public', 'subnet-private'],
  'nlb': ['subnet-public', 'subnet-private'],

  // ── GLOBAL SERVICES — cannot be inside any container ───────────────────
  'route53':           [],
  'dynamodb':          [],
  'cloudfront':        [],
  'sqs':               [],
  'sns':               [],
  'eventbridge':       [],
  'kinesis':           [],
  'iam':               [],
  'waf':               [],
  'shield':            [],
  'kms':               [],
  'secrets-manager':   [],
  'acm':               [],
  'cloudwatch':        [],
  'cloudtrail':        [],
  'config':            [],
  'xray':              [],
  'api-gateway':       [],
  'global-accelerator':[],
  'codepipeline':      [],
  'codebuild':         [],
  'codedeploy':        [],
  'ecr':               [],
  'terraform':         [],
  'elastic-ip':        [],
  'transit-gateway':   [],
  'direct-connect':    [],
  'vpc-peering':       [],
};

const GLOBAL_REASON: Record<string, string> = {
  'route53':            'Route 53 is a global DNS service',
  'dynamodb':           'DynamoDB is a global managed service',
  'cloudfront':         'CloudFront is a global CDN',
  'sqs':                'SQS is a regional managed queue (not VPC-bound)',
  'sns':                'SNS is a regional managed topic (not VPC-bound)',
  'eventbridge':        'EventBridge is a serverless event bus (not VPC-bound)',
  'kinesis':            'Kinesis is a regional streaming service (not VPC-bound)',
  'iam':                'IAM is a global identity service',
  'waf':                'WAF is a global/regional managed service',
  'shield':             'Shield is a global DDoS protection service',
  'kms':                'KMS is a regional key management service (not VPC-bound)',
  'secrets-manager':    'Secrets Manager is a regional managed service',
  'acm':                'ACM is a regional certificate service',
  'cloudwatch':         'CloudWatch is a regional monitoring service (not VPC-bound)',
  'cloudtrail':         'CloudTrail is a regional audit service (not VPC-bound)',
  'config':             'AWS Config is a regional service (not VPC-bound)',
  'xray':               'X-Ray is a regional tracing service (not VPC-bound)',
  'api-gateway':        'API Gateway (edge-optimized) is a global managed service',
  'global-accelerator': 'Global Accelerator is a global networking service',
  'codepipeline':       'CodePipeline is a global CI/CD service',
  'codebuild':          'CodeBuild is a managed build service (not VPC-bound)',
  'codedeploy':         'CodeDeploy is a managed deployment service (not VPC-bound)',
  'ecr':                'ECR is a regional container registry (not VPC-bound)',
  'terraform':          'Terraform is an IaC tool, not an AWS resource',
  'elastic-ip':         'Elastic IPs are region-level resources (not placed inside containers)',
  'transit-gateway':    'Transit Gateway is an inter-VPC routing resource',
  'direct-connect':     'Direct Connect is a physical network connection',
  'vpc-peering':        'VPC Peering is a logical connection between VPCs',
  's3':                 'S3 is a global object storage service',
  'glacier':            'Glacier is a global archive storage service',
};

export function getPlacementError(
  resource: AWSResource,
  container: AWSResource,
): string | null {
  const allowed = ALLOWED_CONTAINERS[resource.id];
  if (allowed === undefined) return null; // no restriction

  if (allowed.length === 0) {
    const reason = GLOBAL_REASON[resource.id] ?? `${resource.name} is not a VPC resource`;
    return `Cannot place here — ${reason}.`;
  }

  if (!allowed.includes(container.id)) {
    const friendlyContainers = allowed
      .map((id) => id.replace('subnet-', '').replace('-', ' '))
      .join(' or ');
    return `${resource.name} must be placed inside a ${friendlyContainers}, not a ${container.name}.`;
  }

  return null;
}

/**
 * Check whether a resource can be placed standalone (not inside any container).
 * Returns error string if it MUST be inside a container, null if standalone is fine.
 */
export function getStandalonePlacementError(resource: AWSResource): string | null {
  const allowed = ALLOWED_CONTAINERS[resource.id];
  if (allowed === undefined) return null; // no restriction
  if (allowed.length === 0) return null;  // global service, standalone is correct

  const friendlyContainers = allowed
    .map((id) => {
      const LABELS: Record<string, string> = {
        'vpc': 'VPC',
        'subnet-public': 'Public Subnet',
        'subnet-private': 'Private Subnet',
        'availability-zone': 'Availability Zone',
        'security-group': 'Security Group',
      };
      return LABELS[id] ?? id;
    })
    .join(' or ');
  return `${resource.name} must be placed inside a ${friendlyContainers}.`;
}
