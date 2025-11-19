# Microsoft Teams Integration - Complete Setup Guide
## Teams App, Adaptive Cards, and Deep Integration

## Overview

This guide provides complete implementation for native Microsoft Teams integration, transforming Teams into the primary interface for QA management.

---

## Architecture

```
Teams Integration
├── Teams App Package
│   ├── Canvas App (embedded)
│   ├── Model-Driven App (embedded)
│   ├── Copilot Agent (bot)
│   └── Adaptive Card Actions
│
├── Channels & Automation
│   ├── Division Channels (Asphalt, Profiling, Spray)
│   ├── Management Channel
│   ├── HSEQ Channel
│   └── IT Alerts Channel
│
├── Notifications & Cards
│   ├── QA Pack Submissions
│   ├── Job Assignments
│   ├── Incident Alerts
│   ├── NCR Notifications
│   └── Daily Summaries
│
└── Integrations
    ├── Approvals App
    ├── Planner (Task management)
    ├── Calendar (Job scheduling)
    └── SharePoint (Documents)
```

---

## Part 1: Teams App Package

### Create Teams App Manifest

```json
// manifest.json
{
  "$schema": "https://developer.microsoft.com/json-schemas/teams/v1.16/MicrosoftTeams.schema.json",
  "manifestVersion": "1.16",
  "version": "1.0.0",
  "id": "com.sgagroup.qapack",
  "packageName": "com.sgagroup.qapack",
  "developer": {
    "name": "SGA Group Pty Ltd",
    "websiteUrl": "https://sgagroup.com.au",
    "privacyUrl": "https://sgagroup.com.au/privacy",
    "termsOfUseUrl": "https://sgagroup.com.au/terms"
  },
  "name": {
    "short": "SGA QA Pack",
    "full": "SGA Quality Assurance Pack - Construction QA Management"
  },
  "description": {
    "short": "Quality assurance management for civil construction",
    "full": "Complete quality assurance solution for managing daily QA packs, job sheets, incidents, NCRs, and compliance in civil construction projects. Includes AI-powered insights, mobile forms, and automated reporting."
  },
  "icons": {
    "outline": "icon-outline.png",
    "color": "icon-color.png"
  },
  "accentColor": "#0078D4",
  "staticTabs": [
    {
      "entityId": "dashboard",
      "name": "Dashboard",
      "contentUrl": "https://apps.powerapps.com/play/{YOUR_CANVAS_APP_ID}?source=teams&enableOnBehalfOf=true&hideNavBar=true",
      "scopes": ["personal"]
    },
    {
      "entityId": "admin",
      "name": "Admin",
      "contentUrl": "https://sgagroup.crm6.dynamics.com/main.aspx?appid={YOUR_MODEL_DRIVEN_APP_ID}&pagetype=dashboard",
      "scopes": ["personal"]
    },
    {
      "entityId": "reports",
      "name": "My Reports",
      "contentUrl": "https://apps.powerapps.com/play/{YOUR_CANVAS_APP_ID}?source=teams&screen=MyReportsScreen",
      "scopes": ["personal"]
    }
  ],
  "configurableTabs": [
    {
      "configurationUrl": "https://sgagroup.sharepoint.com/sites/SGAQualityAssurance/_layouts/15/teamslogon.aspx?spfx=true&dest={teamSitePath}/_layouts/15/teamslogon.aspx?SPFX=true&dest=/",
      "canUpdateConfiguration": true,
      "scopes": ["team"],
      "context": [
        "channelTab",
        "privateChatTab",
        "meetingChatTab",
        "meetingDetailsTab"
      ],
      "sharePointPreviewImage": "sharepoint-preview.png",
      "supportedSharePointHosts": ["sharePointFullPage", "sharePointWebPart"]
    }
  ],
  "bots": [
    {
      "botId": "{YOUR_COPILOT_BOT_ID}",
      "scopes": ["personal", "team", "groupchat"],
      "supportsFiles": true,
      "isNotificationOnly": false,
      "commandLists": [
        {
          "scopes": ["personal", "team", "groupchat"],
          "commands": [
            {
              "title": "Check report status",
              "description": "Get the status of a QA pack by job number"
            },
            {
              "title": "Quality insights",
              "description": "Analyze quality trends and metrics"
            },
            {
              "title": "Create job",
              "description": "Create a new construction job"
            },
            {
              "title": "Find specification",
              "description": "Search for specifications and procedures"
            },
            {
              "title": "Analyze risk",
              "description": "Perform AI risk analysis for a job"
            }
          ]
        }
      ]
    }
  ],
  "connectors": [
    {
      "connectorId": "{YOUR_CONNECTOR_ID}",
      "scopes": ["team"],
      "configurationUrl": "https://your-connector-config-url.com"
    }
  ],
  "composeExtensions": [
    {
      "botId": "{YOUR_COPILOT_BOT_ID}",
      "commands": [
        {
          "id": "searchReports",
          "context": ["compose", "commandBox"],
          "description": "Search for QA packs and reports",
          "title": "Search Reports",
          "type": "query",
          "parameters": [
            {
              "name": "searchQuery",
              "title": "Job Number or Client",
              "description": "Enter job number or client name",
              "inputType": "text"
            }
          ]
        },
        {
          "id": "quickSubmit",
          "context": ["compose"],
          "description": "Quick submit a simple report",
          "title": "Quick Report",
          "type": "action",
          "parameters": [
            {
              "name": "jobNumber",
              "title": "Job Number",
              "inputType": "text"
            },
            {
              "name": "notes",
              "title": "Quick Notes",
              "inputType": "textarea"
            }
          ]
        }
      ]
    }
  ],
  "permissions": [
    "identity",
    "messageTeamMembers"
  ],
  "validDomains": [
    "*.powerapps.com",
    "*.dynamics.com",
    "*.crm6.dynamics.com",
    "sgagroup.sharepoint.com",
    "*.sharepoint.com"
  ],
  "webApplicationInfo": {
    "id": "{YOUR_AAD_APP_ID}",
    "resource": "api://sgagroup.com/{YOUR_AAD_APP_ID}"
  },
  "authorization": {
    "permissions": {
      "resourceSpecific": [
        {
          "name": "ChannelMessage.Read.Group",
          "type": "Application"
        },
        {
          "name": "ChannelMessage.Send.Group",
          "type": "Application"
        },
        {
          "name": "TeamsAppInstallation.Read.Group",
          "type": "Application"
        }
      ]
    }
  }
}
```

