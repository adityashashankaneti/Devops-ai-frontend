import { Node, Edge } from 'reactflow';
import { AWSResource } from '../types';

// ── Deploy payload types ─────────────────────────────────────────────────────

export interface DeployResource {
  id: string;
  resourceType: string;
  name: string;
  properties: Record<string, unknown>;
  children: DeployResource[];
}

export interface DeployConnection {
  id: string;
  connectorType: string;
  source: { resourceId: string; resourceType: string; name: string };
  target: { resourceId: string; resourceType: string; name: string };
}

export interface DeployPayload {
  project: string;
  region: string;
  resources: DeployResource[];
  connections: DeployConnection[];
  existing_resources: DeployResource[];
}

/**
 * Build a nested deploy payload from React Flow nodes/edges.
 *
 * Container nodes (VPC, Subnet, AZ, SG) become parents whose children are
 * nested inside them via `parentNode`.  The resulting tree mirrors the visual
 * hierarchy on the canvas:
 *
 *   VPC (cidr: 10.0.0.0/16)
 *     └─ Public Subnet (cidr: 10.0.1.0/24)
 *          └─ EC2 (instanceType: t3.micro)
 *
 * Connections carry the source/target resource type + name so the backend
 * knows which resources are linked.
 */
export function buildDeployPayload(
  nodes: Node[],
  edges: Edge[],
  project = 'my-infra',
  region = 'us-east-1',
  deployedNodeIds: ReadonlySet<string> = new Set(),
): DeployPayload {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  const buildResource = (node: Node): DeployResource => {
    const data = node.data as AWSResource & { config?: Record<string, unknown> };
    const children = nodes
      .filter((n) => n.parentNode === node.id)
      .map(buildResource);

    return {
      id: node.id,
      resourceType: data.id,
      name: (data.config?.name as string) || data.name,
      properties: data.config ?? {},
      children,
    };
  };

  // Build resource tree with only deployed children (for context)
  const buildDeployedResource = (node: Node): DeployResource => {
    const data = node.data as AWSResource & { config?: Record<string, unknown> };
    const children = nodes
      .filter((n) => n.parentNode === node.id && deployedNodeIds.has(n.id))
      .map(buildDeployedResource);

    return {
      id: node.id,
      resourceType: data.id,
      name: (data.config?.name as string) || data.name,
      properties: data.config ?? {},
      children,
    };
  };

  // NEW (blue) resources to deploy:
  // 1. Top-level new nodes (e.g. standalone S3 bucket)
  // 2. New nodes inside deployed containers (e.g. new EC2 in existing subnet)
  const newTopLevel = nodes
    .filter((n) => !n.parentNode && !deployedNodeIds.has(n.id))
    .map(buildResource);
  const newChildrenOfDeployed = nodes
    .filter((n) => n.parentNode && !deployedNodeIds.has(n.id)
      && deployedNodeIds.has(n.parentNode))
    .map(buildResource);
  const resources = [...newTopLevel, ...newChildrenOfDeployed];

  // Already-deployed (green/locked) nodes sent as context only so Claude
  // can reference their exact names (vpc_name, subnet_name, etc.)
  const existing_resources = nodes
    .filter((n) => deployedNodeIds.has(n.id) && !n.parentNode)
    .map(buildDeployedResource);

  const connections: DeployConnection[] = edges.map((edge) => {
    const src = nodeMap.get(edge.source)?.data as (AWSResource & { config?: Record<string, unknown> }) | undefined;
    const tgt = nodeMap.get(edge.target)?.data as (AWSResource & { config?: Record<string, unknown> }) | undefined;

    // Derive connector type from edge visual style
    let connectorType = 'default';
    if (edge.style?.strokeDasharray) connectorType = 'dashed';
    else if ((edge.style?.strokeWidth as number) >= 4) connectorType = 'thick';
    else if (edge.markerStart) connectorType = 'bidirectional';

    return {
      id: edge.id,
      connectorType,
      source: {
        resourceId: edge.source,
        resourceType: src?.id ?? 'unknown',
        name: (src?.config?.name as string) || src?.name || 'Unknown',
      },
      target: {
        resourceId: edge.target,
        resourceType: tgt?.id ?? 'unknown',
        name: (tgt?.config?.name as string) || tgt?.name || 'Unknown',
      },
    };
  });

  return { project, region, resources, connections, existing_resources };
}
