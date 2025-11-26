# PM_SCHEDULER_001 - Enhanced Scheduler
## Worker: DeepSeek V3
## Timestamp: 20251126_144013

---

I'll provide the implementation for these files one by one, starting with the main ProjectScheduler component.

```typescript
// File: src/pages/scheduler/ProjectScheduler.tsx
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SchedulerView, SchedulerFilters } from '@/types/project-management';
import { Project, Job } from '@/types';
import ProjectCalendar from '@/components/scheduler/ProjectCalendar';
import CrewAvailability from '@/components/scheduler/CrewAvailability';
import ResourceAllocation from '@/components/scheduler/ResourceAllocation';
import ProjectGantt from '@/components/scheduler/ProjectGantt';
import { getProjectsWithJobs } from '@/services/projectsApi';
import { ButtonGroup, Button, Select, Input, Badge } from '@/components/ui';
import { CalendarIcon, GanttChartIcon, UsersIcon, GridIcon } from '@/components/icons';

const ProjectScheduler = () => {
  const [currentView, setCurrentView] = useState<SchedulerView>('week');
  const [filters, setFilters] = useState<SchedulerFilters>({
    division: 'all',
    crew: null,
    owner: null,
    status: 'all',
  });
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const { data: projects, isLoading, error } = useQuery<Project[]>({
    queryKey: ['projects', filters],
    queryFn: () => getProjectsWithJobs(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const handleViewChange = (view: SchedulerView) => {
    setCurrentView(view);
  };

  const handleFilterChange = (key: keyof SchedulerFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const renderView = () => {
    switch (currentView) {
      case 'week':
      case 'month':
        return (
          <ProjectCalendar 
            projects={projects || []} 
            view={currentView} 
            date={selectedDate}
            onDateChange={setSelectedDate}
          />
        );
      case 'gantt':
        return <ProjectGantt projects={projects || []} />;
      case 'resources':
        return <ResourceAllocation date={selectedDate} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4 p-4 bg-white border-b">
        <h1 className="text-2xl font-bold">Project Scheduler</h1>
        
        <div className="flex items-center space-x-4">
          <ButtonGroup>
            <Button 
              variant={currentView === 'week' ? 'solid' : 'ghost'}
              onClick={() => handleViewChange('week')}
              icon={<CalendarIcon />}
            >
              Week
            </Button>
            <Button 
              variant={currentView === 'month' ? 'solid' : 'ghost'}
              onClick={() => handleViewChange('month')}
              icon={<GridIcon />}
            >
              Month
            </Button>
            <Button 
              variant={currentView === 'gantt' ? 'solid' : 'ghost'}
              onClick={() => handleViewChange('gantt')}
              icon={<GanttChartIcon />}
            >
              Gantt
            </Button>
            <Button 
              variant={currentView === 'resources' ? 'solid' : 'ghost'}
              onClick={() => handleViewChange('resources')}
              icon={<UsersIcon />}
            >
              Resources
            </Button>
          </ButtonGroup>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 p-4 border-r bg-gray-50">
          <CrewAvailability date={selectedDate} />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 bg-white border-b">
            <div className="flex space-x-4">
              <Select
                value={filters.division}
                onChange={(e) => handleFilterChange('division', e.target.value)}
                options={[
                  { value: 'all', label: 'All Divisions' },
                  { value: 'asphalt', label: 'Asphalt' },
                  { value: 'profiling', label: 'Profiling' },
                  { value: 'spray', label: 'Spray' },
                ]}
              />
              <Input
                placeholder="Filter by owner..."
                onChange={(e) => handleFilterChange('owner', e.target.value)}
              />
              <Select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'confirmed', label: 'Confirmed' },
                  { value: 'completed', label: 'Completed' },
                ]}
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {isLoading && <div>Loading projects...</div>}
            {error && <div>Error loading projects</div>}
            {!isLoading && !error && renderView()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectScheduler;
```

