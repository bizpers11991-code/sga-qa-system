# Quick Start: Add GPT-5 Nano (3rd Worker)

**Status:** ✅ Configuration Complete - Ready for API Key

---

## What's Been Done

Your multi-AI team now supports **4 workers** instead of 3:

1. **Grok-1** (Primary Coder) - `grok-code`
2. **Grok-2** (Alternative Coder) - `grok-code`
3. **GPT-5 Nano** (NEW - Validator) - `gpt-5-nano` ⭐
4. **Gemini Pro** (Reviewer) - `gemini-2.5-flash`

---

## What You Need To Do

### 1. Get API Key (2 minutes)

Visit: **https://opencode.ai/auth**

- Create a 3rd OpenCode.ai account (or use existing)
- Generate API key
- Copy it

### 2. Add to .env (30 seconds)

```bash
# Open .env file
nano .env

# Add this line (paste your actual key):
OPENCODE_API_KEY_3=sk-your-key-here

# Save and exit (Ctrl+X, Y, Enter)
```

### 3. Test It (30 seconds)

```bash
# Activate virtual environment
source venv/bin/activate

# Run test
python3 test_apis.py
```

**Expected output:**
```
5️⃣ Testing opencode.ai Account 3 (GPT-5 Nano)...
------------------------------------------------------------
Sending test request to gpt-5-nano...
✓ Connection successful!
  Response: Hello...
```

### 4. Launch 4-Worker Team (instant)

```bash
python3 run_team_multi.py
```

**Expected:**
```
✅ Total Workers Active: 4

👥 AI TEAM ROSTER:
1. Grok-Code-Fast-1 (Primary Coder)
2. Grok-Code-Fast-2 (Alternative Coder)
3. GPT-5-Nano (Code Validator & Testing Agent) ← NEW!
4. Gemini-Pro (Architect & Code Reviewer)
```

---

## Files Updated

- ✅ `.env.example` - Added OPENCODE_API_KEY_3 template
- ✅ `run_team_multi.py` - Worker 3 initialization (lines 130-145)
- ✅ `test_apis.py` - Test 5 for GPT-5 Nano connection

---

## Model Verified

**Model ID:** `gpt-5-nano`
**Endpoint:** `https://opencode.ai/zen/v1`
**Status:** ✅ Confirmed available on OpenCode Zen

See full model list in: `ai_team_output/GPT5_NANO_SETUP.md`

---

## Troubleshooting

**Issue:** Model not found
**Fix:** Try `gpt-5` or `gpt-5-codex` instead (edit `run_team_multi.py` line 142)

**Issue:** Auth failed
**Fix:** Regenerate API key at https://opencode.ai/auth

---

That's it! Once you add the API key, you'll have 4 AI workers running 24/7.

**Full docs:** `ai_team_output/GPT5_NANO_SETUP.md`
