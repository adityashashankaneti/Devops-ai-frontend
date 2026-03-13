import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { ChatMessage } from '../types';

const SUGGESTIONS = [
  'Design a 3-tier web architecture on AWS',
  'How do I set up a VPC with public and private subnets?',
  'What are EKS deployment best practices?',
  'Explain NAT Gateway vs Internet Gateway',
  'How to set up a highly available RDS cluster?',
  'Design a serverless event-driven pipeline on AWS',
];

function getAIResponse(input: string): string {
  const q = input.toLowerCase();

  if (q.includes('vpc') || q.includes('subnet')) {
    return `**VPC Architecture Best Practices**

A well-designed VPC typically follows this pattern:

\`\`\`
CIDR: 10.0.0.0/16
├── Public Subnets  (10.0.1.0/24, 10.0.2.0/24) — 2 AZs
│   ├── Internet Gateway → Route Table
│   ├── NAT Gateway (one per AZ for HA)
│   └── Bastion Host / ALB
└── Private Subnets (10.0.10.0/24, 10.0.20.0/24)
    ├── Application Tier (EC2 / ECS)
    └── Data Tier (RDS Multi-AZ, ElastiCache)
\`\`\`

**Key Components:**
- **Internet Gateway** — bidirectional internet access for public subnets
- **NAT Gateway** — outbound-only internet for private subnets (place in public subnet)
- **Security Groups** — stateful instance-level firewall
- **NACLs** — stateless subnet-level firewall

**Pro Tips:**
1. Always deploy across ≥2 Availability Zones
2. Use VPC Flow Logs for traffic visibility
3. Enable DNS hostnames + DNS resolution
4. Size subnets with room to grow — /24 is usually enough per subnet`;
  }

  if (q.includes('nat') && q.includes('internet gateway')) {
    return `**NAT Gateway vs Internet Gateway — Key Differences**

| Feature | Internet Gateway | NAT Gateway |
|---|---|---|
| Direction | Bidirectional | Outbound only |
| Subnet type | Public | Private (deployed in public) |
| Requires public IP | Yes (Elastic IP on instance) | No (NAT translates) |
| Cost | Free | ~$0.045/hr + $0.045/GB |
| HA | Inherently HA | Deploy one per AZ |

**When to use:**
- **IGW** → Web servers, bastion hosts, load balancers that need inbound traffic
- **NAT GW** → App servers, DB instances that need to pull updates but shouldn't be directly reachable`;
  }

  if (q.includes('eks') || q.includes('kubernetes')) {
    return `**EKS Deployment Best Practices**

**Infrastructure:**
- Use Managed Node Groups (automated patching)
- Spread across 3 AZs minimum
- Use Spot Instances for non-critical workloads (Karpenter handles this well)

**Networking:**
- AWS VPC CNI — native pod networking
- Enable pod-level Security Groups (SGPP)
- Use AWS Load Balancer Controller for ALB Ingress

**Security:**
- IRSA (IAM Roles for Service Accounts) — never use EC2 instance profiles
- Enable Envelope Encryption for Kubernetes secrets
- Use OPA Gatekeeper or Kyverno for policy enforcement

**Observability:**
- Container Insights → CloudWatch
- AWS Distro for OpenTelemetry (ADOT)
- Fluent Bit for log aggregation → CloudWatch Logs

**Scaling:**
- HPA (CPU/memory) for pod scaling
- Karpenter for intelligent node provisioning (faster than Cluster Autoscaler)`;
  }

  if (q.includes('rds') || q.includes('database') || q.includes('highly available')) {
    return `**Highly Available RDS Architecture**

\`\`\`
                    ┌─────────────────┐
                    │   Application   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   RDS Proxy     │  ← Connection pooling
                    └────────┬────────┘
                             │
           ┌─────────────────┴──────────────────┐
           │                                     │
  ┌────────▼──────────┐               ┌──────────▼────────┐
  │  Primary (AZ-a)   │──Sync repl──► │  Standby (AZ-b)   │
  │  db.r6g.large     │               │  (Auto-failover)  │
  └───────────────────┘               └───────────────────┘
\`\`\`

**Key Settings:**
- Multi-AZ enabled (automatic failover ~60-120s)
- Read Replicas for read scaling (up to 15)
- RDS Proxy — reduces connection storms, IAM auth
- Automated backups: 7-35 day retention
- Enable Performance Insights + Enhanced Monitoring
- Use Aurora for PostgreSQL/MySQL — better failover (~30s)`;
  }

  if (q.includes('serverless') || q.includes('lambda') || q.includes('event')) {
    return `**Serverless Event-Driven Pipeline on AWS**

\`\`\`
Client → API Gateway → Lambda → SQS → Lambda → DynamoDB
                                  ↓
                               SNS → Email/SMS/Slack
                                  ↓
                           EventBridge → Step Functions
\`\`\`

**Architecture Pattern:**
1. **API Gateway** — REST or HTTP API endpoint
2. **Lambda** — process, validate, transform events
3. **SQS** — decouple services, handle bursts (DLQ for failures)
4. **EventBridge** — route events between services
5. **Step Functions** — orchestrate multi-step workflows

**Best Practices:**
- Keep Lambda functions small and single-purpose
- Use SQS between Lambda for retry + backpressure
- Set Reserved Concurrency to protect downstream services
- Use Lambda Layers for shared code/dependencies
- Enable X-Ray tracing across all services`;
  }

  if (q.includes('3-tier') || q.includes('three tier') || q.includes('web architecture')) {
    return `**3-Tier Web Architecture on AWS**

\`\`\`
Internet
   │
   ▼
Route 53 (DNS)
   │
   ▼
CloudFront (CDN + WAF)
   │
   ▼
ALB (Application Load Balancer)
   │
   ├── EC2 / ECS (Web Tier) — Public Subnet
   │
   ▼
ALB (Internal)
   │
   ├── EC2 / ECS (App Tier) — Private Subnet
   │
   ▼
RDS Multi-AZ + ElastiCache — Data Subnet
\`\`\`

**Components to drag onto canvas:**
- Route 53 → CloudFront → WAF → ALB
- EC2 (web) in Auto Scaling Group
- EC2 (app) in Auto Scaling Group
- RDS Multi-AZ + ElastiCache
- S3 for static assets
- NAT Gateway for private subnet egress`;
  }

  return `Great question about **"${input}"**!

Here's how I'd approach this from a DevOps perspective:

**Architecture Principles:**
1. **High Availability** — deploy across multiple AZs, use managed services
2. **Security** — least privilege IAM, encryption at rest/transit, VPC isolation
3. **Scalability** — auto-scaling groups, serverless where appropriate
4. **Observability** — CloudWatch metrics, logs, alarms, X-Ray tracing
5. **Cost Optimization** — right-size instances, use Spot/Reserved for savings

**Recommended Next Steps:**
- Drag relevant AWS resources onto the Architecture canvas
- Connect them to visualize the data flow
- Switch back to Architecture mode to start designing

Would you like me to go deeper on any specific aspect — networking, security, scaling strategy, or CI/CD setup?`;
}