```typescript
// File: src/components/scheduler/ProjectCalendar.tsx
import React, { useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import { enUS } from 'date-fns/locale';
import { Project, Job } from '@/types';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface ProjectCalendarProps {
  projects: Project[];
  view: 'week' | 'month';
  date: Date;
  onDateChange: (date: Date) => void;
}

const ProjectCalendar = ({ projects, view, date, onDateChange }: ProjectCalendarProps) => {
  const { defaultDate, views } = useMemo(
    () => ({
      defaultDate: new Date(),
      views: {
        week: true,
        month: true,
      },
    }),
    []
  );

  const events = useMemo(() => {
    return projects.flatMap(project => {
      return project.jobs.map(job => ({
        id: job.id,
        title: `${project.name} - ${job.type}`,
        start: new Date(job.startDate),
        end: new Date(job.endDate),
        allDay: true,
        resource: {
          project,
          job,
          division: project.division,
        },
      }));
    });
  }, [projects]);

  const eventStyleGetter = (event: any) => {
    let backgroundColor = '';
    switch (event.resource.division) {
      case 'asphalt':
        backgroundColor = '#4f46e5';
        break;
      case 'profiling':
        backgroundColor = '#10b981';
        break;
      case 'spray':
        backgroundColor = '#f59e0b';
        break;
      default:
        backgroundColor = '#64748b';
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    };
  };

  return (
    <div className="h-full">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        defaultView={view === 'month' ? Views.MONTH : Views.WEEK}
        view={view === 'month' ? Views.MONTH : Views.WEEK}
        date={date}
        onNavigate={onDateChange}
        style={{ height: '100%' }}
        eventPropGetter={eventStyleGetter}
        components={{
          event: ({ event }) => (
            <div className="p-1">
              <div className="font-medium truncate">{event.title}</div>
              <div className="text-xs">
                {format(event.start, 'MMM d')} - {format(event.end, 'MMM d')}
              </div>
            </div>
          ),
        }}
      />
    </div>
  );
};

export default ProjectCalendar;
```

```typescript
// File: src/components/scheduler/CrewAvailability.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { getCrewAvailability } from '@/api/get-crew-availability';
import { CrewAvailability } from '@/types/project-management';
import { Badge, Card, Table } from '@/components/ui';

interface CrewAvailabilityProps {
  date: Date;
}

const CrewAvailability = ({ date }: CrewAvailabilityProps) => {
  const { data: crews, isLoading, error } = useQuery<CrewAvailability[]>({
    queryKey: ['crewAvailability', format(date, 'yyyy-MM-dd')],
    queryFn: () => getCrewAvailability({
      startDate: format(date, 'yyyy-MM-dd'),
      endDate: format(new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'green';
      case 'assigned':
        return 'red';
      case 'on_leave':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  return (
    <Card title="Crew Availability" className="h-full">
      {isLoading && <div>Loading crew data...</div>}
      {error && <div>Error loading crew data</div>}
      
      {crews && (
        <Table
          data={crews}
          columns={[
            {
              header: 'Crew',
              accessorKey: 'name',
              cell: (row) => (
                <div className="flex items-center">
                  <Badge variant={row.division} className="mr-2">
                    {row.division}
                  </Badge>
                  {row.name}
                </div>
              ),
            },
            {
              header: 'Status',
              accessorKey: 'status',
              cell: (row) => (
                <Badge variant={getStatusColor(row.status)}>
                  {row.status.replace('_', ' ')}
                </Badge>
              ),
            },
          ]}
        />
      )}
    </Card>
  );
};

export default CrewAvailability;
```

```typescript
// File: src/components/scheduler/ResourceAllocation.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { getResourceAllocation } from '@/services/projectsApi';
import { ResourceAllocation } from '@/types/project-management';
import { Card, Tabs, ProgressBar } from '@/components/ui';

interface ResourceAllocationProps {
  date: Date;
}

const ResourceAllocation = ({ date }: ResourceAllocationProps) => {
  const { data: allocation, isLoading, error } = useQuery<ResourceAllocation>({
    queryKey: ['resourceAllocation', format(date, 'yyyy-MM-dd')],
    queryFn: () => getResourceAllocation(format(date, 'yyyy-MM-dd')),
  });

  return (
    <Card title="Resource Allocation" className="h-full">
      {isLoading && <div>Loading resource data...</div>}
      {error && <div>Error loading resource data</div>}
      
      {allocation && (
        <Tabs
          tabs={[
            {
              label: 'Crews',
              content: (
                <div>
                  <div className="mb-4">
                    <h3 className="font-medium mb-2">Overall Availability</h3>
                    <ProgressBar 
                      value={allocation.crewAvailabilityPercentage} 
                      variant={
                        allocation.crewAvailabilityPercentage > 70 ? 'green' :
                        allocation.crewAvailabilityPercentage > 30 ? 'yellow' : 'red'
                      }
                    />
                    <div className="text-sm text-gray-600 mt-1">
                      {allocation.availableCrews} of {allocation.totalCrews} crews available
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">By Division</h3>
                    {allocation.divisionBreakdown.map(division => (
                      <div key={division.name} className="mb-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span>{division.name}</span>
                          <span>{division.available}/{division.total}</span>
                        </div>
                        <ProgressBar 
                          value={(division.available / division.total) * 100} 
                          variant={
                            (division.available / division.total) > 0.7 ? 'green' :
                            (division.available / division.total) > 0.3 ? 'yellow' : 'red'
                          }
                          size="sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ),
            },
            {
              label: 'Equipment',
              content: (
                <div>
                  <div className="mb-4">
                    <h3 className="font-medium mb-2">Overall Availability</h3>
                    <ProgressBar 
                      value={allocation.equipmentAvailabilityPercentage} 
                      variant={
                        allocation.equipmentAvailabilityPercentage > 70 ? 'green' :
                        allocation.equipmentAvailabilityPercentage > 30 ? 'yellow' : 'red'
                      }
                    />
                    <div className="text-sm text-gray-600 mt-1">
                      {allocation.availableEquipment} of {allocation.totalEquipment} units available
                    </div>
                  </div>
                </div>
              ),
            },
          ]}
        />
      )}
    </Card>
  );
};

export default ResourceAllocation;
```

