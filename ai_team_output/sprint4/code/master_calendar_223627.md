# Task: master_calendar

**Worker:** qwen
**Generated:** 2025-11-21T22:36:27.226741

---

<think>
Okay, I need to create a Master Calendar component for the SGA QA application. Let me start by breaking down the requirements. The user wants Week, Month, and Day views, so using a library like react-big-calendar makes sense since it supports those views. 

First, I'll need to import and set up react-big-calendar with TypeScript. I remember that react-big-calendar has a default theme, but since the user mentioned using Tailwind CSS, maybe I should customize the styles accordingly. But I should check if react-big-calendar is compatible with Tailwind.

Next, the calendar needs to filter by division, crew, and assigned engineer/admin. That means setting up state for these filters. Each filter probably needs a dropdown or some selection component. I'll need to create a header section for the filters and the calendar views.

Color coding by job status: scheduled, in-progress, completed. So each event should have a status property, and the event component can use that to apply different background colors. I'll need to define a map from status to color, maybe using Tailwind's color classes.

The event click handler for viewing details should be straightforward with the event's `onClick` property in the Calendar component. And drag-and-drop for rescheduling is optional, but I should consider if the library supports that. React-big-calendar has event resizing and dragging if I import the necessary components like `EventWrapper`, but it might require some setup.

Now, the types for events and filters. The user wants TypeScript types, so I'll define `CalendarEvent` with all necessary properties like title, start, end, division, crew, engineer, status. The filters will have state variables for selected division, crew, and engineer.

Integration with Microsoft Graph API for Teams is mentioned, so the calendar events might need to have an `id` that can be linked to Graph events, maybe with an `outlookCalendarId` or something. But the component itself probably just needs to handle the events data structure, so that part might be handled elsewhere when syncing with the API.

Let me outline the structure:

1. Define TypeScript interfaces for CalendarEvent and Filters.
2. Set up state for the filters (selectedDivision, selectedCrew, selectedEngineer).
3. Set up state for the calendar view (e.g., "month", "week", "day").
4. Filter the events based on the selected filters.
5. Render the Calendar component with the filtered events.
6. Customize the event rendering with color based on status.
7. Add handlers for clicking on events and possibly drag-and-drop.

For the filtering, I'll need to filter the events array each time the filters change. So a useMemo or a function that takes the current events and filters and returns the filtered list.

Now, the code structure. The calendar component will be a React component using useState and useEffect if needed. Tailwind classes will be applied for styling. Let me think about how to implement the filters. Maybe using a dropdown for each filter (division, crew, engineer) with options.

Wait, but how does the user get the list of divisions, crews, and engineers? Assuming that these are provided as props or fetched from an API, but for the component itself, perhaps the data is passed in, maybe the events are passed in as a prop.

The component may need to accept events as a prop, or fetch them internally. But since the user wants it ready to integrate with Microsoft Graph, the events might be fetched from Graph API. However, for the component, I'll probably define an interface and pass the events as props.

So the component will probably be a function component that receives events and maybe the options for filters (crews, divisions, engineers) as props. However, the user hasn't specified that, maybe the example can include some dummy data for demonstration.

Wait, the user hasn't given code for the backend or data fetching, so the example should probably include dummy events and filters. So in the example, I can create some sample data for events and possible filter options.

Let me structure the component. Let's start with the types. Define CalendarEvent with all the required fields.

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  division: string;
  crew: string;
  engineer: string;
  status: 'scheduled' | 'in-progress' | 'completed';
  // Maybe other fields if needed, like color or outlookCalendarId
}

Filter types could be:

interface Filters {
  selectedDivision: string | null;
  selectedCrew: string | null;
  selectedEngineer: string | null;
}

But in the component, these will be state variables, probably managed via useState.

The calendar component will need to render the calendar with the filtered events. So the main component will use react-big-calendar, apply filters, and handle view changes.

Now, for the filters UI: dropdowns for divisions, crews, and engineers. The options for these dropdowns would come from the data, but for the component example, maybe they are passed as props or derived from the events. For example, divisions can be ['Asphalt', 'Profiling', 'Spray', 'Grooving'] as per the requirements.

So, in the example, the component could accept props for divisions, crews, engineers, and events. But for the sake of a standalone component, maybe the example will have sample data.

Putting it all together.

First, install react-big-calendar and @types/react-big-calendar if necessary. But in the code block, I can't do that, so the example will just import it.

Next, set up the calendar with localizer. React-big-calendar requires setting up a localizer, like moment or date-fns. Since the user might use moment, but the code can use the default one.

The custom event color can be handled using the event's `style` property, or by passing in a custom component for events.

In the event component, based on the status, apply a background color. For example, scheduled could be blue, in-progress green, completed gray.

For the views, the user can switch between Day, Week, Month. The Calendar component allows that with the `views` prop.

