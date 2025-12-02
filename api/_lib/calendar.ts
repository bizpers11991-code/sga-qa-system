// api/_lib/calendar.ts
/**
 * Microsoft Graph API Calendar Integration
 *
 * Provides functions to create, update, and sync calendar events with Microsoft Teams Group Calendar.
 * This is the master calendar for the SGA QA System - all scheduling automation happens in-app.
 *
 * Architecture:
 * - Uses M365 Group Calendar (not personal calendars)
 * - Client credentials flow for server-side automation
 * - All calendar operations done in-app (reliable)
 * - Power Automate/Flows only used for notifications
 */

export interface CalendarEvent {
    id?: string;
    subject: string;
    start: {
        dateTime: string; // ISO 8601 format
        timeZone: string;
    };
    end: {
        dateTime: string; // ISO 8601 format
        timeZone: string;
    };
    location?: {
        displayName: string;
    };
    body?: {
        contentType: 'HTML' | 'Text';
        content: string;
    };
    attendees?: Array<{
        emailAddress: {
            address: string;
            name?: string;
        };
        type: 'required' | 'optional';
    }>;
    isReminderOn?: boolean;
    reminderMinutesBeforeStart?: number;
    categories?: string[];  // Color categories for division/type
    showAs?: 'free' | 'tentative' | 'busy' | 'oof' | 'workingElsewhere' | 'unknown';
}

export interface SiteVisitSchedule {
    visitNumber: number;
    visitType: '14-Day' | '7-Day' | '3-Day' | '72-Hour';
    scheduledDate: Date;
    eventId?: string;
}

// Graph API configuration
const GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0';
const DEFAULT_TIMEZONE = 'Australia/Perth';  // SGA is in WA

// Category colors for different event types
export const CalendarCategories = {
    JOB_ASPHALT: 'Orange Category',
    JOB_PROFILING: 'Blue Category',
    JOB_SPRAY: 'Purple Category',
    SITE_VISIT: 'Green Category',
    PROJECT: 'Yellow Category',
    MEETING: 'Red Category',
};

/**
 * Get Microsoft Graph API access token using client credentials flow
 * This allows server-side automation without user interaction
 */
async function getGraphAccessToken(): Promise<string> {
    // Use Azure AD / MSAL credentials
    const clientId = process.env.AZURE_CLIENT_ID || process.env.VITE_MSAL_CLIENT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;
    const tenantId = process.env.AZURE_TENANT_ID || process.env.VITE_MSAL_AUTHORITY?.split('/').pop();

    if (!clientId || !clientSecret || !tenantId) {
        console.error('Missing Graph API credentials:', {
            hasClientId: !!clientId,
            hasClientSecret: !!clientSecret,
            hasTenantId: !!tenantId
        });
        throw new Error('Microsoft Graph API credentials not configured');
    }

    // Get token using client credentials flow
    const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const params = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials'
    });

    const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Token acquisition failed:', errorText);
        throw new Error(`Failed to get access token: ${response.statusText}`);
    }

    const data = await response.json();
    return data.access_token;
}

/**
 * Get the M365 Group ID for the SGA QA calendar
 * This is the Teams Group that owns the shared calendar
 */
function getGroupId(): string {
    const groupId = process.env.TEAMS_GROUP_ID || process.env.M365_GROUP_ID;
    if (!groupId) {
        throw new Error('TEAMS_GROUP_ID environment variable is required for calendar integration');
    }
    return groupId;
}

/**
 * Create a calendar event in the M365 Group Calendar (shared Teams calendar)
 */
export async function createCalendarEvent(event: CalendarEvent): Promise<string> {
    const accessToken = await getGraphAccessToken();
    const groupId = getGroupId();

    // Use Group Calendar endpoint (not /me/)
    const response = await fetch(
        `${GRAPH_BASE_URL}/groups/${groupId}/calendar/events`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(event)
        }
    );

    if (!response.ok) {
        const error = await response.text();
        console.error('Create calendar event failed:', error);
        throw new Error(`Failed to create calendar event: ${error}`);
    }

    const createdEvent = await response.json();
    return createdEvent.id;
}

