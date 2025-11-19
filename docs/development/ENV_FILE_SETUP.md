# 📝 How to Update Your .env File

**You're in nano editing .env right now? Perfect! Here's exactly what to do.**

---

## ✅ What You Should Have in Your .env File

**Copy and paste this ENTIRE block into nano:**

```bash
# =================================================================
# SGA QA Pack - Multi-AI Team API Keys
# =================================================================

# Gemini API (Google AI Studio)
# Get from: https://aistudio.google.com/apikey
GOOGLE_API_KEY=AIzaSyD...paste_your_gemini_key_here

# opencode.ai Account 1 (Primary Coder - Grok-1)
# Get from: https://opencode.ai/auth
OPENCODE_API_KEY_1=sk-...paste_your_first_opencode_key_here

# opencode.ai Account 2 (Alternative Coder - Grok-2)
# Get from: https://opencode.ai/auth (2nd account)
OPENCODE_API_KEY_2=sk-...paste_your_second_opencode_key_here

# =================================================================
# Save: Ctrl+O, then Enter, then Ctrl+X to exit
# =================================================================
```

---

## 📋 Step-by-Step in Nano

### If you're in nano right now:

**Step 1:** Clear any existing content
- Press `Ctrl+K` repeatedly to delete all lines

**Step 2:** Paste the template above
- Copy the block above
- Right-click in terminal to paste
- Or use `Ctrl+Shift+V` (Linux) or `Cmd+V` (Mac)

**Step 3:** Replace the placeholder keys with YOUR actual keys

**Before:**
```bash
GOOGLE_API_KEY=AIzaSyD...paste_your_gemini_key_here
```

**After (with YOUR key):**
```bash
GOOGLE_API_KEY=AIzaSyDp8KxJ9mN...your_actual_key_here
```

**Step 4:** Do this for all 3 keys:
- `GOOGLE_API_KEY` = Your Gemini key
- `OPENCODE_API_KEY_1` = Your first opencode.ai key
- `OPENCODE_API_KEY_2` = Your second opencode.ai key

**Step 5:** Save and exit
- Press `Ctrl+O` (WriteOut)
- Press `Enter` (confirm filename)
- Press `Ctrl+X` (eXit)

---

## ✅ Example of Completed .env File

This is what it should look like with REAL keys:

```bash
# =================================================================
# SGA QA Pack - Multi-AI Team API Keys
# =================================================================

# Gemini API (Google AI Studio)
GOOGLE_API_KEY=AIzaSyDp8KxJ9mN2qR5tU7vX3yZ1aB4cD6eF8gH

# opencode.ai Account 1 (Primary Coder - Grok-1)
OPENCODE_API_KEY_1=sk-proj-abc123def456ghi789jkl012mno345pqr678stu

# opencode.ai Account 2 (Alternative Coder - Grok-2)
OPENCODE_API_KEY_2=sk-proj-xyz987wvu654tsr321qpo098nml876kji543hgf

# =================================================================
```

**Important:** Your actual keys will be MUCH longer! That's normal.

---

## 🐛 Troubleshooting

### Problem: "Can't paste in nano"

**Solution:**
```bash
# Exit nano first (Ctrl+X)

# Create .env manually with cat
cat > .env << 'EOF'
GOOGLE_API_KEY=your_key_here
OPENCODE_API_KEY_1=your_key_here
OPENCODE_API_KEY_2=your_key_here
EOF

# Then edit it
nano .env
```

### Problem: "I only have 2 keys (no 2nd opencode.ai yet)"

**That's fine! Use:**
```bash
GOOGLE_API_KEY=your_gemini_key
OPENCODE_API_KEY_1=your_first_opencode_key
# OPENCODE_API_KEY_2=  <- Leave commented out or empty
```

The team will run with 2 workers (Grok-1 + Gemini).

### Problem: "I have keys but which line is which?"

**Easy identification:**
- `AIzaSy...` → This is Gemini (GOOGLE_API_KEY)
- `sk-...` → These are opencode.ai (OPENCODE_API_KEY_1 and _2)

---

## ✅ After Saving .env

### Verify it worked:

```bash
# Check .env exists
ls -la .env

# View it (without exposing full keys)
cat .env | head -10

# Test if keys load
source venv/bin/activate
python -c "from dotenv import load_dotenv; load_dotenv(); import os; print('✓ Gemini key found' if os.getenv('GOOGLE_API_KEY') else '✗ Missing')"
```

### Then launch your team:

```bash
python run_team_multi.py
```

---

## 🎯 Quick Reference

### Nano Commands:
- `Ctrl+K` = Delete line
- `Ctrl+O` = Save (WriteOut)
- `Enter` = Confirm
- `Ctrl+X` = Exit
- `Ctrl+V` = Next page
- `Ctrl+Y` = Previous page

### .env File Rules:
1. ✅ No spaces around `=`
2. ✅ No quotes needed around keys
3. ✅ One key per line
4. ✅ Comments start with `#`
5. ❌ Never commit to Git (.gitignore protects you)

---

## 📋 Final .env Checklist

- [ ] File is named `.env` (with the dot!)
- [ ] All 3 keys are on separate lines
- [ ] No extra spaces around `=`
- [ ] No quotes around the keys
- [ ] Keys are your ACTUAL keys (not the placeholders)
- [ ] Saved with `Ctrl+O` then `Enter`
- [ ] Exited nano with `Ctrl+X`

---

## 🚀 You're Ready!

Once your `.env` file is saved with all 3 keys, run:

```bash
source venv/bin/activate
python run_team_multi.py
```

**Your 3-AI team will launch!** 🎉

---

**Need help?** Just ask! I'm here for you. 💬
