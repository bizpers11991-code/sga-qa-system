# 🤖 Multi-AI Team Setup Guide
**Run 4+ AI Workers Simultaneously - 24/7 Development**

---

## 🎯 Overview

You're setting up a **multi-AI team** that works 24/7 on your M365 application:

1. **Grok-1** (opencode.ai Account 1) - Primary coder, fast implementation
2. **Grok-2 / GPT-5 Nano** (opencode.ai Account 2) - Alternative coder, testing
3. **Gemini Pro** (Paid) - Architecture, review, validation
4. **Office 365 Copilot** (Monday) - M365 expert, best practices

---

## ✅ Prerequisites

### API Keys You'll Need:

#### 1. Paid Gemini Pro (Recommended)
- **URL:** https://aistudio.google.com/apikey
- **Why:** Better architecture and review capabilities
- **Cost:** Check Google AI pricing (very affordable)

#### 2. opencode.ai Account 1 (Required)
- **URL:** https://opencode.ai/auth
- **Why:** Primary coder (Grok Code Fast 1)
- **Cost:** **100% FREE!**

#### 3. opencode.ai Account 2 (Recommended)
- **URL:** https://opencode.ai/auth (Create 2nd account with different email)
- **Why:** Alternative coder, parallel development
- **Options:**
  - Use Grok Code Fast 1 (FREE)
  - Use GPT-5 Nano if you have access
- **Cost:** **100% FREE!**

---

## 🚀 Step-by-Step Setup

### Step 1: Get All API Keys (15-20 minutes)

#### A. Gemini Pro (Paid Account)
```
1. Go to: https://aistudio.google.com/apikey
2. Sign in with your Google account
3. Upgrade to paid tier (if not already)
4. Create API Key
5. Copy key (starts with AIzaSy...)
6. Save securely!
```

#### B. opencode.ai Account 1
```
1. Go to: https://opencode.ai
2. Create account (email 1 + password)
3. Go to: https://opencode.ai/auth
4. Add billing (free tier available)
5. Create API Key
6. Copy key (starts with sk-...)
7. Label it: "opencode.ai Account 1"
```

#### C. opencode.ai Account 2
```
1. Use a DIFFERENT email address
2. Go to: https://opencode.ai
3. Create 2nd account (email 2 + password)
4. Go to: https://opencode.ai/auth
5. Add billing (free tier available)
6. Create API Key
7. Copy key (starts with sk-...)
8. Label it: "opencode.ai Account 2"
```

**Pro Tip:** Use Gmail aliases! If your email is `you@gmail.com`, you can use:
- Account 1: `you+opencode1@gmail.com`
- Account 2: `you+opencode2@gmail.com`

Both will deliver to the same inbox!

---

### Step 2: Configure Your Environment (5 minutes)

#### Option A: Edit .env File (Recommended)

```bash
cd /Users/dhruvmann/sga-qa-pack

# Create .env from example
cp .env.example .env

# Edit the file
nano .env
```

Add your actual keys:
```bash
# Paid Gemini
GOOGLE_API_KEY=AIzaSy...your_actual_paid_gemini_key

# opencode.ai Account 1
OPENCODE_API_KEY_1=sk-...your_first_opencode_key

# opencode.ai Account 2
OPENCODE_API_KEY_2=sk-...your_second_opencode_key
```

Save: `Ctrl+O`, `Enter`, `Ctrl+X`

#### Option B: Export Variables (Temporary)

```bash
export GOOGLE_API_KEY='AIzaSy...your_paid_gemini_key'
export OPENCODE_API_KEY_1='sk-...your_first_opencode_key'
export OPENCODE_API_KEY_2='sk-...your_second_opencode_key'
```

---

### Step 3: Run the Multi-AI Team (2 minutes)

```bash
# Navigate to project
cd /Users/dhruvmann/sga-qa-pack

# Activate virtual environment
source venv/bin/activate

# Run the ENHANCED multi-AI script
python run_team_multi.py
```

---

## 📊 What You'll See

```
🤖 SGA QA Pack - ENHANCED Multi-AI Team Collaboration
============================================================
24/7 Autonomous Development Mode
============================================================

🔑 Checking API Keys...
  ✓ Gemini API key found
  ✓ opencode.ai Account 1 key found
  ✓ opencode.ai Account 2 key found

🚀 Initializing AI Workers...
  ✓ Grok-1 (Primary Coder) initialized
  ✓ Grok-2 (Alternative Coder) initialized
  ✓ Gemini-Pro (Architect & Code Reviewer) initialized

✅ Total Workers Active: 3

============================================================
👥 AI TEAM ROSTER:
============================================================
1. Grok-1
   Role: Primary Coder (Fast Implementation)
   Model: x-ai/grok-code-fast-1

2. Grok-2
   Role: Alternative Coder (Testing & Verification)
   Model: x-ai/grok-code-fast-1

3. Gemini-Pro
   Role: Architect & Code Reviewer
   Model: gemini-2.5-pro-exp-03-25
============================================================

🧪 Testing AI Worker Connections...

✓ Grok-1: Ready to code! Let's build the SGA QA Pack...
✓ Grok-2: I'm ready for testing and verification...
✓ Gemini-Pro: Ready for architecture and code review...

✅ 3 workers ready for 24/7 operation!

============================================================
✅ AI TEAM IS READY FOR 24/7 AUTONOMOUS WORK!
============================================================
```

---

## 🎯 How the Team Works