### App Icons

**Color Icon (192x192):**
- Company logo with vibrant colors
- Hard hat or construction theme
- Brand colors (SGA orange/blue)

**Outline Icon (32x32):**
- Monochrome version
- Simple, recognizable at small size

### Package Structure

```
SGA-QA-Pack.zip
├── manifest.json
├── icon-color.png (192x192)
├── icon-outline.png (32x32)
└── localization/
    ├── en-au.json (Australian English)
    └── en-us.json (US English)
```

---

## Part 2: Adaptive Cards Gallery

### Card 1: QA Pack Submission (With Actions)

```json
{
  "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
  "type": "AdaptiveCard",
  "version": "1.5",
  "body": [
    {
      "type": "Container",
      "style": "emphasis",
      "items": [
        {
          "type": "ColumnSet",
          "columns": [
            {
              "type": "Column",
              "width": "auto",
              "items": [
                {
                  "type": "Image",
                  "url": "https://sgagroup.com.au/logo-icon.png",
                  "size": "Small",
                  "style": "Person"
                }
              ]
            },
            {
              "type": "Column",
              "width": "stretch",
              "items": [
                {
                  "type": "TextBlock",
                  "text": "QA Pack Submitted ✅",
                  "weight": "Bolder",
                  "size": "Large",
                  "color": "Good"
                },
                {
                  "type": "TextBlock",
                  "text": "${formatDateTime(timestamp, 'dd/MM/yyyy hh:mm tt')}",
                  "isSubtle": true,
                  "spacing": "None"
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "FactSet",
      "facts": [
        {
          "title": "Job Number",
          "value": "${jobNumber}"
        },
        {
          "title": "Client",
          "value": "${client}"
        },
        {
          "title": "Project",
          "value": "${projectName}"
        },
        {
          "title": "Foreman",
          "value": "${foremanName}"
        },
        {
          "title": "Division",
          "value": "${division}"
        }
      ]
    },
    {
      "type": "Container",
      "separator": true,
      "spacing": "Medium",
      "items": [
        {
          "type": "TextBlock",
          "text": "Key Metrics",
          "weight": "Bolder"
        },
        {
          "type": "ColumnSet",
          "columns": [
            {
              "type": "Column",
              "width": "stretch",
              "items": [
                {
                  "type": "TextBlock",
                  "text": "${totalTonnes}",
                  "size": "ExtraLarge",
                  "weight": "Bolder",
                  "color": "Accent",
                  "horizontalAlignment": "Center"
                },
                {
                  "type": "TextBlock",
                  "text": "Tonnes Placed",
                  "size": "Small",
                  "horizontalAlignment": "Center",
                  "isSubtle": true
                }
              ]
            },
            {
              "type": "Column",
              "width": "stretch",
              "items": [
                {
                  "type": "TextBlock",
                  "text": "${tempCompliance}%",
                  "size": "ExtraLarge",
                  "weight": "Bolder",
                  "color": "$if(greaterOrEquals(tempCompliance, 95), 'Good', if(greaterOrEquals(tempCompliance, 85), 'Warning', 'Attention'))",
                  "horizontalAlignment": "Center"
                },
                {
                  "type": "TextBlock",
                  "text": "Temp Compliance",
                  "size": "Small",
                  "horizontalAlignment": "Center",
                  "isSubtle": true
                }
              ]
            },
            {
              "type": "Column",
              "width": "stretch",
              "items": [
                {
                  "type": "TextBlock",
                  "text": "${itpCompliance}%",
                  "size": "ExtraLarge",
                  "weight": "Bolder",
                  "color": "$if(equals(itpCompliance, 100), 'Good', 'Warning')",
                  "horizontalAlignment": "Center"
                },
                {
                  "type": "TextBlock",
                  "text": "ITP Compliance",
                  "size": "Small",
                  "horizontalAlignment": "Center",
                  "isSubtle": true
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "Container",
      "separator": true,
      "spacing": "Medium",
      "style": "$if(equals(aiSummaryStatus, 'completed'), 'default', 'accent')",
      "items": [
        {
          "type": "TextBlock",
          "text": "🤖 AI Executive Summary",
          "weight": "Bolder"
        },
        {
          "type": "TextBlock",
          "text": "${aiSummary}",
          "wrap": true,
          "$when": "${equals(aiSummaryStatus, 'completed')}"
        },
        {
          "type": "TextBlock",
          "text": "⏳ AI summary is being generated... You'll be notified when ready.",
          "wrap": true,
          "isSubtle": true,
          "$when": "${equals(aiSummaryStatus, 'pending')}"
        }
      ]
    },
    {
      "type": "Container",
      "separator": true,
      "$when": "${nonCompliantPlacements > 0}",
      "style": "attention",
      "items": [
        {
          "type": "TextBlock",
          "text": "⚠️ Issues Identified",
          "weight": "Bolder",
          "color": "Attention"
        },
        {
          "type": "TextBlock",
          "text": "${nonCompliantPlacements} placement(s) with temperature non-compliance",
          "wrap": true
        }
      ]
    }
  ],
  "actions": [
    {
      "type": "Action.OpenUrl",
      "title": "📄 View PDF",
      "url": "${pdfUrl}",
      "style": "positive"
    },
    {
      "type": "Action.OpenUrl",
      "title": "👁️ Review in App",
      "url": "https://sgagroup.crm6.dynamics.com/main.aspx?etn=msdyn_qapack&id=${qaPackId}",
      "iconUrl": "https://sgagroup.com.au/icons/review.png"
    },
    {
      "type": "Action.Submit",
      "title": "✅ Approve",
      "data": {
        "action": "approve",
        "qaPackId": "${qaPackId}",
        "jobNumber": "${jobNumber}"
      },
      "style": "positive"
    },
    {
      "type": "Action.ShowCard",
      "title": "⚠️ Raise NCR",
      "card": {
        "type": "AdaptiveCard",
        "body": [
          {
            "type": "TextBlock",
            "text": "Describe the non-conformance:",
            "wrap": true
          },
          {
            "type": "Input.Text",
            "id": "ncrDescription",
            "placeholder": "Description of non-conformance",
            "isMultiline": true
          },
          {
            "type": "Input.Text",
            "id": "specificationClause",
            "placeholder": "Specification clause reference (optional)"
          }
        ],
        "actions": [
          {
            "type": "Action.Submit",
            "title": "Submit NCR",
            "data": {
              "action": "raiseNCR",
              "qaPackId": "${qaPackId}",
              "jobNumber": "${jobNumber}"
            }
          }
        ]
      }
    },
    {
      "type": "Action.ShowCard",
      "title": "💬 Add Comment",
      "card": {
        "type": "AdaptiveCard",
        "body": [
          {
            "type": "Input.Text",
            "id": "reviewComment",
            "placeholder": "Add internal review notes",
            "isMultiline": true
          }
        ],
        "actions": [
          {
            "type": "Action.Submit",
            "title": "Add Comment",
            "data": {
              "action": "addComment",
              "qaPackId": "${qaPackId}"
            }
          }
        ]
      }
    }
  ],
  "$data": {
    "jobNumber": "SGA-2024-189",
    "client": "Main Roads WA",
    "projectName": "Tonkin Highway Widening",
    "foremanName": "John Smith",
    "division": "Asphalt",
    "timestamp": "2024-11-14T14:30:00Z",
    "totalTonnes": 847,
    "tempCompliance": 94,
    "itpCompliance": 100,
    "nonCompliantPlacements": 2,
    "aiSummaryStatus": "completed",
    "aiSummary": "Overall excellent report. 847 tonnes placed with 94% temperature compliance (2 placements slightly below minimum). All ITP checkpoints satisfied. Minor delay due to late truck arrival. Recommend early coordination for next placement.",
    "pdfUrl": "https://sgagroup.sharepoint.com/sites/QA/QAPacks/SGA-2024-189.pdf",
    "qaPackId": "12345-67890-abcde"
  }
}
```

