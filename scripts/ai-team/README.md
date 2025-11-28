# 🤖 SGA AI Team - Enhanced Orchestrator v2.0

A powerful, **legitimate** AI coding team that leverages multiple FREE API providers for maximum compute power.

## 📊 Available FREE Providers

| Provider | Daily Limit | Speed | Best For |
|----------|-------------|-------|----------|
| **Groq** | 14,400 req/day | ⚡ Blazing | Fast iteration, quick tasks |
| **Cerebras** | 14,400 req/day | ⚡ Very Fast | Heavy workloads |
| **Google Gemini** | 1M+ tokens/day | 🚀 Fast | Complex reasoning |
| **OpenRouter** | 50 req/day | 🚀 Fast | Many model options |
| **Together.ai** | $25 free credits | 🚀 Fast | Quality outputs |
| **OpenCode (Grok)** | Varies | 🚀 Fast | Code generation |

**Total FREE capacity:** ~30,000+ API calls per day! 🎉

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd scripts/ai-team
pip install -r requirements.txt
```

### 2. Set Up API Keys

Copy `.env.example` to `.env` and add your API keys:

```bash
cp .env.example .env
```

**Fastest to set up:**
1. **Groq** (2 minutes): https://console.groq.com
2. **Google Gemini** (2 minutes): https://aistudio.google.com/apikey

### 3. Test Your Setup

```bash
python test_providers.py
```

### 4. Run Tasks

**Quick single task:**
```bash
python quick_task.py "Write a React component for a login form"
```

**With file context:**
```bash
python quick_task.py "Review this code for bugs" --file ../../src/App.tsx
```

**Interactive mode:**
```bash
python enhanced_orchestrator.py --interactive
```

## 📁 File Structure

```
scripts/ai-team/
├── enhanced_orchestrator.py  # Main orchestrator (v2.0)
├── quick_task.py             # Simple single-task runner
├── test_providers.py         # Test which providers are working
├── requirements.txt          # Python dependencies
├── orchestrator.py           # Legacy orchestrator (v1.0)
└── README.md                 # This file
```

## 🔧 Usage Examples

### Using Quick Task Runner

```bash
# Simple code generation
python quick_task.py "Write a TypeScript function to validate email addresses"

# Code review with file
python quick_task.py "Find bugs in this code" --file ../../src/components/Form.tsx

# With additional context
python quick_task.py "Fix this error" --context "TypeError: Cannot read property 'map' of undefined"

# Save output to file
python quick_task.py "Write unit tests" --file ../../src/utils/helpers.ts --output tests.md
```

### Using Enhanced Orchestrator (Programmatic)

```python
from enhanced_orchestrator import EnhancedOrchestrator, Task, WorkerType, TaskTemplates

# Initialize
orchestrator = EnhancedOrchestrator("/path/to/sga-qa-system")

# Add a task using template
task = TaskTemplates.create_react_component(
    component_name="LoginForm",
    description="A login form with email and password fields",
    context_files=["src/components/Button.tsx"]  # For style reference
)
orchestrator.add_task(task)

# Or create custom task
custom_task = Task(
    id="CUSTOM_001",
    title="Create API endpoint",
    description="Create a REST endpoint for user authentication",
    worker=WorkerType.GROQ_LLAMA70B,
    fallback_workers=[WorkerType.CEREBRAS_LLAMA, WorkerType.GEMINI_FLASH]
)
orchestrator.add_task(custom_task)

# Run all tasks
orchestrator.run_all_tasks(parallel=True, max_workers=3)
```

### Using Interactive Mode

```bash
$ python enhanced_orchestrator.py --interactive

ai-team> add
  Task types: component, api, review, custom
  Type: component
  Component name: UserProfile
  Description: Display user profile with avatar, name, and email
  ✓ Added task: Create React Component: UserProfile

ai-team> run
🚀 Executing 1 tasks...
[1/1] Create React Component: UserProfile
  ✓ Completed

ai-team> status
🤖 Worker Status:
  [✓] groq-llama70b: 1 requests, 2,543 tokens
  [✓] gemini-flash: 0 requests, 0 tokens
  ...

ai-team> quit
```

## 🔐 Security Features

### Data Sanitization

The orchestrator automatically protects sensitive data:

```python
# Automatically redacted:
- API keys (sk-..., AIza...)
- Email addresses
- IP addresses
- Azure tenant IDs
- SharePoint URLs
- Connection strings
- Private keys
- Passwords
```

### Reversible Redaction

Secrets are replaced with placeholders, then restored in the output:

```python
# Before sending to AI:
api_key = "<API_KEY_1>"  # Real key is stored locally

# AI generates code with placeholder:
client = OpenAI(api_key="<API_KEY_1>")

# After receiving response, placeholder is restored:
client = OpenAI(api_key="sk-real-key...")  # Only on your machine
```

## 🎯 Worker Selection

The load balancer automatically selects the best worker:

| Task Type | Preferred Workers |
|-----------|-------------------|
| **Coding** | Qwen Coder, DeepSeek, Groq |
| **Reasoning** | DeepSeek R1, QwQ, Gemini Pro |
| **Fast/Critical** | Groq 8B, Cerebras, Gemini Flash |
| **General** | Groq 70B, Cerebras, DeepSeek V3 |

## 📈 Monitoring

### Check Worker Status

```python
status = orchestrator.get_worker_status()
for worker, info in status.items():
    print(f"{worker}: {info['total_requests']} requests, {info['tokens_used']} tokens")
```

### View Execution Summary

After running tasks, a summary is saved to:
```
ai_team_output/logs/summary_YYYYMMDD_HHMMSS.json
```

## 🆘 Troubleshooting

### "No workers initialized"

```bash
# Check your API keys
python test_providers.py
```

### "Rate limit exceeded"

The orchestrator automatically handles rate limits with:
- Automatic failover to alternative workers
- Rate limit detection and backoff
- Worker availability tracking

### "Import error"

```bash
pip install -r requirements.txt
```

## 🔗 Getting API Keys

| Provider | URL | Time to Set Up |
|----------|-----|----------------|
| Groq | https://console.groq.com | 2 min |
| Google Gemini | https://aistudio.google.com/apikey | 2 min |
| Cerebras | https://cloud.cerebras.ai | 3 min |
| OpenRouter | https://openrouter.ai/keys | 2 min |
| Together.ai | https://together.ai | 3 min |

## 📝 License

Internal SGA project. Not for public distribution.