/**
 * Update an existing calendar event
 */
export async function updateCalendarEvent(eventId: string, updates: Partial<CalendarEvent>): Promise<void> {
    const accessToken = await getGraphAccessToken();
    const groupId = getGroupId();

    const response = await fetch(
        `${GRAPH_BASE_URL}/groups/${groupId}/calendar/events/${eventId}`,
        {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updates)
        }
    );

    if (!response.ok) {
        const error = await response.text();
        console.error('Update calendar event failed:', error);
        throw new Error(`Failed to update calendar event: ${error}`);
    }
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(eventId: string): Promise<void> {
    const accessToken = await getGraphAccessToken();
    const groupId = getGroupId();

    const response = await fetch(
        `${GRAPH_BASE_URL}/groups/${groupId}/calendar/events/${eventId}`,
        {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        }
    );

    if (!response.ok && response.status !== 404) {
        const error = await response.text();
        console.error('Delete calendar event failed:', error);
        throw new Error(`Failed to delete calendar event: ${error}`);
    }
}

/**
 * Get calendar events within a date range
 */
export async function getCalendarEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    const accessToken = await getGraphAccessToken();
    const groupId = getGroupId();

    const startDateTime = startDate.toISOString();
    const endDateTime = endDate.toISOString();

    const response = await fetch(
        `${GRAPH_BASE_URL}/groups/${groupId}/calendar/calendarView?startDateTime=${startDateTime}&endDateTime=${endDateTime}&$orderby=start/dateTime`,
        {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Prefer': 'outlook.timezone="Australia/Perth"'
            }
        }
    );

    if (!response.ok) {
        const error = await response.text();
        console.error('Get calendar events failed:', error);
        throw new Error(`Failed to get calendar events: ${error}`);
    }

    const data = await response.json();
    return data.value || [];
}

/**
 * Get a single calendar event by ID
 */