### Card 2: New Job Assignment (Push Notification)

```json
{
  "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
  "type": "AdaptiveCard",
  "version": "1.5",
  "body": [
    {
      "type": "Container",
      "style": "accent",
      "items": [
        {
          "type": "TextBlock",
          "text": "📋 New Job Assigned to You",
          "weight": "Bolder",
          "size": "Large",
          "color": "Light"
        }
      ]
    },
    {
      "type": "FactSet",
      "facts": [
        {
          "title": "Job Number",
          "value": "${jobNumber}"
        },
        {
          "title": "Client",
          "value": "${client}"
        },
        {
          "title": "Project",
          "value": "${projectName}"
        },
        {
          "title": "Location",
          "value": "${location}"
        },
        {
          "title": "Job Date",
          "value": "${formatDateTime(jobDate, 'dddd, MMMM dd, yyyy')}"
        },
        {
          "title": "Due Date",
          "value": "${formatDateTime(dueDate, 'dddd, MMMM dd')}"
        }
      ]
    },
    {
      "type": "Container",
      "separator": true,
      "items": [
        {
          "type": "TextBlock",
          "text": "Job Details:",
          "weight": "Bolder"
        },
        {
          "type": "TextBlock",
          "text": "${jobDetails}",
          "wrap": true
        }
      ]
    },
    {
      "type": "Image",
      "url": "${mapImageUrl}",
      "size": "Stretch",
      "altText": "Job location map"
    }
  ],
  "actions": [
    {
      "type": "Action.OpenUrl",
      "title": "📄 View Job Sheet",
      "url": "${jobSheetUrl}",
      "style": "positive"
    },
    {
      "type": "Action.OpenUrl",
      "title": "📱 Open in App",
      "url": "mspowerapp://provider/Dynamics365ForOperations?appId=${appId}&screenName=QAPackScreen&jobId=${jobId}"
    },
    {
      "type": "Action.Submit",
      "title": "📅 Add to Calendar",
      "data": {
        "action": "addToCalendar",
        "jobId": "${jobId}"
      }
    }
  ]
}
```