export default function ChatbotView() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = useCallback(
    (content: string) => {
      const text = content.trim();
      if (!text || isTyping) return;

      const userMsg: ChatMessage = {
        id: `${Date.now()}-u`,
        role: 'user',
        content: text,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setIsTyping(true);

      // Auto-resize textarea back to 1 row
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      setTimeout(
        () => {
          const aiMsg: ChatMessage = {
            id: `${Date.now()}-a`,
            role: 'assistant',
            content: getAIResponse(text),
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, aiMsg]);
          setIsTyping(false);
        },
        900 + Math.random() * 800,
      );
    },
    [isTyping],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Empty state */}
      {isEmpty && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
          <div className="w-14 h-14 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center mb-5">
            <Sparkles size={22} className="text-indigo-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-100 mb-1.5">DevOps AI Assistant</h2>
          <p className="text-slate-500 text-sm mb-8 text-center max-w-md leading-relaxed">
            Ask about cloud architecture, AWS services, DevOps practices, or infrastructure
            design patterns.
          </p>
          <div className="grid grid-cols-2 gap-2.5 max-w-2xl w-full">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => sendMessage(s)}
                className="text-left p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 hover:border-indigo-500/40 hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 text-xs leading-relaxed transition-all duration-200"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      {!isEmpty && (
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-5">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl mx-auto ${
                msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${
                  msg.role === 'user'
                    ? 'bg-indigo-600'
                    : 'bg-slate-800 border border-slate-700'
                }`}
              >
                {msg.role === 'user' ? (
                  <User size={12} className="text-white" />
                ) : (
                  <Bot size={12} className="text-indigo-400" />
                )}
              </div>

              {/* Bubble */}
              <div
                className={`rounded-2xl px-4 py-3 max-w-[85%] ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-sm'
                    : 'bg-slate-800/80 text-slate-100 border border-slate-700/60 rounded-tl-sm'
                }`}
              >
                <pre className="text-xs leading-relaxed whitespace-pre-wrap font-sans">
                  {msg.content}
                </pre>
                <p
                  className={`text-[9px] mt-2 ${
                    msg.role === 'user' ? 'text-indigo-200/70' : 'text-slate-600'
                  }`}
                >
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-3 max-w-3xl mx-auto">
              <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center bg-slate-800 border border-slate-700">
                <Bot size={12} className="text-indigo-400" />
              </div>
              <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl rounded-tl-sm px-4 py-3.5">
                <div className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-slate-800/80 flex-shrink-0">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3 bg-slate-800/60 border border-slate-700/60 rounded-2xl px-4 py-3 focus-within:border-indigo-500/60 focus-within:bg-slate-800 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Ask about AWS architecture, DevOps practices..."
              rows={1}
              className="flex-1 bg-transparent text-slate-100 text-sm outline-none resize-none placeholder:text-slate-600 leading-relaxed"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isTyping}
              className="w-8 h-8 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-all flex-shrink-0 shadow-sm"
            >
              <Send size={13} className="text-white" />
            </button>
          </div>
          <p className="text-center text-slate-700 text-[10px] mt-2">
            Responses are simulated · Connect Claude or GPT API for live AI
          </p>
        </div>
      </div>
    </div>
  );
}
