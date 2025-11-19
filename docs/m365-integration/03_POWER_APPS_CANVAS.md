# Power Apps Canvas App - Foreman Mobile Application
## Complete Implementation Guide

## Overview

This guide provides step-by-step instructions to build the foreman-facing mobile application using Power Apps Canvas App. This app will be the primary interface for field workers to:
- View assigned jobs
- Complete QA Pack forms
- Capture photos and signatures
- Submit reports (with offline capability)
- Report incidents

---

## Prerequisites

1. Power Apps license (included in M365 E3/E5 or standalone Power Apps per app)
2. Access to the SGA Quality Assurance Dataverse environment
3. All Dataverse tables created (from schema guide)
4. Test data populated

---

## Part 1: App Setup & Configuration

### Step 1: Create New Canvas App

1. Navigate to [make.powerapps.com](https://make.powerapps.com)
2. Select your environment (e.g., "SGA Production")
3. Click **Apps** → **+ New app** → **Canvas**
4. Choose **Phone** layout
5. Name: `SGA QA Pack - Foreman`
6. Format: **16:9** (better for tablets/phones)
7. Click **Create**

### Step 2: Connect to Data Sources

1. In the left sidebar, click **Data** (cylinder icon)
2. Click **+ Add data**
3. Search for **Dataverse** and select it
4. Check these tables:
   - ☑ msdyn_job
   - ☑ msdyn_qapack
   - ☑ msdyn_dailyreport
   - ☑ msdyn_dailyreportwork
   - ☑ msdyn_dailyreportlabour
   - ☑ msdyn_dailyreportplant
   - ☑ msdyn_dailyreporttruck
   - ☑ msdyn_dailyreporttest
   - ☑ msdyn_asphaltplacement
   - ☑ msdyn_asphaltplacementrow
   - ☑ msdyn_itpchecklist
   - ☑ msdyn_sitephoto
   - ☑ msdyn_incident
   - ☑ msdyn_crewmember
   - ☑ msdyn_equipment
   - ☑ msdyn_itptemplate
5. Click **Connect**

### Step 3: Configure App Settings

1. Click **File** → **Settings** → **Advanced settings**
2. Enable these features:
   - ☑ **Enable offline mode**
   - ☑ **Use new analysis engine**
   - ☑ **Delayed load**
   - ☑ **Formula-level error management**
3. Set **Data row limit** to 2000
4. Enable **Experimental features**:
   - ☑ **Enhanced SharePoint integration**
   - ☑ **Enable Power Fx formula bar**

---

## Part 2: Build the Dashboard Screen

### Screen 1: SplashScreen (Loading Screen)

1. **Insert** → **New screen** → **Blank**
2. Rename to `SplashScreen`
3. Add **Image** control:
   - Image: Upload company logo
   - Width: `600`
   - Height: `200`
   - X: `(Parent.Width - Self.Width) / 2`
   - Y: `(Parent.Height - Self.Height) / 2`
4. Add **Timer** control (invisible):
   - Duration: `2000` (2 seconds)
   - AutoStart: `true`
   - OnTimerEnd: `Navigate(DashboardScreen, ScreenTransition.Fade)`

### Screen 2: DashboardScreen (Main Hub)

#### Header Section

1. **Insert** → **Rectangle**:
   - Name: `HeaderBackground`
   - Fill: `ColorValue("#0078D4")` (Microsoft blue)
   - Height: `120`
   - Width: `Parent.Width`
   - X: `0`, Y: `0`

2. **Insert** → **Label** (inside header):
   - Text: `"Welcome, " & User().FullName`
   - Color: `White`
   - Font: `Open Sans`
   - Size: `24`
   - FontWeight: `Semibold`
   - X: `20`, Y: `20`

3. **Insert** → **Label** (subtitle):
   - Text: `Text(Today(), "dddd, mmmm dd, yyyy")`
   - Color: `RGBA(255,255,255,0.8)`
   - Size: `14`
   - X: `20`, Y: `60`

4. **Insert** → **Icon** (hamburger menu):
   - Icon: `Icon.HamburgerMenu`
   - Color: `White`
   - Height: `40`, Width: `40`
   - X: `Parent.Width - 60`, Y: `40`
   - OnSelect: `Set(varShowMenu, !varShowMenu)`

#### Today's Focus Section

1. **Insert** → **Label** (section header):
   - Text: `"Today's Focus"`
   - Size: `20`
   - FontWeight: `Semibold`
   - X: `20`, Y: `140`

2. **Insert** → **Gallery** → **Blank vertical**:
   - Name: `TodayFocusGallery`
   - X: `20`, Y: `180`
   - Width: `Parent.Width - 40`
   - Height: `200`
   - Items formula:
   ```powerquery
   Sort(
       Filter(
           msdyn_job,
           msdyn_assignedforeman.systemuserid = GUID(User().Email) &&
           (
               DateDiff(msdyn_duedate, Today()) <= 0 || // Overdue
               DateDiff(msdyn_duedate, Today()) = 0 // Due today
           ) &&
           IsBlank(
               LookUp(
                   msdyn_qapack,
                   'msdyn_job'.msdyn_jobid = msdyn_jobid
               )
           )
       ),
       msdyn_duedate,
       Ascending
   )
   ```

3. Inside `TodayFocusGallery`, design the template:
   
   **Background Rectangle:**
   ```powerquery
   // Add Rectangle
   Fill: If(
       DateDiff(ThisItem.msdyn_duedate, Today()) < 0,
       RGBA(209, 52, 56, 0.1), // Overdue: Red tint
       RGBA(255, 185, 0, 0.1)  // Due today: Yellow tint
   )
   BorderColor: If(
       DateDiff(ThisItem.msdyn_duedate, Today()) < 0,
       ColorValue("#D13438"),
       ColorValue("#FFB900")
   )
   BorderThickness: 2
   RadiusTopLeft: 8
   RadiusTopRight: 8
   RadiusBottomLeft: 8
   RadiusBottomRight: 8
   ```

   **Job Number Label:**
   ```powerquery
   Text: ThisItem.msdyn_jobnumber
   Size: 18
   FontWeight: Bold
   Color: ColorValue("#333333")
   X: 20, Y: 10
   ```

   **Client Label:**
   ```powerquery
   Text: ThisItem.msdyn_client
   Size: 14
   Color: ColorValue("#666666")
   X: 20, Y: 40
   ```

   **Status Badge:**
   ```powerquery
   // Add Label
   Text: If(
       DateDiff(ThisItem.msdyn_duedate, Today()) < 0,
       "OVERDUE",
       "DUE TODAY"
   )
   Fill: If(
       DateDiff(ThisItem.msdyn_duedate, Today()) < 0,
       ColorValue("#D13438"),
       ColorValue("#FFB900")
   )
   Color: White
   Size: 10
   FontWeight: Semibold
   PaddingLeft: 10
   PaddingRight: 10
   PaddingTop: 5
   PaddingBottom: 5
   X: Parent.Width - Self.Width - 20
   Y: 10
   ```

   **OnSelect (entire gallery item):**
   ```powerquery
   Navigate(QAPackScreen, ScreenTransition.Cover, {selectedJob: ThisItem})
   ```

#### Open Jobs Section

1. **Insert** → **Label**:
   - Text: `"All Open Jobs (" & CountRows(OpenJobsGallery.AllItems) & ")"`
   - Size: `18`
   - FontWeight: `Semibold`
   - X: `20`, Y: `400`

2. **Insert** → **Gallery** → **Blank vertical**:
   - Name: `OpenJobsGallery`
   - X: `20`, Y: `440`
   - Width: `Parent.Width - 40`
   - Height: `400`
   - Items formula:
   ```powerquery
   Sort(
       Filter(
           msdyn_job,
           msdyn_assignedforeman.systemuserid = GUID(User().Email) &&
           IsBlank(
               LookUp(
                   msdyn_qapack,
                   'msdyn_job'.msdyn_jobid = msdyn_jobid
               )
           )
       ),
       msdyn_jobdate,
       Descending
   )
   ```

3. Design gallery template (simpler than Today's Focus):
   
   ```powerquery
   // Rectangle background
   Fill: White
   BorderColor: ColorValue("#CCCCCC")
   BorderThickness: 1
   
   // Job Number
   Text: ThisItem.msdyn_jobnumber
   Size: 16
   FontWeight: Semibold
   
   // Client & Project
   Text: ThisItem.msdyn_client & " - " & ThisItem.msdyn_projectname
   Size: 12
   Color: ColorValue("#666666")
   
   // Job Date
   Text: "Job Date: " & Text(ThisItem.msdyn_jobdate, "mmm dd, yyyy")
   Size: 11
   
   // Division Badge
   Fill: Switch(
       ThisItem.msdyn_division,
       1, ColorValue("#F59E0B"), // Asphalt: Orange
       2, ColorValue("#3B82F6"), // Profiling: Blue
       3, ColorValue("#8B5CF6")  // Spray: Purple
   )
   Text: Switch(
       ThisItem.msdyn_division,
       1, "Asphalt",
       2, "Profiling",
       3, "Spray"
   )
   ```

#### Pending Submissions Section (Offline Queue)

1. **Insert** → **Label**:
   - Text: `"Pending Submissions"`
   - Visible: `CountRows(colPendingSubmissions) > 0`

2. **Insert** → **Gallery**:
   - Name: `PendingSubmissionsGallery`
   - Items: `colPendingSubmissions`
   - Visible: `CountRows(colPendingSubmissions) > 0`

3. **Add Sync Button**:
   ```powerquery
   // OnSelect
   ForAll(
       colPendingSubmissions,
       Patch(
           msdyn_qapack,
           Defaults(msdyn_qapack),
           {
               msdyn_reportid: reportid,
               msdyn_job: LookUp(msdyn_job, msdyn_jobnumber = jobnumber),
               // ... other fields
           }
       )
   );
   Clear(colPendingSubmissions);
   Notify("All submissions synced successfully!", NotificationType.Success)
   ```

#### Bottom Navigation Bar

1. **Insert** → **Rectangle**:
   - Fill: `ColorValue("#F3F2F1")`
   - Height: `80`
   - Width: `Parent.Width`
   - Y: `Parent.Height - Self.Height`

2. **Insert** → **Icon** (Home):
   - Icon: `Icon.Home`
   - Color: `ColorValue("#0078D4")`
   - X: `50`, Y: `Parent.Height - 60`
   - OnSelect: `Navigate(DashboardScreen)`

3. **Insert** → **Icon** (Reports):
   - Icon: `Icon.DocumentPDF`
   - X: `150`
   - OnSelect: `Navigate(MyReportsScreen)`

4. **Insert** → **Icon** (Incident):
   - Icon: `Icon.Warning`
   - X: `250`
   - OnSelect: `Navigate(IncidentReportScreen)`

5. **Insert** → **Icon** (Settings):
   - Icon: `Icon.Settings`
   - X: `350`
   - OnSelect: `Navigate(SettingsScreen)`

---

## Part 3: Build the QA Pack Form Screen

### Screen 3: QAPackScreen (Multi-Tab Form)

#### OnVisible Property (Initialize Data)

```powerquery
// Get the selected job passed from dashboard
Set(varCurrentJob, selectedJob);

// Check if draft exists for this job
Set(
    varDraft,
    LookUp(
        colOfflineDrafts,
        jobid = varCurrentJob.msdyn_jobid
    )
);

// Initialize or load draft data
If(
    IsBlank(varDraft),
    // No draft exists, create new blank
    Set(varCurrentTab, 1);
    Set(varDailyReportData, Blank());
    Set(varAsphaltPlacementData, Blank());
    Set(varITPChecklistData, Blank());
    ClearCollect(colSitePhotos, Blank());
    ClearCollect(colDamagePhotos, Blank()),
    
    // Draft exists, load it
    Set(varDailyReportData, varDraft.dailyReport);
    Set(varAsphaltPlacementData, varDraft.asphaltPlacement);
    // Load other form data...
);

// Start auto-save timer
Set(varAutoSaveTimer, Now())
```

#### Header with Tabs

1. **Insert** → **Label** (Job Info):
   ```powerquery
   Text: varCurrentJob.msdyn_jobnumber & " - " & varCurrentJob.msdyn_client
   Size: 18
   FontWeight: Bold
   ```

2. **Insert** → **Gallery** → **Horizontal** (Tab Bar):
   - Name: `TabGallery`
   - Items:
   ```powerquery
   Table(
       {id: 1, label: "Daily Report", icon: "📋", required: true},
       {id: 2, label: "Asphalt", icon: "🚧", required: true},
       {id: 3, label: "ITP", icon: "✓", required: true},
       {id: 4, label: "Photos", icon: "📷", required: true},
       {id: 5, label: "Review", icon: "✔️", required: false}
   )
   ```
   - Height: `80`
   - Template:
   ```powerquery
   // Rectangle background
   Fill: If(
       ThisItem.id = varCurrentTab,
       ColorValue("#0078D4"),
       Transparent
   )
   
   // Label
   Text: ThisItem.icon & "
" & ThisItem.label
   Color: If(
       ThisItem.id = varCurrentTab,
       White,
       ColorValue("#666666")
   )
   
   // OnSelect
   OnSelect: Set(varCurrentTab, ThisItem.id)
   ```

#### Tab 1: Daily Report Form

1. Create a **Container** for this tab:
   - Name: `DailyReportContainer`
   - Visible: `varCurrentTab = 1`

2. **Insert** → **Form** (Edit form):
   - Name: `DailyReportForm`
   - DataSource: `msdyn_dailyreport`
   - Item: `varDailyReportData`
   - DefaultMode: `FormMode.New`

3. Add cards for fields:
   - **Date** (Date picker)
   - **Completed By** (Text input, default: `User().FullName`)
   - **Start Time** (Time picker)
   - **Finish Time** (Time picker)
   - **Weather Conditions** (Text area)
   - **Corrector Used** (Toggle)
   - **Site Instructions** (Text area)
   - **Additional Comments** (Text area)

4. **Works Performed Section** (Repeating Gallery):
   
   ```powerquery
   // Add Gallery
   Name: WorksGallery
   Items: colWorks
   
   // Inside gallery template:
   - Mix Type (Dropdown)
   - Specification (Text input)
   - Area (Text input)
   - Depth (Text input)
   - Tonnes (Text input)
   - Comments (Text area)
   
   // Add button
   OnSelect: Collect(
       colWorks,
       {
           id: GUID(),
           mixtype: Blank(),
           spec: Blank(),
           area: Blank(),
           depth: Blank(),
           tonnes: Blank()
       }
   )
   
   // Delete button (in gallery)
   OnSelect: Remove(colWorks, ThisItem)
   ```

5. **Labour/Crew Section** (Similar repeating gallery):
   
   ```powerquery
   // Crew Gallery
   Items: colLabour
   
   // Template fields:
   - Crew Member (Dropdown from msdyn_crewmember)
   - Start Time
   - End Time
   - Hours (calculated)
   - Comments
   ```

6. **Plant Equipment Section**:
   ```powerquery
   // Similar pattern, data from msdyn_equipment
   ```

#### Tab 2: Asphalt Placement Form

1. **Container**: `AsphaltPlacementContainer`
   - Visible: `varCurrentTab = 2`

2. **Form Header Fields**:
   - Lot Number
   - Sheet Number
   - Pavement Surface Condition (Dropdown: Dry/Damp/Wet)
   - Rainfall During Shift (Toggle)
   - Rolling Pattern ID

3. **Weather Conditions Gallery** (Repeating):
   ```powerquery
   colWeatherConditions
   Fields:
   - Time
   - Air Temp (°C)
   - Road Temp (°C)
   - Wind Speed (km/h)
   - Chill Factor (calculated)
   - Day/Night (Toggle)
   ```

4. **Placement Records Gallery** (Main Table):
   ```powerquery
   Name: PlacementsGallery
   Items: colPlacements
   
   Template (Horizontal Gallery for scrolling fields):
   - Docket Number
   - Tonnes
   - Progressive Tonnes (auto-calculated)
   - Time
   - Incoming Temp (°C)
   - Placement Temp (°C)
   - Temps Compliant (Checkbox, auto-set based on temp rules)
   - Start Chainage
   - End Chainage
   - Length (calculated)
   - Run Width
   - Area (calculated)
   - Depth
   - Lane/Run
   - Comments
   - Details Match Spec (Checkbox)
   - Non-Conformance Reason (Text, visible if not compliant)
   ```

5. **Temperature Compliance Indicator**:
   ```powerquery
   // Add Label (large, prominent)
   Text: Round(
       CountRows(Filter(colPlacements, tempsCompliant = true)) / 
       CountRows(colPlacements) * 100,
       0
   ) & "% Compliant"
   
   Fill: If(
       Value(Self.Text) >= 95,
       ColorValue("#107C10"), // Green
       Value(Self.Text) >= 80,
       ColorValue("#FFB900"), // Yellow
       ColorValue("#D13438")  // Red
   )
   ```

#### Tab 3: ITP Checklist (Dynamic)

1. **Container**: `ITPChecklistContainer`

2. **Load ITP Template** (OnVisible):
   ```powerquery
   // Get the template ID from the job
   Set(
       varITPTemplate,
       LookUp(
           msdyn_itptemplate,
           msdyn_itptemplateid = varCurrentJob.msdyn_itptemplateid
       )
   );
   
   // Parse JSON sections
   Set(
       varITPSections,
       ParseJSON(varITPTemplate.msdyn_sections)
   );
   
   // Create collection for checklist responses
   ClearCollect(
       colITPChecklist,
       ForAll(
           varITPSections.items,
           {
               itemid: Value(id),
               description: Text(description),
               compliant: Blank(),
               comments: Blank(),
               isWitnessPoint: Boolean(isWitnessPoint),
               witnessName: Blank()
           }
       )
   )
   ```

3. **Dynamic Checklist Gallery**:
   ```powerquery
   Items: colITPChecklist
   
   Template:
   - Description (Label, wrapped text)
   - Compliant (Dropdown: Yes/No/N/A)
   - Comments (Text input)
   - Witness Point Badge (visible if isWitnessPoint)
   - Witness Name (Text input, visible if isWitnessPoint)
   ```

4. **Compliance Summary**:
   ```powerquery
   Text: CountRows(Filter(colITPChecklist, compliant = "Yes")) & 
         " of " & 
         CountRows(colITPChecklist) & 
         " items compliant"
   ```

#### Tab 4: Site Photos

1. **Container**: `SitePhotosContainer`

2. **Add Photo Section**:
   ```powerquery
   // Camera button
   OnSelect: Set(varNewPhoto, Camera1.Stream)
   
   // Description input
   Name: PhotoDescriptionInput
   
   // Save button
   OnSelect: Collect(
       colSitePhotos,
       {
           id: GUID(),
           image: varNewPhoto,
           description: PhotoDescriptionInput.Text,
           timestamp: Now(),
           geolocation: Location.Latitude & "," & Location.Longitude
       }
   );
   Reset(PhotoDescriptionInput);
   Notify("Photo added", NotificationType.Success)
   ```

3. **Photo Gallery**:
   ```powerquery
   Items: colSitePhotos
   
   Template:
   - Image control (showing ThisItem.image)
   - Description label
   - Delete button
   ```

4. **Damage Photos Section** (Same pattern)

#### Tab 5: Review & Submit

1. **Container**: `ReviewSubmitContainer`

2. **Summary Cards**:
   ```powerquery
   // Daily Report Summary
   Card showing:
   - Total labour hours
   - Total tonnes
   - Start/finish time
   
   // Asphalt Placement Summary
   - Total placements: CountRows(colPlacements)
   - Total tonnes: Sum(colPlacements, tonnes)
   - Temperature compliance %
   
   // ITP Summary
   - Items compliant
   - Non-compliant items list
   
   // Photos
   - Number of site photos
   - Number of damage photos
   ```

3. **Sign & Submit Section**:
   
   **Signature Pad:**
   ```powerquery
   // Add PenInput control
   Name: ForemanSignaturePad
   BorderStyle: BorderStyle.Solid
   BorderThickness: 2
   Height: 200
   
   // Clear button
   OnSelect: Reset(ForemanSignaturePad)
   ```

   **Camera for Biometric Photo:**
   ```powerquery
   // Add Camera control
   Name: BiometricCamera
   OnSelect: Set(varBiometricPhoto, Self.Stream)
   ```

   **Submit Button:**
   ```powerquery
   DisplayMode: If(
       IsBlank(ForemanSignaturePad.Image) || IsBlank(varBiometricPhoto),
       DisplayMode.Disabled,
       DisplayMode.Edit
   )
   
   OnSelect:
   // Save to Dataverse
   Set(
       varNewQAPack,
       Patch(
           msdyn_qapack,
           Defaults(msdyn_qapack),
           {
               msdyn_reportid: varCurrentJob.msdyn_jobnumber & " " & Text(Now(), "yyyy-mm-dd hh:mm:ss"),
               msdyn_job: varCurrentJob,
               msdyn_submittedby: LookUp(User, systemuserid = GUID(User().Email)),
               msdyn_timestamp: Now(),
               msdyn_version: 1,
               msdyn_status: 1, // Pending Review
               msdyn_foremansignature: JSON(ForemanSignaturePad.Image, JSONFormat.IncludeBinaryData)
           }
       )
   );
   
   // Save daily report
   Patch(
       msdyn_dailyreport,
       Defaults(msdyn_dailyreport),
       {
           msdyn_qapack: varNewQAPack,
           msdyn_date: varDailyReportData.date,
           msdyn_completedby: varDailyReportData.completedBy,
           // ... all other fields
       }
   );
   
   // Save all works
   ForAll(
       colWorks,
       Patch(
           msdyn_dailyreportwork,
           Defaults(msdyn_dailyreportwork),
           {
               msdyn_dailyreport: ...,
               msdyn_mixtype: ThisRecord.mixtype,
               // ... other fields
           }
       )
   );
   
   // Save labour, plant, asphalt placements, photos...
   // (Similar ForAll loops)
   
   // Upload photos to SharePoint
   ForAll(
       colSitePhotos,
       // Upload to SharePoint document library
   );
   
   // Clear draft
   Remove(colOfflineDrafts, LookUp(colOfflineDrafts, jobid = varCurrentJob.msdyn_jobid));
   
   // Navigate back to dashboard
   Notify("QA Pack submitted successfully!", NotificationType.Success);
   Navigate(DashboardScreen, ScreenTransition.UnCover)
   ```

---

## Part 4: Offline Capability

### Auto-Save to Local Collection

```powerquery
// Add Timer control (invisible) on QAPackScreen
Name: AutoSaveTimer
Duration: 30000 // 30 seconds
AutoStart: true
Repeat: true

OnTimerEnd:
// Save current state to collection
Collect(
    colOfflineDrafts,
    {
        jobid: varCurrentJob.msdyn_jobid,
        lastSaved: Now(),
        dailyReport: varDailyReportData,
        works: colWorks,
        labour: colLabour,
        asphaltPlacement: varAsphaltPlacementData,
        placements: colPlacements,
        itpChecklist: colITPChecklist,
        sitePhotos: colSitePhotos
    }
);
Notify("Draft auto-saved", NotificationType.Information)
```

### Offline Detection & Queue

```powerquery
// On App OnStart
If(
    Connection.Connected,
    Set(varIsOnline, true),
    Set(varIsOnline, false);
    Notify("You are offline. Data will be saved locally.", NotificationType.Warning)
);

// Load pending submissions from local storage
ClearCollect(
    colPendingSubmissions,
    // Load from device storage
);
```

---

## Part 5: Testing & Deployment

### Test Scenarios

1. **Happy Path**:
   - Login → View jobs → Complete QA pack → Submit
   
2. **Offline Mode**:
   - Disconnect device → Complete forms → Reconnect → Auto-sync

3. **Draft Recovery**:
   - Start QA pack → Exit app → Reopen → Continue from draft

4. **Validation**:
   - Try to submit incomplete forms → Show validation errors

### Deployment

1. Click **File** → **Save**
2. Click **Publish**
3. **Share** the app:
   - Add security groups (Foremen)
   - Set permissions

### Add to Microsoft Teams

1. In Power Apps, click **Add to Teams**
2. Select the Teams channel
3. Configure tab name and description
4. Users can now access the app directly from Teams

---

This completes the Canvas App implementation guide for the foreman mobile application!
