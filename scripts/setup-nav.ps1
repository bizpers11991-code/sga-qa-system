
# SharePoint Online Navigation Setup Script
# Run this in PowerShell with PnP.PowerShell module installed

# Install PnP.PowerShell if not already installed
# Install-Module -Name PnP.PowerShell -Scope CurrentUser -Force

# Connect to SharePoint (will prompt for credentials)
$siteUrl = "https://sgagroupcomau.sharepoint.com/sites/SGAQualityAssurance"
Connect-PnPOnline -Url $siteUrl -Interactive

# Clear existing quick launch navigation
$quickLaunch = Get-PnPNavigationNode -Location QuickLaunch
foreach ($node in $quickLaunch) {
    Remove-PnPNavigationNode -Identity $node.Id -Force
}

# Add Quick Access section
Write-Host "Adding Quick Access links..."
Add-PnPNavigationNode -Location QuickLaunch -Title "New Job" -Url "/Lists/Jobs/NewForm.aspx"
Add-PnPNavigationNode -Location QuickLaunch -Title "New QA Pack" -Url "/Lists/QAPacks/NewForm.aspx"
Add-PnPNavigationNode -Location QuickLaunch -Title "Report Incident" -Url "/Lists/Incidents/NewForm.aspx"

# Add Navigation Sections

Write-Host "Adding HOME section..."
Add-PnPNavigationNode -Location QuickLaunch -Title "Dashboard" -Url "/"
Add-PnPNavigationNode -Location QuickLaunch -Title "Site Contents" -Url "/_layouts/15/viewlsts.aspx"

Write-Host "Adding WORK MANAGEMENT section..."
$parent = Add-PnPNavigationNode -Location QuickLaunch -Title "Jobs & Projects" -Url "#"
Add-PnPNavigationNode -Location QuickLaunch -Title "All Jobs" -Url "/Lists/Jobs" -Parent $parent.Id
Add-PnPNavigationNode -Location QuickLaunch -Title "Active Projects" -Url "/Lists/Projects" -Parent $parent.Id
Add-PnPNavigationNode -Location QuickLaunch -Title "Tender Handovers" -Url "/Lists/Tenders" -Parent $parent.Id
Add-PnPNavigationNode -Location QuickLaunch -Title "Division Requests" -Url "/Lists/DivisionRequests" -Parent $parent.Id
$parent = Add-PnPNavigationNode -Location QuickLaunch -Title "Scheduling" -Url "#"
Add-PnPNavigationNode -Location QuickLaunch -Title "Scope Reports" -Url "/Lists/ScopeReports" -Parent $parent.Id
Add-PnPNavigationNode -Location QuickLaunch -Title "Resources" -Url "/Lists/Resources" -Parent $parent.Id
Add-PnPNavigationNode -Location QuickLaunch -Title "Foremen" -Url "/Lists/Foremen" -Parent $parent.Id

Write-Host "Adding QUALITY ASSURANCE section..."
$parent = Add-PnPNavigationNode -Location QuickLaunch -Title "QA Documents" -Url "#"
Add-PnPNavigationNode -Location QuickLaunch -Title "QA Packs" -Url "/Lists/QAPacks" -Parent $parent.Id
Add-PnPNavigationNode -Location QuickLaunch -Title "QA Documents Library" -Url "/QADocuments" -Parent $parent.Id
Add-PnPNavigationNode -Location QuickLaunch -Title "ITP Templates" -Url "/Lists/ITPTemplates" -Parent $parent.Id
Add-PnPNavigationNode -Location QuickLaunch -Title "Sampling Plans" -Url "/Lists/SamplingPlans" -Parent $parent.Id
$parent = Add-PnPNavigationNode -Location QuickLaunch -Title "Issues & NCRs" -Url "#"
Add-PnPNavigationNode -Location QuickLaunch -Title "Non-Conformance Reports" -Url "/Lists/NCRs" -Parent $parent.Id
Add-PnPNavigationNode -Location QuickLaunch -Title "NCR Documents" -Url "/NCRDocuments" -Parent $parent.Id

Write-Host "Adding SAFETY & INCIDENTS section..."
$parent = Add-PnPNavigationNode -Location QuickLaunch -Title "Safety Management" -Url "#"
Add-PnPNavigationNode -Location QuickLaunch -Title "Incident Reports" -Url "/Lists/Incidents" -Parent $parent.Id
Add-PnPNavigationNode -Location QuickLaunch -Title "Incident Documents" -Url "/IncidentReports" -Parent $parent.Id
Add-PnPNavigationNode -Location QuickLaunch -Title "Site Photos" -Url "/SitePhotos" -Parent $parent.Id

Write-Host "Adding DOCUMENTS section..."
$parent = Add-PnPNavigationNode -Location QuickLaunch -Title "Document Libraries" -Url "#"
Add-PnPNavigationNode -Location QuickLaunch -Title "QA Documents" -Url "/QADocuments" -Parent $parent.Id
Add-PnPNavigationNode -Location QuickLaunch -Title "Site Photos" -Url "/SitePhotos" -Parent $parent.Id
Add-PnPNavigationNode -Location QuickLaunch -Title "Incident Reports" -Url "/IncidentReports" -Parent $parent.Id
Add-PnPNavigationNode -Location QuickLaunch -Title "NCR Documents" -Url "/NCRDocuments" -Parent $parent.Id
Add-PnPNavigationNode -Location QuickLaunch -Title "Scope Report Docs" -Url "/ScopeReportDocs" -Parent $parent.Id

Write-Host "Adding SYSTEM section..."
$parent = Add-PnPNavigationNode -Location QuickLaunch -Title "System Lists" -Url "#"
Add-PnPNavigationNode -Location QuickLaunch -Title "Drafts" -Url "/Lists/Drafts" -Parent $parent.Id
Add-PnPNavigationNode -Location QuickLaunch -Title "Notifications" -Url "/Lists/Notifications" -Parent $parent.Id
Add-PnPNavigationNode -Location QuickLaunch -Title "Daily Reports" -Url "/Lists/DailyReports" -Parent $parent.Id
Add-PnPNavigationNode -Location QuickLaunch -Title "Activity Log" -Url "/Lists/ActivityLog" -Parent $parent.Id

Write-Host "Navigation setup complete!" -ForegroundColor Green
Disconnect-PnPOnline