Now, the drag-and-drop is optional. If I include it, I need to handle it. React-big-calendar has experimental support for drag and drop, so maybe import `components` and `dnd`. But that adds complexity. Maybe the initial code example can include it as a placeholder, just setting it up, but the user can choose to implement it later.

For the Microsoft Graph integration, the component might not need to handle it directly; that's more for data fetching and syncing. So the component can accept events that are synced with Graph.

Now, putting all into code.

Start with TypeScript code.

Import necessary modules.

import React, { useState, useMemo, useCallback } from 'react';
import { Calendar, momentLocalizer, View, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useNavigate } from 'react-router-dom'; // For handling job details click

Wait, maybe for the event click, navigate to a job details page. But in the example, maybe just log the event or show a modal. Since the user says "click to view job details", perhaps using a Modal or some routing.

But in the example, I can have a function that handles the click, maybe redirects to '/jobs/' + id, but that depends on the app's routing.

Now, for the Tailwind styles. React-big-calendar's default CSS is based on bootstrap, but with Tailwind, I may need to override the styles. However, that can be tricky. Alternatively, use custom event components with Tailwind classes.

The event's appearance can be controlled by using `event` prop in Calendar and a custom component. So the `event` component can be a function that returns JSX with Tailwind classes.

For example, the event component could be:

const EventComponent = ({ event }) => (
  <div className={`text-white p-1 rounded ${getStatusColor(event.status)}`}>
    {event.title}
  </div>
);

Where `getStatusColor` is a helper function that returns Tailwind color classes based on status.

Now, putting all together.

Define the component:

export const MasterCalendar: React.FC<CalendarProps> = ({ events }) => {
  // ... state and logic
  return (<Calendar /> ...);
};

CalendarProps could include events, divisions, crews, engineers. For the purpose of the example, let's assume that divisions, crews, engineers are static or passed in.

Wait, the user might expect that the component can receive the possible options for divisions, crews, and engineers. But for the example, let's hardcode the options.

Let me think of the props. Maybe the component should accept the possible options for filters. But maybe the example will include them as static data.

In the code example, the component could look like this.

But the user wants the code to be ready for integration with Microsoft Graph API, which probably means the event shapes are compatible. So the event's properties should have things that Graph API provides. But again, the component is more about UI, so it's okay to have generic structure.

Now, code outline.

1. Setup localizer for react-big-calendar.
2. Define types.
3. Setup state for filters and selected view.
4. Compute filtered events.
5. Handle calendar view changes.
6. Handle event click.
7. Render the UI with Tailwind classes.

Let me start coding.

First, the localizer:

const localizer = momentLocalizer(moment); // or date-fns

But moment is a common choice.

Now, the component.

import React, { useState, useMemo } from 'react';
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';

import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'tailwindcss/tailwind.css'; // Assuming Tailwind is set up

// Types
interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  division: string;
  crew: string;
  engineer: string;
  status: 'scheduled' | 'in-progress' | 'completed';
}

interface CalendarProps {
  events: CalendarEvent[];
}

// Helper for color coding
const getStatusColor = (status: CalendarEvent['status']) => {
  switch (status) {
    case 'scheduled':
      return 'bg-blue-500';
    case 'in-progress':
      return 'bg-green-500';
    case 'completed':
      return 'bg-gray-500';
    default:
      return 'bg-gray-500';
  }
};

const MasterCalendar: React.FC<CalendarProps> = ({ events }) => {
  const [selectedView, setSelectedView] = useState<View>('month');
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null);
  const [selectedCrew, setSelectedCrew] = useState<string | null>(null);
  const [selectedEngineer, setSelectedEngineer] = useState<string | null>(null);

  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const divisionMatch = selectedDivision ? event.division === selectedDivision : true;
      const crewMatch = selectedCrew ? event.crew === selectedCrew : true;
      const engineerMatch = selectedEngineer ? event.engineer === selectedEngineer : true;
      return divisionMatch && crewMatch && engineerMatch;
    });
  }, [events, selectedDivision, selectedCrew, selectedEngineer]);

  // Handle event click
  const handleEventClick = (event: CalendarEvent) => {
    console.log('Event clicked:', event.id);
    // Implement navigation to job details page or modal
  };

  // Handle date change
  const handleNavigate = (newDate: Date) => {
    this.setState({ date: newDate });
  };

  // Custom event component with color coding
  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    return (
      <div className={`${getStatusColor(event.status)} text-white p-1 rounded`}>
        {event.title}
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="bg-white p-4 rounded shadow mb-4">
        <div className="mb-4">
          <label className="mr-2 font-medium">View:</label>
          <select
            value={selectedView}
            onChange={(e) => setSelectedView(e.target.value as View)}
            className="p-1 border rounded"
          >
            <option value="month">Month</option>
            <option value="week">Week</option>
            <option value="day">Day</option>
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block font-medium mb-1">Division</label>
            <select
              value={selectedDivision || ''}
              onChange={(e) => setSelectedDivision(e.target.value || null)}
              className="w-full p-2 border rounded"
            >
              <option value="">All Divisions</option>
              <option value="Asphalt">Asphalt</option>
              <option value="Profiling">Profiling</option>
              <option value="Spray">Spray</option>
              <option value="Grooving">Grooving</option>
            </select>
          </div>
          <div>
            <label className="block font-medium mb-1">Crew</label>
            <select
              value={selectedCrew || ''}
              // Assuming crews are a list, but in example we need to have some
              className="w-full p-2 border rounded"
              onChange={(e) => setSelectedCrew(e.target.value || null)}
            >
              <option value="">All Crews</option>
              {/* Dummy crews */}
              <option value="Crew A">Crew A</option>
              <option value="Crew B">Crew B</option>
            </select>
          </div>
          <div>
            <label className="block font-medium mb-1">Engineer</label>
            <select
              value={selectedEngineer || ''}
              onChange={(e) => setSelectedEngineer(e.target.value || null)}
              className="w-full p-2 border rounded"
            >
              <option value="">All Engineers</option>
              <option value="John Doe">John Doe</option>
              <option value="Jane Smith">Jane Smith</option>
            </select>
          </div>
        </div>
      </div>
      <div className="bg-white p-4 rounded shadow">
        <Calendar
          localizer={localizer}
          events={filteredEvents}
          startAccessor="start"
          endAccessor="end"
          views={['month', 'week', 'day']}
          view={selectedView}
          onSelectEvent={handleEventClick}
          components={{
            event: EventComponent,
          }}
          style={{ height: 500 }}
        />
      </div>
    </div>
  );
};

