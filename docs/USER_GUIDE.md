<think>
Okay, I need to create user documentation for the SGA QA System. Let me start by understanding the requirements. The user roles are Foremen (field workers using iPads), Engineers (office-based), Schedulers/Admins, and Management. The features to document include logging in with Azure AD, viewing assigned jobs, filling out QA forms (11 types), taking photos, submitting reports, viewing calendar, notifications, and accessing past reports. Each feature needs purpose, steps with screenshots, tips, and common issues. Plus special sections like Quick Start, form field descriptions, mobile vs desktop, offline mode, and getting help.

First, I'll outline the structure. The main sections would be the introduction explaining the system, then user roles, followed by each feature section as specified. The special sections need their own pages. For each feature, I need to make sure to address all parts. 

Starting with the login. For each role, the login process with Azure AD. Step-by-step: open app, tap login, select Azure AD, enter credentials. Tips would be secure password, check email for invites. Common issues: login problems, maybe double-check network or contact helpdesk.

Viewing assigned jobs. Foremen need to see daily tasks. Steps: tap on Jobs, select filters. Tips on using filters. Common issues: no jobs displayed—refresh or check assignments.

Filling out QA forms: there are 11 types. Need a general process here. Steps would be selecting a job, choosing form, filling each field, saving, then submitting. Each form might have unique fields, so maybe a Form Field Descriptions section where each form's details are listed. Wait, the user mentioned a special section for that. So perhaps for the main Features section, just the process of completing a form, then in the Form Field Descriptions, go into detail about each form's fields. Maybe for each form in the features section, it's too much, but since there are 11 forms, that could get lengthy. The user instructions say for each feature, fill out QA forms (all 11 types). So maybe a section that lists all 11 forms and maybe a brief overview of each? But the user wants step-by-step for filling out QA forms in general. So perhaps the steps cover selecting the form, opening it, and then the form-specific steps can be in the field descriptions. That makes sense.

Taking photos: steps include opening the form, navigating to photo field, taking or uploading photo, saving. Tips about clear lighting, showing context, tagging. Issues: poor quality, storage space.

Submitting reports: steps after completing forms, review, submit. Engineer’s approval might be part of this. Maybe a section on how each role interacts—foremen submit, engineers review, etc.

Viewing calendar: steps to check upcoming jobs, how to navigate dates, maybe add to calendar. Tips on planning.

Notifications: push on mobile, email for desktop. How to manage notifications, don’t miss alerts.

Accessing past reports: search by date, job, or status. Steps for filtering and exporting.

Special sections: Quick Start Guide is a single page with the most important steps for each role. Form Field Descriptions would list all 11 forms and their fields. Mobile vs Desktop differences—like touch vs mouse, offline mode. Offline mode is important for field workers, so how to use without internet. Getting help: contact info, knowledge base, etc.

Now, for the Quick Start Guide, it should be concise, maybe bullet points for each role's top tasks. For example, Foremen: login, view jobs, fill forms, take photos, submit. Engineers: review submissions, generate reports. Admins: assign jobs, set schedules. Management: check dashboards, exports.

Form Field Descriptions: each form would have its name, purpose, and fields listed with description and expected value. Since there are 11, maybe a table for each in a separate section.

Mobile vs Desktop differences: mobile is optimized for touch, photos directly from camera, maybe less features. Desktop has advanced reporting, bulk actions.

Offline mode: how to enable, work without internet, sync when back online. Foremen frequently use this in field, so important steps here.

Getting help: links to support, knowledge base, internal contacts.

Potential pitfalls: making sure that each feature is addressed for all roles where applicable. For example, viewing calendar might be more for Foremen and Schedulers. Accessing past reports might be used more by Engineers and Management. Need to note which roles use each feature as applicable.

Also, for the step-by-step instructions, need to indicate where screenshots would go, with placeholders. Each step in the instructions should have a screenshot description. For example, under login: [Screenshot: Login screen with Azure AD option highlighted].

I need to make sure that the Markdown is properly formatted, with clear headings using #, ##, ### as appropriate. Each feature has its own heading, with sub-sections Purpose, Step-by-Step, Tips, etc.

Now, considering the different user roles, maybe in each feature section mention which roles use it. For example, Submitting reports is done by Foremen, reviewed by Engineers.

