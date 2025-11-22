<think>
Okay, I need to create user documentation for the SGA QA System. Let me start by understanding the user's requirements. The user provided four roles: Foremen (field workers using iPads), Engineers (office-based), Schedulers/Admins, and Management. The features to document include logging in with Azure AD, viewing assigned jobs, filling out 11 QA forms, taking photos, submitting reports, viewing a calendar, receiving notifications, and accessing past reports. Additionally, there are special sections like a Quick Start Guide, form field descriptions, mobile vs desktop differences, offline mode, and getting help.

First, I need to structure the documentation in Markdown. The user wants clear headings, numbered steps, and visual cues like screenshots. Each feature should have purpose, step-by-step instructions with placeholder screenshots, tips, and common issues.

Let me start with the Quick Start Guide. Since it's a one-pager, I should list the main steps for each role briefly. For example, logging in, viewing jobs, filling forms, submitting, etc. I'll need to make it concise.

Next, for each feature, I'll need to detail the purpose and when to use it. For each role, maybe there's a different emphasis. For example, Foremen use the mobile app for filling forms and taking photos, while Engineers might focus on reviewing submissions.

Logging in via Azure AD is straightforward, but screenshots would help. I'll include steps for both mobile and desktop, noting differences. Common issues might include login problems, so I should suggest solutions like checking internet or contacting IT.

Viewing assigned jobs: explain how each role interacts. Foremen see their jobs on the go, Engineers might assign, Schedulers manage schedules. Steps would involve navigating to the jobs section. Tips could include filtering or sorting.

Filling out QA forms needs descriptions for all 11 types. Maybe a reference section for form fields is needed. For each form, the fields can be described in a separate section. Common issues might be missing fields or submission errors.

Taking photos involves using the camera within the app. Steps would be accessing the camera, taking photos, uploading. Tips on good lighting, clear shots. Common issues with photos not uploading could relate to storage or connectivity.

Submitting reports: process steps, confirmation, notifications. Tips on reviewing before submission. Issues include incomplete data or failed submissions.

Calendar viewing for schedules and deadlines. Engineers and Schedulers might have more administrative access here.

Notifications: how users receive alerts, settings maybe for different roles. Common issues like not receiving notifications, solutions involve checking device settings or app permissions.

Accessing past reports: search, filter, download. Management might need historical data for reports.

Special sections:

- Form field descriptions: list each form with key fields and descriptions. Maybe a table for each with Field Name, Description.

- Mobile vs Desktop differences: navigation, features available, performance. For example, mobile has camera access, and desktop has bulk actions.

- Offline mode: how to enable, syncing when back online. Foremen might use this in areas with poor connectivity. Tips on not making too many changes offline.

- Getting help: support contacts, FAQs, feedback.

I need to make sure the documentation is user-friendly. Each section for a feature should be clear and structured the same way. Use headings, bold for key terms, placeholders for screenshots. Visual cues like icons (maybe in italics for placeholders). 

Potential mistakes to avoid: missing a feature, not differentiating between roles in their features, not providing enough practical examples for common issues. Also, ensuring that the 11 QA forms are covered without making the documentation too lengthy. Maybe a separate section listing all 11 forms and their typical use cases without going into detail in the main sections.

Also, consider the user roles. For example, the Schedulers/Admins may have access to different parts than Foremen, so in each feature explanation, specify which role would use it how. Unless the feature is common to all.

Now, organize the Markdown structure. Start with the overview, then the Quick Start. Then each feature with headings, followed by the special sections.

Need to check if all 11 forms are to be listed with their fields. Maybe in a separate section, under Form Field Descriptions. The user mentioned it as a special section.

Also, offline mode is important for field workers. I need to explain enabling it, using it, and syncing.

For the documentation flow, the user likely expects:

1. Introduction
2. Quick Start Guide
3. Full Features Documentation
4. Special Sections
5. Support

Make sure the navigation is clear with markdown headers.

I need to avoid technical jargon, keep it simple for field workers. Use step-by-step instructions with clear numbers and actions.

Now, start drafting each section.

First, the title and overview. Then the quick start guide as a one-page summary.

