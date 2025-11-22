# Task: client_tiers

**Worker:** qwen
**Generated:** 2025-11-21T22:36:25.691400

---

<think>
Alright, let me break down how I approach solving this SGA QA application's Client Tier System. The user has asked for a complete system involving TypeScript types, a React component, utility functions for calculating site visits, and integration with the job creation workflow. I'll go step by step to ensure everything is covered correctly.

First, I'll start by creating TypeScript types and interfaces. The primary entity is a client tier. From the requirements, there are three tiers with specific site visits. So, I need to model those. I'll define an enum for the tiers to ensure consistency. Then, maybe an interface or a type that maps each tier to the number of visits and the number of days before the project. Wait, but the dates are specific days before the project, so maybe each tier should have an array of day numbers. For example, Tier 1 has visits at 14, 7, and 3 days before the project.

Wait, the project itself probably has a start date. The site visits occur relative to that. So for each tier, the visits are scheduled X days before the project's start date. Therefore, I can create a structure where each tier has an array of days for the visits. So Tier1: [14, 7, 3], Tier2: [7, 3], Tier3: [3], but wait, the first requirement says Tier1 has visits at 14, 7, and 3 days before the project. So I need to capture these days.

So I can create a TypeScript enum for the tiers and an object that maps each tier to its visit days. That makes sense. Maybe an interface called ClientTier that includes the name, and the days before the project. Then a mapping object, like tierConfigurations, where each tier is associated with its days.

Wait, perhaps the interface should be something like:

interface ClientTier {
  name: string;
  daysBeforeProject: number[];
}

And an enum Tiers for Tier1, Tier2, Tier3. Then the mapping could be an object that maps each enum value to the configuration. That way, when a client is selected in a certain tier, we can use the enum and the configuration to get the days.

Alternatively, maybe combine the enum and the configuration. Like:

const ClientTierConfigurations = {
  Tier1: [14, 7, 3],
  Tier2: [7, 3],
  Tier3: [3],
};

But using an enum for the tier names would be better to avoid typos. So:

enum ClientTiers {
  Tier1 = 'Tier 1',
  Tier2 = 'Tier 2',
  Tier3 = 'Tier 3',
}

Then the config object maps each enum to the days before.

Then, the React component for selecting or displaying the client tier. So, we need a selector (probably a dropdown) where the user can choose between the tiers. When selected, the component should update the job's tier. Also, when the user selects a tier, it should affect the site visits.

So, I'll create a component like ClientTierPicker. It should accept the current tier, onChange handler, and project date. Wait, no. Maybe the project date is handled in the parent component. Wait, the site visit dates depend on the project date and the tier. But in the requirements, the site visit dates are calculated based on the project date. So for a given tier, when the user selects it, the component should know to show the visit dates based on that tier and the project's start date.

But perhaps the job creation form already includes the project's start date. So the client tier component needs to be part of that form. So when the user selects a tier, the form will have the project date, and the component will use that date to calculate the visit dates.

But how does that integration happen? Let's think: the parent component (job creation form) holds the state for tier, project date, and site visits. The ClientTierPicker component updates the tier and also uses the project date to generate the correct visit dates. But when the project date is not yet set, maybe the visit dates should be as calculated, but dmpled as such.

Wait, but the utility functions for calculating site visit dates will need to take in the project date and tier to compute the dates. So the utility function would be something like calculateSiteVisitDates(tier: ClientTiers, projectDate: Date): Date[].

So the overall structure:

- Define TypeScript types for ClientTiers and the configuration.
- Create a React component that allows selection of the tier and displays the visit dates based on project date.
- Create a utility function that takes project date and tier, and returns the calculated visit dates.

Now, integrating with the job creation workflow would involve ensuring that when a user creates a job, selects the client tier, and the project date, the system calculates the site visit dates correctly and saves them.

For error handling, we need to make sure that if the project date is not set, the visit dates can't be calculated. So in the component, if the project date is not provided, the visit dates should be indications of the schedule (like "14 days before project", etc.), but in the actual system, maybe the errors are shown to the user if they try to proceed without the necessary info.

So, step by step:

1. **TypeScript Types:** Define ClientTiers enum and a configuration object that maps each tier to the days before.

2. **React Component:** ClientTierPicker. Uses controlled select input. When tier is selected, it triggers a state update in the parent. The component should display the name of the selected tier and the calculated visit dates based on the project date provided as a prop. If the project date is not set, it may show the days in days instead of actual dates.

3. **Utility Functions:** A function called calculateSiteVisitDates that takes a tier and project date, returns the array of visit dates. We can also have a function to format those dates into strings (e.g., April 5, 2024).

4. **Error Handling:** If the project date is required to calculate the dates, the component should check that and possibly show a warning or just display the days as placeholders.

Now, in code:

First, the enum and configuration:

enum ClientTiers {
  Tier1 = 'Tier 1',
  Tier2 = 'Tier 2',
  Tier3 = 'Tier 3',
}

