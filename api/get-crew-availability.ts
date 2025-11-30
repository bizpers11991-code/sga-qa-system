import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ResourcesData } from './_lib/sharepointData.js';

/**
 * GET /api/get-crew-availability
 *
 * Returns crew availability data for scheduling
 *
 * Query Parameters:
 *   - division: Filter by division (optional)
 *   - startDate: Start date for availability check (optional)
 *   - endDate: End date for availability check (optional)
 *
 * Note: This is a simplified implementation. Full version with
 * real-time availability tracking available in PM_SCHEDULER_001 AI output.
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { division, startDate, endDate } = req.query;

    // Mock crew data - in production, this would come from Redis/database
    const mockCrews = [
      {
        id: 'CREW_A1',
        name: 'Asphalt Crew A',
        division: 'Asphalt',
        foreman: 'John Smith',
        available: true,
        currentAssignment: null,
        upcomingAssignments: []
      },
      {
        id: 'CREW_A2',
        name: 'Asphalt Crew B',
        division: 'Asphalt',
        foreman: 'Mike Davis',
        available: false,
        currentAssignment: 'PRJ-2025-001',
        upcomingAssignments: ['PRJ-2025-002']
      },
      {
        id: 'CREW_A3',
        name: 'Asphalt Crew C',
        division: 'Asphalt',
        foreman: 'Tom Wilson',
        available: true,
        currentAssignment: null,
        upcomingAssignments: []
      },
      {
        id: 'CREW_P1',
        name: 'Profiling Crew 1',
        division: 'Profiling',
        foreman: 'Sarah Jones',
        available: true,
        currentAssignment: null,
        upcomingAssignments: []
      },
      {
        id: 'CREW_P2',
        name: 'Profiling Crew 2',
        division: 'Profiling',
        foreman: 'Emma Brown',
        available: true,
        currentAssignment: null,
        upcomingAssignments: []
      },
      {
        id: 'CREW_S1',
        name: 'Spray Crew 1',
        division: 'Spray',
        foreman: 'Alex Lee',
        available: false,
        currentAssignment: 'Leave',
        upcomingAssignments: []
      },
      {
        id: 'CREW_S2',
        name: 'Spray Crew 2',
        division: 'Spray',
        foreman: 'Chris Taylor',
        available: true,
        currentAssignment: null,
        upcomingAssignments: []
      }
    ];

    // Filter by division if provided
    let crews = mockCrews;
    if (division && division !== 'all') {
      crews = crews.filter(c => c.division === division);
    }

    res.status(200).json({
      success: true,
      crews,
      filters: { division, startDate, endDate }
    });
  } catch (error) {
    console.error('Error fetching crew availability:', error);
    res.status(500).json({
      error: 'Failed to fetch crew availability',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
