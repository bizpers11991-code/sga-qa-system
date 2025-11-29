/**
 * Knowledge Base Data
 *
 * Static knowledge base content for the SGA QA Assistant.
 * Contains specifications, procedures, and system help.
 */

import type { KnowledgeEntry } from '../../../src/types/chat.js';

/**
 * Knowledge base entries
 */
export const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  // ============================================================================
  // ASPHALT SPECIFICATIONS
  // ============================================================================
  {
    id: 'spec_ac10_temp',
    category: 'specifications',
    question: 'What is the temperature specification for AC10 asphalt?',
    answer: `**AC10 Asphalt Temperature Requirements:**

- **Minimum Placement Temperature:** 125°C
- **Maximum Placement Temperature:** 165°C
- **Minimum Rolling Temperature:** 85°C
- **Compaction Window:** Complete rolling before mix cools below 85°C

**Notes:**
- Thinner lifts (<25mm) may require placement at higher end of range
- Cold weather conditions may require heated equipment
- Always verify against project-specific specifications`,
    keywords: ['ac10', 'temperature', 'placement', 'asphalt', 'spec'],
    source: 'Main Roads WA Specification 501',
  },
  {
    id: 'spec_ac14_temp',
    category: 'specifications',
    question: 'What is the temperature specification for AC14 asphalt?',
    answer: `**AC14 Asphalt Temperature Requirements:**

- **Minimum Placement Temperature:** 130°C
- **Maximum Placement Temperature:** 165°C
- **Minimum Rolling Temperature:** 90°C
- **Compaction Window:** Complete rolling before mix cools below 90°C

**Notes:**
- Standard wearing course mix
- Verify truck docket temperature on arrival
- Check surface temperature during laying
- Document any deviations in QA pack`,
    keywords: ['ac14', 'temperature', 'placement', 'asphalt', 'spec', 'wearing course'],
    source: 'Main Roads WA Specification 501',
  },
  {
    id: 'spec_ac20_temp',
    category: 'specifications',
    question: 'What is the temperature specification for AC20 asphalt?',
    answer: `**AC20 Asphalt Temperature Requirements:**

- **Minimum Placement Temperature:** 135°C
- **Maximum Placement Temperature:** 165°C
- **Minimum Rolling Temperature:** 95°C
- **Compaction Window:** Complete rolling before mix cools below 95°C

**Notes:**
- Typically used for base/binder course
- Higher placement temperature due to larger aggregate
- May require more passes for compaction
- Monitor surface cooling rate in windy conditions`,
    keywords: ['ac20', 'temperature', 'placement', 'asphalt', 'spec', 'base course', 'binder'],
    source: 'Main Roads WA Specification 501',
  },
  {
    id: 'spec_thickness',
    category: 'specifications',
    question: 'What are the layer thickness requirements for asphalt?',
    answer: `**Asphalt Layer Thickness Guidelines:**

| Mix Type | Minimum | Maximum | Typical |
|----------|---------|---------|---------|
| AC10     | 25mm    | 50mm    | 30-40mm |
| AC14     | 35mm    | 70mm    | 40-50mm |
| AC20     | 50mm    | 100mm   | 60-80mm |

**Rules of Thumb:**
- Minimum thickness = 2.5 × nominal aggregate size
- Maximum thickness = 4-5 × nominal aggregate size
- Multi-layer work: ensure adequate bond between layers

**Documentation Required:**
- Record actual thickness in QA pack
- Note any thin spots or variations
- Include survey levels where required`,
    keywords: ['thickness', 'layer', 'depth', 'ac10', 'ac14', 'ac20', 'millimeters', 'mm'],
    source: 'Austroads Guide to Pavement Technology Part 4B',
  },
  {
    id: 'spec_compaction',
    category: 'specifications',
    question: 'What are the compaction requirements for asphalt?',
    answer: `**Asphalt Compaction Requirements:**

**Target Density:**
- Minimum 95% of Marshall density (Tier 1 clients)
- Minimum 93% of Marshall density (Tier 2/3 clients)
- Specific project requirements may vary

**Roller Pattern Guidelines:**
- Static steel: 2-3 passes for breakdown
- Vibrating steel: 3-4 passes at appropriate frequency
- Pneumatic: 4-6 passes for finishing
- Overlap passes by 150-300mm

**Key Points:**
- Complete rolling while mix is workable
- Avoid over-rolling (causes aggregate crushing)
- Check for roller marks and correct
- Record roller types and pass counts`,
    keywords: ['compaction', 'density', 'roller', 'rolling', 'marshall', 'passes'],
    source: 'Main Roads WA Specification 501',
  },
  {
    id: 'spec_weather',
    category: 'specifications',
    question: 'What are the weather requirements for asphalt placement?',
    answer: `**Weather Conditions for Asphalt Work:**

**Do Not Place When:**
- Air temperature below 10°C
- Rain is falling or imminent
- Surface is wet or frozen
- Wind speed exceeds 40 km/h
- Surface temperature below 5°C

**Precautions in Marginal Conditions:**
- Increase placement temperature by 5-10°C in cold weather
- Cover loads to retain heat
- Reduce haul distances
- Use additional rollers
- Heat equipment and tools

**Documentation:**
- Record weather conditions in QA pack
- Note any work stoppages due to weather
- Document mitigation measures taken`,
    keywords: ['weather', 'rain', 'temperature', 'wind', 'cold', 'conditions', 'placement'],
    source: 'Main Roads WA Specification 501',
  },

  // ============================================================================
  // QA PROCEDURES
  // ============================================================================
  {
    id: 'proc_qa_pack_contents',
    category: 'procedures',
    question: 'What should be included in a QA pack?',
    answer: `**Standard QA Pack Contents:**

1. **SGA Daily Report**
   - Work performed summary
   - Crew members and hours
   - Materials used
   - Equipment deployed

2. **Site Record**
   - Site hazards identified
   - Visitors on site
   - Client instructions
   - Variations noted

3. **ITP Checklist (if required)**
   - Pre-placement checks
   - During placement checks
   - Post-placement checks

4. **Asphalt/Profiling Forms**
   - Docket details
   - Temperature records
   - Area/tonnes placed

5. **Site Photos**
   - Before work
   - During work
   - After completion
   - Any issues/defects

6. **Test Results (if applicable)**
   - Density tests
   - Level surveys
   - Core results`,
    keywords: ['qa pack', 'contents', 'documents', 'forms', 'itp', 'checklist', 'what', 'include'],
    source: 'SGA QA Procedures Manual',
  },
  {
    id: 'proc_qa_pack_submit',
    category: 'procedures',
    question: 'How do I submit a QA pack?',
    answer: `**Submitting a QA Pack:**

**Step 1: Navigate to Job**
- Go to Jobs → Select your job
- Or search by job number

**Step 2: Access QA Pack**
- Click on the "QA Pack" tab
- Review existing entries

**Step 3: Complete Forms**
- Fill in Daily Report section
- Complete Site Record
- Add Asphalt/Profiling data
- Complete ITP checklist (if required)

**Step 4: Add Photos**
- Upload site photos
- Add captions describing each
- Minimum: Before, During, After

**Step 5: Review**
- Check AI-generated summary
- Verify all required fields
- Check for any warnings

**Step 6: Submit**
- Click "Submit QA Pack"
- Confirm submission
- PDF will be generated automatically

**After Submission:**
- QA pack sent to engineer for review
- You'll receive notification of approval/comments
- PDF available in Documents section`,
    keywords: ['submit', 'qa pack', 'how to', 'upload', 'complete', 'send'],
    source: 'SGA QA System User Guide',
  },
  {
    id: 'proc_itp_checklist',
    category: 'procedures',
    question: 'What is an ITP checklist and when is it required?',
    answer: `**ITP (Inspection Test Plan) Checklist:**

**What is it?**
An ITP is a quality control document that lists all inspections and tests required at each stage of work.

**When Required:**
- All Tier 1 (Main Roads, City of Perth) projects
- Projects over $100,000 value
- When specified in contract documents
- Complex or critical works

**ITP Checklist Sections:**

1. **Pre-Work Checks** (Hold Point)
   - Surface preparation approved
   - Materials verified
   - Equipment calibrated
   - Weather acceptable

2. **During Work Checks** (Witness Point)
   - Placement temperatures
   - Layer thickness
   - Compaction pattern
   - Joint treatment

3. **Post-Work Checks** (Hold Point)
   - Surface quality
   - Level conformance
   - Density results
   - Clean-up complete

**Hold Points:** Work cannot proceed without sign-off
**Witness Points:** Client may observe but work can proceed`,
    keywords: ['itp', 'checklist', 'inspection', 'test', 'plan', 'hold point', 'witness'],
    source: 'SGA QA Procedures Manual',
  },
  {
    id: 'proc_ncr',
    category: 'procedures',
    question: 'What is an NCR and when should one be raised?',
    answer: `**NCR (Non-Conformance Report):**

**What is it?**
A formal document recording work that doesn't meet specifications or contract requirements.

**When to Raise NCR:**
- Material out of specification (temperature, gradation)
- Work below minimum standards (thickness, density)
- Incorrect procedures followed
- Equipment malfunction affecting quality
- Client complaint about quality

**NCR Process:**

1. **Identify** - Recognize non-conformance
2. **Stop** - Halt affected work if necessary
3. **Report** - Notify supervisor immediately
4. **Document** - Complete NCR form with details
5. **Investigate** - Determine root cause
6. **Remedy** - Propose corrective action
7. **Close** - Implement fix and verify

**NCR Contains:**
- Description of non-conformance
- Location and extent
- Root cause analysis
- Corrective action taken
- Preventive measures
- Sign-offs required

**Note:** Raising an NCR is not a failure - it's good quality management!`,
    keywords: ['ncr', 'non-conformance', 'defect', 'issue', 'raise', 'report'],
    source: 'SGA QA Procedures Manual',
  },

  // ============================================================================
  // SAFETY PROCEDURES
  // ============================================================================
  {
    id: 'safety_ppe',
    category: 'safety',
    question: 'What PPE is required for asphalt works?',
    answer: `**Required PPE for Asphalt Works:**

**Minimum Requirements:**
- Hi-vis vest or shirt (Class D/N as required)
- Safety boots (steel cap, heat resistant soles)
- Hard hat (when near plant/machinery)
- Safety glasses
- Gloves (heat resistant for working near hot mix)
- Long pants (no shorts)

**Additional PPE:**
- Hearing protection (near plant)
- Face shield (for emulsion work)
- Respiratory protection (fumes in confined spaces)
- Sun protection (sunscreen, neck shade)

**Hot Mix Specific:**
- Heat resistant gloves when handling tools
- Full-length sleeves recommended
- Stand upwind of hot mix when possible
- Never step in fresh asphalt

**Checking PPE:**
- Inspect before each shift
- Replace damaged items immediately
- Report shortages to supervisor`,
    keywords: ['ppe', 'safety', 'protective', 'equipment', 'boots', 'vest', 'hard hat', 'glasses'],
    source: 'SGA Safety Procedures',
  },
  {
    id: 'safety_traffic',
    category: 'safety',
    question: 'What are the traffic management requirements?',
    answer: `**Traffic Management Requirements:**

**Before Work:**
- Approved Traffic Management Plan (TMP)
- Trained traffic controllers on site
- All signs and devices as per TMP
- Pre-start briefing includes traffic risks

**Key Requirements:**
- Minimum 60m taper for 60km/h roads
- Signs positioned as per Australian Standards
- Delineation devices (cones/barriers) as specified
- High visibility clothing for all workers

**During Work:**
- Maintain continuous traffic control
- Regular checks of sign condition
- Adjust for changing conditions
- Record all traffic-related incidents

**Common Issues:**
- Insufficient sign coverage
- Cones too far apart
- Traffic controllers not in position
- Signs obscured or damaged

**Documentation:**
- Photo of traffic setup
- Note any traffic incidents
- Record adjustments made
- Include in QA pack`,
    keywords: ['traffic', 'management', 'tmp', 'signs', 'cones', 'controllers', 'safety'],
    source: 'Main Roads WA Traffic Management Guidelines',
  },
  {
    id: 'safety_incident',
    category: 'safety',
    question: 'How do I report a safety incident?',
    answer: `**Incident Reporting Process:**

**Immediate Actions:**
1. Ensure area is safe
2. Provide first aid if required
3. Call emergency services if needed
4. Notify supervisor immediately

**Reporting in App:**
1. Go to Incidents → Report New
2. Select incident type and severity
3. Describe what happened
4. Add photos and witness details
5. Submit for review

**Incident Types:**
- Injury (first aid, medical treatment, lost time)
- Near miss (could have caused injury)
- Property damage
- Environmental incident
- Vehicle incident

**Information Required:**
- Date, time, location
- People involved
- Description of events
- Immediate actions taken
- Root cause (if known)
- Photos/evidence

**Timeframes:**
- Report immediately to supervisor
- Enter in system within 24 hours
- Serious incidents: immediate notification to HSEQ

**Remember:** All incidents and near misses must be reported - this helps prevent future injuries!`,
    keywords: ['incident', 'report', 'safety', 'injury', 'near miss', 'accident', 'how to'],
    source: 'SGA Safety Procedures',
  },

  // ============================================================================
  // SYSTEM HELP
  // ============================================================================
  {
    id: 'help_create_job',
    category: 'system_help',
    question: 'How do I create a new job in the system?',
    answer: `**Creating a New Job:**

**Step 1: Access Job Creation**
- Go to Jobs → Create New Job
- Or click the + button on Jobs list

**Step 2: Select Project**
- Choose existing project from dropdown
- Or create standalone job

**Step 3: Enter Job Details**
- Job date (when work will be done)
- Division (Asphalt/Profiling/Spray)
- Location/address
- Work description
- Estimated quantities (area, tonnes)

**Step 4: Assign Foreman**
- Select from available foremen
- Or leave unassigned for scheduler

**Step 5: Add Specifications**
- Client tier (Tier 1, 2, or 3)
- QA requirements
- Special instructions

**Step 6: Save Job**
- Click "Create Job"
- Job number is automatically generated
- Notification sent to assigned foreman

**Tips:**
- Check scheduler availability before assigning date
- Add detailed description for field crew
- Include any client-specific requirements`,
    keywords: ['create', 'new', 'job', 'how to', 'add', 'schedule'],
    source: 'SGA QA System User Guide',
  },
  {
    id: 'help_job_status',
    category: 'system_help',
    question: 'What do the different job statuses mean?',
    answer: `**Job Status Guide:**

**Pending**
- Job created but not started
- Waiting for scheduled date
- May need assignment

**In Progress**
- Work has commenced
- Crew is on site
- Actively being worked on

**QA Pending**
- Physical work complete
- Waiting for QA pack submission
- Foreman needs to complete documentation

**Under Review**
- QA pack submitted
- Engineer reviewing documentation
- May have queries

**Completed**
- All work finished
- QA pack approved
- Ready for invoicing

**On Hold**
- Temporarily stopped
- Waiting for client/materials/weather
- Reason documented

**Cancelled**
- Job will not proceed
- Removed from schedule
- Reason documented`,
    keywords: ['status', 'pending', 'progress', 'completed', 'review', 'hold', 'cancelled'],
    source: 'SGA QA System User Guide',
  },
  {
    id: 'help_find_specs',
    category: 'system_help',
    question: 'Where can I find project specifications?',
    answer: `**Finding Project Specifications:**

**In the App:**
1. Go to Projects → Select Project
2. Click "Documents" tab
3. Look for "Specifications" folder
4. Download required documents

**Alternative Locations:**
- Job Details → Attachments section
- Resources → Specifications library
- Ask engineer for specific project specs

**Common Specification Documents:**
- Main Roads WA Spec 501 (Asphalt)
- Main Roads WA Spec 504 (Profiling)
- Project-specific amendments
- Client quality requirements

**Quick Reference:**
- Key specs are summarized in job details
- ITP references relevant spec clauses
- Chat with assistant for specific requirements

**If Specs Not Found:**
- Contact project engineer
- Check with scheduler for job specifics
- Request from client if new project`,
    keywords: ['specifications', 'specs', 'find', 'where', 'documents', 'project'],
    source: 'SGA QA System User Guide',
  },
  {
    id: 'help_password_reset',
    category: 'system_help',
    question: 'How do I reset my password?',
    answer: `**Resetting Your Password:**

This app uses Microsoft 365 login, so password management is through Microsoft.

**To Reset:**
1. Go to the login screen
2. Click "Forgot password?" or "Can't access your account?"
3. Enter your work email address
4. Follow Microsoft's verification steps
5. Create a new password

**Password Requirements:**
- Minimum 8 characters
- Mix of uppercase and lowercase
- At least one number
- At least one special character
- Not a previously used password

**If You're Locked Out:**
- Contact SGA IT support
- Or your direct supervisor
- They can request a password reset

**Security Tips:**
- Don't share your password
- Use different passwords for different systems
- Enable two-factor authentication if available`,
    keywords: ['password', 'reset', 'forgot', 'login', 'locked', 'access'],
    source: 'SGA IT Support',
  },
  {
    id: 'help_offline',
    category: 'system_help',
    question: 'Does the app work offline?',
    answer: `**Offline Functionality:**

**What Works Offline:**
- Viewing previously loaded jobs
- Viewing cached project details
- Taking photos (saved locally)
- Drafting QA pack entries
- Viewing downloaded specifications

**What Requires Internet:**
- Submitting QA packs
- Creating new jobs
- Syncing changes
- Real-time chat
- Receiving notifications

**When You're Back Online:**
- App automatically syncs
- Drafted content uploads
- Photos are attached
- Check for any sync errors

**Tips for Field Work:**
- Load job details before heading to site
- Download specs you'll need
- Draft entries offline, submit when connected
- Check sync status before leaving site

**Sync Issues:**
- Check internet connection
- Try refreshing the page
- Log out and back in if needed
- Contact support if data lost`,
    keywords: ['offline', 'internet', 'sync', 'connection', 'field', 'work'],
    source: 'SGA QA System User Guide',
  },

  // ============================================================================
  // GENERAL INFORMATION
  // ============================================================================
  {
    id: 'gen_client_tiers',
    category: 'general',
    question: 'What are the different client tiers?',
    answer: `**SGA Client Tier System:**

**Tier 1 - Premium**
- Main Roads WA
- City of Perth
- Major infrastructure clients
- **Requirements:**
  - Full ITP required
  - Density testing mandatory
  - Engineer sign-off
  - Comprehensive documentation

**Tier 2 - Standard**
- Local councils
- Commercial developers
- Mid-size contractors
- **Requirements:**
  - ITP as specified
  - Periodic testing
  - Standard QA pack
  - Client notification

**Tier 3 - Basic**
- Small private works
- Residential
- Body corporate
- **Requirements:**
  - Standard site record
  - Photo documentation
  - Basic QA pack
  - Simplified process

**Impact on Work:**
- Tier determines documentation level
- Affects QA requirements
- Influences pricing
- Sets response times`,
    keywords: ['tier', 'client', 'level', 'premium', 'standard', 'basic', 'main roads'],
    source: 'SGA Client Management Policy',
  },
  {
    id: 'gen_divisions',
    category: 'general',
    question: 'What are the different SGA divisions?',
    answer: `**SGA Divisions:**

**Asphalt Division**
- Hot mix asphalt placement
- Wearing courses
- Base/binder courses
- Patching and repairs
- Key Equipment: Pavers, rollers, trucks

**Profiling Division**
- Road profiling/milling
- Surface preparation
- Level correction
- Box-outs and patches
- Key Equipment: Profilers, sweepers

**Spray Division**
- Spray sealing
- Emulsion works
- Prime and tack coats
- Surface treatments
- Key Equipment: Spray trucks, chip spreaders

**Cross-Division Work:**
- Many projects involve multiple divisions
- Division requests coordinate work
- Project manager oversees integration
- QA requirements may differ by division`,
    keywords: ['division', 'asphalt', 'profiling', 'spray', 'department', 'team'],
    source: 'SGA Company Structure',
  },
  {
    id: 'gen_contacts',
    category: 'general',
    question: 'Who should I contact for help?',
    answer: `**SGA Support Contacts:**

**Day-to-Day Operations:**
- Your direct supervisor/foreman
- Division manager
- Scheduler for job queries

**Technical/QA Questions:**
- Division engineer
- HSEQ Manager for safety
- Use this chat assistant!

**System/IT Issues:**
- IT Support
- Report via app feedback
- Contact scheduler if urgent

**Client Issues:**
- Project manager
- Don't commit to anything on site
- Document all discussions

**Emergency:**
- Call 000 for emergencies
- Notify supervisor immediately
- Complete incident report

**After Hours:**
- Emergency contacts in Resources
- On-call manager roster
- Use SMS/phone for urgent items`,
    keywords: ['contact', 'help', 'support', 'who', 'call', 'emergency', 'assistance'],
    source: 'SGA Contact Directory',
  },
];

/**
 * Get knowledge entries by category
 */
export function getEntriesByCategory(category: KnowledgeEntry['category']): KnowledgeEntry[] {
  return KNOWLEDGE_BASE.filter(entry => entry.category === category);
}

/**
 * Get all categories with counts
 */
export function getCategoryCounts(): Record<string, number> {
  return KNOWLEDGE_BASE.reduce((acc, entry) => {
    acc[entry.category] = (acc[entry.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

export default KNOWLEDGE_BASE;