### Card 3: Incident Alert (Urgent)

```json
{
  "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
  "type": "AdaptiveCard",
  "version": "1.5",
  "body": [
    {
      "type": "Container",
      "style": "attention",
      "bleed": true,
      "items": [
        {
          "type": "ColumnSet",
          "columns": [
            {
              "type": "Column",
              "width": "auto",
              "items": [
                {
                  "type": "Image",
                  "url": "https://sgagroup.com.au/icons/alert.png",
                  "size": "Medium"
                }
              ]
            },
            {
              "type": "Column",
              "width": "stretch",
              "items": [
                {
                  "type": "TextBlock",
                  "text": "🚨 ${incidentType} Reported",
                  "weight": "Bolder",
                  "size": "Large",
                  "color": "Light"
                },
                {
                  "type": "TextBlock",
                  "text": "Severity: ${severity}",
                  "weight": "Bolder",
                  "color": "Light",
                  "spacing": "None"
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "FactSet",
      "facts": [
        {
          "title": "Incident No",
          "value": "${incidentNumber}"
        },
        {
          "title": "Reported By",
          "value": "${reportedBy}"
        },
        {
          "title": "Date/Time",
          "value": "${formatDateTime(incidentDateTime, 'dd/MM/yyyy hh:mm tt')}"
        },
        {
          "title": "Location",
          "value": "${location}"
        },
        {
          "title": "Job No",
          "value": "${jobNumber}"
        }
      ]
    },
    {
      "type": "Container",
      "separator": true,
      "items": [
        {
          "type": "TextBlock",
          "text": "Description:",
          "weight": "Bolder"
        },
        {
          "type": "TextBlock",
          "text": "${description}",
          "wrap": true
        }
      ]
    },
    {
      "type": "Container",
      "separator": true,
      "$when": "${not(empty(immediateAction))}",
      "items": [
        {
          "type": "TextBlock",
          "text": "Immediate Action Taken:",
          "weight": "Bolder"
        },
        {
          "type": "TextBlock",
          "text": "${immediateAction}",
          "wrap": true
        }
      ]
    },
    {
      "type": "ImageSet",
      "$when": "${count(photos) > 0}",
      "imageSize": "Medium",
      "images": "${photos}"
    }
  ],
  "actions": [
    {
      "type": "Action.OpenUrl",
      "title": "🔍 Investigate Now",
      "url": "https://sgagroup.crm6.dynamics.com/main.aspx?etn=msdyn_incident&id=${incidentId}",
      "style": "destructive"
    },
    {
      "type": "Action.Submit",
      "title": "✅ Acknowledge",
      "data": {
        "action": "acknowledge",
        "incidentId": "${incidentId}"
      }
    },
    {
      "type": "Action.Submit",
      "title": "👥 Assign Investigator",
      "data": {
        "action": "assign",
        "incidentId": "${incidentId}"
      }
    }
  ]
}
```