Then each feature, starting with login. Then assigned jobs, QA forms, photos, submitting reports, etc.

Each feature section will have Purpose, Step-by-Step, Tips, Common Issues.

In the form filling section, since there are 11 types, maybe in the step-by-step, mention that the process is similar but fields vary, then refer to the form descriptions section.

For the form field descriptions, perhaps list each form type with a brief description and key fields. Maybe use a collapsed section or a separate document within the markdown.

Mobile vs desktop differences: compare features available on each platform.

Need to make sure each part is covered without redundancy. For example, in the QA forms section, maybe just outline the general process, then refer to the form descriptions for specifics.

For the Quick Start Guide, a table or bullet points for each role's key actions.

Potential challenges: keeping all the content concise while covering enough detail. Since it's user documentation, clarity is key. Avoid overlapping information.

Now, proceed to outline each section in markdown, using placeholders for screenshots and form field descriptions as specified.
</think>

# SGA QA System User Documentation  

---

## **Overview**  
The SGA QA System enables teams to complete quality assurance workflows, track progress, and ensure compliance. Roles include **Foremen** (field workers), **Engineers** (office-based), **Schedulers/Admins**, and **Management**.  

---

## **Quick Start Guide (1-Page Summary)**  

1. **Log In**  
   - Open the app or website → Use Azure AD credentials.  
   [Screenshot: Login screen]  

2. **View Jobs**  
   - Tap/Desktop: Navigate to "Assigned Jobs".  
   - Filter by status (e.g., "Pending", "Completed").  

3. **Fill QA Form**  
   - Select a job → Tap "Start QA Form".  
   - Choose form type (11 templates available).  

4. **Take Photos**  
   - Use in-app camera → Capture issues → Tag photos with QA forms.  

5. **Submit Report**  
   - Review data → Tap "Submit". Confirm via email/SMS.  

6. **Access Past Reports**  
   - Use "Search Reports" → Filter by date, job number, or team.  

7. **Offline Mode** (Foremen only):  
   - Enable offline in Settings → Sync when connectivity resumes.  

8. **Get Help**:  
   - Tap "Help Center" → Email [support@sgaqa.com] or call 1-800-SGA-Help.  

---

## **Feature Documentation**  

### **1. Logging in (Azure AD)**  
**Purpose**: Secure access to the system for all roles.  
**Steps**:  
1. Open the SGA QA app or desktop portal.  
2. Tap “Sign in with Azure AD”.  
3. Enter your organizational credentials and approve multi-factor authentication (if prompted).  
[Screenshot: Azure AD login flow]  

**Tips**:  
- First-time users: Complete onboarding via email link.  
- Update passwords through your organization’s portal.  

**Common Issues**:  
- **Error: “Login Failed”**  
  - Check internet connection.  
  - Reset password via Azure AD portal.  

---

### **2. Viewing Assigned Jobs**  
**Purpose**: Foremen track active tasks; Engineers/Managers monitor progress.  
**Steps**:  
1. Tap/Desktop: Navigate to “Jobs Dashboard”.  
2. Filter by:  
  - Due date  
  - Job status (e.g., “Overdue”, “Pending QA”)  
  - Assigned team.  
[Screenshot: Job filtering options]  

**Tips**:  
- Use the “Sort by Deadline” button for urgent tasks.  
- Engineers can assign new jobs via the “+ New Job” button.  

**Common Issues**:  
- **No jobs appear**:  
  - Verify your team/role is assigned via the Scheduler.  
  - Refresh the dashboard.  

---

### **3. Filling Out QA Forms**  
**Purpose**: Standardize quality checks across 11 form types (e.g., concrete pour, weld inspection).  
**Steps**:  
1. Select a job → Tap “Start QA Form”.  
2. Choose form type (e.g., “Form 5a: Material Check”).  
3. Fill fields:  
   - Text entries  
   - Checklists  
   - Measurements.  
4. Attach photos (see Section 4).  
5. Save as draft (optional).  

[Screenshot: QA form example]  

**Tips**:  
- Use the “Autofill” feature for repetitive data (e.g., project number).  
- Consult the **Form Field Descriptions** (Section 9) for unclear fields.  

