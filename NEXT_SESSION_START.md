# 🚀 NEXT SESSION QUICK START
## SGA QA Pack - November 28, 2025

---

## ✅ WHAT'S READY

### AI Team (8 Workers Available)
| Provider | Status | Speed |
|----------|--------|-------|
| Groq | ⏳ Add key to `.env` | ⚡ Fastest |
| Cerebras | ⏳ Add key to `.env` | ⚡ Very Fast |
| Gemini (paid) | ✅ Active | 🚀 Fast |
| Gemini (free) | ⏳ Add second key | 🚀 Fast |
| OpenRouter x2 | ✅ Active | 🚀 Fast |
| OpenCode x2 | ✅ Active | 🚀 Fast |

### Add Your New Keys to `.env`
```
GROQ_API_KEY=your_groq_key_here
CEREBRAS_API_KEY=your_cerebras_key_here
GOOGLE_API_KEY_2=your_second_gemini_key_here
```

---

## 🎯 PRIORITY TASKS

### 1. Test AI Team
```powershell
cd C:\Dhruv\sga-qa-system\scripts\ai-team
python test_providers.py
```

### 2. Complete Phase 2 UI
- **PM_UI_003**: Scope Report UI (9 files)
- **PM_UI_004**: Division Request UI (7 files)

Use the orchestrator:
```powershell
python enhanced_orchestrator.py --interactive
```

### 3. Update Routes & Navigation
After generating UI, update:
- `src/routing/routes.tsx`
- `src/components/layout/Sidebar.tsx`

---

## 📖 FULL INSTRUCTIONS

Read: `CLAUDE_MASTER_INSTRUCTIONS.md`

---

## 🏗️ ARCHITECTURE DECISIONS (CONFIRMED)

| Decision | Choice |
|----------|--------|
| Data Storage | SharePoint (no Dataverse) |
| Simple Automation | Power Automate |
| Complex Logic | Code (TypeScript) |
| Production AI | Custom M365 Copilot Agent |
| Development AI | AI Team (Groq, Gemini, etc.) |
| Frontend | Vercel PWA (current stack) |

---

## 🔗 QUICK LINKS

- **Groq Console**: https://console.groq.com
- **Cerebras Cloud**: https://cloud.cerebras.ai
- **Google AI Studio**: https://aistudio.google.com/apikey
- **M365 Copilot**: https://m365.cloud.microsoft/
- **SharePoint**: https://sgagroupcomau.sharepoint.com/sites/SGAQualityAssurance

---

**Start here → Run `test_providers.py` → Then read `CLAUDE_MASTER_INSTRUCTIONS.md`**