### Card 4: Daily Summary (End of Day)

```json
{
  "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
  "type": "AdaptiveCard",
  "version": "1.5",
  "body": [
    {
      "type": "Container",
      "style": "emphasis",
      "items": [
        {
          "type": "TextBlock",
          "text": "📊 End of Day Summary",
          "weight": "Bolder",
          "size": "ExtraLarge"
        },
        {
          "type": "TextBlock",
          "text": "${formatDateTime(date, 'dddd, MMMM dd, yyyy')}",
          "size": "Medium",
          "isSubtle": true
        }
      ]
    },
    {
      "type": "ColumnSet",
      "columns": [
        {
          "type": "Column",
          "width": "stretch",
          "items": [
            {
              "type": "Container",
              "style": "good",
              "items": [
                {
                  "type": "TextBlock",
                  "text": "${qaPacksSubmitted}",
                  "size": "ExtraLarge",
                  "weight": "Bolder",
                  "horizontalAlignment": "Center",
                  "color": "Light"
                },
                {
                  "type": "TextBlock",
                  "text": "QA Packs Submitted",
                  "horizontalAlignment": "Center",
                  "color": "Light",
                  "spacing": "None"
                }
              ]
            }
          ]
        },
        {
          "type": "Column",
          "width": "stretch",
          "items": [
            {
              "type": "Container",
              "style": "accent",
              "items": [
                {
                  "type": "TextBlock",
                  "text": "${totalTonnes}t",
                  "size": "ExtraLarge",
                  "weight": "Bolder",
                  "horizontalAlignment": "Center",
                  "color": "Light"
                },
                {
                  "type": "TextBlock",
                  "text": "Asphalt Placed",
                  "horizontalAlignment": "Center",
                  "color": "Light",
                  "spacing": "None"
                }
              ]
            }
          ]
        },
        {
          "type": "Column",
          "width": "stretch",
          "items": [
            {
              "type": "Container",
              "style": "attention",
              "items": [
                {
                  "type": "TextBlock",
                  "text": "${activeNCRs}",
                  "size": "ExtraLarge",
                  "weight": "Bolder",
                  "horizontalAlignment": "Center",
                  "color": "Light"
                },
                {
                  "type": "TextBlock",
                  "text": "Active NCRs",
                  "horizontalAlignment": "Center",
                  "color": "Light",
                  "spacing": "None"
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "Container",
      "separator": true,
      "spacing": "Medium",
      "items": [
        {
          "type": "TextBlock",
          "text": "Division Breakdown",
          "weight": "Bolder",
          "size": "Medium"
        },
        {
          "type": "FactSet",
          "facts": [
            {
              "title": "🔶 Asphalt",
              "value": "${asphaltReports} reports (${asphaltTonnes}t)"
            },
            {
              "title": "🔷 Profiling",
              "value": "${profilingReports} reports"
            },
            {
              "title": "🟣 Spray",
              "value": "${sprayReports} reports"
            }
          ]
        }
      ]
    },
    {
      "type": "Container",
      "separator": true,
      "spacing": "Medium",
      "style": "emphasis",
      "items": [
        {
          "type": "TextBlock",
          "text": "🤖 AI Executive Summary",
          "weight": "Bolder",
          "size": "Medium"
        },
        {
          "type": "TextBlock",
          "text": "${aiSummary}",
          "wrap": true
        }
      ]
    },
    {
      "type": "Container",
      "separator": true,
      "$when": "${count(issues) > 0}",
      "style": "warning",
      "items": [
        {
          "type": "TextBlock",
          "text": "⚠️ Items Requiring Attention",
          "weight": "Bolder"
        },
        {
          "type": "FactSet",
          "facts": "${issues}"
        }
      ]
    }
  ],
  "actions": [
    {
      "type": "Action.OpenUrl",
      "title": "📊 View Full Dashboard",
      "url": "https://sgagroup.crm6.dynamics.com/main.aspx?appid=${appId}"
    },
    {
      "type": "Action.OpenUrl",
      "title": "📧 Email Report",
      "url": "mailto:management@sgagroup.com.au?subject=Daily Summary ${formatDateTime(date, 'dd/MM/yyyy')}"
    }
  ]
}
```

