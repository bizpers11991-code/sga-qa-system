# 💬 Chat with Gemini - PowerShell CLI Tool

Chat with Gemini directly from your PowerShell terminal!

---

## 🚀 Quick Start

### Step 1: Start the Chat

```powershell
# Navigate to project directory (if not already there)
cd C:\Dhruv\sga-qa-pack

# Run the chat tool
node chat-with-gemini.cjs
```

That's it! You'll see:
```
╔════════════════════════════════════════════════════════════════╗
║        🤖 Gemini Pro - M365 Deployment Assistant              ║
║        Chat directly with Gemini from PowerShell               ║
╚════════════════════════════════════════════════════════════════╝

📦 Loading context package for Gemini...

🤖 Gemini: Hi Dhruv! I've received the full context from Claude...

💬 You: _
```

---

## 💡 How It Works

The tool automatically:
- ✅ Loads your Gemini API key from `.env` file
- ✅ Loads `GEMINI_CONTEXT_PACKAGE.md` automatically (full context!)
- ✅ Maintains conversation history
- ✅ Provides an interactive chat interface

---

## 📝 Available Commands

While chatting, you can use these commands:

| Command | Description |
|---------|-------------|
| `help` | Show available commands |
| `clear` | Clear the screen |
| `load <filename>` | Load a file as additional context |
| `save` | Save conversation to a text file |
| `exit` or `quit` | Exit the chat |

---

## 📚 Examples

### Example 1: Basic Question
```
💬 You: How do I install Power Platform CLI?

🤖 Gemini: I can help with that! Let me give you 3 methods...
```

### Example 2: Load Additional Context
```
💬 You: load GEMINI_TAKEOVER_PLAN.md

📄 Loading GEMINI_TAKEOVER_PLAN.md...

🤖 Gemini: I've received the full takeover plan. It's very comprehensive...
```

### Example 3: Phase-by-Phase Guidance
```
💬 You: I'm ready for Phase 1. What do I need to do?

🤖 Gemini: Great! Phase 1 is Environment Setup. Here's what we'll do...
```

### Example 4: Save Conversation
```
💬 You: save

💾 Conversation saved to: gemini-chat-2025-11-17T10-30-45.txt
```

---

## 🔧 Troubleshooting

### Issue: "GOOGLE_API_KEY not found"

**Fix:**
```powershell
# Check if .env file exists
Test-Path .env

# If false, copy the template
Copy-Item .env.example .env

# Open and add your Gemini API key
notepad .env

# Add this line with your actual key:
# GOOGLE_API_KEY=AIzaSy...your_actual_key_here
```

### Issue: "Cannot find module '@google/genai'"

**Fix:**
```powershell
# Install dependencies
npm install @google/genai dotenv --save

# Then try again
node chat-with-gemini.cjs
```

### Issue: Chat is slow or timing out

**Cause:** Large context or slow internet

**Fix:**
- Wait a bit longer (first message can take 10-20 seconds with full context)
- Try shorter messages
- Check your internet connection

---

## 💻 What Makes This Different?

**vs. Gemini Web UI:**
- ✅ No browser needed - work directly in PowerShell
- ✅ Context auto-loaded every time
- ✅ Can load files directly with `load` command
- ✅ Save conversations locally
- ✅ Integrates with your workflow

**vs. Claude Code:**
- Claude Code uses Claude (Anthropic), this uses Gemini (Google)
- Helps conserve your Claude usage for high-priority tasks
- Gemini excels at planning and architecture guidance

---

## 🎯 Best Practices

1. **Start with context loaded** - The tool does this automatically!

2. **Be specific** - Instead of "help me deploy", say:
   ```
   I need to install Power Platform CLI. The dotnet tool method failed.
   Can you guide me through the MSI installer method?
   ```

3. **Ask for PowerShell commands** - Gemini knows you prefer PowerShell:
   ```
   Can you give me the exact PowerShell commands to create the
   Power Platform environment?
   ```

4. **Load files as needed** - For detailed sections:
   ```
   load GEMINI_TAKEOVER_PLAN.md
   ```

5. **Save important conversations**:
   ```
   save
   ```

6. **One phase at a time** - Don't rush:
   ```
   I've completed Phase 1. Before moving to Phase 2, can you verify
   I have everything ready?
   ```

---

## 🚀 Typical Workflow

```powershell
# 1. Start chat
node chat-with-gemini.cjs

# 2. Gemini greets with context loaded

# 3. You ask for help
💬 You: Let's start with fixing Power Platform CLI

# 4. Gemini provides step-by-step guidance
🤖 Gemini: Here are 3 methods...

# 5. You execute commands in another PowerShell window
# (Keep this chat open for guidance)

# 6. Report back results
💬 You: Method 1 worked! pac --version shows 1.35.6

# 7. Continue to next task
💬 You: What's next?

# 8. Save conversation when done
💬 You: save
💬 You: exit
```

---

## 📋 Quick Reference

**Start chat:**
```powershell
node chat-with-gemini.cjs
```

**With full logging (for debugging):**
```powershell
$env:DEBUG="*"
node chat-with-gemini.cjs
```

**Exit chat:**
- Type `exit` or `quit`
- Press `Ctrl+C`

---

## 🎓 Tips from Claude

1. **Keep both tools open** - Chat with Gemini in one PowerShell window, execute commands in another
2. **Copy-paste PowerShell commands** - Gemini will give you ready-to-run commands
3. **Ask for explanations** - "Why do I need to do this?"
4. **Report errors** - Paste error messages to Gemini for troubleshooting
5. **Celebrate wins** - Tell Gemini when things work! 🎉

---

## 🆘 Need Help?

- **For deployment questions:** Ask Gemini in the chat
- **If chat tool crashes:** Check the error and restart with `node chat-with-gemini.cjs`
- **For complex issues:** Load additional context files with `load` command
- **To save progress:** Use `save` command regularly

---

**Happy chatting with Gemini! 🚀**

*Your deployment assistant is just one command away: `node chat-with-gemini.cjs`*