**Common Issues**:  
- **Fields are missing**:  
  - Form type mismatch; restart with the correct template.  
- **Submission error**:  
  - Ensure all required fields are filled.  

---

### **4. Taking Photos**  
**Purpose**: Document on-site conditions for QA reports.  
**Steps**:  
1. From a QA form or job detail page → Tap the camera icon.  
2. Take photo or upload from gallery.  
3. Add tags (e.g., “Crack in Column B3”).  
4. Photos sync automatically when online.  
[Screenshot: Photo tagging interface]  

**Tips**:  
- Ensure good lighting and close-up shots for clarity.  
- Delete low-quality photos before submission.  

**Common Issues**:  
- **Photos not uploading**:  
  - Check storage space on your device.  
  - Disable “Low Data Mode” in app settings.  

---

### **5. Submitting Reports**  
**Purpose**: Finalize QA data for review by Engineers/Managers.  
**Steps**:  
1. Review QA form and attached photos.  
2. Tap “Submit Report”.  
3. Confirm submission via on-screen banner and email.  

**Tips**:  
- Submit reports within 24 hours of on-site work.  
- Managers receive notifications for overdue submissions.  

**Common Issues**:  
- **Submission stuck**:  
  - Toggle offline mode off/on to resync data.  

---

### **6. Viewing Calendar**  
**Purpose**: Schedulers/Admins track deadlines; Foremen see task dates.  
**Steps**:  
1. Navigate to “Calendar”.  
2. Switch between:  
   - Day view (Foremen)  
   - Team view (Schedulers)  
3. Tap events to view job details.  
[Screenshot: Calendar week view]  

**Tips**:  
- Engineers can edit deadlines directly from the calendar.  

---

### **7. Receiving Notifications**  
**Purpose**: Stay updated on form due dates, approvals, and errors.  
**Steps**:  
- **Mobile**: Enable Push Notifications in Settings.  
- **Desktop**: Check the bell icon for alerts.  
[Screenshot: Notification center]  

**Tips**:  
- Assign notification preferences under “User Profile > Notifications”.  

**Common Issues**:  
- **Missing notifications**:  
  - Check device permissions in Settings > Notifications.  

---

### **8. Accessing Past Reports**  
**Purpose**: Management/Engineers review historical data for audits.  
**Steps**:  
1. Navigate to “Search Reports”.  
2. Filter by:  
   - Date range  
   - Job number  
   - Team member  
3. Export as PDF/Excel.  
[Screenshot: Report search filters]  

**Tips**:  
- Use Excel exports for custom dashboards.  

---

## **Special Sections**  

### **9. Form Field Descriptions**  
| **Form Type** | **Key Fields** |  
|---------------|----------------|  
| **Form 1: Prep Check** | Material ID, Prep Method, Inspector Name |  
| **Form 5a: Concrete Pour** | Mix ID, Slump Reading, Cure Time |  
| **...** | **...** |  

Full list via “Help Center > QA Form Library”.  

---

### **10. Mobile vs Desktop Differences**  
| **Feature**       | **Mobile (iPad)** | **Desktop** |  
|--------------------|-------------------|-------------|  
| Photo Capture      | ✅ Native camera  | ❌ Use upload |  
| Offline Mode       | ✅ Supported      | ❌ Always online |  
| Bulk Actions       | ❌                | ✅ Edit 10+ reports |  

---

### **11. Offline Mode Usage (Foremen Only)**  
**Steps**:  
1. Enable “Offline Mode” in Settings.  
2. Sync jobs/forms once hourly.  
3. Save QA forms offline; sync when online.  
[Screenshot: Offline mode toggle]  

**Tips**:  
- Avoid complex edits offline (limited to text fields).  

---

### **12. Getting Help**  
- **24/7 Support**: [support@sgaqa.com] | [1-800-SGA-HELP]  
- **In-App**: “Help > Live Chat” (9 AM–6 PM PST).  
- **FAQs**: [help.sgaqa.com/faqs]  

---  

*End of Documentation*  
*[Screenshot placeholders are marked for design team to fill.]*