export default MasterCalendar;

Wait, but the handleNavigate function in the code above isn't used. The react-big-calendar's Calendar component has onNavigate prop for handling date changes. So in the component, adding that.

The Calendar component's onNavigate can be used to update some state if needed, but maybe in the example, it's not necessary unless we need to track the current date being displayed. But for now, maybe just leave it as is.

Also, for the drag-and-drop, I'll need to import some DnD components. Let's see.

The Doc says that to enable drag and drop, you need to import the dnd module and set up the backend.

But for the sake of the optional requirement, perhaps I can add a note in the code comments, and maybe leave a placeholder for it. Since it complicates the example, maybe not include it unless data is external.

So in the example code, perhaps mention that you can add drag-and-drop by setting up the dnd module.

Now, checking the code:

1. The code uses useState for the filters and view.
2. The filteredEvents are computed with useMemo.
3. The EventComponent is a custom renderer with Tailwind classes.
4. The Calendar is set with the localizer and filtered events.

Potential issues:

- The react-big-calendar's CSS might conflict with Tailwind, so maybe the default CSS is imported (react-big-calendar's CSS), but Tailwind can override it. Alternatively, customize the styles more deeply.

- The divisions, crews, and engineers options are hardcoded here, but in a real app, these would probably come from props or state. So the component might need to accept those as props. For example, maybe the props should include divisions, crews, engineers, in addition to events.

But the user hasn't specified, so perhaps the code example uses dummy options.

- The Calendar component requires the localizer to be set up. In the code example, momentLocalizer is created with moment.

Another thing: the example uses 'views' prop to set ['month', 'week', 'day'], which includes the three required views.

For the job details on click, the handleEventClick is a placeholder, and the user can hook into their routing or modal system.

Integration with Microsoft Graph would require that the events have properties that can be mapped to Graph's event properties, but the component doesn't need to handle that; it's more about the event data structure.

Now, possible improvements:

- Add Types for props (CalendarProps should include the options for divisions, crews, engineers).
- Add prop drilling or context for the options.
- Use more dynamic options.

But given the user's request, the code seems to cover the main points.

Another thing: the react-big-calendar's default styles may not be fully compatible with Tailwind, so the event's color and styling could be adjusted. For example, maybe using the `eventWrapperStyle` or `classForEvent` prop. But in the example, using the `components.event` is the right approach.

Now, the code is ready. Let me structure the final code with all these considerations.
</think>

Here's a professional implementation of the SGA QA Master Calendar component with all requested features:

```tsx
import React, { useState, useMemo } from 'react';
import { Calendar, momentLocalizer, View, Views, Navigate } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// TypeScript Interfaces
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  division: 'Asphalt' | 'Profiling' | 'Spray' | 'Grooving';
  crew: string;
  engineer: string;
  status: 'scheduled' | 'in-progress' | 'completed';
  resourceId?: string;
}

interface CalendarProps {
  events: CalendarEvent[];
  crews: string[];
  engineers: string[];
}

// Status color mapping for Tailwind
const getStatusColor = (status: CalendarEvent['status']) => {
  switch (status) {
    case 'scheduled': return 'bg-blue-500'
    case 'in-progress': return 'bg-green-500'
    case 'completed': return 'bg-gray-400'
    default: return 'bg-gray-500'
  }
};

const Master