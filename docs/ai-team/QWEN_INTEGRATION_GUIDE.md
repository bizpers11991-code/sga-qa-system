# Qwen 3 Coder Integration Guide

**Date:** November 16, 2025
**Worker #5:** Qwen 3 Coder via OpenRouter
**Status:** ✅ Integrated
**Cost:** Free tier or ~$0.50/day

---

## Overview

Qwen 3 Coder is a specialized coding model from Alibaba Cloud, integrated into the SGA QA Pack AI team as Worker #5 via OpenRouter API. This document outlines usage guidelines, security considerations, and task delegation rules.

---

## Why Qwen?

**Benefits:**
- ✅ **Cost-Effective:** Free tier available, or $0.50-1/day for heavy use (vs $5-10/day for GPT-4)
- ✅ **Coding Specialist:** Optimized for code generation, debugging, refactoring
- ✅ **Reduces Load:** Offloads repetitive coding tasks from expensive models (Claude, Gemini)
- ✅ **OpenRouter Access:** 100+ models available with one API key
- ✅ **Fast:** Quick responses for boilerplate code

**Trade-offs:**
- ⚠️ **Lower Quality:** Not as accurate as GPT-4 or Claude for complex tasks
- ⚠️ **Requires Review:** All generated code must be reviewed by Claude (me)
- ⚠️ **Limited Context:** Smaller context window than Claude/Gemini
- ⚠️ **Data Privacy:** Code sent to third-party (OpenRouter/Alibaba Cloud)

---

## Security & Privacy Guidelines

### ✅ SAFE to Send to Qwen

- Code structure and templates (empty functions, class definitions)
- Boilerplate code (TypeScript interfaces, Power Apps YAML structure)
- Test case skeletons
- Documentation formatting
- Refactoring non-sensitive code
- General programming questions (syntax, best practices)

### ❌ NEVER Send to Qwen

- **Customer Data:** Names, emails, phone numbers, addresses
- **API Keys or Credentials:** Any secrets, tokens, passwords
- **Security-Critical Code:** Authentication, encryption, authorization logic
- **Business Logic:** Proprietary algorithms, pricing formulas
- **Production Data:** Real user data, actual database records
- **Personally Identifiable Information (PII):** Any data covered by Australian Privacy Principles (APPs)

---

## Task Delegation Rules

### What Qwen CAN Do (With Claude Review)

**Code Generation:**
- TypeScript interfaces and type definitions
- Power Apps YAML structure for new screens
- Azure Function HTTP trigger templates
- Power Automate flow JSON skeletons
- Test case templates (Jest, Vitest)
- API endpoint stubs
- Data transformation functions (sanitization, validation)

**Documentation:**
- Code comments (JSDoc, TSDoc)
- README formatting
- API documentation structure
- Inline documentation

**Refactoring:**
- Extracting functions from large blocks
- Renaming variables for clarity
- Formatting and linting fixes
- Converting callbacks to async/await

### What Qwen CANNOT Do (Claude Does These)

- Architecture decisions
- Security-critical code (authentication, encryption)
- Production deployments
- API key management
- Customer data handling
- Code review and approval
- Sprint planning and coordination

---

## Integration Details

### API Configuration

**Endpoint:** `https://openrouter.ai/api/v1`
**Authentication:** Bearer token (OPENROUTER_API_KEY)
**Models Available:**
1. `qwen/qwq-32b-preview` (Best: Latest reasoning model)
2. `qwen/qwen-2.5-coder-32b-instruct` (Good: Coder-specific)
3. `qwen/qwen-2.5-72b-instruct` (Fallback: General purpose)

### Team Position

**Worker #5 of 5:**
1. **Claude Sonnet 4.5 (Me):** Project coordinator and architect
2. **Grok-code (OpenCode 1):** Primary coder, M365 implementation
3. **GPT-5 Nano (OpenCode 2):** Code validator and testing
4. **Gemini 2.5 Pro:** Architecture review and research
5. **Qwen 3 Coder (OpenRouter):** Code generation specialist ⭐ NEW

---

## Usage Examples

### Example 1: Generate TypeScript Interface

**Task:** "Create a TypeScript interface for a QA Pack submission"

**Qwen Output:**
```typescript
interface QAPackSubmission {
  id: string;
  jobId: string;
  foremanId: string;
  submissionDate: Date;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  asphaltTests: AsphaltTest[];
  straightEdgeTests: StraightEdgeTest[];
  photos: Photo[];
  signature: Signature;
}
```

**Claude Review:** ✅ Approved (good structure, standard TypeScript patterns)

---

### Example 2: Power Apps YAML Template

**Task:** "Create YAML structure for a new settings screen"

**Qwen Output:**
```yaml
SettingsScreen As screen:
  Fill: =RGBA(255, 255, 255, 1)

  HeaderContainer As container:
    Fill: =Color.SGAOrange
    Height: =100

    HeaderTitle As label:
      Text: ="Settings"
      Color: =RGBA(255, 255, 255, 1)
      Font: =Font.Bold
      Size: =24
```

**Claude Review:** ✅ Approved (matches existing screen patterns)

---

## Cost Management

### Free Tier Limits (OpenRouter)

- **Credits:** $0 (free)
- **Daily Limit:** Varies by model (~100 requests/day)
- **Rate Limit:** 10 requests/minute

### Paid Tier Costs