### Division of Labor:

**Grok-1 (Primary Coder):**
- Reads `instructions.md`
- Implements Sprint 1 tasks
- Writes code for Azure Functions, Power Apps, Power Automate
- Fast implementation focus

**Grok-2 (Alternative Coder):**
- Validates Grok-1's code
- Implements alternative solutions
- Runs tests and verifications
- Catches bugs early

**Gemini Pro (Architect):**
- Reviews all code changes
- Validates architecture decisions
- Ensures M365 best practices
- Final quality check before your review

**You (Claude via user):**
- Provide strategic direction
- Approve major changes
- Guide architectural decisions
- Final sign-off

**Copilot (Monday):**
- M365-specific expertise
- Power Platform best practices
- Integration guidance
- Dataverse optimization

---

## 📁 Output Structure

All work is saved to:

```
ai_team_output/
├── session_logs/          # JSON logs of each session
│   └── session_20251115_143022.json
├── code_changes/          # Code written by Grok-1 & Grok-2
│   ├── grok1_sprint1_task1.ts
│   └── grok2_test_validation.ts
├── review_reports/        # Reviews by Gemini
│   └── gemini_code_review_20251115.md
└── worker_logs/           # Individual AI activity logs
    ├── grok1_activity.log
    ├── grok2_activity.log
    └── gemini_activity.log
```

---

## 💰 Cost Breakdown

| Worker | Cost | Usage |
|--------|------|-------|
| Grok-1 (opencode.ai 1) | **FREE** | Unlimited |
| Grok-2 (opencode.ai 2) | **FREE** | Unlimited |
| Gemini Pro (Paid) | ~$7-10/month | Based on usage |
| Copilot (M365 Premium) | **INCLUDED** | In your subscription |

**Total Estimated Cost:** $7-10/month for 24/7 AI development team!

---

## 🔄 Switching Between Single and Multi-AI Mode

### Single AI Mode (Original):
```bash
python run_team.py
```
Uses: 1 Grok + 1 Gemini

### Multi-AI Mode (Enhanced):
```bash
python run_team_multi.py
```
Uses: 2 Groks + 1 Gemini (+ future Copilot)

**Recommendation:** Use Multi-AI mode for 24/7 operation

---

## 🐛 Troubleshooting

### Issue: "Not all workers initialized"
**Solution:** Check which API keys are missing
```bash
echo $GOOGLE_API_KEY
echo $OPENCODE_API_KEY_1
echo $OPENCODE_API_KEY_2
```

### Issue: "Worker test failed"
**For Gemini:**
- Verify paid account is active
- Check quota at https://aistudio.google.com

**For opencode.ai:**
- Ensure both accounts are created
- Verify free tier or credits are active
- Check https://opencode.ai/dashboard

### Issue: "Can I use GPT-5 Nano?"
Yes! Update line 85 in `run_team_multi.py`:
```python
model="gpt-5-nano"  # if you have access
```

---

## ⚙️ Advanced Configuration

### Customize Worker Models:

Edit `run_team_multi.py`:

```python
# Line 85: Change Grok-2 model
worker2 = AIWorker(
    name="GPT-5-Nano",  # Rename if using different model
    role="Alternative Coder",
    client=grok2_client,
    model="gpt-5-nano"  # or "x-ai/grok-code-fast-1"
)

# Line 101: Change Gemini model
gemini_model = genai.GenerativeModel('gemini-2.5-pro-exp-03-25')
# Options: 'gemini-2.5-pro-exp-03-25', 'gemini-1.5-pro', 'gemini-1.5-flash'
```

---

## 🎯 Recommended Workflow

### Daily Routine:

**Morning:**
```bash
cd /Users/dhruvmann/sga-qa-pack
source venv/bin/activate
python run_team_multi.py
```

**Check progress:**
```bash
# View latest session
cat ai_team_output/session_logs/session_*.json | tail -50

# See what Grok-1 implemented
ls -la ai_team_output/code_changes/

# Read Gemini's review
cat ai_team_output/review_reports/*.md
```

**Evening:**
- Review the day's work in `ai_team_output/`
- Provide feedback in `instructions.md` if needed
- Team continues working 24/7!

---

## 🔜 Adding Copilot on Monday

When you add Office 365 Copilot:

1. Follow `COPILOT_INTEGRATION_GUIDE.md`
2. Create "SGA QA Assistant" in Copilot Studio
3. The team will automatically recognize Copilot as Worker #4
4. Full 4-AI collaboration begins!

---

## ✅ Final Checklist

- [ ] Got paid Gemini API key
- [ ] Created opencode.ai Account 1 (got API key)
- [ ] Created opencode.ai Account 2 (got API key)
- [ ] Set all 3 API keys in `.env` file
- [ ] Ran `python run_team_multi.py` successfully
- [ ] Saw all 3 workers initialize
- [ ] Checked `ai_team_output/` directory created
- [ ] Ready for 24/7 autonomous development! 🎉

---

## 🚀 You're Ready!

Your multi-AI team is configured for 24/7 autonomous development on the SGA QA Pack M365 application!

**Next:**
- Let the team work through `instructions.md`
- Monitor progress in `ai_team_output/`
- Add Copilot on Monday for full 4-AI power!

**Questions?** Ask Claude (me) anytime! 💬

---

**Created:** November 15, 2025
**For:** 24/7 Multi-AI Development
**Status:** ✅ Ready to deploy!