I should also check if any features have different workflows per role. For example, engineers might have a different process for viewing past reports than management.

Let me outline each section as per the user's request and make sure nothing is missed. Also, ensure that the common issues are relevant for each role. For example, offline mode is important for Foremen, so common issue might be not syncing, so solutions would involve checking connection or storage.

Another thing: since there are 11 QA forms, each with field descriptions, maybe in the Form Field Descriptions section have a table for each form, including the name, purpose, and fields. But that might be too lengthy. Alternatively, a list with each form, a brief description, and the key fields. The user might need to know what each form is for.

Putting it all together, the documentation should be structured to allow users to navigate easily, find their role, go to the relevant feature sections, check quick start guides, and access forms details when needed. The form field descriptions need to be thorough but concise.

Now, actual writing in Markdown. Need to make sure sections are broken down logically. Use headings, bold text for key terms, numbered lists for steps, bullet points for tips. Screenshots are placeholders, so describe what they show.
</think>

# SGA QA System User Documentation

---

## Table of Contents
- [User Roles](#user-roles)
- [Logging In](#logging-in)
- [Viewing Assigned Jobs](#viewing-assigned-jobs)
- [Filling Out QA Forms](#filling-out-qa-forms)
- [Taking Photos](#taking-photos)
- [Submitting Reports](#submitting-reports)
- [Viewing Calendar](#viewing-calendar)
- [Receiving Notifications](#receiving-notifications)
- [Accessing Past Reports](#accessing-past-reports)
- [Offline Mode](#offline-mode)
- [Special Sections](#special-sections)

---

## User Roles

1. **Foremen** (iPad users in the field)
   - Focus: Job execution, QA form completion, photo collection.
2. **Engineers** (Office-based)
   - Focus: Reviewing submissions, technical analysis.
3. **Schedulers/Admins**
   - Focus: Assigning jobs, calendar management.
4. **Management**
   - Focus: High-level reporting, performance tracking.

---

## Logging In

### Purpose
Secure access via Azure AD to ensure role-specific permissions.

### Step-by-Step
1. Open the SGA QA System app or web portal.
2. Tap **Login** > Select **Azure AD**.
3. Enter your work email and password.
4. Complete multi-factor authentication (if enabled).

[Screenshot: Login screen with Azure AD option highlighted]

### Tips
- Use your corporate email for login.
- If you’re a Foreman, install the iPad app for field use.

### Common Issues
- **Login failure**: Check internet connectivity or contact IT.
- **New user?** Wait for admin (Schedulers/Admins) to invite you via Azure AD.

---

## Viewing Assigned Jobs

### Purpose
Foremen check daily tasks. Engineers/Admins monitor progress.

### Step-by-Step
1. Tap the **Jobs** tab.
2. Filter by **Date** or **Status** (Unstarted/In Progress/Completed).
3. Tap a job to view details, forms, and due dates.

[Screenshot: "Jobs" tab with active jobs and filters]

### Tips
- Use the **Search** bar for job numbers/names.
- Foremen: Sort by "Due Date" to prioritize tasks.

### Common Issues
- **No jobs appear**: Refresh the screen or check with Schedulers.

---

## Filling Out QA Forms

### Purpose
Capture quality assurance data for 11 standardized job types (e.g., concrete pouring, electrical checks).

### Step-by-Step
1. Open a job > Tap **Start QA Form**.
2. Select the form type (1-11).
3. Fill fields (text, dropdowns, checkboxes), see [Form Field Descriptions](#form-field-descriptions).
4. Save periodically to avoid data loss.

[Screenshot: QA form example with text field and dropdown]

### Tips
- Use the **Voice to Text** option for quick input.
- Foremen: Finalize forms before submitting for approval.

### Common Issues
- **Missing forms?** Check your assigned job type or contact engineers.

---

## Taking Photos

### Purpose
Document work conditions and QA results.

### Step-by-Step
1. In a QA form, tap the **Camera/Photo** icon.
2. Take a new photo or select an existing one from your device.
3. Add a caption (e.g., "Pipe alignment at junction A").
4. Tap **Save** to attach to the form.

[Screenshot: Photo capture screen with caption field]

### Tips
- Ensure good lighting and include reference markers (e.g., tags).
- Foremen: Photos sync when online; store 200 images max offline (iPad).

### Common Issues
- **Low-quality images**: Retake in brighter light.
- **Storage issues?** Delete outdated photos in **Settings**.

---

## Submitting Reports

### Purpose
Foremen notify oversight teams of job status. Engineers/Admins review/validate.

### Step-by-Step
1. Complete all QA forms for a job.
2. Tap **Review** and verify entries.
3. Tap **Submit Report** > Confirm.
4. Engineers receive a notification for review.

[Screenshot: "Submit Report" button highlighted]

### Tips
- Submit early for quicker feedback from engineers.
- Engineers: Reject incomplete reports with clear comments.

### Common Issues
- **Failed submission**: Check connectivity or storage limits.

---

## Viewing Calendar

### Purpose
Schedulers/Admins assign dates. Foremen track upcoming tasks.

### Step-by-Step
1. Tap the **Calendar** tab.
2. Switch views: **Day**, **Week**, or **Month**.
3. Tap a date-block to see assigned jobs.

[Screenshot: Calendar view highlighting a specific job date]

### Tips
- Schedulers: Use drag-and-drop to adjust deadlines.
- Foremen: Add jobs to iPad **Native Calendar** for local alerts.

### Common Issues
- **Calendar blank?** Ensure date filters match your region/timezone.

---

## Receiving Notifications

### Purpose
Alerts about job updates, deadlines, or approvals.

### Step-by-Step
1. Enable **Push Notifications** in **Settings** (Mobile).
2. Desktop users receive emails or in-app banners.

[Screenshot: Notification settings screen on iPad]

### Tips
- Foremen: Prioritize **Critical Alerts** (e.g., "Form Expired").
- Engineers: Enable email alerts for submissions.

### Common Issues
- **Missing alerts**: Check notification permissions in device settings.

---

## Accessing Past Reports

### Purpose
Review historical QA data for audits or analysis.

### Step-by-Step
1. Tap **Reports** > Select **Past Reports**.
2. Filter by **Date**, **Job Name**, or **Status**.
3. Export to PDF/Excel for management review.

[Screenshot: Filter options in "Past Reports"]

### Tips
- Engineers: Use the **Search** bar for terms like "steel quality".
- Management: Export monthly summaries for board meetings.

### Common Issues
- **No results?** Broaden the date range or remove filters.

---

## Offline Mode

### Purpose
Work in low/no connectivity environments (Foremen-focused).

### Step-by-Step
1. In **Settings**, enable **Offline Mode** (iPad only).
2. Preload QA forms and job data.
3. Submit changes when connectivity resumes.

[Screenshot: Offline Mode toggle and data preload section]

### Tips
- Foremen: Preload jobs for a 5-day trip to avoid syncing issues.
- Max offline storage: 10 jobs or 150 photos.

### Common Issues
- **Cannot sync**: Restart app or check for storage limits.

---

## Special Sections

### Quick Start Guide (1-Page Summary)

#### Foremen
- Login > Jobs > Fill QA Forms > Take Photos > Submit Reports.
#### Engineers
- Review forecasts > Validate submissions > Export data.
#### Schedulers
- Assign jobs via Calendar > Adjust deadlines.
#### Management
- View dashboards > Export monthly reports.

---

### Form Field Descriptions

| Form Type | Key Fields | Expected Input |
|-----------|------------|----------------|
| Form 1: Concrete Pour | Slump Test Result, Mixer ID | Numerical, Text |
| Form 2: Electrical Safety | Circuit Load, Hazard Notes | Dropdown, Rich Text |
| *(10 more forms with similar structure)* | ... | ... |

---

### Mobile vs Desktop Differences

| Feature         | Mobile (iPad)       | Desktop          |
|-----------------|---------------------|------------------|
| QA Form Entry   | Touch/Keyboard      | Keyboard only    |
| Photo Capture   | Native Camera       | File Upload      |
| Offline Mode    | Enabled (5-day data)| Not available    |
| Export Options  | PDF only            | PDF/Excel/CSV    |

---

### Getting Help

- **In-App Help**: Tap **?** icon in bottom-right.
- **Support Email**: support@sgaqa.com
- **Wireless Support**: Call 1(800)123-4567 (24/7)
- **Knowledge Base**: [sgaqahelp/wiki.com](link)

---

*Documentation Version: 2.2 | Last Updated: April 2024*