---

## Part 3: Channel Structure & Webhooks

### Create Teams Channels

```powershell
# PowerShell script to create Teams channels

$teamId = "YOUR_TEAM_ID"

# Install Microsoft Teams module
Install-Module -Name MicrosoftTeams
Connect-MicrosoftTeams

# Create channels
$channels = @(
    @{Name="Asphalt Operations"; Description="Asphalt division QA packs and jobs"},
    @{Name="Profiling Operations"; Description="Profiling division QA packs and jobs"},
    @{Name="Spray Operations"; Description="Spray sealing division QA packs and jobs"},
    @{Name="Management Reports"; Description="Executive summaries and daily briefings"},
    @{Name="HSEQ Incidents"; Description="Incident reports and safety alerts"},
    @{Name="NCR Register"; Description="Non-conformance reports"},
    @{Name="Biosecurity"; Description="Foreman verification photos"},
    @{Name="IT Alerts"; Description="System errors and notifications"}
)

foreach ($channel in $channels) {
    New-TeamChannel -GroupId $teamId `
        -DisplayName $channel.Name `
        -Description $channel.Description
}
```

### Configure Webhooks

```bash
# For each channel, create an incoming webhook

# 1. In Teams, go to channel → ⋯ → Connectors
# 2. Search for "Incoming Webhook"
# 3. Configure webhook
# 4. Copy webhook URL
# 5. Add to environment variables

export TEAMS_WEBHOOK_URL_ASPHALT="https://sgagroup.webhook.office.com/webhookb2/..."
export TEAMS_WEBHOOK_URL_PROFILING="https://sgagroup.webhook.office.com/webhookb2/..."
export TEAMS_WEBHOOK_URL_SPRAY="https://sgagroup.webhook.office.com/webhookb2/..."
# ... etc
```

---

## Part 4: Deep Integrations

### Integration 1: Approvals App

```yaml
Approval Flow:
  Trigger: QA Pack status = "Pending Review"
  
  Create Approval Request:
    Title: "Review QA Pack: ${jobNumber}"
    Assigned To: Division Engineer
    Details: |
      Job: ${jobNumber}
      Client: ${client}
      Submitted by: ${foremanName}
      Date: ${date}
      
      AI Summary: ${aiSummary}
      
      Key Metrics:
      - Tonnes: ${totalTonnes}
      - Temp Compliance: ${tempCompliance}%
      - ITP Compliance: ${itpCompliance}%
    
    Actions:
      - Approve → Update status to "Approved"
      - Reject → Update status to "Requires Action", prompt for reason
      - Request Changes → Send notification to foreman
  
  On Approval:
    - Update QA Pack status
    - Send notification to foreman
    - Archive report
  
  On Rejection:
    - Update QA Pack with notes
    - Send detailed feedback to foreman
    - Create task in Planner for follow-up
```

