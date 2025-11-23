# Task: client_tiers

**Worker:** qwen
**Generated:** 2025-11-23T13:47:55.767433

---

Sure, let's break down the task into manageable parts:

### Step 1: Define Types/Interfaces for the Tier System

First, we need to define TypeScript types/interfaces to represent the client tier system. We'll create an interface for `Client` and `SiteVisit`.

```typescript
// types.ts
export interface SiteVisit {
  date: Date;
  description: string;
}

export type TierType = 'Tier 1' | 'Tier 2' | 'Tier 3';

export interface Client {
  id: number;
  name: string;
  tier: TierType;
  siteVisits: SiteVisit[];
}
```

### Step 2: React Component for Selecting/Displaying Client Tier

Let's create a React component that allows selecting the client tier and displays the site visit dates accordingly.

```tsx
// ClientTierSelector.tsx
import React, { useState } from 'react';
import { TierType, SiteVisit, Client } from './types';
import { calculateSiteVisitDates } from './utils';

const ClientTierSelector: React.FC = () => {
  const [tier, setTier] = useState<TierType>('Tier 1');
  const [clientId, setClientId] = useState<number>(1);
  const [clientName, setClientName] = useState<string>('');
  const [siteVisits, setSiteVisits] = useState<SiteVisit[]>([]);

  const handleTierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTier(e.target.value as TierType);
  };

  const handleCreateClient = () => {
    if (clientName.trim() === '') {
      alert('Client name is required');
      return;
    }

    const calculatedSiteVisits = calculateSiteVisitDates(new Date(), tier);
    const newClient: Client = {
      id: clientId,
      name: clientName,
      tier,
      siteVisits: calculatedSiteVisits,
    };

    // Assuming this client would be added to a list or sent to a backend
    console.log('Created Client:', newClient);
    setSiteVisits(calculatedSiteVisits);
  };

  return (
    <div className="p-6 border border-gray-300 rounded bg-white">
      <h2 className="text-xl font-bold mb-4">Create Client</h2>
      <div className="mb-4">
        <label htmlFor="clientName" className="block mb-1 font-medium">Client Name</label>
        <input
          type="text"
          id="clientName"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="tier" className="block mb-1 font-medium">Client Tier</label>
        <select
          id="tier"
          value={tier}
          onChange={handleTierChange}
          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="Tier 1">Tier 1</option>
          <option value="Tier 2">Tier 2</option>
          <option value="Tier 3">Tier 3</option>
        </select>
      </div>
      <button
        onClick={handleCreateClient}
        className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Create Client
      </button>
      <div className="mt-6">
        {siteVisits.length > 0 && (
          <>
            <h3 className="text-lg font-semibold mb-2">Scheduled Site Visits:</h3>
            <ul>
              {siteVisits.map((visit, index) => (
                <li key={index} className="mb-1">
                  {visit.date.toLocaleDateString()} - {visit.description}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};

export default ClientTierSelector;
```

### Step 3: Utility Functions for Calculating Site Visit Dates

We'll create a utility function to calculate the appropriate site visit dates based on the client tier.

```typescript
// utils.ts
import { SiteVisit, TierType } from './types';

export const calculateSiteVisitDates = (projectDate: Date, tier: TierType): SiteVisit[] => {
  const visits: SiteVisit[] = [];
  const projectDt = new Date(projectDate.getTime());

  switch (tier) {
    case 'Tier 1':
      visits.push({ date: new Date(projectDt.setDate(projectDt.getDate() - 14)), description: '14 days before project' });
      visits.push({ date: new Date(projectDt.setDate(projectDt.getDate() + 7)), description: '7 days before project' });
      visits.push({ date: new Date(projectDt.setDate(projectDt.getDate() + 3)), description: '3 days before project' });
      break;
    case 'Tier 2':
      visits.push({ date: new Date(projectDt.setDate(projectDt.getDate() - 7)), description: '7 days before project' });
      visits.push({ date: new Date(projectDt.setDate(projectDt.getDate() + 3)), description: '3 days before project' });
      break;
    case 'Tier 3':
      visits.push({ date: new Date(projectDt.setDate(projectDt.getDate() - 2)), description: 'Within 72 hours' });
      break;
    default:
      throw new Error('Invalid tier');
  }

  return visits;
};
```

### Step 4: Integration with Job Creation Workflow

Assuming there's a job creation form in your application, we integrate `ClientTierSelector` into it. For the purpose of this example, we will assume a basic job creation form component.

```tsx
// JobCreationForm.tsx
import React from 'react';
import ClientTierSelector from './ClientTierSelector';

const JobCreationForm: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-gray-100 p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-semibold mb-6">Job Creation</h1>
        <ClientTierSelector />
        {/* Additional form fields for job creation */}
      </div>
    </div>
  );
};

export default JobCreationForm;
```

### Styling with Tailwind CSS

Ensure Tailwind CSS is set up in your project, which provides the utility classes used in the previous components.

### Error Handling

In this example, we added a simple alert if the client name is empty and throw an error for an invalid tier. In a production-ready application, consider more robust error handling mechanisms such as using context or a global error state management.

This setup provides a foundational structure that can be extended to fit more complex requirements and integrate seamlessly with existing workflows.