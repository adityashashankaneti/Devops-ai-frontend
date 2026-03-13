export type CloudProvider = 'aws' | 'azure' | 'gcp';
export type AppMode = 'architecture' | 'chatbot';
export type NodeType = 'default' | 'container' | 'expandable';
export type ConnectorType = 'default' | 'dashed' | 'thick' | 'bidirectional';

export interface AWSResource {
  id: string;
  name: string;
  category: string;
  description: string;
  color: string;
  abbr: string;
  nodeType?: NodeType;
}

export interface ResourceCategory {
  id: string;
  name: string;
  resources: AWSResource[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