| Model | Cost per 1M tokens |
|-------|-------------------|
| qwen/qwq-32b-preview | $0.50 input, $1.50 output |
| qwen/qwen-2.5-coder-32b-instruct | $0.30 input, $0.90 output |
| qwen/qwen-2.5-72b-instruct | $0.80 input, $2.40 output |

**Estimated Usage:**
- **Light:** 10 tasks/day = ~$0.10/day = $3/month
- **Medium:** 50 tasks/day = ~$0.50/day = $15/month
- **Heavy:** 200 tasks/day = ~$2/day = $60/month

**Still cheaper than:**
- GPT-4: $10-30/day
- Claude Pro: $20/month subscription
- Copilot Studio: $200/month license

---

## Setup Instructions

### 1. Get OpenRouter API Key

1. Go to: https://openrouter.ai/
2. Sign in with Google or GitHub
3. Navigate to **API Keys**
4. Click **Create Key**
5. Name: `SGA QA Pack - Qwen Worker`
6. Credits: Start with $0 (free tier) or add $5 for testing
7. **Copy the key** (starts with `sk-or-v1-...`)

### 2. Add to .env File

```bash
# OPENROUTER API (Worker #5 - Qwen 3 Coder)
OPENROUTER_API_KEY=sk-or-v1-YOUR_KEY_HERE
```

### 3. Test the Integration

```bash
cd /Users/dhruvmann/sga-qa-pack
python scripts/ai-team/test_apis.py
```

Look for:
```
6️⃣ Testing OpenRouter API (Qwen 3 Coder)...
------------------------------------------------------------
Trying qwen/qwq-32b-preview...
✓ qwen/qwq-32b-preview works!
  Response: Ready for coding tasks...
```

### 4. Run AI Team with Qwen

```bash
python scripts/ai-team/run_team_multi.py
```

You should see:
```
✓ Qwen-3-Coder (Code Generation Specialist) initialized
✅ Total Workers Active: 5
```

---

## Monitoring and Maintenance

### Monitor Usage

**OpenRouter Dashboard:** https://openrouter.ai/activity

Track:
- Daily requests
- Token usage
- Costs
- Error rates

### Set Budget Alerts

1. Go to OpenRouter → Settings → Billing
2. Set **Monthly Limit:** $10 (or your preferred limit)
3. Enable **Email Alerts** at 50%, 80%, 100%

### Review Generated Code

**All Qwen-generated code MUST be reviewed by Claude before committing.**

Review checklist:
- ✅ Code compiles and passes linting
- ✅ No security vulnerabilities
- ✅ Matches existing code style
- ✅ No hardcoded credentials
- ✅ Appropriate error handling
- ✅ Documented with comments

---

## Troubleshooting

### Issue 1: "Rate limit exceeded"

**Solution:**
- Wait 1 minute and retry
- Reduce task frequency
- Upgrade to paid tier if needed

### Issue 2: "Invalid API key"

**Solution:**
- Check `.env` file has correct key
- Verify key starts with `sk-or-v1-`
- Generate new key if needed

### Issue 3: "Model not available"

**Solution:**
- Try fallback model (qwen-2.5-coder-32b-instruct)
- Check OpenRouter status page
- Verify sufficient credits

### Issue 4: Poor code quality

**Solution:**
- This is expected! Qwen is for boilerplate only
- Use Claude/Gemini for complex logic
- Always review and refactor Qwen output

---

## Compliance and Legal

### Data Residency

- ⚠️ **OpenRouter:** US-based (data may leave Australia)
- ⚠️ **Alibaba Cloud:** China-based parent company
- ✅ **Mitigation:** Only send non-sensitive code templates

### Australian Privacy Principles (APPs)

**Compliance:**
- ✅ APP 1: Open and transparent (disclosed in this doc)
- ✅ APP 8: Cross-border disclosure (no customer PII sent)
- ✅ APP 11: Security (TLS encryption, no sensitive data)

**Non-Compliance Risks:**
- ❌ Sending customer PII to OpenRouter violates APP 8
- ❌ Sending production data without consent violates APP 3

**Mitigation:** **NEVER** send customer data to Qwen!

### Commercial Use License

**Qwen 3 License:** Apache 2.0 (allows commercial use)
**OpenRouter Terms:** Free tier for development, paid tier for production

---

## Future Enhancements

### Phase 2 (Optional)

1. **Local Qwen Deployment:** Run Qwen locally to avoid data leaving Australia
2. **Fine-Tuning:** Train Qwen on SGA-specific code patterns
3. **Automated Code Review:** Qwen validates code before sending to Claude
4. **Performance Monitoring:** Track accuracy and cost per task

---

## Summary

**Qwen 3 Coder is a valuable addition to the AI team for:**
- ✅ Boilerplate code generation
- ✅ Code refactoring and formatting
- ✅ Documentation creation
- ✅ Cost reduction (90% cheaper than GPT-4)

**But it requires:**
- ⚠️ **Claude review** for all output
- ⚠️ **No sensitive data** sent to Qwen
- ⚠️ **Monitoring** of costs and quality

**When used correctly, Qwen can reduce development time by 20-30% while keeping costs under $15/month.**

---

## Support

**Questions?** Ask Claude (me) - I coordinate all AI team tasks.

**Issues?**
- Check OpenRouter status: https://status.openrouter.ai/
- Review logs in `ai_team_output/worker_logs/`
- Test connection: `python scripts/ai-team/test_apis.py`

---

**Last Updated:** November 16, 2025
**Version:** 1.0
**Maintained By:** Claude (AI Team Coordinator)
