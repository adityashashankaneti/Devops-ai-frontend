export interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'select' | 'toggle' | 'number' | 'cidr' | 'textarea';
  placeholder?: string;
  options?: string[];
  defaultValue?: string | boolean | number;
  help?: string;
}

const AZ_OPTIONS = [
  'us-east-1a','us-east-1b','us-east-1c',
  'us-east-2a','us-east-2b','us-east-2c',
  'us-west-1a','us-west-1b',
  'us-west-2a','us-west-2b','us-west-2c','us-west-2d',
  'ap-south-1a','ap-south-1b',
  'ap-southeast-1a','ap-southeast-1b',
  'ap-northeast-1a','ap-northeast-1b','ap-northeast-1c',
  'eu-west-1a','eu-west-1b','eu-west-1c',
  'eu-central-1a','eu-central-1b','eu-central-1c',
];

const EC2_TYPES = [
  't2.micro','t2.small','t2.medium','t2.large',
  't3.micro','t3.small','t3.medium','t3.large','t3.xlarge','t3.2xlarge',
  'm5.large','m5.xlarge','m5.2xlarge','m5.4xlarge',
  'c5.large','c5.xlarge','c5.2xlarge','c5.4xlarge',
  'r5.large','r5.xlarge','r5.2xlarge','r5.4xlarge',
];

const RDS_CLASSES = [
  'db.t3.micro','db.t3.small','db.t3.medium','db.t3.large',
  'db.r5.large','db.r5.xlarge','db.r5.2xlarge','db.r5.4xlarge',
  'db.m5.large','db.m5.xlarge','db.m5.2xlarge',
];

