import { createContext, useContext } from 'react';

/**
 * Provides the set of canvas node IDs that have been successfully deployed to AWS.
 * AWSNode and ContainerNode consume this to apply green/locked styling.
 */
export const DeployedNodesContext = createContext<ReadonlySet<string>>(new Set());

export function useIsNodeDeployed(nodeId: string): boolean {
  return useContext(DeployedNodesContext).has(nodeId);
}