const ClientTierConfigurations: Record<ClientTiers, number[]> = {
  [ClientTiers.Tier1]: [14, 7, 3],
  [ClientTiers.Tier2]: [7, 3],
  [ClientTiers.Tier3]: [3],
};

Then, the React component. Use react hooks, maybe use a controlled component with a select input. Pass down the options and the value, handle the onChange. Also, display the calculated dates.

The component could accept a projectDate prop (optional), and when it's present, it shows actual dates. When it's not, it shows the days before. Also, display the site visits based on the selected tier and the project date.

Let me structure the component as a selector. So the ClientTierPicker would have:

- Select input with options of the client tiers.
- Display the selected tier.
- Display the site visit dates, if projectDate is provided.

Now, for the job creation workflow, when the user selects a tier, this component would update the parent state (like the job data), and when the project date is set, the site visit dates are recalculated.

Now, in the utility function, the calculation can be done as follows: for each day in the tier's configuration, subtract that number of days from the project date. So:

function calculateSiteVisitDates(tier: ClientTiers, projectDate: Date): Date[] {
  const daysBefore = ClientTierConfigurations[tier];
  return daysBefore.map(day => {
    const visitDate = new Date(projectDate);
    visitDate.setDate(visitDate.getDate() - day);
    return visitDate;
  });
}

But we have to be careful with JavaScript Dates, as setting date.date could mess up if the date is invalid. But since we're subtracting days, and day is a positive number, it should be okay.

In the React component, when the tier is selected and a project date is available, we can call the utility function and display the dates.

Now, integrating this into the job creation workflow would involve passing the state of the tier selection and project date to this component, and allowing it to generate the site visit dates.

Now, for error handling: for example, if the project date is in the past, but the site visit dates are before the project, that's okay. But if the project date is not set, the component should not attempt to calculate the dates and instead show a message like "Please set the project date to calculate site visits".

Putting it all together, I can write the TypeScript types, the component, and the utility function.

Also, considering Tailwind CSS, I'll use classes for styling: like select input with Tailwind's styling, perhaps using borders, padding, etc.

Now, writing the code step by step.

First, the TypeScript types.

I'll define the enum and the configuration in a separate file, but in the code, the user probably wants it all in one go.

So:

enum ClientTiers {
  Tier1 = 'Tier 1',
  Tier2 = 'Tier 2',
  Tier3 = 'Tier 3',
}

interface ClientTierConfig {
  [key: string]: number[];
}

const ClientTierConfigurations: ClientTierConfig = {
  [ClientTiers.Tier1]: [14, 7, 3],
  [ClientTiers.Tier2]: [7, 3],
  [ClientTiers.Tier3]: [3],
};

Then, for the utility function:

function calculateSiteVisitDates(tier: ClientTiers, projectDate: Date): Date[] {
  const daysBeforeProject = ClientTierConfigurations[tier];

  if (!daysBeforeProject) {
    throw new Error(`Invalid client tier: ${tier}`);
  }

  return daysBeforeProject.map((daysBefore) => {
    const visitDate = new Date(projectDate);
    visitDate.setDate(visitDate.getDate() - daysBefore);
    return visitDate;
  });
}

But I also need to handle formatting the date. So another function, maybe formatSiteVisitDates, which returns a string in a user-friendly format.

function formatSiteVisitDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

Of course, the formatting can be adjusted depending on the user's localization needs, but for the code example, using localeDateString with the options is a good start.

Now, the React component. Let's create a component called ClientTierPicker.

It should:

- Accept a value (the selected tier) as a prop.
- Call an onChange handler with the selected tier when it's changed.
- Optionally, accept a projectDate.
- Render the selected tier and the calculated site visit dates.

The code could be something like:

import React, { useEffect, useState } from 'react';

const ClientTierPicker: React.FC<{
  selectedTier: ClientTiers | undefined;
  onTierChange: (tier: ClientTiers) => void;
  projectDate?: Date | null;
}> = ({ selectedTier, onTierChange, projectDate }) => {
  // If no selected tier is passed, default to Tier1
  const [tier, setTier] = useState<ClientTiers>(selectedTier || ClientTiers.Tier1);
  const [visitDates, setVisitDates] = useState<Date[] | null>(null);

  // Update visit dates when tier or projectDate changes
  useEffect(() => {
    if (tier && projectDate) {
      try {
        const dates = calculateSiteVisitDates(tier, projectDate);
        setVisitDates(dates);
      } catch (err) {
        setVisitDates(null);
        console.error('Error calculating site visit dates:', err);
      }
    } else {
      setVisitDates(null);
    }
  }, [tier, projectDate]);

  // Handle change in the select input
  const handleTierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTier = e.target.value as ClientTiers;
    setTier(selectedTier);
    onTierChange(selectedTier);
  };

  // Render the display for visit dates
  const renderVisitDates = () => {
    if (!projectDate) {
      return [
        <span key="no-date-warning">Please set the project date to calculate site visits.</span>,
      ];
    }

    if (!visitDates) {
      return [
        <span key="error">Error calculating site visits. Check project date and tier.</span>,
      ];
    }

    return visitDates.map((date, index) => (
      <span key={`visit-date-${index}`}>
        {formatSiteVisitDate(date)} {index < visitDates.length - 1 ? ', ' : ''}
      </span>
    ));
  };

  return (
    <div className="mb-4 p-4 border rounded bg-gray-50">
      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-700">Client Tier</label>
        <select
          value={tier}
          onChange={handleTierChange}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary rounded-md"
        >
          {Object.values(ClientTiers).map((tierType) => (
            <option key={tierType} value={tierType}>
              {tierType}
            </option>
          ))}
        </select>
      </div>
      <div>
        <p className="text-sm text-gray-600">
          Selected Tier: <span className="font-semibold">{tier}</span>
        </p>
        {visitDates && projectDate && (
          <p className="mt-1 text-sm text-gray-600">
            Site Visits: {renderVisitDates()}
          </p>
        )}
      </div>
    </div>
  );
};