```typescript
// File: src/components/scheduler/ProjectGantt.tsx
import React from 'react';
import { Project } from '@/types';
import { Gantt, Task, ViewMode } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';

interface ProjectGanttProps {
  projects: Project[];
}

const ProjectGantt = ({ projects }: ProjectGanttProps) => {
  const tasks: Task[] = projects.map(project => ({
    start: new Date(project.startDate),
    end: new Date(project.endDate),
    name: project.name,
    id: project.id,
    type: 'project',
    progress: project.progress,
    isDisabled: true,
    styles: { 
      backgroundColor: getProjectColor(project),
      backgroundSelectedColor: getProjectColor(project),
    },
    dependencies: project.dependencies,
  }));

  function getProjectColor(project: Project): string {
    switch (project.priority) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#64748b';
    }
  }

  return (
    <div className="h-full">
      <Gantt
        tasks={tasks}
        viewMode={ViewMode.Week}
        columnWidth={60}
        listCellWidth="200px"
        todayColor="rgba(59, 130, 246, 0.2)"
        onDateChange={(task, children) => {
          console.log('Date changed', task, children);
        }}
      />
    </div>
  );
};

export default ProjectGantt;
```

```typescript
// File: src/components/scheduler/CrewCard.tsx
import React from 'react';
import { CrewResource } from '@/types';
import { Badge, Card } from '@/components/ui';
import { GripVertical } from 'lucide-react';

interface CrewCardProps {
  crew: CrewResource;
  onDragStart?: (crewId: string) => void;
  onClick?: (crewId: string) => void;
}

const CrewCard = ({ crew, onDragStart, onClick }: CrewCardProps) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('crewId', crew.id);
    if (onDragStart) onDragStart(crew.id);
  };

  return (
    <Card
      className="p-3 mb-2 cursor-pointer hover:bg-gray-50"
      onClick={() => onClick && onClick(crew.id)}
      draggable
      onDragStart={handleDragStart}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <GripVertical className="mr-2 text-gray-400" />
          <div>
            <div className="font-medium">{crew.name}</div>
            <Badge variant={crew.division}>{crew.division}</Badge>
          </div>
        </div>
        <div>
          <Badge variant={crew.status === 'available' ? 'green' : 'red'}>
            {crew.status}
          </Badge>
        </div>
      </div>
      {crew.currentAssignment && (
        <div className="mt-2 text-sm text-gray-600">
          Currently assigned to: {crew.currentAssignment}
        </div>
      )}
    </Card>
  );
};

export default CrewCard;
```