export async function getCalendarEvent(eventId: string): Promise<CalendarEvent | null> {
    const accessToken = await getGraphAccessToken();
    const groupId = getGroupId();

    const response = await fetch(
        `${GRAPH_BASE_URL}/groups/${groupId}/calendar/events/${eventId}`,
        {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        }
    );

    if (response.status === 404) {
        return null;
    }

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get calendar event: ${error}`);
    }

    return await response.json();
}

/**
 * Create calendar event for a job assignment
 * This is called when a job is scheduled/assigned
 */
export async function createJobCalendarEvent(job: {
    jobNo: string;
    client: string;
    projectName: string;
    location: string;
    jobDate: string;
    division: 'Asphalt' | 'Profiling' | 'Spray';
    foremanEmail?: string;
    foremanName?: string;
    shift?: 'Day' | 'Night';
    estimatedDuration?: number; // hours
}): Promise<string> {
    const jobDateTime = new Date(job.jobDate);

    // Set start time based on shift
    if (job.shift === 'Night') {
        jobDateTime.setHours(18, 0, 0, 0); // 6 PM start for night shift
    } else {
        jobDateTime.setHours(6, 0, 0, 0);  // 6 AM start for day shift
    }

    const endDateTime = new Date(jobDateTime);
    const duration = job.estimatedDuration || 8; // Default 8 hours
    endDateTime.setHours(jobDateTime.getHours() + duration);

    // Get category based on division
    let category: string;
    switch (job.division) {
        case 'Asphalt':
            category = CalendarCategories.JOB_ASPHALT;
            break;
        case 'Profiling':
            category = CalendarCategories.JOB_PROFILING;
            break;
        case 'Spray':
            category = CalendarCategories.JOB_SPRAY;
            break;
        default:
            category = CalendarCategories.JOB_ASPHALT;
    }

    const event: CalendarEvent = {
        subject: `[${job.division}] ${job.jobNo} - ${job.client}`,
        start: {
            dateTime: jobDateTime.toISOString(),
            timeZone: DEFAULT_TIMEZONE
        },
        end: {
            dateTime: endDateTime.toISOString(),
            timeZone: DEFAULT_TIMEZONE
        },
        location: {
            displayName: job.location
        },
        body: {
            contentType: 'HTML',
            content: `
                <h2>${job.projectName}</h2>
                <table style="border-collapse: collapse; width: 100%;">
                    <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Job Number:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${job.jobNo}</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Client:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${job.client}</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Division:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${job.division}</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Location:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${job.location}</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Shift:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${job.shift || 'Day'}</td></tr>
                    ${job.foremanName ? `<tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Assigned Foreman:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${job.foremanName}</td></tr>` : ''}
                </table>
            `
        },
        attendees: job.foremanEmail ? [
            {
                emailAddress: {
                    address: job.foremanEmail,
                    name: job.foremanName || job.foremanEmail
                },
                type: 'required'
            }
        ] : undefined,
        isReminderOn: true,
        reminderMinutesBeforeStart: 1440, // 24 hours
        categories: [category],
        showAs: 'busy'
    };

    return await createCalendarEvent(event);
}

/**
 * Calculate site visit dates based on client tier
 * Tier 1: 14-day, 7-day, 3-day before project
 * Tier 2: 7-day, 3-day before project
 * Tier 3: 72 hours before project
 */
export function calculateSiteVisitDates(
    projectDate: Date,
    tier: 'Tier 1' | 'Tier 2' | 'Tier 3'
): SiteVisitSchedule[] {
    const visits: SiteVisitSchedule[] = [];

    switch (tier) {
        case 'Tier 1':
            visits.push(
                {
                    visitNumber: 1,
                    visitType: '14-Day',
                    scheduledDate: new Date(projectDate.getTime() - 14 * 24 * 60 * 60 * 1000)
                },
                {
                    visitNumber: 2,
                    visitType: '7-Day',
                    scheduledDate: new Date(projectDate.getTime() - 7 * 24 * 60 * 60 * 1000)
                },
                {
                    visitNumber: 3,
                    visitType: '3-Day',
                    scheduledDate: new Date(projectDate.getTime() - 3 * 24 * 60 * 60 * 1000)
                }
            );
            break;
        case 'Tier 2':
            visits.push(
                {
                    visitNumber: 1,
                    visitType: '7-Day',
                    scheduledDate: new Date(projectDate.getTime() - 7 * 24 * 60 * 60 * 1000)
                },
                {
                    visitNumber: 2,
                    visitType: '3-Day',
                    scheduledDate: new Date(projectDate.getTime() - 3 * 24 * 60 * 60 * 1000)
                }
            );
            break;
        case 'Tier 3':
            visits.push({
                visitNumber: 1,
                visitType: '72-Hour',
                scheduledDate: new Date(projectDate.getTime() - 3 * 24 * 60 * 60 * 1000)
            });
            break;
    }

    // Set visits to 9 AM
    visits.forEach(visit => {
        visit.scheduledDate.setHours(9, 0, 0, 0);
    });

    return visits;
}

/**
 * Create site visit calendar events based on client tier
 * Called automatically when a project is created from tender handover
 */
export async function createSiteVisitEvents(
    projectNumber: string,
    client: string,
    projectDate: Date,
    tier: 'Tier 1' | 'Tier 2' | 'Tier 3',
    scopingPersonEmail: string,
    scopingPersonName: string,
    location: string
): Promise<SiteVisitSchedule[]> {
    const visits = calculateSiteVisitDates(projectDate, tier);

    // Create calendar events for each site visit
    for (const visit of visits) {
        const endDate = new Date(visit.scheduledDate);
        endDate.setHours(11, 0, 0, 0); // 2 hour duration

        const event: CalendarEvent = {
            subject: `[Site Visit] ${projectNumber} - ${client} (${visit.visitType})`,
            start: {
                dateTime: visit.scheduledDate.toISOString(),
                timeZone: DEFAULT_TIMEZONE
            },
            end: {
                dateTime: endDate.toISOString(),
                timeZone: DEFAULT_TIMEZONE
            },
            location: {
                displayName: location
            },
            body: {
                contentType: 'HTML',
                content: `
                    <h2>Site Visit - ${visit.visitType}</h2>
                    <p><strong>Visit ${visit.visitNumber}</strong> for ${tier} client</p>
                    <table style="border-collapse: collapse; width: 100%;">
                        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Project:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${projectNumber}</td></tr>
                        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Client:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${client} (${tier})</td></tr>
                        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Location:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${location}</td></tr>
                    </table>
                    <p style="margin-top: 16px; padding: 12px; background-color: #f3f4f6; border-radius: 4px;">
                        <strong>Action Required:</strong> Complete a Scope Report after this visit using the SGA QA System.
                    </p>
                `
            },
            attendees: [
                {
                    emailAddress: {
                        address: scopingPersonEmail,
                        name: scopingPersonName
                    },
                    type: 'required'
                }
            ],
            isReminderOn: true,
            reminderMinutesBeforeStart: 1440, // 24 hours
            categories: [CalendarCategories.SITE_VISIT],
            showAs: 'busy'
        };

        const eventId = await createCalendarEvent(event);
        visit.eventId = eventId;
    }

    return visits;
}

/**
 * Create project calendar event (overall project timeline)
 */
export async function createProjectCalendarEvent(project: {
    projectNumber: string;
    projectName: string;
    client: string;
    clientTier: 'Tier 1' | 'Tier 2' | 'Tier 3';
    location: string;
    startDate: string;
    endDate: string;
    projectOwnerEmail: string;
    projectOwnerName: string;
}): Promise<string> {
    const startDateTime = new Date(project.startDate);
    startDateTime.setHours(0, 0, 0, 0);

    const endDateTime = new Date(project.endDate);
    endDateTime.setHours(23, 59, 59, 0);

    const event: CalendarEvent = {
        subject: `[Project] ${project.projectNumber} - ${project.projectName}`,
        start: {
            dateTime: startDateTime.toISOString(),
            timeZone: DEFAULT_TIMEZONE
        },
        end: {
            dateTime: endDateTime.toISOString(),
            timeZone: DEFAULT_TIMEZONE
        },
        location: {
            displayName: project.location
        },
        body: {
            contentType: 'HTML',
            content: `
                <h2>${project.projectName}</h2>
                <table style="border-collapse: collapse; width: 100%;">
                    <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Project Number:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${project.projectNumber}</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Client:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${project.client} (${project.clientTier})</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Location:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${project.location}</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Project Owner:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${project.projectOwnerName}</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Start Date:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${new Date(project.startDate).toLocaleDateString('en-AU')}</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>End Date:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${new Date(project.endDate).toLocaleDateString('en-AU')}</td></tr>
                </table>
            `
        },
        attendees: [
            {
                emailAddress: {
                    address: project.projectOwnerEmail,
                    name: project.projectOwnerName
                },
                type: 'required'
            }
        ],
        isReminderOn: true,
        reminderMinutesBeforeStart: 10080, // 7 days
        categories: [CalendarCategories.PROJECT],
        showAs: 'free'  // Show as free since it's an overview event
    };

    return await createCalendarEvent(event);
}

/**
 * Sync job status to calendar event
 * Updates the calendar event when job status changes
 */
export async function syncJobStatusToCalendar(
    eventId: string,
    status: string,
    jobNo: string
): Promise<void> {
    const updates: Partial<CalendarEvent> = {};

    switch (status) {
        case 'Completed':
            updates.showAs = 'free';
            updates.subject = `✓ [Completed] ${jobNo}`;
            break;
        case 'In Progress':
            updates.showAs = 'busy';
            updates.subject = `⏳ [In Progress] ${jobNo}`;
            break;
        case 'Cancelled':
            // Delete cancelled events
            await deleteCalendarEvent(eventId);
            return;
        default:
            updates.showAs = 'tentative';
    }

    await updateCalendarEvent(eventId, updates);
}

// Export calendar service for convenience
export const CalendarService = {
    createEvent: createCalendarEvent,
    updateEvent: updateCalendarEvent,
    deleteEvent: deleteCalendarEvent,
    getEvents: getCalendarEvents,
    getEvent: getCalendarEvent,
    createJobEvent: createJobCalendarEvent,
    createSiteVisitEvents,
    createProjectEvent: createProjectCalendarEvent,
    syncJobStatus: syncJobStatusToCalendar,
    calculateSiteVisitDates,
};

export default CalendarService;