export const RESOURCE_FIELDS: Record<string, FieldDef[]> = {
  vpc: [
    { key: 'name',         label: 'Name',            type: 'text',   placeholder: 'my-vpc' },
    { key: 'cidrBlock',    label: 'CIDR Block',       type: 'cidr',   placeholder: '10.0.0.0/16', help: 'e.g. 10.0.0.0/16' },
    { key: 'description',  label: 'Description',      type: 'textarea', placeholder: 'Main VPC' },
    { key: 'tenancy',      label: 'Tenancy',          type: 'select', options: ['default','dedicated'], defaultValue: 'default' },
    { key: 'dnsHostnames', label: 'DNS Hostnames',    type: 'toggle', defaultValue: true },
    { key: 'dnsResolution',label: 'DNS Resolution',   type: 'toggle', defaultValue: true },
  ],
  'subnet-public': [
    { key: 'name',              label: 'Name',                  type: 'text',   placeholder: 'public-subnet-1a' },
    { key: 'cidrBlock',         label: 'CIDR Block',            type: 'cidr',   placeholder: '10.0.1.0/24' },
    { key: 'availabilityZone',  label: 'Availability Zone',     type: 'select', options: AZ_OPTIONS },
    { key: 'autoAssignPublicIp',label: 'Auto-assign Public IP', type: 'toggle', defaultValue: true },
  ],
  'subnet-private': [
    { key: 'name',             label: 'Name',              type: 'text',   placeholder: 'private-subnet-1a' },
    { key: 'cidrBlock',        label: 'CIDR Block',        type: 'cidr',   placeholder: '10.0.10.0/24' },
    { key: 'availabilityZone', label: 'Availability Zone', type: 'select', options: AZ_OPTIONS },
  ],
  'availability-zone': [
    { key: 'name', label: 'AZ Name', type: 'select', options: AZ_OPTIONS, defaultValue: 'us-east-1a' },
  ],
  'security-group': [
    { key: 'name',        label: 'Name',        type: 'text',     placeholder: 'my-sg' },
    { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Allow HTTP/HTTPS' },
  ],
  'internet-gateway': [
    { key: 'name', label: 'Name', type: 'text', placeholder: 'my-igw' },
  ],
  'nat-gateway': [
    { key: 'name',             label: 'Name',              type: 'text',   placeholder: 'my-nat' },
    { key: 'connectivityType', label: 'Connectivity Type', type: 'select', options: ['public','private'], defaultValue: 'public' },
  ],
  'elastic-ip': [
    { key: 'name',   label: 'Name',   type: 'text', placeholder: 'my-eip' },
    { key: 'domain', label: 'Domain', type: 'select', options: ['vpc','standard'], defaultValue: 'vpc' },
  ],
  'transit-gateway': [
    { key: 'name',       label: 'Name',       type: 'text',   placeholder: 'my-tgw' },
    { key: 'amazonAsn',  label: 'Amazon ASN', type: 'number', placeholder: '64512', defaultValue: '64512' },
    { key: 'dnsSupport', label: 'DNS Support', type: 'toggle', defaultValue: true },
    { key: 'vpnEcmpSupport', label: 'VPN ECMP Support', type: 'toggle', defaultValue: true },
  ],
  ec2: [
    { key: 'name',         label: 'Name',          type: 'text',   placeholder: 'my-instance' },
    { key: 'instanceType', label: 'Instance Type',  type: 'select', options: EC2_TYPES, defaultValue: 't3.micro' },
    { key: 'ami',          label: 'AMI ID',         type: 'text',   placeholder: 'ami-0abcdef1234567890' },
    { key: 'keyPair',      label: 'Key Pair',       type: 'text',   placeholder: 'my-key-pair' },
    { key: 'monitoring',   label: 'Detailed Monitoring', type: 'toggle', defaultValue: false },
  ],
  lambda: [
    { key: 'functionName', label: 'Function Name', type: 'text',   placeholder: 'my-function' },
    { key: 'runtime',      label: 'Runtime',       type: 'select', options: ['nodejs20.x','nodejs18.x','python3.12','python3.11','python3.10','java21','java17','dotnet8','go1.x','ruby3.3'], defaultValue: 'nodejs20.x' },
    { key: 'memory',       label: 'Memory (MB)',   type: 'select', options: ['128','256','512','1024','1536','2048','3008','4096','8192','10240'], defaultValue: '128' },
    { key: 'timeout',      label: 'Timeout (sec)', type: 'number', placeholder: '30', defaultValue: '3' },
    { key: 'handler',      label: 'Handler',       type: 'text',   placeholder: 'index.handler' },
  ],
  ecs: [
    { key: 'clusterName',      label: 'Cluster Name',       type: 'text',   placeholder: 'my-cluster' },
    { key: 'capacityProvider', label: 'Capacity Provider',  type: 'select', options: ['FARGATE','FARGATE_SPOT','EC2'], defaultValue: 'FARGATE' },
    { key: 'containerInsights',label: 'Container Insights', type: 'toggle', defaultValue: true },
  ],
  eks: [
    { key: 'clusterName', label: 'Cluster Name',       type: 'text',   placeholder: 'my-cluster' },
    { key: 'k8sVersion',  label: 'Kubernetes Version', type: 'select', options: ['1.30','1.29','1.28','1.27'], defaultValue: '1.30' },
    { key: 'accessMode',  label: 'Access Mode',        type: 'select', options: ['API_AND_CONFIG_MAP','API','CONFIG_MAP'], defaultValue: 'API_AND_CONFIG_MAP' },
  ],
  fargate: [
    { key: 'taskFamily', label: 'Task Family', type: 'text',   placeholder: 'my-task' },
    { key: 'cpu',        label: 'CPU',         type: 'select', options: ['256','512','1024','2048','4096'], defaultValue: '256' },
    { key: 'memory',     label: 'Memory (MB)', type: 'select', options: ['512','1024','2048','4096','8192','16384'], defaultValue: '512' },
  ],
  'auto-scaling': [
    { key: 'groupName',  label: 'Group Name',      type: 'text',   placeholder: 'my-asg' },
    { key: 'minSize',    label: 'Min Instances',   type: 'number', placeholder: '1',  defaultValue: '1' },
    { key: 'maxSize',    label: 'Max Instances',   type: 'number', placeholder: '10', defaultValue: '3' },
    { key: 'desired',    label: 'Desired Capacity',type: 'number', placeholder: '2',  defaultValue: '2' },
  ],
  s3: [
    { key: 'bucketName',         label: 'Bucket Name',            type: 'text',   placeholder: 'my-unique-bucket' },
    { key: 'region',             label: 'Region',                 type: 'select', options: ['us-east-1','us-west-2','eu-west-1','ap-southeast-1'], defaultValue: 'us-east-1' },
    { key: 'versioning',         label: 'Versioning',             type: 'toggle', defaultValue: false },
    { key: 'blockPublicAccess',  label: 'Block Public Access',    type: 'toggle', defaultValue: true },
    { key: 'encryption',         label: 'Server-side Encryption', type: 'toggle', defaultValue: true },
  ],
  rds: [
    { key: 'identifier',       label: 'DB Identifier',   type: 'text',   placeholder: 'my-database' },
    { key: 'engine',           label: 'Engine',          type: 'select', options: ['mysql','postgres','mariadb','oracle-ee','sqlserver-ex','aurora-mysql','aurora-postgresql'], defaultValue: 'postgres' },
    { key: 'instanceClass',    label: 'Instance Class',  type: 'select', options: RDS_CLASSES, defaultValue: 'db.t3.micro' },
    { key: 'storage',          label: 'Storage (GB)',    type: 'number', placeholder: '20', defaultValue: '20' },
    { key: 'multiAz',          label: 'Multi-AZ',        type: 'toggle', defaultValue: true },
    { key: 'publiclyAccessible',label: 'Publicly Accessible', type: 'toggle', defaultValue: false },
    { key: 'backupRetention',  label: 'Backup Retention (days)', type: 'number', placeholder: '7', defaultValue: '7' },
  ],
  dynamodb: [
    { key: 'tableName',     label: 'Table Name',     type: 'text',   placeholder: 'my-table' },
    { key: 'partitionKey',  label: 'Partition Key',  type: 'text',   placeholder: 'id' },
    { key: 'sortKey',       label: 'Sort Key',       type: 'text',   placeholder: 'createdAt (optional)' },
    { key: 'billingMode',   label: 'Billing Mode',   type: 'select', options: ['PAY_PER_REQUEST','PROVISIONED'], defaultValue: 'PAY_PER_REQUEST' },
    { key: 'pitr',          label: 'Point-in-Time Recovery', type: 'toggle', defaultValue: true },
    { key: 'encryption',    label: 'Encryption at Rest', type: 'toggle', defaultValue: true },
  ],
  elasticache: [
    { key: 'clusterName', label: 'Cluster Name', type: 'text',   placeholder: 'my-cache' },
    { key: 'engine',      label: 'Engine',       type: 'select', options: ['redis','memcached'], defaultValue: 'redis' },
    { key: 'nodeType',    label: 'Node Type',    type: 'select', options: ['cache.t3.micro','cache.t3.small','cache.r6g.large','cache.r6g.xlarge'], defaultValue: 'cache.t3.micro' },
    { key: 'numNodes',    label: 'Num Nodes',    type: 'number', placeholder: '1', defaultValue: '1' },
    { key: 'multiAz',     label: 'Multi-AZ',     type: 'toggle', defaultValue: false },
  ],
  aurora: [
    { key: 'clusterIdentifier', label: 'Cluster Identifier', type: 'text',   placeholder: 'my-aurora' },
    { key: 'engine',            label: 'Engine',             type: 'select', options: ['aurora-mysql','aurora-postgresql'], defaultValue: 'aurora-postgresql' },
    { key: 'instanceClass',     label: 'Instance Class',     type: 'select', options: RDS_CLASSES, defaultValue: 'db.r5.large' },
    { key: 'replicas',          label: 'Read Replicas',      type: 'number', placeholder: '1', defaultValue: '1' },
    { key: 'serverless',        label: 'Aurora Serverless v2', type: 'toggle', defaultValue: false },
  ],
  alb: [
    { key: 'name',           label: 'Name',            type: 'text',   placeholder: 'my-alb' },
    { key: 'scheme',         label: 'Scheme',          type: 'select', options: ['internet-facing','internal'], defaultValue: 'internet-facing' },
    { key: 'ipAddressType',  label: 'IP Address Type', type: 'select', options: ['ipv4','dualstack'], defaultValue: 'ipv4' },
    { key: 'deletionProtection', label: 'Deletion Protection', type: 'toggle', defaultValue: false },
  ],
  nlb: [
    { key: 'name',           label: 'Name',            type: 'text',   placeholder: 'my-nlb' },
    { key: 'scheme',         label: 'Scheme',          type: 'select', options: ['internet-facing','internal'], defaultValue: 'internet-facing' },
    { key: 'crossZone',      label: 'Cross-Zone Load Balancing', type: 'toggle', defaultValue: true },
  ],
  'api-gateway': [
    { key: 'name',         label: 'Name',          type: 'text',   placeholder: 'my-api' },
    { key: 'type',         label: 'Type',          type: 'select', options: ['REST','HTTP','WebSocket'], defaultValue: 'REST' },
    { key: 'endpointType', label: 'Endpoint Type', type: 'select', options: ['EDGE','REGIONAL','PRIVATE'], defaultValue: 'REGIONAL' },
    { key: 'throttling',   label: 'Throttling (req/s)', type: 'number', placeholder: '10000' },
  ],
  cloudfront: [
    { key: 'name',        label: 'Distribution Name', type: 'text',   placeholder: 'my-distribution' },
    { key: 'originDomain',label: 'Origin Domain',     type: 'text',   placeholder: 'my-bucket.s3.amazonaws.com' },
    { key: 'priceClass',  label: 'Price Class',       type: 'select', options: ['PriceClass_All','PriceClass_200','PriceClass_100'], defaultValue: 'PriceClass_All' },
    { key: 'httpsOnly',   label: 'HTTPS Only',        type: 'toggle', defaultValue: true },
    { key: 'wafEnabled',  label: 'WAF Enabled',       type: 'toggle', defaultValue: false },
  ],
  sqs: [
    { key: 'queueName',           label: 'Queue Name',           type: 'text',   placeholder: 'my-queue' },
    { key: 'type',                label: 'Type',                 type: 'select', options: ['Standard','FIFO'], defaultValue: 'Standard' },
    { key: 'visibilityTimeout',   label: 'Visibility Timeout (s)', type: 'number', placeholder: '30', defaultValue: '30' },
    { key: 'retentionPeriod',     label: 'Retention Period (days)', type: 'select', options: ['1','4','7','14'], defaultValue: '4' },
    { key: 'dlqEnabled',          label: 'Dead Letter Queue',    type: 'toggle', defaultValue: false },
  ],
  sns: [
    { key: 'topicName',   label: 'Topic Name',   type: 'text',   placeholder: 'my-topic' },
    { key: 'type',        label: 'Type',         type: 'select', options: ['Standard','FIFO'], defaultValue: 'Standard' },
    { key: 'encryption',  label: 'Encryption',   type: 'toggle', defaultValue: false },
  ],
  eventbridge: [
    { key: 'eventBusName', label: 'Event Bus Name', type: 'text',   placeholder: 'my-event-bus' },
    { key: 'archiveEnabled', label: 'Archive Events', type: 'toggle', defaultValue: false },
    { key: 'retention',    label: 'Archive Retention (days)', type: 'number', placeholder: '30' },
  ],
  cloudwatch: [
    { key: 'alarmName',   label: 'Alarm Name',       type: 'text',   placeholder: 'my-alarm' },
    { key: 'namespace',   label: 'Metric Namespace', type: 'text',   placeholder: 'AWS/EC2' },
    { key: 'metric',      label: 'Metric Name',      type: 'text',   placeholder: 'CPUUtilization' },
    { key: 'threshold',   label: 'Threshold',        type: 'number', placeholder: '80' },
    { key: 'period',      label: 'Period (s)',        type: 'select', options: ['60','300','900','3600'], defaultValue: '300' },
  ],
  iam: [
    { key: 'name',       label: 'Name',        type: 'text',   placeholder: 'my-role' },
    { key: 'type',       label: 'Type',        type: 'select', options: ['Role','Policy','Group','User'], defaultValue: 'Role' },
    { key: 'mfa',        label: 'Require MFA', type: 'toggle', defaultValue: false },
  ],
  'secrets-manager': [
    { key: 'secretName',       label: 'Secret Name',             type: 'text',   placeholder: '/app/db/password' },
    { key: 'rotationEnabled',  label: 'Automatic Rotation',      type: 'toggle', defaultValue: false },
    { key: 'rotationInterval', label: 'Rotation Interval (days)',type: 'number', placeholder: '30', defaultValue: '30' },
  ],
  kms: [
    { key: 'alias',     label: 'Key Alias',  type: 'text',   placeholder: 'alias/my-key' },
    { key: 'keyUsage',  label: 'Key Usage',  type: 'select', options: ['ENCRYPT_DECRYPT','SIGN_VERIFY','GENERATE_VERIFY_MAC'], defaultValue: 'ENCRYPT_DECRYPT' },
    { key: 'rotation',  label: 'Auto Rotation', type: 'toggle', defaultValue: true },
  ],
  ecr: [
    { key: 'repositoryName', label: 'Repository Name', type: 'text',   placeholder: 'my-app' },
    { key: 'imageMutability',label: 'Image Tag Mutability', type: 'select', options: ['MUTABLE','IMMUTABLE'], defaultValue: 'MUTABLE' },
    { key: 'scanOnPush',     label: 'Scan on Push',    type: 'toggle', defaultValue: true },
  ],
  codepipeline: [
    { key: 'pipelineName', label: 'Pipeline Name', type: 'text', placeholder: 'my-pipeline' },
  ],
  codebuild: [
    { key: 'projectName',   label: 'Project Name',     type: 'text',   placeholder: 'my-build' },
    { key: 'environment',   label: 'Environment',      type: 'select', options: ['aws/codebuild/standard:7.0','aws/codebuild/amazonlinux2-x86_64-standard:5.0'], defaultValue: 'aws/codebuild/standard:7.0' },
    { key: 'computeType',   label: 'Compute Type',     type: 'select', options: ['BUILD_GENERAL1_SMALL','BUILD_GENERAL1_MEDIUM','BUILD_GENERAL1_LARGE'], defaultValue: 'BUILD_GENERAL1_SMALL' },
  ],
  waf: [
    { key: 'name',  label: 'WAF Name', type: 'text',   placeholder: 'my-waf' },
    { key: 'scope', label: 'Scope',    type: 'select', options: ['REGIONAL','CLOUDFRONT'], defaultValue: 'REGIONAL' },
  ],
  kinesis: [
    { key: 'streamName', label: 'Stream Name',        type: 'text',   placeholder: 'my-stream' },
    { key: 'shards',     label: 'Shard Count',        type: 'number', placeholder: '1', defaultValue: '1' },
    { key: 'retention',  label: 'Retention (hours)',  type: 'select', options: ['24','48','72','168','8760'], defaultValue: '24' },
  ],
};

// Default fields for resources not explicitly listed above
export const DEFAULT_FIELDS: FieldDef[] = [
  { key: 'name',        label: 'Name',        type: 'text',     placeholder: 'my-resource' },
  { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Description...' },
];

export function getFieldsForResource(resourceId: string): FieldDef[] {
  return RESOURCE_FIELDS[resourceId] ?? DEFAULT_FIELDS;
}
