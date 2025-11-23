# SGA QA System - Internal Notes

## Client Tier System - INTERNAL USE ONLY

**IMPORTANT:** The client tier system (Tier 1, Tier 2, Tier 3) is an **internal SGA assignment** and should **NEVER** be displayed to external clients.

### Purpose
Client tiers determine the number of pre-project site visits required:
- **Tier 1**: 3 site visits (14, 7, 3 days before project) - High-value/complex projects
- **Tier 2**: 2 site visits (7, 3 days before project) - Standard projects
- **Tier 3**: 1 site visit (3 days before project) - Simple/routine projects

### Implementation Details
- Tier assignment is done by SGA schedulers/admins during job creation
- Tier information is stored in the `Job.clientTier` field in the database
- Automatically triggers calendar events for site visits
- Sends notifications to assigned engineers for upcoming visits

### Security & Privacy
- ✅ Tier data is stored securely in Redis/Dataverse
- ✅ Only accessible by SGA employees (not clients)
- ✅ Not included in external reports or PDFs sent to clients
- ✅ Used only for internal workflow automation

### Access Control
**Who can assign/edit tiers:**
- Scheduler Admin
- Management Admin
- HSEQ Manager

**Who can view tiers:**
- All SGA engineers and admins
- NOT visible to foremen (field workers)
- NOT visible to external clients

### Best Practices
1. Always assign a tier when creating a new job
2. Review tier assignments quarterly for accuracy
3. Use Tier 1 for all new/first-time clients
4. Adjust tiers based on client history and project complexity

---

**Last Updated:** November 23, 2025
**Document Owner:** SGA Digital Team
