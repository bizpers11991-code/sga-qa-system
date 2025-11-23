// api/_lib/calendar.ts
/**
 * Microsoft Graph API Calendar Integration
 * Provides functions to create, update, and sync calendar events with Microsoft Teams
 */

interface CalendarEvent {
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
}

/**
 * Get Microsoft Graph API access token
 * Uses the MSAL configuration from msalConfig.ts
 */
async function getGraphAccessToken(): Promise<string> {
    // In a production environment, this would use the MSAL instance
    // For now, we'll use environment variables for server-side access
    const clientId = process.env.VITE_MSAL_CLIENT_ID || process.env.GRAPH_CLIENT_ID;
    const clientSecret = process.env.GRAPH_CLIENT_SECRET;
    const tenantId = process.env.VITE_MSAL_AUTHORITY?.split('/').pop() || process.env.GRAPH_TENANT_ID;

    if (!clientId || !clientSecret || !tenantId) {
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
        throw new Error(`Failed to get access token: ${response.statusText}`);
    }

    const data = await response.json();
    return data.access_token;
}

/**
 * Create a calendar event in the shared SGA QA Schedule calendar
 */
export async function createCalendarEvent(event: CalendarEvent): Promise<string> {
    const accessToken = await getGraphAccessToken();
    const calendarId = process.env.TEAMS_SHARED_CALENDAR_ID || 'primary';

    const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/calendars/${calendarId}/events`,
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
    const calendarId = process.env.TEAMS_SHARED_CALENDAR_ID || 'primary';

    const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/calendars/${calendarId}/events/${eventId}`,
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
        throw new Error(`Failed to update calendar event: ${error}`);
    }
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(eventId: string): Promise<void> {
    const accessToken = await getGraphAccessToken();
    const calendarId = process.env.TEAMS_SHARED_CALENDAR_ID || 'primary';

    const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/calendars/${calendarId}/events/${eventId}`,
        {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        }
    );

    if (!response.ok && response.status !== 404) {
        const error = await response.text();
        throw new Error(`Failed to delete calendar event: ${error}`);
    }
}

/**
 * Get calendar events within a date range
 */
export async function getCalendarEvents(startDate: Date, endDate: Date): Promise<any[]> {
    const accessToken = await getGraphAccessToken();
    const calendarId = process.env.TEAMS_SHARED_CALENDAR_ID || 'primary';

    const startDateTime = startDate.toISOString();
    const endDateTime = endDate.toISOString();

    const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/calendars/${calendarId}/calendarView?startDateTime=${startDateTime}&endDateTime=${endDateTime}`,
        {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get calendar events: ${error}`);
    }

    const data = await response.json();
    return data.value || [];
}

/**
 * Create calendar event for a job assignment
 */
export async function createJobCalendarEvent(job: {
    jobNo: string;
    client: string;
    projectName: string;
    address: string;
    jobDate: string;
    foremanEmail: string;
    foremanName: string;
}): Promise<string> {
    const jobDateTime = new Date(job.jobDate);
    const endDateTime = new Date(jobDateTime);
    endDateTime.setHours(jobDateTime.getHours() + 8); // 8-hour job duration

    const event: CalendarEvent = {
        subject: `${job.jobNo} - ${job.client}`,
        start: {
            dateTime: jobDateTime.toISOString(),
            timeZone: 'Australia/Sydney'
        },
        end: {
            dateTime: endDateTime.toISOString(),
            timeZone: 'Australia/Sydney'
        },
        location: {
            displayName: job.address
        },
        body: {
            contentType: 'HTML',
            content: `
                <h2>${job.projectName}</h2>
                <p><strong>Job Number:</strong> ${job.jobNo}</p>
                <p><strong>Client:</strong> ${job.client}</p>
                <p><strong>Location:</strong> ${job.address}</p>
                <p><strong>Assigned Foreman:</strong> ${job.foremanName}</p>
            `
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
        isReminderOn: true,
        reminderMinutesBeforeStart: 1440 // 24 hours
    };

    return await createCalendarEvent(event);
}

/**
 * Create site visit calendar events based on client tier
 */
export async function createSiteVisitEvents(
    jobNo: string,
    client: string,
    projectDate: Date,
    tier: 'Tier 1' | 'Tier 2' | 'Tier 3',
    engineerEmail: string,
    engineerName: string,
    location: string
): Promise<string[]> {
    const eventIds: string[] = [];
    const visits: Array<{ daysBefor: number; description: string }> = [];

    // Calculate site visit dates based on tier
    switch (tier) {
        case 'Tier 1':
            visits.push(
                { daysBefor: 14, description: '14 days before project' },
                { daysBefor: 7, description: '7 days before project' },
                { daysBefor: 3, description: '3 days before project' }
            );
            break;
        case 'Tier 2':
            visits.push(
                { daysBefor: 7, description: '7 days before project' },
                { daysBefor: 3, description: '3 days before project' }
            );
            break;
        case 'Tier 3':
            visits.push({ daysBefor: 3, description: 'Within 72 hours of project' });
            break;
    }

    // Create calendar events for each site visit
    for (const visit of visits) {
        const visitDate = new Date(projectDate);
        visitDate.setDate(visitDate.getDate() - visit.daysBefor);
        visitDate.setHours(9, 0, 0, 0); // 9 AM start

        const endDate = new Date(visitDate);
        endDate.setHours(10, 0, 0, 0); // 1 hour duration

        const event: CalendarEvent = {
            subject: `Site Visit: ${jobNo} - ${client}`,
            start: {
                dateTime: visitDate.toISOString(),
                timeZone: 'Australia/Sydney'
            },
            end: {
                dateTime: endDate.toISOString(),
                timeZone: 'Australia/Sydney'
            },
            location: {
                displayName: location
            },
            body: {
                contentType: 'HTML',
                content: `
                    <h2>Site Visit - ${visit.description}</h2>
                    <p><strong>Job Number:</strong> ${jobNo}</p>
                    <p><strong>Client:</strong> ${client} (${tier})</p>
                    <p><strong>Location:</strong> ${location}</p>
                    <p><em>Please complete a scope report after this visit.</em></p>
                `
            },
            attendees: [
                {
                    emailAddress: {
                        address: engineerEmail,
                        name: engineerName
                    },
                    type: 'required'
                }
            ],
            isReminderOn: true,
            reminderMinutesBeforeStart: 1440 // 24 hours
        };

        const eventId = await createCalendarEvent(event);
        eventIds.push(eventId);
    }

    return eventIds;
}