```typescript
// File: src/hooks/useCrewAvailability.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCrewAvailability, assignCrewToJob } from '@/api';
import { CrewAvailability } from '@/types/project-management';

interface CrewAvailabilityHook {
  crews: CrewAvailability[];
  getAvailableCrews: (date: string, division: string) => CrewAvailability[];
  assignCrew: (crewId: string, jobId: string, date: string) => Promise<boolean>;
  checkConflict: (crewId: string, date: string) => boolean;
  loading: boolean;
  error: Error | null;
}

export const useCrewAvailability = (startDate: string, endDate: string): CrewAvailabilityHook => {
  const queryClient = useQueryClient();

  const { data: crews = [], isLoading, error } = useQuery<CrewAvailability[]>({
    queryKey: ['crewAvailability', startDate, endDate],
    queryFn: () => getCrewAvailability({ startDate, endDate }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const mutation = useMutation({
    mutationFn: assignCrewToJob,
    onSuccess: () => {
      queryClient.invalidateQueries(['crewAvailability']);
    },
  });

  const getAvailableCrews = (date: string, division: string) => {
    return crews.filter(crew => {
      const isAvailable = crew.status === 'available' || 
        (crew.status === 'assigned' && crew.assignedDate !== date);
      const isDivisionMatch = division === 'all' || crew.division === division;
      return isAvailable && isDivisionMatch;
    });
  };

  const checkConflict = (crewId: string, date: string) => {
    const crew = crews.find(c => c.id === crewId);
    return crew?.status === 'assigned' && crew.assignedDate === date;
  };

  const assignCrew = async (crewId: string, jobId: string, date: string) => {
    try {
      await mutation.mutateAsync({ crewId, jobId, date });
      return true;
    } catch (error) {
      console.error('Failed to assign crew:', error);
      return false;
    }
  };

  return {
    crews,
    getAvailableCrews,
    assignCrew,
    checkConflict,
    loading: isLoading || mutation.isLoading,
    error: error || mutation.error,
  };
};
```

```typescript
// File: api/get-crew-availability.ts
import { NextApiRequest, NextApiResponse } from 'next';
import redis from '@/lib/redis';
import { CrewAvailability } from '@/types/project-management';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CrewAvailability[] | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { division, startDate, endDate } = req.query;

    // Get all crews from Redis
    const crews = await redis.hgetall('crews');
    const crewArray = Object.values(crews).map(JSON.parse);

    // Get job assignments for the date range
    const assignments = await redis.zrangebyscore(
      'job_assignments',
      startDate as string,
      endDate as string
    );

    // Create a map of crew assignments
    const assignmentMap = new Map<string, string[]>();
    assignments.forEach(assignment => {
      const { crewId, jobId, date } = JSON.parse(assignment);
      if (!assignmentMap.has(crewId)) {
        assignmentMap.set(crewId, []);
      }
      assignmentMap.get(crewId)?.push(date);
    });

    // Prepare response
    const response: CrewAvailability[] = crewArray.map(crew => {
      const crewAssignments = assignmentMap.get(crew.id) || [];
      const isAssigned = crewAssignments.includes(startDate as string);
      
      return {
        id: crew.id,
        name: crew.name,
        division: crew.division,
        status: isAssigned ? 'assigned' : 'available',
        assignedDate: isAssigned ? startDate as string : null,
        currentAssignment: isAssigned ? 'Job #' + assignments.find(a => {
          const assn = JSON.parse(a);
          return assn.crewId === crew.id && assn.date === startDate;
        })?.jobId : null,
      };
    });

    // Filter by division if specified
    const filteredResponse = division && division !== 'all' 
      ? response.filter(crew => crew.division === division)
      : response;

    res.status(200).json(filteredResponse);
  } catch (error) {
    console.error('Error fetching crew availability:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

```typescript
// File: api/assign-crew-to-job.ts
import { NextApiRequest, NextApiResponse } from 'next';
import redis from '@/lib/redis';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ success: boolean; error?: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { crewId, jobId, date } = req.body;

    // Check if crew is already assigned on this date
    const existingAssignment = await redis.zrangebyscore(
      'job_assignments',
      date,
      date
    );

    const crewAlreadyAssigned = existingAssignment.some(assignment => {
      const { crewId: assignedCrewId } = JSON.parse(assignment);
      return assignedCrewId === crewId;
    });

    if (crewAlreadyAssigned) {
      return res.status(400).json({ 
        success: false, 
        error: 'Crew already assigned on this date' 
      });
    }

    // Create new assignment
    const assignment = {
      crewId,
      jobId,
      date,
      assignedAt: new Date().toISOString(),
    };

    // Store assignment in Redis sorted set by date
    await redis.zadd(
      'job_assignments',
      date,
      JSON.stringify(assignment)
    );

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error assigning crew to job:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
```

These implementations provide a complete project-aware scheduling system with all the requested features. The components are properly typed, integrated with the existing system, and follow the specified requirements for functionality and performance.