### Integration 2: Planner (Task Management)

```powershell
# Auto-create Planner tasks for important items

function Create-PlannerTask {
    param(
        $PlanId,
        $Title,
        $DueDate,
        $AssignedTo,
        $Priority
    )
    
    $task = New-PlannerTask `
        -PlanId $PlanId `
        -Title $Title `
        -DueDateTime $DueDate `
        -Assignments @{$AssignedTo = @{}} `
        -Priority $Priority
    
    return $task
}

# Example: Create task when NCR is raised
$ncrTask = Create-PlannerTask `
    -PlanId "NCR_PLAN_ID" `
    -Title "Investigate NCR-2024-045" `
    -DueDate (Get-Date).AddDays(3) `
    -AssignedTo "engineer@sgagroup.com.au" `
    -Priority 1
```

### Integration 3: Calendar (Job Scheduling)

```javascript
// Microsoft Graph API: Create calendar events for jobs

const { Client } = require('@microsoft/microsoft-graph-client');

async function createJobCalendarEvent(job) {
    const client = Client.init({
        authProvider: (done) => {
            done(null, accessToken);
        }
    });
    
    const event = {
        subject: `Job: ${job.jobNumber} - ${job.client}`,
        body: {
            contentType: 'HTML',
            content: `
                <h2>${job.projectName}</h2>
                <p><strong>Location:</strong> ${job.location}</p>
                <p><strong>Foreman:</strong> ${job.foremanName}</p>
                <p><strong>Division:</strong> ${job.division}</p>
                <br>
                <a href="${jobSheetUrl}">View Job Sheet</a>
            `
        },
        start: {
            dateTime: `${job.jobDate}T07:00:00`,
            timeZone: 'Australia/Perth'
        },
        end: {
            dateTime: `${job.jobDate}T17:00:00`,
            timeZone: 'Australia/Perth'
        },
        location: {
            displayName: job.location
        },
        attendees: [
            {
                emailAddress: {
                    address: job.foremanEmail,
                    name: job.foremanName
                },
                type: 'required'
            }
        ],
        categories: [job.division],
        isReminderOn: true,
        reminderMinutesBeforeStart: 720 // 12 hours
    };
    
    await client.api(`/users/${job.foremanEmail}/calendar/events`)
        .post(event);
}
```

---

## Part 5: Deployment

### Package and Deploy Teams App

```bash
# 1. Create app package
cd teams-app
zip -r SGA-QA-Pack.zip manifest.json icon-color.png icon-outline.png

# 2. Upload to Teams Admin Center
# Go to https://admin.teams.microsoft.com
# Apps → Manage apps → Upload
# Select SGA-QA-Pack.zip

# 3. Set app policies
# Setup policies → App setup policies
# Add "SGA QA Pack" to installed apps

# 4. Assign to users
# Users → Active users
# Select users → Apps → Assign
```

### Configure Permissions

```powershell
# Grant app permissions in Azure AD
Connect-AzureAD

$sp = Get-AzureADServicePrincipal -Filter "DisplayName eq 'SGA QA Pack'"

# Grant application permissions
$appRoleAssignments = @(
    "ChannelMessage.Read.All",
    "ChannelMessage.Send",
    "Team.ReadBasic.All"
)

foreach ($role in $appRoleAssignments) {
    New-AzureADServiceAppRoleAssignment `
        -ObjectId $sp.ObjectId `
        -PrincipalId $sp.ObjectId `
        -ResourceId $resourceId `
        -Id $appRoleId
}
```

---

## Summary

This Teams integration provides:

✅ **Native Teams App** - Embedded Power Apps and bot
✅ **Rich Adaptive Cards** - Interactive notifications
✅ **Multi-Channel Architecture** - Organized by division
✅ **Deep M365 Integration** - Approvals, Planner, Calendar
✅ **Action-Oriented** - Approve/reject directly in Teams
✅ **AI-Powered** - Copilot assistant in Teams
✅ **Mobile-Ready** - Full experience on Teams mobile

**User Experience:** Teams becomes the primary interface for QA management, eliminating app-switching and improving adoption.
