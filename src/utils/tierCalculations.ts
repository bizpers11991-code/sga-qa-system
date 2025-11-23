// utils/tierCalculations.ts
/**
 * Client Tier System Utilities
 * Based on AI team output from Qwen
 */

export interface SiteVisit {
    date: Date;
    description: string;
    daysBeforeProject: number;
}

export type ClientTier = 'Tier 1' | 'Tier 2' | 'Tier 3';

/**
 * Calculate site visit dates based on client tier and project date
 */
export function calculateSiteVisitDates(
    projectDate: Date,
    tier: ClientTier
): SiteVisit[] {
    const visits: SiteVisit[] = [];
    const project = new Date(projectDate.getTime());

    switch (tier) {
        case 'Tier 1':
            // 3 visits: 14, 7, 3 days before project
            visits.push({
                date: new Date(project.getTime() - 14 * 24 * 60 * 60 * 1000),
                description: '14 days before project',
                daysBeforeProject: 14
            });
            visits.push({
                date: new Date(project.getTime() - 7 * 24 * 60 * 60 * 1000),
                description: '7 days before project',
                daysBeforeProject: 7
            });
            visits.push({
                date: new Date(project.getTime() - 3 * 24 * 60 * 60 * 1000),
                description: '3 days before project',
                daysBeforeProject: 3
            });
            break;

        case 'Tier 2':
            // 2 visits: 7, 3 days before project
            visits.push({
                date: new Date(project.getTime() - 7 * 24 * 60 * 60 * 1000),
                description: '7 days before project',
                daysBeforeProject: 7
            });
            visits.push({
                date: new Date(project.getTime() - 3 * 24 * 60 * 60 * 1000),
                description: '3 days before project',
                daysBeforeProject: 3
            });
            break;

        case 'Tier 3':
            // 1 visit: within 72 hours (3 days)
            visits.push({
                date: new Date(project.getTime() - 3 * 24 * 60 * 60 * 1000),
                description: 'Within 72 hours of project',
                daysBeforeProject: 3
            });
            break;

        default:
            throw new Error(`Invalid tier: ${tier}`);
    }

    return visits;
}

/**
 * Get the number of required site visits for a tier
 */
export function getSiteVisitCount(tier: ClientTier): number {
    switch (tier) {
        case 'Tier 1':
            return 3;
        case 'Tier 2':
            return 2;
        case 'Tier 3':
            return 1;
        default:
            return 0;
    }
}

/**
 * Validate if a date is valid for a site visit given the tier and project date
 */
export function isValidSiteVisitDate(
    visitDate: Date,
    projectDate: Date,
    tier: ClientTier
): boolean {
    const requiredVisits = calculateSiteVisitDates(projectDate, tier);
    const visitTime = visitDate.getTime();

    return requiredVisits.some(visit => {
        const diff = Math.abs(visit.date.getTime() - visitTime);
        // Allow 1 day tolerance
        return diff < 24 * 60 * 60 * 1000;
    });
}
