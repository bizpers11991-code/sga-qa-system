# 🚀 QUICK START - Run This TODAY!

**Last Updated:** November 15, 2025
**Time Required:** 15-20 minutes

---

## ✅ What's Ready For You

I've updated everything for **opencode.ai** (FREE Grok access)! Here's what's been fixed:

1. ✅ `run_team.py` - Updated for opencode.ai
2. ✅ `setup_team.sh` - Automated setup script
3. ✅ `requirements.txt` - All dependencies listed
4. ✅ `instructions.md` - Complete tasks for your AI team
5. ✅ `readme/AI_TEAM_SETUP_GUIDE.md` - Full documentation

---

## 📋 Step-by-Step: What to Do RIGHT NOW

### Step 1: Get Your API Keys (10 minutes)

#### A. Get Gemini API Key (FREE)
1. Open: https://aistudio.google.com/apikey
2. Sign in with Google account
3. Click "Get API Key" or "Create API Key"
4. Copy the key (starts with `AIzaSy...`)
5. Save it securely!

#### B. Get opencode.ai API Key (FREE - for Grok!)
1. Open: https://opencode.ai
2. Click "Sign In" or "Get Started"
3. Create account (email + password)
4. Go to: https://opencode.ai/auth
5. Add billing details if prompted (free tier is available!)
6. Click "Create API Key"
7. Copy the key (starts with `sk-...`)
8. Save it securely!

---

### Step 2: Open Terminal and Run Setup (5 minutes)

Copy and paste these commands **one at a time**:

```bash
# Navigate to your project
cd /Users/dhruvmann/sga-qa-pack

# Run the automated setup script
bash setup_team.sh
```

The script will:
- Check Python version
- Create virtual environment
- Install all packages
- Create directories
- Make a `.env` template

**Expected output:** You should see lots of ✓ checkmarks!

---

### Step 3: Set Your API Keys (2 minutes)

**Option A: Edit .env file (RECOMMENDED)**

```bash
# Open the .env file
nano .env
```

Replace the placeholder text with your actual keys:
```
GOOGLE_API_KEY=AIzaSy...paste_your_actual_gemini_key_here
OPENCODE_API_KEY=sk-...paste_your_actual_opencode_key_here
```

Save: Press `Ctrl+O`, then `Enter`, then `Ctrl+X`

**Option B: Export variables (temporary for this session)**

```bash
export GOOGLE_API_KEY='AIzaSy...your_actual_key'
export OPENCODE_API_KEY='sk-...your_actual_key'
```

---

### Step 4: Activate Environment & Test (2 minutes)

```bash
# Activate the virtual environment
source venv/bin/activate

# You should see (venv) appear in your prompt

# Test the team!
python run_team.py
```

---

## ✅ What You Should See

If everything works, you'll see:

```
🤖 SGA QA Pack AI Team Collaboration
==================================================
✓ API keys found
✓ Required packages available
✓ Gemini API configured
✓ Grok API configured (via opencode.ai)
✓ Successfully read instructions from instructions.md

👥 Setting up AI Team:
  • Grok (Developer): Fast coding and implementation
  • Gemini (Architect): Code review, planning, and validation
  • Claude (Supervisor - You): Architecture and oversight

🚀 Starting AI Team Collaboration...

🧪 Testing Gemini API connection...
✓ Gemini response: Hello! I'm ready to assist...

🧪 Testing Grok API connection (via opencode.ai)...
✓ Grok response: Ready to code! Let's build...

✅ AI Team is ready!
```

---

## 🎉 SUCCESS! Your Team is Ready

Your AI team can now:
- **Grok** - Write code quickly (via FREE opencode.ai)
- **Gemini** - Review and validate code
- **Claude (You)** - Provide architectural guidance

All output saved to: `ai_team_output/`

---

## 🐛 Troubleshooting

### Problem: "Command not found: python3"
**Solution:** Install Python from https://www.python.org/downloads/

### Problem: "API keys not set"
**Solution:**
```bash
# Check if they're set
echo $GOOGLE_API_KEY
echo $OPENCODE_API_KEY

# If empty, set them again (or edit .env file)
```

### Problem: "Missing required package"
**Solution:**
```bash
source venv/bin/activate
pip install -r requirements.txt
```

### Problem: Grok API test failed
**Solutions:**
1. Make sure you created account at https://opencode.ai
2. Get API key from https://opencode.ai/auth
3. Key should start with `sk-`
4. Check if free tier is active

---

## 📱 Next Week: Add Office 365 Copilot

Good news! Your Office 365 Premium Enterprise includes Copilot for FREE!

**Next week you'll:**
1. Access Copilot Studio: https://copilotstudio.microsoft.com
2. Create "SGA QA Assistant" copilot
3. Add it to your Power App
4. Integrate with your AI team

**See:** `COPILOT_INTEGRATION_GUIDE.md` for details

---

## 📚 Quick Reference

### Essential Commands

```bash
# Always run these when starting a new terminal session:
cd /Users/dhruvmann/sga-qa-pack
source venv/bin/activate

# Run the team:
python run_team.py

# Check logs:
ls ai_team_output/session_logs/

# View latest session:
cat ai_team_output/session_logs/session_*.json | tail -20
```

### API Key Links
- **Gemini:** https://aistudio.google.com/apikey
- **opencode.ai (Grok):** https://opencode.ai/auth

### Documentation
- **Full Setup Guide:** `readme/AI_TEAM_SETUP_GUIDE.md`
- **Team Instructions:** `instructions.md`
- **Copilot Integration:** `COPILOT_INTEGRATION_GUIDE.md`

---

## 🎯 What Happens Next?

Once your team is running:

1. **This Week (Today):**
   - Team reads `instructions.md`
   - Grok starts implementing Sprint 1 tasks
   - Gemini reviews the code
   - All changes saved to `ai_team_output/`

2. **Next Week:**
   - Add Office 365 Copilot
   - Copilot becomes the "M365 Expert" on your team
   - Full 4-AI collaboration!

---

## 💡 Pro Tips

1. **Keep terminal open** - The virtual environment stays active
2. **Check ai_team_output/** regularly - That's where all work is saved
3. **Review instructions.md** - See what tasks the team will work on
4. **Ask Claude (me) for help** - I'm here if you get stuck!

---

## ✅ Final Checklist for TODAY

- [ ] Got Gemini API key from Google
- [ ] Got opencode.ai API key
- [ ] Ran `bash setup_team.sh`
- [ ] Set API keys in `.env` or via `export`
- [ ] Activated venv: `source venv/bin/activate`
- [ ] Ran `python run_team.py` successfully
- [ ] Saw both APIs connect successfully
- [ ] Team is ready! 🎉

---

## 🚀 You're All Set!

Your Grok+Gemini AI team is ready to work on the SGA QA Pack M365 application!

**Next:** Review the tasks in `instructions.md` and let the team start working.

**Questions?** Ask Claude (me) in this terminal! 💬

---

**Created:** November 15, 2025
**For:** Running your AI team TODAY
**Status:** ✅ Ready to use!