Wait, but in this code, the ClientTierPicker is a controlled component? The parent passes the selectedTier via props, and the component has its own state? Wait, maybe it's better to make the component controlled, where the parent manages the state. So the component should accept the selected tier as a prop, and the onChange handler to update it in the parent. That way, the parent (the job creation form) can have the state of the tier and manage it accordingly.

So perhaps in the component, instead of its own state for the tier (setTier), we directly use the selectedTier from props, and on change, call onTierChange.

But in the code above, I made 'tier' a useState and then when it's changed, it updates the parent via onTierChange. But if the parent is passing the selectedTier down, perhaps the component should be a controlled component, where the state is managed by the parent. Otherwise, the state may be out of sync.

So maybe the component should look like this:

The component takes selectedTier and onTierChange. Then the internal state for the selectedTier is not in the component, but managed by the parent.

But in the code above, the initial code uses useState to set the tier. But if the parent passes selectedTier as a prop, that's conflicting. So perhaps the component is actually not a controlled component, but the example in the code is incorrect. I need to correct that.

Ah, right. If the component is supposed to be controlled, then the value of the select input is determined by the props. So in the component:

const ClientTierPicker = ({ selectedTier, onTierChange, projectDate }) => {
  const handleTierChange = (e) => {
    onTierChange(e.target.value as ClientTiers);
  }

  ...
}

Then, in the component, the select input's value is set to selectedTier:

value={selectedTier}

And the onChange calls handleTierChange, which triggers the parent's onTierChange.

This way, the parent manages the state, which is better for integration with the job creation form.

So updating the code:

import React from 'react';

interface ClientTierPickerProps {
  selectedTier: ClientTiers;
  onTierChange: (tier: ClientTiers) => void;
  projectDate?: Date | null;
}

const ClientTierPicker: React.FC<ClientTierPickerProps> = ({ selectedTier, onTierChange, projectDate }) => {
  // Recalculate visit dates when tier or project date changes
  const [visitDates, setVisitDates] = React.useState<Date[] | null>(null);

  React.useEffect(() => {
    if (projectDate) {
      try {
        const dates = calculateSiteVisitDates(selectedTier, projectDate);
        setVisitDates(dates);
      } catch (err) {
        setVisitDates(null);
        console.error('Error calculating site visit dates:', err);
      }
    } else {
      setVisitDates(null);
    }
  }, [selectedTier, projectDate]);

  const renderVisitDates = () => {
    if (!projectDate) {
      return (
        <span key="no-date-warning">Please set the project date to calculate site visits.</span>
      );
    }

    if (!visitDates) {
      return (
        <span key="error">Error calculating site visits. Check project date and tier.</span>
      );
    }

    return visitDates.map((date, index) => (
      <span key={`visit-date-${index}`}>
        {formatSiteVisitDate(date)}
        {index < visitDates.length - 1 ? ', ' : ''}
      </span>
    ));
  };

  return (
    <div className="mb-4 p-4 border rounded bg-gray-50">
      <label className="block text-sm font-medium text-gray-700 mb-1">Client Tier</label>
      <div className="mb-3">
        <select
          value={selectedTier}
          onChange={(e) => onTierChange(e.target.value as ClientTiers)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary rounded-md"
        >
          {Object.values(ClientTiers).map((tierOption) => (
            <option key={tierOption} value={tierOption}>
              {tierOption}
            </option>
          ))}
        </select>
      </div>
      <div>
        <p className="text-sm text-gray-600">
          Selected Tier: <span className="font-semibold">{selectedTier}</span>
        </p>
        <p className="mt-1 text-sm text-gray-600">
          <span className="mr-2 font-medium">Site Visits:</span>
          {renderVisitDates()}
        </p>
      </div>
    </div>
  );
};

This is a better controlled component. The parent component manages the state of selectedTier, and when the user chooses a tier, it's passed up via the onTierChange callback.

Now, for the job creation workflow, the parent component (like a JobForm) would include the project date